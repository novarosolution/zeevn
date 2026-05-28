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

async function verifyPayment(req, res, next) {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(String(id))) {
      return res.status(400).json({ message: "Invalid order id." });
    }
    const order = await Order.findById(id);
    if (!order) {
      return res.status(404).json({ message: "Order not found." });
    }
    if (String(order.user) !== String(req.user._id)) {
      return res.status(403).json({ message: "You can verify only your own order." });
    }
    if (order.paymentMethod !== "Razorpay") {
      return res.status(400).json({ message: "This order is not a Razorpay order." });
    }

    if (order.paymentStatus === "paid") {
      const populated = await Order.findById(order._id)
        .populate("user", "name email")
        .populate("products.product", "name price image inStock stockQty");
      return res.json(populated);
    }

    const {
      razorpay_order_id: razorpayOrderId,
      razorpay_payment_id: razorpayPaymentId,
      razorpay_signature: razorpaySignature,
    } = req.body || {};

    if (!razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
      return res.status(400).json({
        message:
          "razorpay_order_id, razorpay_payment_id, and razorpay_signature are required.",
      });
    }
    if (order.razorpay?.orderId && order.razorpay.orderId !== razorpayOrderId) {
      return res.status(400).json({ message: "Razorpay order id mismatch." });
    }

    const ok = verifyPaymentSignature({
      orderId: razorpayOrderId,
      paymentId: razorpayPaymentId,
      signature: razorpaySignature,
    });
    if (!ok) {
      order.paymentStatus = "failed";
      await order.save();
      return res.status(400).json({ message: "Payment signature verification failed." });
    }

    order.razorpay = {
      orderId: razorpayOrderId,
      paymentId: razorpayPaymentId,
      signature: razorpaySignature,
    };
    order.paymentStatus = "paid";
    order.status = "confirmed";
    order.paymentExpiresAt = null;
    if (order.invoice) {
      order.invoice.status = "paid";
      order.invoice.updatedAt = new Date();
    }
    await order.save();

    const populated = await Order.findById(order._id)
      .populate("user", "name email")
      .populate("products.product", "name price image inStock stockQty");
    return res.json(populated);
  } catch (error) {
    next(error);
  }
}

async function razorpayWebhook(req, res, next) {
  try {
    const { registerWebhookEvent } = require("../../services/webhookReplayService");
    const signatureHeader = req.headers["x-razorpay-signature"];
    const signature = typeof signatureHeader === "string" ? signatureHeader : "";
    const rawBody = Buffer.isBuffer(req.rawBody)
      ? req.rawBody
      : Buffer.isBuffer(req.body)
        ? req.body
        : null;
    if (!rawBody) {
      return res.status(400).send("Missing raw body for webhook verification.");
    }
    if (!signature) {
      return res.status(400).send("Missing signature.");
    }
    const ok = verifyWebhookSignature(rawBody, signature);
    if (!ok) {
      return res.status(400).send("Invalid signature.");
    }

    let event;
    try {
      event = JSON.parse(rawBody.toString("utf8"));
    } catch {
      return res.status(400).send("Invalid JSON.");
    }

    const eventType = String(event?.event || "");
    const paymentEntity = event?.payload?.payment?.entity;
    const orderEntity = event?.payload?.order?.entity;
    const razorpayOrderId =
      paymentEntity?.order_id || orderEntity?.id || event?.payload?.order_id || "";
    const razorpayPaymentId = paymentEntity?.id || "";

    if (!razorpayOrderId) {
      return res.status(200).send("ignored");
    }

    const dedupeKey = `${eventType}:${razorpayOrderId}:${razorpayPaymentId || "none"}`;
    const result = await registerWebhookEvent({
      dedupeKey,
      eventType,
      razorpayOrderId,
      razorpayPaymentId,
      event,
    });

    if (result.duplicate) {
      return res.status(200).send("duplicate");
    }
    if (!result.ok) {
      return res.status(500).send("processing failed");
    }
    return res.status(200).send("ok");
  } catch (error) {
    next(error);
  }
}

async function cancelPendingOrder(req, res, next) {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(String(id))) {
      return res.status(400).json({ message: "Invalid order id." });
    }
    const order = await Order.findById(id);
    if (!order) {
      return res.status(404).json({ message: "Order not found." });
    }
    if (String(order.user) !== String(req.user._id)) {
      return res.status(403).json({ message: "You can cancel only your own order." });
    }
    if (order.status !== "pending_payment" || order.paymentStatus !== "pending") {
      return res
        .status(400)
        .json({ message: "Only orders awaiting payment can be cancelled here." });
    }

    order.status = "cancelled";
    order.paymentStatus = "failed";
    order.paymentExpiresAt = null;
    if (order.invoice) {
      order.invoice.status = "void";
      order.invoice.updatedAt = new Date();
    }
    await order.save();

    const populated = await Order.findById(order._id)
      .populate("user", "name email")
      .populate("products.product", "name price image inStock stockQty");
    return res.json(populated);
  } catch (error) {
    next(error);
  }
}

/**
 * Periodic task: cancel orders past `paymentExpiresAt` that are still awaiting payment.
 */
async function sweepExpiredPendingPayments() {
  try {
    const now = new Date();
    const result = await Order.updateMany(
      {
        status: "pending_payment",
        paymentStatus: "pending",
        paymentExpiresAt: { $ne: null, $lte: now },
      },
      {
        $set: {
          status: "cancelled",
          paymentStatus: "failed",
          paymentExpiresAt: null,
          "invoice.status": "void",
          "invoice.updatedAt": new Date(),
        },
      }
    );
    if (result.modifiedCount > 0) {
      console.log(`[orders] Auto-cancelled ${result.modifiedCount} expired Razorpay orders.`);
    }
  } catch (err) {
    console.error("[orders] sweepExpiredPendingPayments failed:", err.message);
  }
}

module.exports = {
  verifyPayment,
  razorpayWebhook,
  cancelPendingOrder,
  sweepExpiredPendingPayments,
};
