const Datastore = require("nedb-promises");
const path = require("path");
const fs = require("fs");

const dataDir = process.env.DATA_DIR || path.join(__dirname, "..", "data");
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

const users = Datastore.create({ filename: path.join(dataDir, "users.db"), autoload: true });
const properties = Datastore.create({ filename: path.join(dataDir, "properties.db"), autoload: true });
const subscriptions = Datastore.create({ filename: path.join(dataDir, "subscriptions.db"), autoload: true });
const reviews = Datastore.create({ filename: path.join(dataDir, "reviews.db"), autoload: true });
const passwordResets = Datastore.create({ filename: path.join(dataDir, "passwordResets.db"), autoload: true });

module.exports = { users, properties, subscriptions, reviews, passwordResets };
