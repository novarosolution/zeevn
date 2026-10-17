const express = require("express");
const {
  getProducts,
  createProduct,
  updateProduct,
  deleteProduct,
  uploadProductImage,
  uploadMarketingVideo,
} = require("../controllers/productController");
const {
  getAllOrders,
  getAdminOrderById,
  updateOrderStatus,
  deleteOrder,
  updateAdminOrderDetails,
} = require("../controllers/orderController");
const {
  getAllUsers,
  updateUserAdminStatus,
  updateUserDeliveryPartnerStatus,
  deleteUser,
} = require("../controllers/userController");
const {
  createBroadcastNotification,
  getAdminNotifications,
} = require("../controllers/notificationController");
const { getAdminAnalytics, getAdminOpsSummary } = require("../controllers/analyticsController");
const {
  getAdminCoupons,
  createAdminCoupon,
  updateAdminCoupon,
} = require("../controllers/couponController");
const {
  getAdminRewards,
  createAdminReward,
  updateAdminReward,
} = require("../controllers/rewardController");
const {
  getAdminSupportThreads,
  replyToSupportThread,
  updateSupportThreadStatus,
} = require("../controllers/supportController");
const {
  getAdminHomeViewConfig,
  updateAdminHomeViewConfig,
} = require("../controllers/homeViewController");
const {
  listDeliveryZones,
  createDeliveryZone,
  updateDeliveryZone,
  deleteDeliveryZone,
  listDeliveryPartners,
} = require("../controllers/deliveryZoneController");
const { protect, adminOnly } = require("../middleware/authMiddleware");

const router = express.Router();

router.use(protect, adminOnly);

router.get("/products", getProducts);
router.post("/products", createProduct);
router.put("/products/:id", updateProduct);
router.delete("/products/:id", deleteProduct);
router.post("/uploads/image", uploadProductImage);
router.post("/uploads/video", uploadMarketingVideo);

router.get("/orders", getAllOrders);
router.get("/orders/:id", getAdminOrderById);
router.patch("/orders/:id/status", updateOrderStatus);
router.put("/orders/:id", updateAdminOrderDetails);
router.delete("/orders/:id", deleteOrder);

router.get("/users", getAllUsers);
router.patch("/users/:id/role", updateUserAdminStatus);
router.patch("/users/:id/delivery-role", updateUserDeliveryPartnerStatus);
router.delete("/users/:id", deleteUser);

router.get("/notifications", getAdminNotifications);
router.post("/notifications/broadcast", createBroadcastNotification);
router.get("/analytics", getAdminAnalytics);
router.get("/ops-summary", getAdminOpsSummary);
router.get("/coupons", getAdminCoupons);
router.post("/coupons", createAdminCoupon);
router.put("/coupons/:id", updateAdminCoupon);
router.get("/rewards", getAdminRewards);
router.post("/rewards", createAdminReward);
router.put("/rewards/:id", updateAdminReward);
router.get("/support-threads", getAdminSupportThreads);
router.post("/support-threads/:id/reply", replyToSupportThread);
router.patch("/support-threads/:id/status", updateSupportThreadStatus);
router.get("/home-view", getAdminHomeViewConfig);
router.put("/home-view", updateAdminHomeViewConfig);

router.get("/delivery-zones", listDeliveryZones);
router.post("/delivery-zones", createDeliveryZone);
router.patch("/delivery-zones/:id", updateDeliveryZone);
router.delete("/delivery-zones/:id", deleteDeliveryZone);
router.get("/delivery-partners", listDeliveryPartners);

module.exports = router;
