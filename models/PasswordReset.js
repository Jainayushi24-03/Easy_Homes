const crypto = require("crypto");
const { passwordResets } = require("./db");

class PasswordReset {
  static async create(userId) {
    const token = crypto.randomBytes(32).toString("hex");
    const record = {
      user: userId,
      token,
      expiresAt: new Date(Date.now() + 60 * 60 * 1000),
      used: false,
      createdAt: new Date(),
    };
    await passwordResets.insert(record);
    return token;
  }

  static async findByToken(token) {
    return passwordResets.findOne({ token, used: false, expiresAt: { $gt: new Date() } });
  }

  static async markUsed(id) {
    return passwordResets.update({ _id: id }, { $set: { used: true } });
  }
}

module.exports = PasswordReset;
