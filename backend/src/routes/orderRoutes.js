const express = require("express");
const {
  createOrder,
  validateCouponForCart,
  getAvailableCouponsForCart,
  reorderMyOrder,
  updateMyOrderAddress,
  verifyPayment,
  razorpayWebhook,
  cancelPendingOrder,
  claimMyOrderReward,
} = require("../controllers/orderController");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

/**
 * Razorpay webhook needs the RAW body for HMAC verification, so we use
 * express.raw() and stash it on req.rawBody. This MUST be registered before
 * any JSON middleware that might consume the stream.
 */
router.post(
  "/razorpay-webhook",
  express.raw({ type: "application/json", limit: "1mb" }),
  (req, _res, next) => {
    req.rawBody = req.body;
    next();
  },
  razorpayWebhook
);

router.post("/", protect, createOrder);
router.get("/available-coupons", protect, getAvailableCouponsForCart);
router.post("/validate-coupon", protect, validateCouponForCart);
router.post("/:id/reorder", protect, reorderMyOrder);
router.patch("/:id/address", protect, updateMyOrderAddress);
router.post("/:id/claim-reward", protect, claimMyOrderReward);
router.post("/:id/verify-payment", protect, verifyPayment);
router.post("/:id/cancel-pending", protect, cancelPendingOrder);

module.exports = router;
