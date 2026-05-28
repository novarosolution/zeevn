const { createOrder } = require("./createOrder");
const { getAllOrders, getMyOrders } = require("./queries");
const { updateMyDeliveryLocation, getMyOrderLiveLocation, getMyOrderDrivingRoute } = require("./tracking");
const { validateCouponForCart, getAvailableCouponsForCart } = require("./coupon");
const { reorderMyOrder } = require("./reorder");
const { updateMyOrderAddress } = require("./customer");
const {
  updateAdminOrderDetails,
  getMyDeliveryOrders,
  markMyDeliveryOrderDelivered,
  updateOrderStatus,
  deleteOrder,
} = require("./status");
const { verifyPayment, razorpayWebhook, cancelPendingOrder, sweepExpiredPendingPayments } = require("./payment");
const { claimMyOrderReward } = require("./returns");

module.exports = {
  createOrder,
  getAllOrders,
  getMyOrders,
  updateMyDeliveryLocation,
  getMyOrderLiveLocation,
  getMyOrderDrivingRoute,
  validateCouponForCart,
  getAvailableCouponsForCart,
  reorderMyOrder,
  updateMyOrderAddress,
  updateAdminOrderDetails,
  getMyDeliveryOrders,
  markMyDeliveryOrderDelivered,
  updateOrderStatus,
  verifyPayment,
  razorpayWebhook,
  cancelPendingOrder,
  claimMyOrderReward,
  sweepExpiredPendingPayments,
  deleteOrder,
};
