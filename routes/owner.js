const express = require("express");
const Property = require("../models/Property");
const { auth, ownerOnly } = require("../middleware/auth");

const router = express.Router();

router.get("/dashboard", auth, ownerOnly, async (req, res) => {
  const properties = await Property.find({ owner: req.user._id });
  properties.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  res.render("owner/dashboard", { properties });
});

router.get("/add-property", auth, ownerOnly, (req, res) => {
  res.render("owner/add-property", { error: null });
});

router.post("/add-property", auth, ownerOnly, async (req, res) => {
  try {
    const { title, description, price, bedrooms, bathrooms, area, address, city, state, pincode, ownerContactRevealPrice } = req.body;
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

router.post("/edit-property/:id", auth, ownerOnly, async (req, res) => {
  try {
    const { title, description, price, bedrooms, bathrooms, area, address, city, state, pincode, available, ownerContactRevealPrice } = req.body;
    await Property.findOneAndUpdate(
      { _id: req.params.id, owner: req.user._id },
      {
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
      }
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

module.exports = router;
