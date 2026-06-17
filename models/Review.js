const { reviews } = require("./db");

class Review {
  static async create(data) {
    const review = {
      property: data.property,
      user: data.user,
      userName: data.userName,
      rating: Number(data.rating),
      comment: data.comment || "",
      createdAt: new Date(),
    };
    return reviews.insert(review);
  }

  static async findByProperty(propertyId) {
    return reviews.find({ property: propertyId }).sort({ createdAt: -1 });
  }

  static async findByUserAndProperty(userId, propertyId) {
    return reviews.findOne({ user: userId, property: propertyId });
  }

  static async getAverageRating(propertyId) {
    const all = await reviews.find({ property: propertyId });
    if (all.length === 0) return { average: 0, count: 0 };
    const sum = all.reduce((a, r) => a + r.rating, 0);
    return { average: Math.round((sum / all.length) * 10) / 10, count: all.length };
  }

  static async findOne(query) {
    return reviews.findOne(query);
  }
}

module.exports = Review;
