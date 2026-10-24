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
const hoursRowSchema = new mongoose.Schema(
  {
    /** 0 = Sunday … 6 = Saturday (in the shop's time zone). */
    day: { type: Number, min: 0, max: 6, required: true },
    open: { type: String, default: "09:00", trim: true },
    close: { type: String, default: "21:00", trim: true },
    closed: { type: Boolean, default: false },
  },
  { _id: false }
);

/** Day-to-day rules the shop owner flips from the admin desk. Defaults keep today's behaviour (always open, no minimum). */
const opsSchema = new mongoose.Schema(
  {
    acceptingOrders: { type: Boolean, default: true },
    closedMessage: { type: String, default: "", trim: true, maxlength: 200 },
    /** While paused, orders reopen by themselves at this time (optional). */
    reopenAt: { type: Date, default: null },
    /** When on, orders are only accepted inside the weekly hours below. */
    autoSchedule: { type: Boolean, default: false },
    timezone: { type: String, default: "Asia/Kolkata", trim: true },
    hours: { type: [hoursRowSchema], default: [] },
    minOrderAmount: { type: Number, default: 0, min: 0 },
    codEnabled: { type: Boolean, default: true },
    onlinePaymentsEnabled: { type: Boolean, default: true },
    /** Largest items total that may be paid on delivery. 0 = no limit. */
    maxCodAmount: { type: Number, default: 0, min: 0 },
  },
  { _id: false }
);

const contactSchema = new mongoose.Schema(
  {
    supportEmail: { type: String, default: "", trim: true, maxlength: 120 },
    supportPhone: { type: String, default: "", trim: true, maxlength: 30 },
    whatsapp: { type: String, default: "", trim: true, maxlength: 30 },
    address: { type: String, default: "", trim: true, maxlength: 240 },
  },
  { _id: false }
);

const businessSchema = new mongoose.Schema(
  {
    legalName: { type: String, default: "", trim: true, maxlength: 120 },
    gstin: { type: String, default: "", trim: true, uppercase: true, maxlength: 15 },
    defaultTaxPercent: { type: Number, default: 0, min: 0, max: 28 },
    invoiceFooter: { type: String, default: "", trim: true, maxlength: 300 },
  },
  { _id: false }
);

const storeSettingsSchema = new mongoose.Schema(
  {
    ops: { type: opsSchema, default: () => ({}) },
    contact: { type: contactSchema, default: () => ({}) },
    business: { type: businessSchema, default: () => ({}) },
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
