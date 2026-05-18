const mongoose = require("mongoose");
const Order = require("../../models/Order");
const User = require("../../models/User");
const Product = require("../../models/Product");
const Coupon = require("../../models/Coupon");
const CouponRedemption = require("../../models/CouponRedemption");
const {
  normalizeCouponCode,
  getCouponValidationError,
  computeCouponDiscount,
} = require("../../utils/coupon");
const { buildCouponValidationResponse } = require("../couponController");
const { resolveProductLineFromRaw } = require("../../utils/productLine");
const {
  ORDER_STATUS_VALUES,
  ORDER_STATUSES_ALLOW_ADDRESS_EDIT,
  ORDER_STATUSES_DELIVERY_DASHBOARD,
  ORDER_STATUSES_MARK_DELIVERABLE_FROM,
} = require("../../constants/orderStatuses");
const {
  createPaymentOrder,
  getRazorpayKeyId,
  verifyPaymentSignature,
  verifyWebhookSignature,
} = require("../../services/razorpayService");
const {
  fetchDrivingRouteEncodedPolyline,
  getDirectionsApiKey,
} = require("../../services/googleDirectionsService");
const {
  PLATFORM_FEE,
  DEFAULT_DELIVERY_FEE,
  DELIVERY_LOCATION_UPDATE_MIN_INTERVAL_MS,
  INVOICE_STATUS_VALUES,
  SUPPORTED_PAYMENT_METHODS,
  RAZORPAY_PAYMENT_WINDOW_MS,
  liveLocationDestinationSummary,
  getRequestSubtotal,
  getUserCartSubtotal,
} = require("./shared");

async function validateCouponForCart(req, res, next) {
  try {
    const couponCode = normalizeCouponCode(req.body?.couponCode);
    if (!couponCode) {
      return res.status(400).json({ message: "Coupon code is required." });
    }

    const user = await User.findById(req.user._id).select("cartItems");
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    const subtotal = getRequestSubtotal(req) ?? getUserCartSubtotal(user);
    const coupon = await Coupon.findOne({ code: couponCode });
    const issuedForUserId = coupon?.issuedForUser ? String(coupon.issuedForUser) : "";
    const personalOk =
      coupon && issuedForUserId && issuedForUserId === String(req.user._id);
    if (coupon && !coupon.isVisibleToUsers && !personalOk) {
      return res.status(400).json({ valid: false, message: "This coupon is not available for users." });
    }
    if (coupon && issuedForUserId && issuedForUserId !== String(req.user._id)) {
      return res.status(400).json({ valid: false, message: "This coupon is linked to another account." });
    }
    if (coupon && coupon.isOneTimePerUser) {
      const usedByUser = await CouponRedemption.exists({ coupon: coupon._id, user: req.user._id });
      if (usedByUser) {
        return res.status(400).json({
          valid: false,
          message: "This coupon can be used only one time per user.",
        });
      }
    }
    const payload = buildCouponValidationResponse(coupon, subtotal);

    if (!payload.valid) {
      return res.status(400).json(payload);
    }
    return res.json({
      ...payload,
      subtotal: Number(subtotal.toFixed(2)),
    });
  } catch (error) {
    next(error);
  }
}

async function getAvailableCouponsForCart(req, res, next) {
  try {
    const user = await User.findById(req.user._id).select("cartItems");
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    const subtotal = getRequestSubtotal(req) ?? getUserCartSubtotal(user);
    const allCoupons = await Coupon.find({
      isActive: true,
      $or: [{ isVisibleToUsers: true }, { issuedForUser: req.user._id }],
    }).sort({ createdAt: -1 });
    const validCoupons = [];

    for (const coupon of allCoupons) {
      const couponIssuedFor = coupon.issuedForUser ? String(coupon.issuedForUser) : "";
      if (couponIssuedFor && couponIssuedFor !== String(req.user._id)) {
        continue;
      }
      if (coupon.isOneTimePerUser) {
        const usedByUser = await CouponRedemption.exists({ coupon: coupon._id, user: req.user._id });
        if (usedByUser) continue;
      }
      const errorMessage = getCouponValidationError(coupon, subtotal);
      if (errorMessage) continue;
      validCoupons.push({
        code: coupon.code,
        title: coupon.title,
        type: coupon.type,
        value: Number(coupon.value || 0),
        minOrderAmount: Number(coupon.minOrderAmount || 0),
        maxDiscountAmount: Number(coupon.maxDiscountAmount || 0) || null,
        estimatedDiscount: computeCouponDiscount(coupon, subtotal),
        isOneTimePerUser: Boolean(coupon.isOneTimePerUser),
        expiresAt: coupon.expiresAt || null,
      });
    }

    return res.json({
      subtotal: Number(subtotal.toFixed(2)),
      coupons: validCoupons,
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  validateCouponForCart,
  getAvailableCouponsForCart,
};
