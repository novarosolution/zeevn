const express = require("express");
const {
  createOrder,
  validateCouponForCart,
  getAvailableCouponsForCart,
  reorderMyOrder,
  updateMyOrderAddress,
} = require("../controllers/orderController");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

router.post("/", protect, createOrder);
router.get("/available-coupons", protect, getAvailableCouponsForCart);
router.post("/validate-coupon", protect, validateCouponForCart);
router.post("/:id/reorder", protect, reorderMyOrder);
router.patch("/:id/address", protect, updateMyOrderAddress);

module.exports = router;
