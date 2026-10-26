const express = require("express");
const {
  getAdminProducts,
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
  bulkUpdateOrderStatus,
  bulkAssignRider,
  updateOrderPayment,
  getAdminOrderNotes,
  addOrderNote,
  deleteOrderNote,
} = require("../controllers/orderController");
const {
  searchAdminOrders,
  getDeskSummary,
  getZoneStats,
  listRiders,
  listCashDue,
  listRiderPerformance,
  getStoreOpsSettings,
  updateStoreOpsSettings,
} = require("../controllers/adminDeskController");
const { listAdminDispatch } = require("../controllers/adminDispatchController");
const {
  getAllUsers,
  updateUserAdminStatus,
  updateUserDeliveryPartnerStatus,
  deleteUser,
} = require("../controllers/userController");
const {
  listAdminDeletions,
  getAdminDeletion,
  approveDeletion,
  rejectDeletion,
} = require("../controllers/deletionController");
const {
  createBroadcastNotification,
  createRiderNotification,
  getAdminRiderNotifications,
  getAdminNotifications,
} = require("../controllers/notificationController");
const { getAdminAnalytics, getAdminOpsSummary } = require("../controllers/analyticsController");
const { getAdminOverview } = require("../controllers/adminOverviewController");
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
const { getAdminFaqs, updateAdminFaqs } = require("../controllers/faqController");
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
  getStoreSettings,
  updateStoreSettings,
} = require("../controllers/deliveryZoneController");
const {
  listAdminReturns,
  getAdminReturn,
  createAdminReturn,
  approveReturn,
  rejectReturn,
} = require("../controllers/returnController");
const {
  listReceipts,
  getReceipt,
  createReceipt,
  updateReceipt,
  confirmReceipt,
} = require("../controllers/stockInController");
const { listReorders } = require("../controllers/adminReorderController");
const { listStockReport } = require("../controllers/adminStockReportController");
const { listStockHistory } = require("../controllers/adminStockHistoryController");
const { listAdminLogs } = require("../controllers/adminLogController");
const {
  listClosings,
  getToday,
  getClosing,
  saveDraft,
  submitClosing,
  reopenClosing,
  applyVariance,
} = require("../controllers/closingController");
const {
  listTransfers,
  getTransfer,
  createTransfer,
  updateTransfer,
  confirmTransfer,
} = require("../controllers/stockTransferController");
const { createStockOut } = require("../controllers/stockOutController");
const { listSuppliers, upsertSupplier } = require("../controllers/supplierController");
const { applyCycleCount } = require("../controllers/cycleCountController");
const {
  createWalkIn,
  voidWalkIn,
  createWalkInCustomer,
  updateCustomerNote,
} = require("../controllers/walkInController");
const { protect, adminOnly } = require("../middleware/authMiddleware");
const { idempotent } = require("../middleware/idempotency");

const router = express.Router();

router.use(protect, adminOnly);

router.get("/products", getAdminProducts);
router.post("/products", createProduct);
router.put("/products/:id", updateProduct);
router.delete("/products/:id", deleteProduct);
router.post("/uploads/image", uploadProductImage);
router.post("/uploads/video", uploadMarketingVideo);

router.get("/orders", getAllOrders);
// Static paths first, so "search" is never read as an order id.
router.get("/orders/search", searchAdminOrders);
router.post("/orders/bulk-status", bulkUpdateOrderStatus);
router.post("/orders/bulk-assign", bulkAssignRider);
router.get("/orders/:id", getAdminOrderById);
router.patch("/orders/:id/status", updateOrderStatus);
router.patch("/orders/:id/payment", updateOrderPayment);
router.get("/orders/:id/notes", getAdminOrderNotes);
router.post("/orders/:id/notes", addOrderNote);
router.delete("/orders/:id/notes/:noteId", deleteOrderNote);
router.put("/orders/:id", updateAdminOrderDetails);
router.delete("/orders/:id", deleteOrder);

router.get("/dispatch", listAdminDispatch);
router.get("/cash", listCashDue);

