const mongoose = require("mongoose");

const deliveryZoneSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    /** Normalized 6-digit Indian pincodes. */
    postalCodes: {
      type: [String],
      default: [],
    },
    /** Lowercased city names for fallback when pin is missing/unknown. */
    cities: {
      type: [String],
      default: [],
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    deliveryFee: {
      type: Number,
      default: 0,
      min: 0,
    },
    /** Items total at/above this → delivery fee 0. 0 = never free. */
    freeAbove: {
      type: Number,
      default: 1499,
      min: 0,
    },
    etaMinutesMin: {
      type: Number,
      default: 60,
      min: 0,
    },
    etaMinutesMax: {
      type: Number,
      default: 180,
      min: 0,
    },
    /** Drawn coverage on the admin map. Empty = pincode/city only. */
    polygon: {
      type: [{ lat: { type: Number }, lng: { type: Number }, _id: false }],
      default: [],
    },
    /** Optional partners allowed to deliver this zone. Empty = any partner. */
    partnerIds: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
  },
  { timestamps: true }
);

deliveryZoneSchema.index({ postalCodes: 1 });
deliveryZoneSchema.index({ cities: 1 });
deliveryZoneSchema.index({ isActive: 1 });

module.exports = mongoose.model("DeliveryZone", deliveryZoneSchema);
