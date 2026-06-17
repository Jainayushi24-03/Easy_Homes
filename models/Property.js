const { properties } = require("./db");

class Property {
  static async create(data) {
    const prop = {
      owner: data.owner,
      title: data.title,
      description: data.description,
      price: Number(data.price),
      bedrooms: Number(data.bedrooms) || 1,
      bathrooms: Number(data.bathrooms) || 1,
      area: data.area || "",
      address: data.address,
      city: (data.city || "").toLowerCase(),
      state: (data.state || "").toLowerCase(),
      pincode: data.pincode,
      images: data.images || { hall: "", bedroom: "", kitchen: "" },
      available: data.available !== undefined ? data.available : true,
      ownerContactRevealPrice: Number(data.ownerContactRevealPrice) || 50,
      createdAt: new Date(),
    };
    return properties.insert(prop);
  }

  static async findById(id) {
    return properties.findOne({ _id: id });
  }

  static async find(query) {
    return properties.find(query);
  }

  static async findOne(query) {
    return properties.findOne(query);
  }

  static async findOneAndUpdate(filter, update) {
    await properties.update(filter, { $set: update });
    return properties.findOne(filter);
  }

  static async findOneAndDelete(filter) {
    const doc = await properties.findOne(filter);
    if (doc) await properties.remove(filter);
    return doc;
  }
}

module.exports = Property;
