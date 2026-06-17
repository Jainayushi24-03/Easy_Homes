require("dotenv").config();
const express = require("express");
const cookieParser = require("cookie-parser");
const session = require("express-session");
const path = require("path");
const fs = require("fs");

const dataDir = process.env.DATA_DIR || path.join(__dirname, "data");
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

const uploadsDir = path.join(__dirname, "public", "uploads");
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

const jwt = require("jsonwebtoken");
const User = require("./models/User");

const authRoutes = require("./routes/auth");
const ownerRoutes = require("./routes/owner");
const userRoutes = require("./routes/user");

const app = express();

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

app.use(express.static(path.join(__dirname, "public")));
app.use("/uploads", express.static(uploadsDir));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cookieParser());
app.use(
  session({
    secret: process.env.SESSION_SECRET || "secret",
    resave: false,
    saveUninitialized: true,
    cookie: { secure: process.env.NODE_ENV === "production" },
  })
);

app.use(async (req, res, next) => {
  try {
    const token = req.cookies.token;
    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id);
      if (user) {
        delete user.password;
        req.user = user;
        res.locals.user = user;
      } else {
        req.user = null;
        res.locals.user = null;
      }
    } else {
      req.user = null;
      res.locals.user = null;
    }
  } catch {
    req.user = null;
    res.locals.user = null;
  }
  next();
});

app.use("/", authRoutes);
app.use("/owner", ownerRoutes);
app.use("/user", userRoutes);

app.get("/", (req, res) => {
  res.render("index");
});

app.use((err, req, res, next) => {
  console.error("Unhandled error:", err);
  if (req.path.startsWith("/user/") || req.path.startsWith("/owner/")) {
    return res.status(500).json({ error: err.message || "Internal server error" });
  }
  res.status(500).send("Something broke!");
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, async () => {
  console.log(`Server running on http://localhost:${PORT}`);
  if (process.env.SEED_ON_START === "true") {
    try {
      await require("./seed")();
      console.log("Auto-seed complete");
    } catch (e) {
      console.error("Auto-seed error:", e.message);
    }
  }
});
