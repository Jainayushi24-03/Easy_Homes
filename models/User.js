const { users } = require("./db");

class User {
  static async create(data) {
    const user = {
      name: data.name,
      email: data.email.toLowerCase(),
      password: data.password,
      phone: data.phone || "",
      role: data.role || "user",
      subscription: {
        plan: "none",
        startDate: null,
        endDate: null,
        searchLimit: 0,
        searchesUsed: 0,
      },
      favorites: [],
      recentlyViewed: [],
      createdAt: new Date(),
    };
    return users.insert(user);
  }

  static async findById(id) {
    return users.findOne({ _id: id });
  }

  static async findOne(query) {
    if (query.email) query.email = query.email.toLowerCase();
    return users.findOne(query);
  }

  static async find(query) {
    return users.find(query);
  }

  static async findByIdAndUpdate(id, update) {
    await users.update({ _id: id }, { $set: update });
    return users.findOne({ _id: id });
  }

  static async updateOne(filter, update) {
    return users.update(filter, update);
  }

  static async addFavorite(userId, propertyId) {
    const user = await User.findById(userId);
    const favorites = user.favorites || [];
    if (!favorites.includes(propertyId)) {
      favorites.push(propertyId);
      await users.update({ _id: userId }, { $set: { favorites } });
    }
    return user;
  }

  static async removeFavorite(userId, propertyId) {
    const user = await User.findById(userId);
    user.favorites = (user.favorites || []).filter((id) => id !== propertyId);
    await users.update({ _id: userId }, { $set: { favorites: user.favorites } });
    return user;
  }

  static async addRecentlyViewed(userId, propertyId) {
    const user = await User.findById(userId);
    let recent = user.recentlyViewed || [];
    recent = recent.filter((id) => id !== propertyId);
    recent.unshift(propertyId);
    if (recent.length > 10) recent = recent.slice(0, 10);
    await users.update({ _id: userId }, { $set: { recentlyViewed: recent } });
    return user;
  }
}

module.exports = User;
