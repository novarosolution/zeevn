const express = require("express");
const { protect, deliveryPartnerOnly } = require("../middleware/authMiddleware");
const { rateLimitDeliveryLocation } = require("../middleware/rateLimitDeliveryLocation");
const { checkDeliveryServiceability } = require("../controllers/deliveryZoneController");
const {
  getMyDeliveryOrders,
  acceptMyDeliveryOrder,
  declineMyDeliveryOrder,
  markMyDeliveryOrderDelivered,
  updateMyDeliveryLocation,
} = require("../controllers/orderController");

const router = express.Router();

/** Public checkout check — no auth. */
router.get("/check", checkDeliveryServiceability);

router.use(protect, deliveryPartnerOnly);
router.patch("/location", rateLimitDeliveryLocation, updateMyDeliveryLocation);
router.get("/orders", getMyDeliveryOrders);
router.patch("/orders/:id/accept", acceptMyDeliveryOrder);
router.patch("/orders/:id/decline", declineMyDeliveryOrder);
router.patch("/orders/:id/mark-delivered", markMyDeliveryOrderDelivered);

module.exports = router;
