const mongoose = require("mongoose");

/**
 * Admin-defined catalog offers users redeem for reward points (same discount
 * mechanics as coupons once redeemed — a personal coupon is issued).
 */
const rewardSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, default: "", trim: true },
    pointsCost: { type: Number, required: true, min: 1 },
    discountType: {
      type: String,
      enum: ["percent", "flat"],
      default: "percent",
    },
    discountValue: { type: Number, required: true, min: 0 },
    minOrderAmount: { type: Number, default: 0, min: 0 },
    maxDiscountAmount: { type: Number, default: null, min: 0 },
    /** Max times this reward can be redeemed globally (null = unlimited). */
    totalRedemptionLimit: { type: Number, default: null, min: 1 },
    redemptionCount: { type: Number, default: 0, min: 0 },
    /** Max successful redeems per user for this reward. */
    perUserLimit: { type: Number, default: 1, min: 1 },
    /** Days until issued coupon expires (from redeem time). */
    issuedCouponValidDays: { type: Number, default: 90, min: 1 },
    isActive: { type: Boolean, default: true },
    isVisibleToUsers: { type: Boolean, default: true },
    expiresAt: { type: Date, default: null },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Reward", rewardSchema);
