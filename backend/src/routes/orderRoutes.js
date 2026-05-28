const express = require("express");
const {
  createOrder,
  validateCouponForCart,
  getAvailableCouponsForCart,
  reorderMyOrder,
  updateMyOrderAddress,
  verifyPayment,
  cancelPendingOrder,
  claimMyOrderReward,
} = require("../controllers/orderController");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

/** Razorpay webhook is mounted on `server.js` before `express.json()` for raw body verification. */

router.post("/", protect, createOrder);
router.get("/available-coupons", protect, getAvailableCouponsForCart);
router.post("/validate-coupon", protect, validateCouponForCart);
router.post("/:id/reorder", protect, reorderMyOrder);
router.patch("/:id/address", protect, updateMyOrderAddress);
router.post("/:id/claim-reward", protect, claimMyOrderReward);
router.post("/:id/verify-payment", protect, verifyPayment);
router.post("/:id/cancel-pending", protect, cancelPendingOrder);

module.exports = router;
