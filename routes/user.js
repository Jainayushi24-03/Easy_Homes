const express = require("express");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const Razorpay = require("razorpay");
const Property = require("../models/Property");
const Subscription = require("../models/Subscription");
const Review = require("../models/Review");
const User = require("../models/User");
const { auth, userOnly } = require("../middleware/auth");

const RAZORPAY_KEY_ID = process.env.RAZORPAY_KEY_ID || "";
const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET || "";
const razorpayEnabled = RAZORPAY_KEY_ID.startsWith("rzp_") && RAZORPAY_KEY_SECRET.length > 0;

const razorpay = razorpayEnabled ? new Razorpay({
  key_id: RAZORPAY_KEY_ID,
  key_secret: RAZORPAY_KEY_SECRET,
}) : null;

const router = express.Router();

const PLAN_DETAILS = {
  basic: { price: 199, durationDays: 30, searchLimit: 50, label: "Basic" },
  premium: { price: 399, durationDays: 30, searchLimit: 200, label: "Premium" },
  gold: { price: 799, durationDays: 90, searchLimit: -1, label: "Gold" },
};

const ITEMS_PER_PAGE = 9;

router.get("/dashboard", auth, userOnly, async (req, res) => {
  const { city, state, pincode, sort, minPrice, maxPrice, bedrooms, page } = req.query;
  const filter = { available: true };

  if (city) filter.city = city.toLowerCase();
  if (state) filter.state = state.toLowerCase();
  if (pincode) filter.pincode = pincode;
  if (minPrice) filter.price = { ...filter.price, $gte: Number(minPrice) };
  if (maxPrice) filter.price = { ...filter.price, $lte: Number(maxPrice) };
  if (bedrooms) filter.bedrooms = Number(bedrooms);

  const user = await User.findById(req.user._id);
  const isSubscribed = user.subscription.plan !== "none" && user.subscription.endDate && new Date(user.subscription.endDate) > new Date();
  const canSearch = !isSubscribed || (user.subscription.searchLimit === -1 || user.subscription.searchesUsed < user.subscription.searchLimit);

  let allProperties = await Property.find(filter);

  if (sort === "price_asc") allProperties.sort((a, b) => a.price - b.price);
  else if (sort === "price_desc") allProperties.sort((a, b) => b.price - a.price);
  else allProperties.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  const currentPage = Math.max(1, parseInt(page) || 1);
  const totalPages = Math.ceil(allProperties.length / ITEMS_PER_PAGE);
  const startIdx = (currentPage - 1) * ITEMS_PER_PAGE;
  const pageProperties = allProperties.slice(startIdx, startIdx + ITEMS_PER_PAGE);

  const populated = [];
  for (const p of pageProperties) {
    const owner = await User.findById(p.owner);
    const rating = await Review.getAverageRating(p._id);
    populated.push({
      ...p,
      owner: owner ? { name: owner.name, email: owner.email, phone: owner.phone } : {},
      rating: rating.average,
      reviewCount: rating.count,
    });
  }

  if (isSubscribed && canSearch && user.subscription.searchLimit !== -1) {
    await User.findByIdAndUpdate(req.user._id, {
      "subscription.searchesUsed": (user.subscription.searchesUsed || 0) + 1,
    });
  }

  const favSet = new Set(user.favorites || []);

  const recentIds = (user.recentlyViewed || []).slice(0, 6);
  const recentProperties = [];
  for (const id of recentIds) {
    const p = await Property.findById(id);
    if (p) recentProperties.push(p);
  }

  res.render("user/dashboard", {
    properties: populated,
    query: req.query,
    isSubscribed,
    canSearch,
    plan: user.subscription.plan,
    searchesUsed: user.subscription.searchesUsed || 0,
    searchLimit: user.subscription.searchLimit,
    favorites: favSet,
    currentPage,
    totalPages,
    recentProperties,
  });
});

