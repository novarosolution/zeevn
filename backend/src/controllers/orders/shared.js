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

const PLATFORM_FEE = 1.2;
const DEFAULT_DELIVERY_FEE = 0;
const DELIVERY_LOCATION_UPDATE_MIN_INTERVAL_MS = 10000;
const INVOICE_STATUS_VALUES = ["draft", "final", "paid", "void"];
const SUPPORTED_PAYMENT_METHODS = ["Cash on Delivery", "Razorpay"];
const RAZORPAY_PAYMENT_WINDOW_MS = 30 * 60 * 1000;

function liveLocationDestinationSummary(shippingAddress) {
  const a = shippingAddress && typeof shippingAddress === "object" ? shippingAddress : {};
  return {
    fullName: String(a.fullName || "").trim(),
    line1: String(a.line1 || "").trim(),
    city: String(a.city || "").trim(),
    state: String(a.state || "").trim(),
    postalCode: String(a.postalCode || "").trim(),
    phone: String(a.phone || "").trim(),
    country: String(a.country || "").trim(),
  };
}

function getRequestSubtotal(req) {
  const rawSubtotal = req.body?.subtotal ?? req.query?.subtotal;
  if (rawSubtotal === undefined || rawSubtotal === null || rawSubtotal === "") {
    return null;
  }
  const subtotal = Number(rawSubtotal);
  return Number.isFinite(subtotal) && subtotal >= 0 ? subtotal : null;
}

function getUserCartSubtotal(user) {
  return (user.cartItems || []).reduce(
    (sum, item) => sum + Number(item.price || 0) * Number(item.quantity || 0),
    0
  );
}

module.exports = {
  PLATFORM_FEE,
  DEFAULT_DELIVERY_FEE,
  DELIVERY_LOCATION_UPDATE_MIN_INTERVAL_MS,
  INVOICE_STATUS_VALUES,
  SUPPORTED_PAYMENT_METHODS,
  RAZORPAY_PAYMENT_WINDOW_MS,
  liveLocationDestinationSummary,
  getRequestSubtotal,
  getUserCartSubtotal,
};
