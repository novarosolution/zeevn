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

async function updateMyOrderAddress(req, res, next) {
  try {
    const { id } = req.params;
    const order = await Order.findById(id);
    if (!order) {
      return res.status(404).json({ message: "Order not found." });
    }
    if (String(order.user) !== String(req.user._id)) {
      return res.status(403).json({ message: "You can update only your own order address." });
    }

    const elapsedMs = Date.now() - new Date(order.createdAt).getTime();
    const canEditWithin5Min = elapsedMs <= 5 * 60 * 1000;
    if (!canEditWithin5Min) {
      return res.status(400).json({ message: "Address can be changed only within 5 minutes of placing order." });
    }
    if (!ORDER_STATUSES_ALLOW_ADDRESS_EDIT.includes(order.status)) {
      return res.status(400).json({
        message: "Address can only be changed while the order is still early in processing (before pickup).",
      });
    }

    const shippingAddress = req.body?.shippingAddress || {};
    const requiredFields = ["fullName", "phone", "line1", "city", "state", "postalCode", "country"];
    for (const field of requiredFields) {
      if (!String(shippingAddress[field] || "").trim()) {
        return res.status(400).json({ message: `Shipping address field "${field}" is required.` });
      }
    }

    order.shippingAddress = {
      ...order.shippingAddress,
      ...shippingAddress,
      fullName: String(shippingAddress.fullName || "").trim(),
      phone: String(shippingAddress.phone || "").trim(),
      line1: String(shippingAddress.line1 || "").trim(),
      city: String(shippingAddress.city || "").trim(),
      state: String(shippingAddress.state || "").trim(),
      postalCode: String(shippingAddress.postalCode || "").trim(),
      country: String(shippingAddress.country || "").trim(),
      note: String(shippingAddress.note || "").trim(),
      latitude: Number.isFinite(Number(shippingAddress.latitude))
        ? Number(shippingAddress.latitude)
        : order.shippingAddress?.latitude ?? null,
      longitude: Number.isFinite(Number(shippingAddress.longitude))
        ? Number(shippingAddress.longitude)
        : order.shippingAddress?.longitude ?? null,
    };

    await order.save();
    const updated = await Order.findById(order._id)
      .populate("user", "name email")
      .populate("products.product", "name price image inStock stockQty");
    res.json(updated);
  } catch (error) {
    next(error);
  }
}

module.exports = {
  updateMyOrderAddress,
};
