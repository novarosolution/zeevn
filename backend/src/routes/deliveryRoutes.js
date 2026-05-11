const express = require("express");
const { protect, deliveryPartnerOnly } = require("../middleware/authMiddleware");
const {
  getMyDeliveryOrders,
  markMyDeliveryOrderDelivered,
  updateMyDeliveryLocation,
} = require("../controllers/orderController");

const router = express.Router();

router.use(protect, deliveryPartnerOnly);
router.patch("/location", updateMyDeliveryLocation);
router.get("/orders", getMyDeliveryOrders);
router.patch("/orders/:id/mark-delivered", markMyDeliveryOrderDelivered);

module.exports = router;
