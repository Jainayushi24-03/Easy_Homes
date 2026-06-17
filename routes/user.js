const express = require("express");
const Property = require("../models/Property");
const Subscription = require("../models/Subscription");
const User = require("../models/User");
const { auth, userOnly } = require("../middleware/auth");

const router = express.Router();

const PLAN_DETAILS = {
  basic: { price: 199, durationDays: 30, searchLimit: 50, label: "Basic" },
  premium: { price: 399, durationDays: 30, searchLimit: 200, label: "Premium" },
  gold: { price: 799, durationDays: 90, searchLimit: -1, label: "Gold" },
};

router.get("/dashboard", auth, userOnly, async (req, res) => {
  const { city, state, pincode, sort, minPrice, maxPrice, bedrooms } = req.query;
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

  let properties = await Property.find(filter);

  if (sort === "price_asc") properties.sort((a, b) => a.price - b.price);
  else if (sort === "price_desc") properties.sort((a, b) => b.price - a.price);
  else properties.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  const populated = [];
  for (const p of properties) {
    const owner = await User.findById(p.owner);
    populated.push({ ...p, owner: owner ? { name: owner.name, email: owner.email, phone: owner.phone } : {} });
  }

  if (isSubscribed && canSearch && user.subscription.searchLimit !== -1) {
    await User.findByIdAndUpdate(req.user._id, {
      "subscription.searchesUsed": (user.subscription.searchesUsed || 0) + 1,
    });
  }

  res.render("user/dashboard", {
    properties: populated,
    query: req.query,
    isSubscribed,
    canSearch,
    plan: user.subscription.plan,
    searchesUsed: user.subscription.searchesUsed || 0,
    searchLimit: user.subscription.searchLimit,
  });
});

router.get("/property/:id", auth, userOnly, async (req, res) => {
  const property = await Property.findById(req.params.id);
  if (!property) return res.redirect("/user/dashboard");

  const owner = await User.findById(property.owner);
  property.owner = owner ? { name: owner.name, email: owner.email, phone: owner.phone } : {};

  const user = await User.findById(req.user._id);
  const isSubscribed = user.subscription.plan !== "none" && user.subscription.endDate && new Date(user.subscription.endDate) > new Date();
  const hasPaid = req.session.paidProperties && req.session.paidProperties.includes(req.params.id);

  res.render("user/property-detail", { property, isSubscribed, hasPaid, error: null });
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

router.post("/subscribe", auth, userOnly, async (req, res) => {
  try {
    const { plan } = req.body;
    const planDetails = PLAN_DETAILS[plan];
    if (!planDetails) {
      const subscriptions = await Subscription.find({ user: req.user._id });
      return res.render("user/subscriptions", {
        plans: Object.entries(PLAN_DETAILS).map(([key, val]) => ({ key, ...val })),
        subscriptions,
        currentSub: null,
        error: "Invalid plan",
      });
    }

    const endDate = new Date();
    endDate.setDate(endDate.getDate() + planDetails.durationDays);

    await Subscription.create({
      user: req.user._id,
      plan,
      amount: planDetails.price,
      endDate,
      paymentId: `PAY_${Date.now()}`,
    });

    await User.findByIdAndUpdate(req.user._id, {
      "subscription.plan": plan,
      "subscription.startDate": new Date(),
      "subscription.endDate": endDate,
      "subscription.searchLimit": planDetails.searchLimit,
      "subscription.searchesUsed": 0,
    });

    res.redirect("/user/subscriptions");
  } catch {
    res.redirect("/user/subscriptions");
  }
});

module.exports = router;
