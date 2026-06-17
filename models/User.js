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
}

module.exports = User;
