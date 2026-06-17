const express = require("express");
const bcrypt = require("bcryptjs");
const multer = require("multer");
const path = require("path");
const Property = require("../models/Property");
const User = require("../models/User");
const { auth, ownerOnly } = require("../middleware/auth");

const router = express.Router();

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, path.join(__dirname, "..", "public", "uploads")),
  filename: (req, file, cb) => cb(null, Date.now() + "-" + file.originalname.replace(/\s+/g, "-")),
});
const upload = multer({ storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = /jpeg|jpg|png|gif|webp/;
    const ext = allowed.test(path.extname(file.originalname).toLowerCase());
    const mime = allowed.test(file.mimetype);
    if (ext && mime) return cb(null, true);
    cb(new Error("Only images (jpeg, jpg, png, gif, webp) are allowed"));
  },
});

router.get("/dashboard", auth, ownerOnly, async (req, res) => {
  const { page } = req.query;
  let properties = await Property.find({ owner: req.user._id });
  properties.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  const ITEMS_PER_PAGE = 9;
  const currentPage = Math.max(1, parseInt(page) || 1);
  const totalPages = Math.ceil(properties.length / ITEMS_PER_PAGE);
  const startIdx = (currentPage - 1) * ITEMS_PER_PAGE;
  const pageProperties = properties.slice(startIdx, startIdx + ITEMS_PER_PAGE);
  res.render("owner/dashboard", { properties: pageProperties, currentPage, totalPages, query: req.query });
});

router.get("/add-property", auth, ownerOnly, (req, res) => {
  res.render("owner/add-property", { error: null });
});

router.post("/add-property", auth, ownerOnly, upload.fields([
  { name: "imgHall", maxCount: 1 },
  { name: "imgBedroom", maxCount: 1 },
  { name: "imgKitchen", maxCount: 1 },
]), async (req, res) => {
  try {
    const { title, description, price, bedrooms, bathrooms, area, address, city, state, pincode, ownerContactRevealPrice } = req.body;
    const images = { hall: "", bedroom: "", kitchen: "" };
    if (req.files) {
      if (req.files.imgHall) images.hall = "/uploads/" + req.files.imgHall[0].filename;
      if (req.files.imgBedroom) images.bedroom = "/uploads/" + req.files.imgBedroom[0].filename;
      if (req.files.imgKitchen) images.kitchen = "/uploads/" + req.files.imgKitchen[0].filename;
    }
    await Property.create({
      owner: req.user._id,
      title,
      description,
      price,
      bedrooms,
      bathrooms,
      area,
      address,
      city: city.toLowerCase(),
      state: state.toLowerCase(),
      pincode,
      images,
      ownerContactRevealPrice: ownerContactRevealPrice || 50,
    });
    res.redirect("/owner/dashboard");
  } catch (err) {
    res.render("owner/add-property", { error: "Failed to add property: " + err.message });
  }
});

router.get("/edit-property/:id", auth, ownerOnly, async (req, res) => {
  const property = await Property.findOne({ _id: req.params.id, owner: req.user._id });
  if (!property) return res.redirect("/owner/dashboard");
  res.render("owner/edit-property", { property, error: null });
});

router.post("/edit-property/:id", auth, ownerOnly, upload.fields([
  { name: "imgHall", maxCount: 1 },
  { name: "imgBedroom", maxCount: 1 },
  { name: "imgKitchen", maxCount: 1 },
]), async (req, res) => {
  try {
    const { title, description, price, bedrooms, bathrooms, area, address, city, state, pincode, available, ownerContactRevealPrice } = req.body;
    const update = {
      title,
      description,
      price: Number(price),
      bedrooms: Number(bedrooms),
      bathrooms: Number(bathrooms),
      area,
      address,
      city: city.toLowerCase(),
      state: state.toLowerCase(),
      pincode,
      available: available === "on",
      ownerContactRevealPrice: Number(ownerContactRevealPrice) || 50,
    };
    if (req.files) {
      if (req.files.imgHall) update["images.hall"] = "/uploads/" + req.files.imgHall[0].filename;
      if (req.files.imgBedroom) update["images.bedroom"] = "/uploads/" + req.files.imgBedroom[0].filename;
      if (req.files.imgKitchen) update["images.kitchen"] = "/uploads/" + req.files.imgKitchen[0].filename;
    }
    await Property.findOneAndUpdate(
      { _id: req.params.id, owner: req.user._id },
      update
    );
    res.redirect("/owner/dashboard");
  } catch {
    res.redirect("/owner/dashboard");
  }
});

router.post("/delete-property/:id", auth, ownerOnly, async (req, res) => {
  await Property.findOneAndDelete({ _id: req.params.id, owner: req.user._id });
  res.redirect("/owner/dashboard");
});

router.get("/profile", auth, ownerOnly, (req, res) => {
  res.render("owner/profile", { user: req.user, error: null, success: null });
});

router.post("/profile", auth, ownerOnly, async (req, res) => {
  try {
    const { name, phone } = req.body;
    await User.findByIdAndUpdate(req.user._id, { name, phone });
    res.render("owner/profile", { user: { ...req.user, name, phone }, error: null, success: "Profile updated successfully" });
  } catch {
    res.render("owner/profile", { user: req.user, error: "Failed to update profile", success: null });
  }
});

router.post("/change-password", auth, ownerOnly, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user._id);
    if (!(await bcrypt.compare(currentPassword, user.password))) {
      return res.render("owner/profile", { user: req.user, error: "Current password is incorrect", success: null });
    }
    const hashed = await bcrypt.hash(newPassword, 10);
    await User.findByIdAndUpdate(req.user._id, { password: hashed });
    res.render("owner/profile", { user: req.user, error: null, success: "Password changed successfully" });
  } catch {
    res.render("owner/profile", { user: req.user, error: "Failed to change password", success: null });
  }
});

module.exports = router;
