const express = require("express");
const {
  registerUser,
  loginUser,
  refreshAccessToken,
  getProfile,
  updateProfile,
  uploadUserAvatar,
  upsertPushToken,
  getMyCart,
  replaceMyCart,
} = require("../controllers/userController");
const { getMyOrders, getMyOrderLiveLocation, getMyOrderDrivingRoute } = require("../controllers/orderController");
const {
  getMyNotifications,
  markNotificationAsRead,
  archiveNotification,
  unarchiveNotification,
} = require("../controllers/notificationController");
const {
  getOrCreateMySupportThread,
  sendMessageToSupport,
} = require("../controllers/supportController");
const { getRewardsCatalog, getMyRewardCoupons, redeemReward } = require("../controllers/rewardController");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

router.post("/register", registerUser);
router.post("/login", loginUser);
router.post("/refresh", refreshAccessToken);
router.get("/profile", protect, getProfile);
router.put("/profile", protect, updateProfile);
router.post("/profile/avatar", protect, uploadUserAvatar);
router.post("/push-token", protect, upsertPushToken);
router.get("/cart", protect, getMyCart);
router.put("/cart", protect, replaceMyCart);
router.get("/my-orders/:orderId/live-location", protect, getMyOrderLiveLocation);
router.get("/my-orders/:orderId/driving-route", protect, getMyOrderDrivingRoute);
router.get("/my-orders", protect, getMyOrders);
router.get("/notifications", protect, getMyNotifications);
router.patch("/notifications/:id/read", protect, markNotificationAsRead);
router.patch("/notifications/:id/archive", protect, archiveNotification);
router.patch("/notifications/:id/unarchive", protect, unarchiveNotification);
router.get("/support-thread", protect, getOrCreateMySupportThread);
router.post("/support-thread/messages", protect, sendMessageToSupport);
router.get("/rewards/catalog", protect, getRewardsCatalog);
router.get("/rewards/my-coupons", protect, getMyRewardCoupons);
router.post("/rewards/:rewardId/redeem", protect, redeemReward);

module.exports = router;
