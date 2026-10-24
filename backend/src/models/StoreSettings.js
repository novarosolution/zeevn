const mongoose = require("mongoose");

const storePinSchema = new mongoose.Schema(
  {
    label: { type: String, default: "Zeevan farm shop", trim: true },
    latitude: { type: Number, default: 23.2156 },
    longitude: { type: Number, default: 72.6369 },
    maxRadiusKm: { type: Number, default: 25, min: 0 },
    isActive: { type: Boolean, default: true },
  },
  { _id: true }
);

/** Shop pins + “1 km = 3 min”. One doc; `stores` is the list. */
const storeSettingsSchema = new mongoose.Schema(
  {
    latitude: { type: Number, default: 23.2156 },
    longitude: { type: Number, default: 72.6369 },
    label: { type: String, default: "Zeevan farm shop", trim: true },
    minutesPerKm: { type: Number, default: 3, min: 0.2 },
    maxRadiusKm: { type: Number, default: 25, min: 0 },
    stores: { type: [storePinSchema], default: [] },
  },
  { timestamps: true }
);

function seedFromLegacy(doc) {
  if (doc.stores?.length) return false;
  doc.stores = [
    {
      label: doc.label || "Zeevan farm shop",
      latitude: doc.latitude,
      longitude: doc.longitude,
      maxRadiusKm: doc.maxRadiusKm,
      isActive: true,
    },
  ];
  return true;
}

function syncPrimary(doc) {
  const primary = (doc.stores || []).find((s) => s.isActive !== false) || doc.stores?.[0];
  if (!primary) return;
  doc.latitude = primary.latitude;
  doc.longitude = primary.longitude;
  doc.label = primary.label;
  doc.maxRadiusKm = primary.maxRadiusKm;
}

storeSettingsSchema.statics.get = async function getStoreSettings() {
  let doc = await this.findOne();
  if (!doc) doc = await this.create({});
  if (seedFromLegacy(doc)) {
    syncPrimary(doc);
    await doc.save();
  }
  return doc;
};

storeSettingsSchema.statics.listStores = function listStores(doc) {
  const rows = (doc?.stores || []).filter(
    (s) => s && s.isActive !== false && Number.isFinite(Number(s.latitude)) && Number.isFinite(Number(s.longitude))
  );
  if (rows.length) return rows;
  return [
    {
      label: doc?.label || "Zeevan farm shop",
      latitude: doc?.latitude,
      longitude: doc?.longitude,
      maxRadiusKm: doc?.maxRadiusKm,
      isActive: true,
    },
  ];
};

storeSettingsSchema.statics.syncPrimary = syncPrimary;

module.exports = mongoose.model("StoreSettings", storeSettingsSchema);