router.get("/property/:id", auth, userOnly, async (req, res) => {
  const property = await Property.findById(req.params.id);
  if (!property) return res.redirect("/user/dashboard");

  const owner = await User.findById(property.owner);
  property.owner = owner ? { name: owner.name, email: owner.email, phone: owner.phone, _id: owner._id } : {};

  const user = await User.findById(req.user._id);
  const isSubscribed = user.subscription.plan !== "none" && user.subscription.endDate && new Date(user.subscription.endDate) > new Date();
  const hasPaid = req.session.paidProperties && req.session.paidProperties.includes(req.params.id);
  const isFavorited = (user.favorites || []).includes(req.params.id);

  await User.addRecentlyViewed(req.user._id, req.params.id);

  const reviews = await Review.findByProperty(req.params.id);
  const ratingData = await Review.getAverageRating(req.params.id);
  const userReview = await Review.findByUserAndProperty(req.user._id, req.params.id);

  const baseUrl = `${req.protocol}://${req.get("host")}`;

  res.render("user/property-detail", {
    property,
    isSubscribed,
    hasPaid,
    isFavorited,
    reviews,
    rating: ratingData,
    userReview,
    baseUrl,
    error: null,
    success: null,
  });
});

router.post("/pay-reveal/:id", auth, userOnly, async (req, res) => {
  try {
    const property = await Property.findById(req.params.id);
    if (!property) return res.redirect("/user/dashboard");

    if (!req.session.paidProperties) req.session.paidProperties = [];

    if (req.session.paidProperties.includes(req.params.id)) {
      return res.redirect(`/user/property/${req.params.id}`);
    }

    req.session.paidProperties.push(req.params.id);
    res.redirect(`/user/property/${req.params.id}`);
  } catch {
    res.redirect("/user/dashboard");
  }
});

router.post("/favorite/:id", auth, userOnly, async (req, res) => {
  const user = await User.findById(req.user._id);
  const isFav = (user.favorites || []).includes(req.params.id);
  if (isFav) {
    await User.removeFavorite(req.user._id, req.params.id);
  } else {
    await User.addFavorite(req.user._id, req.params.id);
  }
  const referer = req.get("Referer") || "/user/dashboard";
  res.redirect(referer);
});

router.get("/favorites", auth, userOnly, async (req, res) => {
  const user = await User.findById(req.user._id);
  const ids = user.favorites || [];
  const properties = [];
  for (const id of ids) {
    const p = await Property.findById(id);
    if (p) {
      const owner = await User.findById(p.owner);
      const rating = await Review.getAverageRating(p._id);
      properties.push({
        ...p,
        owner: owner ? { name: owner.name } : {},
        rating: rating.average,
        reviewCount: rating.count,
      });
    }
  }
  res.render("user/favorites", { properties, error: null });
});

router.post("/review/:id", auth, userOnly, async (req, res) => {
  try {
    const { rating, comment } = req.body;
    const existing = await Review.findByUserAndProperty(req.user._id, req.params.id);
    if (existing) {
      const property = await Property.findById(req.params.id);
      const owner = await User.findById(property.owner);
      property.owner = owner ? { name: owner.name, email: owner.email, phone: owner.phone, _id: owner._id } : {};
      const user = await User.findById(req.user._id);
      const isSubscribed = user.subscription.plan !== "none" && user.subscription.endDate && new Date(user.subscription.endDate) > new Date();
      const hasPaid = req.session.paidProperties && req.session.paidProperties.includes(req.params.id);
      const isFavorited = (user.favorites || []).includes(req.params.id);
      const reviews = await Review.findByProperty(req.params.id);
      const ratingData = await Review.getAverageRating(req.params.id);
      const userReview = await Review.findByUserAndProperty(req.user._id, req.params.id);
      const baseUrl2 = `${req.protocol}://${req.get("host")}`;
      return res.render("user/property-detail", {
        property, isSubscribed, hasPaid, isFavorited, reviews, rating: ratingData, userReview, baseUrl: baseUrl2,
        error: "You have already reviewed this property", success: null,
      });
    }
    await Review.create({
      property: req.params.id,
      user: req.user._id,
      userName: req.user.name,
      rating: Number(rating),
      comment: comment || "",
    });
    res.redirect(`/user/property/${req.params.id}`);
  } catch {
    res.redirect("/user/dashboard");
  }
});

router.get("/subscriptions", auth, userOnly, async (req, res) => {
  const subscriptions = await Subscription.find({ user: req.user._id });
  const currentSub = subscriptions.find((s) => s.status === "active");
  res.render("user/subscriptions", {
    plans: Object.entries(PLAN_DETAILS).map(([key, val]) => ({ key, ...val })),
    subscriptions,
    currentSub,
    error: null,
  });
});

