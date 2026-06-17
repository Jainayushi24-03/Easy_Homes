const { subscriptions } = require("./db");

class Subscription {
  static async create(data) {
    const sub = {
      user: data.user,
      plan: data.plan,
      amount: Number(data.amount),
      startDate: data.startDate || new Date(),
      endDate: data.endDate,
      status: data.status || "active",
      paymentId: data.paymentId || "",
      createdAt: new Date(),
    };
    return subscriptions.insert(sub);
  }

  static async findById(id) {
    return subscriptions.findOne({ _id: id });
  }

  static async find(query) {
    return subscriptions.find(query).sort({ createdAt: -1 });
  }

  static async findOne(query) {
    return subscriptions.findOne(query);
  }
}

module.exports = Subscription;
