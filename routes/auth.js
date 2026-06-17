const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const PasswordReset = require("../models/PasswordReset");
const { auth } = require("../middleware/auth");

const router = express.Router();

router.get("/login", (req, res) => {
  res.render("login", { error: null });
});

router.get("/register", (req, res) => {
  res.render("register", { error: null });
});

router.post("/register", async (req, res) => {
  try {
    const { name, email, password, phone, role } = req.body;
    const exists = await User.findOne({ email });
    if (exists) return res.render("register", { error: "Email already registered" });
    const hashed = await bcrypt.hash(password, 10);
    const user = await User.create({ name, email, password: hashed, phone, role });
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "7d" });
    res.cookie("token", token, { httpOnly: true, maxAge: 7 * 24 * 60 * 60 * 1000 });
    res.redirect(user.role === "owner" ? "/owner/dashboard" : "/user/dashboard");
  } catch {
    res.render("register", { error: "Registration failed" });
  }
});

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user || !(await bcrypt.compare(password, user.password)))
      return res.render("login", { error: "Invalid email or password" });
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "7d" });
    res.cookie("token", token, { httpOnly: true, maxAge: 7 * 24 * 60 * 60 * 1000 });
    res.redirect(user.role === "owner" ? "/owner/dashboard" : "/user/dashboard");
  } catch {
    res.render("login", { error: "Login failed" });
  }
});

router.get("/logout", (req, res) => {
  res.clearCookie("token");
  res.redirect("/");
});

router.get("/forgot-password", (req, res) => {
  res.render("forgot-password", { error: null, success: null });
});

router.post("/forgot-password", async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.render("forgot-password", { error: "No account found with that email", success: null });
    const token = await PasswordReset.create(user._id);
    res.render("forgot-password", {
      error: null,
      success: `Password reset link: ${req.protocol}://${req.get("host")}/reset-password/${token}`,
    });
  } catch {
    res.render("forgot-password", { error: "Something went wrong", success: null });
  }
});

router.get("/reset-password/:token", async (req, res) => {
  const record = await PasswordReset.findByToken(req.params.token);
  if (!record) return res.render("reset-password", { token: null, error: "Invalid or expired reset link", success: null });
  res.render("reset-password", { token: req.params.token, error: null, success: null });
});

router.post("/reset-password/:token", async (req, res) => {
  try {
    const record = await PasswordReset.findByToken(req.params.token);
    if (!record) return res.render("reset-password", { token: null, error: "Invalid or expired reset link", success: null });
    const { password, confirmPassword } = req.body;
    if (password !== confirmPassword) return res.render("reset-password", { token: req.params.token, error: "Passwords do not match", success: null });
    if (password.length < 6) return res.render("reset-password", { token: req.params.token, error: "Password must be at least 6 characters", success: null });
    const hashed = await bcrypt.hash(password, 10);
    await User.findByIdAndUpdate(record.user, { password: hashed });
    await PasswordReset.markUsed(record._id);
    res.render("reset-password", { token: null, error: null, success: "Password reset successfully! You can now login." });
  } catch {
    res.render("reset-password", { token: null, error: "Failed to reset password", success: null });
  }
});

module.exports = router;
