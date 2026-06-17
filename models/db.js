const Datastore = require("nedb-promises");
const path = require("path");

const dataDir = path.join(__dirname, "..", "data");

const users = Datastore.create({ filename: path.join(dataDir, "users.db"), autoload: true });
const properties = Datastore.create({ filename: path.join(dataDir, "properties.db"), autoload: true });
const subscriptions = Datastore.create({ filename: path.join(dataDir, "subscriptions.db"), autoload: true });

module.exports = { users, properties, subscriptions };
