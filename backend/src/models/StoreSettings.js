const mongoose = require("mongoose");

/** Singleton: shop pin + “1 km = 3 min” + max circle. */
const storeSettingsSchema = new mongoose.Schema(
  {
    latitude: { type: Number, default: 23.2156 },
    longitude: { type: Number, default: 72.6369 },
    label: { type: String, default: "Zeevan farm shop", trim: true },
    minutesPerKm: { type: Number, default: 3, min: 0.2 },
    maxRadiusKm: { type: Number, default: 25, min: 0 },
  },
  { timestamps: true }
);

storeSettingsSchema.statics.get = async function getStoreSettings() {
  let doc = await this.findOne();
  if (!doc) doc = await this.create({});
  return doc;
};

module.exports = mongoose.model("StoreSettings", storeSettingsSchema);