router.get("/returns", listAdminReturns);
router.post("/returns", createAdminReturn);
router.get("/returns/:id", getAdminReturn);
router.post("/returns/:id/approve", approveReturn);
router.post("/returns/:id/reject", rejectReturn);

router.get("/stock-in", listReceipts);
router.post("/stock-in", idempotent("stock-in"), createReceipt);
router.get("/stock-in/:id", getReceipt);
router.put("/stock-in/:id", updateReceipt);
router.post("/stock-in/:id/confirm", confirmReceipt);
router.get("/stock-transfers", listTransfers);
router.post("/stock-transfers", idempotent("transfer"), createTransfer);
router.get("/stock-transfers/:id", getTransfer);
router.put("/stock-transfers/:id", updateTransfer);
router.post("/stock-transfers/:id/confirm", confirmTransfer);
router.post("/stock-out", idempotent("stock-out"), createStockOut);
router.get("/suppliers", listSuppliers);
router.post("/suppliers", upsertSupplier);
router.post("/cycle-count", applyCycleCount);
router.post("/walk-in", idempotent("walk-in"), createWalkIn);
router.post("/walk-in/:id/void", voidWalkIn);
router.post("/customers", createWalkInCustomer);
router.patch("/customers/:id/note", updateCustomerNote);
router.get("/reorders", listReorders);
router.get("/stock-report", listStockReport);
router.get("/stock-history", listStockHistory);
router.get("/logs", listAdminLogs);

router.get("/closings", listClosings);
router.get("/closings/today", getToday);
router.get("/closings/:date", getClosing);
router.put("/closings/:date", saveDraft);
router.post("/closings/:date/submit", submitClosing);
router.post("/closings/:date/reopen", reopenClosing);
router.post("/closings/:date/apply", applyVariance);

router.get("/deletions", listAdminDeletions);
router.get("/deletions/:id", getAdminDeletion);
router.post("/deletions/:id/approve", approveDeletion);
router.post("/deletions/:id/reject", rejectDeletion);

router.get("/users", getAllUsers);
router.patch("/users/:id/role", updateUserAdminStatus);
router.patch("/users/:id/delivery-role", updateUserDeliveryPartnerStatus);
router.delete("/users/:id", deleteUser);

router.get("/notifications", getAdminNotifications);
router.get("/notifications/riders", getAdminRiderNotifications);
router.post("/notifications/broadcast", createBroadcastNotification);
router.post("/notifications/riders", createRiderNotification);
router.get("/analytics", getAdminAnalytics);
router.get("/overview", getAdminOverview);
router.get("/ops-summary", getAdminOpsSummary);
router.get("/desk-summary", getDeskSummary);
router.get("/riders", listRiders);
router.get("/rider-performance", listRiderPerformance);
router.get("/store-ops", getStoreOpsSettings);
router.put("/store-ops", updateStoreOpsSettings);
router.get("/coupons", getAdminCoupons);
router.post("/coupons", createAdminCoupon);
router.put("/coupons/:id", updateAdminCoupon);
router.get("/rewards", getAdminRewards);
router.post("/rewards", createAdminReward);
router.put("/rewards/:id", updateAdminReward);
router.get("/faqs", getAdminFaqs);
router.put("/faqs", updateAdminFaqs);
router.get("/support-threads", getAdminSupportThreads);
router.post("/support-threads/:id/reply", replyToSupportThread);
router.patch("/support-threads/:id/status", updateSupportThreadStatus);
router.get("/home-view", getAdminHomeViewConfig);
router.put("/home-view", updateAdminHomeViewConfig);

router.get("/delivery-zones", listDeliveryZones);
router.get("/delivery-zones/stats", getZoneStats);
router.post("/delivery-zones", createDeliveryZone);
router.patch("/delivery-zones/:id", updateDeliveryZone);
router.delete("/delivery-zones/:id", deleteDeliveryZone);
router.get("/delivery-partners", listDeliveryPartners);
router.get("/store-settings", getStoreSettings);
router.put("/store-settings", updateStoreSettings);

module.exports = router;
