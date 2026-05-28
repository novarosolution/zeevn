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

async function updateMyDeliveryLocation(req, res, next) {
  try {
    const lat = Number(req.body?.latitude);
    const lng = Number(req.body?.longitude);
    const accRaw = req.body?.accuracyMeters;
    const accuracyMeters =
      accRaw !== undefined && accRaw !== null && accRaw !== ""
        ? Number(accRaw)
        : null;

    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
      return res.status(400).json({ message: "latitude and longitude are required as numbers." });
    }
    if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      return res.status(400).json({ message: "Invalid coordinates." });
    }

    const user = await User.findById(req.user._id).select("deliveryLiveLocation");
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    const prevAt = user.deliveryLiveLocation?.updatedAt;
    if (prevAt && Date.now() - new Date(prevAt).getTime() < DELIVERY_LOCATION_UPDATE_MIN_INTERVAL_MS) {
      return res.status(200).json({
        ok: true,
        throttled: true,
        updatedAt: new Date(prevAt).toISOString(),
      });
    }

    const now = new Date();
    await User.findByIdAndUpdate(req.user._id, {
      $set: {
        deliveryLiveLocation: {
          latitude: lat,
          longitude: lng,
          accuracyMeters: Number.isFinite(accuracyMeters) ? accuracyMeters : null,
          updatedAt: now,
        },
      },
    });

    res.json({ ok: true, throttled: false, updatedAt: now.toISOString() });
  } catch (error) {
    next(error);
  }
}

async function getMyOrderLiveLocation(req, res, next) {
  try {
    const { orderId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(String(orderId))) {
      return res.status(400).json({ message: "Invalid order id." });
    }

    const order = await Order.findOne({ _id: orderId, user: req.user._id })
      .select("status assignedDeliveryUser shippingAddress")
      .populate({
        path: "assignedDeliveryUser",
        select: "name phone deliveryLiveLocation",
      });

    if (!order) {
      return res.status(404).json({ message: "Order not found." });
    }

    const status = String(order.status || "");
    const liveLocationStatuses = new Set(["ready_for_pickup", "shipped", "out_for_delivery"]);
    if (!liveLocationStatuses.has(status)) {
      return res.status(403).json({
        message: "Live location is available after packing starts (ready for pickup, shipped, or out for delivery).",
      });
    }

    const partner = order.assignedDeliveryUser;
    if (!partner) {
      return res.status(404).json({ message: "No delivery partner assigned yet." });
    }

    const loc = partner.deliveryLiveLocation;
    const lat = loc?.latitude;
    const lng = loc?.longitude;
    const destLat = order.shippingAddress?.latitude;
    const destLng = order.shippingAddress?.longitude;
    const destSummary = liveLocationDestinationSummary(order.shippingAddress);

    const payload = {
      trackable: Number.isFinite(lat) && Number.isFinite(lng),
      partner: {
        name: partner.name || "",
        phone: partner.phone || "",
      },
      destination: {
        latitude: Number.isFinite(Number(destLat)) ? Number(destLat) : null,
        longitude: Number.isFinite(Number(destLng)) ? Number(destLng) : null,
        ...destSummary,
      },
    };

    if (!payload.trackable) {
      return res.json({
        ...payload,
        latitude: null,
        longitude: null,
        updatedAt: null,
        accuracyMeters: null,
        message: "Partner has not shared location yet.",
      });
    }

    res.json({
      ...payload,
      latitude: lat,
      longitude: lng,
      updatedAt: loc.updatedAt ? new Date(loc.updatedAt).toISOString() : null,
      accuracyMeters:
        loc.accuracyMeters != null && Number.isFinite(Number(loc.accuracyMeters))
          ? Number(loc.accuracyMeters)
          : null,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Driving route polyline (Google Directions) for order owner — same auth as live-location.
 * Coordinates are taken from the database only (not client-supplied).
 */
async function getMyOrderDrivingRoute(req, res, next) {
  try {
    const { orderId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(String(orderId))) {
      return res.status(400).json({ message: "Invalid order id." });
    }

    const order = await Order.findOne({ _id: orderId, user: req.user._id })
      .select("status shippingAddress")
      .populate({
        path: "assignedDeliveryUser",
        select: "deliveryLiveLocation",
      });

    if (!order) {
      return res.status(404).json({ message: "Order not found." });
    }

    const status = String(order.status || "");
    const liveLocationStatuses = new Set(["ready_for_pickup", "shipped", "out_for_delivery"]);
    if (!liveLocationStatuses.has(status)) {
      return res.status(403).json({
        message: "Driving route is available when the order is ready for pickup, shipped, or out for delivery.",
      });
    }

    const partner = order.assignedDeliveryUser;
    if (!partner) {
      return res.status(404).json({ message: "No delivery partner assigned yet." });
    }

    const loc = partner.deliveryLiveLocation;
    const oLat = loc?.latitude;
    const oLng = loc?.longitude;
    const dLat = order.shippingAddress?.latitude;
    const dLng = order.shippingAddress?.longitude;

    const origOk = Number.isFinite(Number(oLat)) && Number.isFinite(Number(oLng));
    const destOk = Number.isFinite(Number(dLat)) && Number.isFinite(Number(dLng));
    if (!origOk || !destOk) {
      return res.json({ encodedPolyline: null, message: "Origin or destination coordinates are missing." });
    }

    const apiKey = getDirectionsApiKey();
    if (!apiKey) {
      return res.json({ encodedPolyline: null, message: "Directions are not configured on the server." });
    }

    const encodedPolyline = await fetchDrivingRouteEncodedPolyline(
      orderId,
      Number(oLat),
      Number(oLng),
      Number(dLat),
      Number(dLng),
      apiKey
    );

    return res.json({
      encodedPolyline,
      provider: encodedPolyline ? "google" : null,
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  updateMyDeliveryLocation,
  getMyOrderLiveLocation,
  getMyOrderDrivingRoute,
};
