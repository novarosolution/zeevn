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

async function claimMyOrderReward(req, res, next) {
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
      return res.status(403).json({ message: "You can claim rewards only for your own order." });
    }
    if (String(order.status) !== "delivered") {
      return res.status(400).json({ message: "Rewards can only be claimed for delivered orders." });
    }
    if (order.reward?.claimedAt) {
      return res.status(409).json({ message: "Reward already claimed for this order." });
    }

    const eligiblePoints = Math.max(0, Number(order.reward?.eligiblePoints || 25));
    order.reward = {
      eligiblePoints,
      claimedPoints: eligiblePoints,
      claimedAt: new Date(),
    };
    await order.save();

    await User.findByIdAndUpdate(req.user._id, {
      $inc: { rewardPoints: eligiblePoints },
    });

    const updated = await Order.findById(order._id)
      .populate("user", "name email")
      .populate("products.product", "name price image inStock stockQty");
    const refreshedUser = await User.findById(req.user._id).select("rewardPoints");
    return res.json({
      message: `${eligiblePoints} reward points claimed successfully.`,
      order: updated,
      rewardPoints: Number(refreshedUser?.rewardPoints || 0),
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  claimMyOrderReward,
};