router.post("/create-order", auth, userOnly, async (req, res) => {
  try {
    const { plan, type, propertyId } = req.body;
    if (type === "subscription") {
      const planDetails = PLAN_DETAILS[plan];
      if (!planDetails) return res.status(400).json({ error: "Invalid plan" });
      if (!razorpayEnabled) {
        const fakeId = "order_" + Date.now();
        return res.json({ orderId: fakeId, amount: planDetails.price * 100, key: "simulated", plan, type: "subscription", simulated: true });
      }
      const order = await razorpay.orders.create({ amount: planDetails.price * 100, currency: "INR", receipt: `sub_${req.user._id}_${Date.now()}` });
      return res.json({ orderId: order.id, amount: order.amount, key: RAZORPAY_KEY_ID, plan, type: "subscription" });
    }
    if (type === "reveal") {
      const property = await Property.findById(propertyId);
      if (!property) return res.status(400).json({ error: "Property not found" });
      if (req.session.paidProperties && req.session.paidProperties.includes(propertyId)) {
        return res.json({ alreadyPaid: true });
      }
      const amount = (property.ownerContactRevealPrice || 50) * 100;
      if (!razorpayEnabled) {
        const fakeId = "order_" + Date.now();
        return res.json({ orderId: fakeId, amount, key: "simulated", propertyId, type: "reveal", simulated: true });
      }
      const order = await razorpay.orders.create({ amount, currency: "INR", receipt: `rev_${req.user._id}_${propertyId}_${Date.now()}` });
      return res.json({ orderId: order.id, amount: order.amount, key: RAZORPAY_KEY_ID, propertyId, type: "reveal" });
    }
    res.status(400).json({ error: "Invalid type" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

function verifyRazorpaySignature(orderId, paymentId, signature) {
  if (!razorpayEnabled) return true;
  const body = orderId + "|" + paymentId;
  const expected = crypto.createHmac("sha256", RAZORPAY_KEY_SECRET).update(body).digest("hex");
  return expected === signature;
}

router.post("/verify-payment", auth, userOnly, async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, plan, type, propertyId } = req.body;
    if (!verifyRazorpaySignature(razorpay_order_id, razorpay_payment_id, razorpay_signature)) {
      return res.status(400).json({ success: false, error: "Invalid signature" });
    }
    if (type === "subscription") {
      const planDetails = PLAN_DETAILS[plan];
      if (!planDetails) return res.status(400).json({ success: false, error: "Invalid plan" });
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + planDetails.durationDays);
      await Subscription.create({
        user: req.user._id, plan, amount: planDetails.price, endDate,
        paymentId: razorpay_payment_id || ("PAY_" + Date.now()), status: "active",
      });
      await User.findByIdAndUpdate(req.user._id, {
        "subscription.plan": plan, "subscription.startDate": new Date(),
        "subscription.endDate": endDate, "subscription.searchLimit": planDetails.searchLimit,
        "subscription.searchesUsed": 0,
      });
      return res.json({ success: true, redirect: "/user/subscriptions" });
    }
    if (type === "reveal") {
      if (!req.session.paidProperties) req.session.paidProperties = [];
      if (!req.session.paidProperties.includes(propertyId)) {
        req.session.paidProperties.push(propertyId);
      }
      return res.json({ success: true, redirect: `/user/property/${propertyId}` });
    }
    res.status(400).json({ success: false, error: "Invalid type" });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.get("/profile", auth, userOnly, (req, res) => {
  res.render("user/profile", { user: req.user, error: null, success: null });
});

router.post("/profile", auth, userOnly, async (req, res) => {
  try {
    const { name, phone } = req.body;
    await User.findByIdAndUpdate(req.user._id, { name, phone });
    res.render("user/profile", { user: { ...req.user, name, phone }, error: null, success: "Profile updated successfully" });
  } catch {
    res.render("user/profile", { user: req.user, error: "Failed to update profile", success: null });
  }
});

router.post("/change-password", auth, userOnly, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user._id);
    if (!(await bcrypt.compare(currentPassword, user.password))) {
      return res.render("user/profile", { user: req.user, error: "Current password is incorrect", success: null });
    }
    const hashed = await bcrypt.hash(newPassword, 10);
    await User.findByIdAndUpdate(req.user._id, { password: hashed });
    res.render("user/profile", { user: req.user, error: null, success: "Password changed successfully" });
  } catch {
    res.render("user/profile", { user: req.user, error: "Failed to change password", success: null });
  }
});

module.exports = router;
