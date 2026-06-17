const jwt = require("jsonwebtoken");
const User = require("../models/User");

const auth = async (req, res, next) => {
  try {
    const token = req.cookies.token;
    if (!token) return res.redirect("/login");
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);
    if (!user) return res.redirect("/login");
    delete user.password;
    req.user = user;
    next();
  } catch {
    res.clearCookie("token");
    res.redirect("/login");
  }
};

const ownerOnly = (req, res, next) => {
  if (req.user && req.user.role === "owner") return next();
  res.redirect("/user/dashboard");
};

const userOnly = (req, res, next) => {
  if (req.user && req.user.role === "user") return next();
  res.redirect("/owner/dashboard");
};

module.exports = { auth, ownerOnly, userOnly };
