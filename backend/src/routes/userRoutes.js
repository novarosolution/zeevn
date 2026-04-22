const express = require("express");
const {
  registerUser,
  loginUser,
  getProfile,
  updateProfile,
  uploadUserAvatar,
  upsertPushToken,
  getMyCart,
  replaceMyCart,
} = require("../controllers/userController");
const { getMyOrders } = require("../controllers/orderController");
const {
  getMyNotifications,
  markNotificationAsRead,
} = require("../controllers/notificationController");
const {
  getOrCreateMySupportThread,
  sendMessageToSupport,
} = require("../controllers/supportController");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

router.post("/register", registerUser);
router.post("/login", loginUser);
router.get("/profile", protect, getProfile);
router.put("/profile", protect, updateProfile);
router.post("/profile/avatar", protect, uploadUserAvatar);
router.post("/push-token", protect, upsertPushToken);
router.get("/cart", protect, getMyCart);
router.put("/cart", protect, replaceMyCart);
router.get("/my-orders", protect, getMyOrders);
router.get("/notifications", protect, getMyNotifications);
router.patch("/notifications/:id/read", protect, markNotificationAsRead);
router.get("/support-thread", protect, getOrCreateMySupportThread);
router.post("/support-thread/messages", protect, sendMessageToSupport);

module.exports = router;
