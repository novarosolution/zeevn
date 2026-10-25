import { createLazyScreenDevSafe } from "./createLazyScreenDevSafe";

export const AdminDashboardScreen = createLazyScreenDevSafe(
  () => require("../screens/admin/AdminDashboardScreen").default,
  () => import("../screens/admin/AdminDashboardScreen"),
  { screenName: "AdminDashboardScreen" }
);
export const AdminShopDeskScreen = createLazyScreenDevSafe(
  () => require("../screens/admin/AdminShopDeskScreen").default,
  () => import("../screens/admin/AdminShopDeskScreen"),
  { screenName: "AdminShopDeskScreen" }
);
export const AdminOrdersScreen = createLazyScreenDevSafe(
  () => require("../screens/admin/AdminOrdersScreen").default,
  () => import("../screens/admin/AdminOrdersScreen"),
  { screenName: "AdminOrdersScreen" }
);
export const AdminOrderDetailScreen = createLazyScreenDevSafe(
  () => require("../screens/admin/AdminOrderDetailScreen").default,
  () => import("../screens/admin/AdminOrderDetailScreen"),
  { screenName: "AdminOrderDetailScreen" }
);
export const AdminReturnsScreen = createLazyScreenDevSafe(
  () => require("../screens/admin/AdminReturnsScreen").default,
  () => import("../screens/admin/AdminReturnsScreen"),
  { screenName: "AdminReturnsScreen" }
);
export const AdminReturnDetailScreen = createLazyScreenDevSafe(
  () => require("../screens/admin/AdminReturnDetailScreen").default,
  () => import("../screens/admin/AdminReturnDetailScreen"),
  { screenName: "AdminReturnDetailScreen" }
);
export const AdminDispatchScreen = createLazyScreenDevSafe(
  () => require("../screens/admin/AdminDispatchScreen").default,
  () => import("../screens/admin/AdminDispatchScreen"),
  { screenName: "AdminDispatchScreen" }
);
export const AdminRidersScreen = createLazyScreenDevSafe(
  () => require("../screens/admin/AdminRidersScreen").default,
  () => import("../screens/admin/AdminRidersScreen"),
  { screenName: "AdminRidersScreen" }
);
export const AdminRiderMapScreen = createLazyScreenDevSafe(
  () => require("../screens/admin/AdminRiderMapScreen").default,
  () => import("../screens/admin/AdminRiderMapScreen"),
  { screenName: "AdminRiderMapScreen" }
);
export const AdminCashScreen = createLazyScreenDevSafe(
  () => require("../screens/admin/AdminCashScreen").default,
  () => import("../screens/admin/AdminCashScreen"),
  { screenName: "AdminCashScreen" }
);
export const AdminRiderMessagesScreen = createLazyScreenDevSafe(
  () => require("../screens/admin/AdminRiderMessagesScreen").default,
  () => import("../screens/admin/AdminRiderMessagesScreen"),
  { screenName: "AdminRiderMessagesScreen" }
);
export const AdminRiderPerformanceScreen = createLazyScreenDevSafe(
  () => require("../screens/admin/AdminRiderPerformanceScreen").default,
  () => import("../screens/admin/AdminRiderPerformanceScreen"),
  { screenName: "AdminRiderPerformanceScreen" }
);
export const AdminDeliveryScreen = createLazyScreenDevSafe(
  () => require("../screens/admin/AdminDeliveryScreen").default,
  () => import("../screens/admin/AdminDeliveryScreen"),
  { screenName: "AdminDeliveryScreen" }
);
export const AdminProductsScreen = createLazyScreenDevSafe(
  () => require("../screens/admin/AdminProductsScreen").default,
  () => import("../screens/admin/AdminProductsScreen"),
  { screenName: "AdminProductsScreen" }
);
export const AdminAddProductScreen = createLazyScreenDevSafe(
  () => require("../screens/admin/AdminAddProductScreen").default,
  () => import("../screens/admin/AdminAddProductScreen"),
  { screenName: "AdminAddProductScreen" }
);
export const AdminPricesScreen = createLazyScreenDevSafe(
  () => require("../screens/admin/AdminPricesScreen").default,
  () => import("../screens/admin/AdminPricesScreen"),
  { screenName: "AdminPricesScreen" }
);
export const AdminCategoriesScreen = createLazyScreenDevSafe(
  () => require("../screens/admin/AdminCategoriesScreen").default,
  () => import("../screens/admin/AdminCategoriesScreen"),
  { screenName: "AdminCategoriesScreen" }
);
export const AdminCounterScreen = createLazyScreenDevSafe(
  () => require("../screens/admin/AdminCounterScreen").default,
  () => import("../screens/admin/AdminCounterScreen"),
  { screenName: "AdminCounterScreen" }
);
export const AdminTransfersScreen = createLazyScreenDevSafe(
  () => require("../screens/admin/AdminTransfersScreen").default,
  () => import("../screens/admin/AdminTransfersScreen"),
  { screenName: "AdminTransfersScreen" }
);
export const AdminStockOutScreen = createLazyScreenDevSafe(
  () => require("../screens/admin/AdminStockOutScreen").default,
  () => import("../screens/admin/AdminStockOutScreen"),
  { screenName: "AdminStockOutScreen" }
);
export const AdminInventoryScreen = createLazyScreenDevSafe(
  () => require("../screens/admin/AdminInventoryScreen").default,
  () => import("../screens/admin/AdminInventoryScreen"),
  { screenName: "AdminInventoryScreen" }
);
export const AdminStockInScreen = createLazyScreenDevSafe(
  () => require("../screens/admin/AdminStockInScreen").default,
  () => import("../screens/admin/AdminStockInScreen"),
  { screenName: "AdminStockInScreen" }
);
export const AdminReordersScreen = createLazyScreenDevSafe(
  () => require("../screens/admin/AdminReordersScreen").default,
  () => import("../screens/admin/AdminReordersScreen"),
  { screenName: "AdminReordersScreen" }
);
export const AdminClosingScreen = createLazyScreenDevSafe(
  () => require("../screens/admin/AdminClosingScreen").default,
  () => import("../screens/admin/AdminClosingScreen"),
  { screenName: "AdminClosingScreen" }
);
export const AdminStockReportScreen = createLazyScreenDevSafe(
  () => require("../screens/admin/AdminStockReportScreen").default,
  () => import("../screens/admin/AdminStockReportScreen"),
  { screenName: "AdminStockReportScreen" }
);
export const AdminStockHistoryScreen = createLazyScreenDevSafe(
  () => require("../screens/admin/AdminStockHistoryScreen").default,
  () => import("../screens/admin/AdminStockHistoryScreen"),
  { screenName: "AdminStockHistoryScreen" }
);
export const AdminAnalyticsScreen = createLazyScreenDevSafe(
  () => require("../screens/admin/AdminAnalyticsScreen").default,
  () => import("../screens/admin/AdminAnalyticsScreen"),
  { screenName: "AdminAnalyticsScreen" }
);
export const AdminHomeViewScreen = createLazyScreenDevSafe(
  () => require("../screens/admin/AdminHomeViewScreen").default,
  () => import("../screens/admin/AdminHomeViewScreen"),
  { screenName: "AdminHomeViewScreen" }
);
export const AdminHomeSectionsScreen = createLazyScreenDevSafe(
  () => require("../screens/admin/AdminHomeSectionsScreen").default,
  () => import("../screens/admin/AdminHomeSectionsScreen"),
  { screenName: "AdminHomeSectionsScreen" }
);
export const AdminCouponsScreen = createLazyScreenDevSafe(
  () => require("../screens/admin/AdminCouponsScreen").default,
  () => import("../screens/admin/AdminCouponsScreen"),
  { screenName: "AdminCouponsScreen" }
);
export const AdminRewardsScreen = createLazyScreenDevSafe(
  () => require("../screens/admin/AdminRewardsScreen").default,
  () => import("../screens/admin/AdminRewardsScreen"),
  { screenName: "AdminRewardsScreen" }
);
export const AdminFaqsScreen = createLazyScreenDevSafe(
  () => require("../screens/admin/AdminFaqsScreen").default,
  () => import("../screens/admin/AdminFaqsScreen"),
  { screenName: "AdminFaqsScreen" }
);
export const AdminNotificationsScreen = createLazyScreenDevSafe(
  () => require("../screens/admin/AdminNotificationsScreen").default,
  () => import("../screens/admin/AdminNotificationsScreen"),
  { screenName: "AdminNotificationsScreen" }
);
export const AdminCustomersScreen = createLazyScreenDevSafe(
  () => require("../screens/admin/AdminCustomersScreen").default,
  () => import("../screens/admin/AdminCustomersScreen"),
  { screenName: "AdminCustomersScreen" }
);
export const AdminDeletionsScreen = createLazyScreenDevSafe(
  () => require("../screens/admin/AdminDeletionsScreen").default,
  () => import("../screens/admin/AdminDeletionsScreen"),
  { screenName: "AdminDeletionsScreen" }
);
export const AdminUsersScreen = createLazyScreenDevSafe(
  () => require("../screens/admin/AdminUsersScreen").default,
  () => import("../screens/admin/AdminUsersScreen"),
  { screenName: "AdminUsersScreen" }
);
export const AdminSupportScreen = createLazyScreenDevSafe(
  () => require("../screens/admin/AdminSupportScreen").default,
  () => import("../screens/admin/AdminSupportScreen"),
  { screenName: "AdminSupportScreen" }
);
export const AdminHealthScreen = createLazyScreenDevSafe(
  () => require("../screens/admin/AdminHealthScreen").default,
  () => import("../screens/admin/AdminHealthScreen"),
  { screenName: "AdminHealthScreen" }
);
export const AdminLogsScreen = createLazyScreenDevSafe(
  () => require("../screens/admin/AdminLogsScreen").default,
  () => import("../screens/admin/AdminLogsScreen"),
  { screenName: "AdminLogsScreen" }
);
export const AdminHelpScreen = createLazyScreenDevSafe(
  () => require("../screens/admin/AdminHelpScreen").default,
  () => import("../screens/admin/AdminHelpScreen"),
  { screenName: "AdminHelpScreen" }
);
export const AdminSuppliersScreen = createLazyScreenDevSafe(
  () => require("../screens/admin/AdminSuppliersScreen").default,
  () => import("../screens/admin/AdminSuppliersScreen"),
  { screenName: "AdminSuppliersScreen" }
);
export const AdminCycleCountScreen = createLazyScreenDevSafe(
  () => require("../screens/admin/AdminCycleCountScreen").default,
  () => import("../screens/admin/AdminCycleCountScreen"),
  { screenName: "AdminCycleCountScreen" }
);
export const AdminOfflineScreen = createLazyScreenDevSafe(
  () => require("../screens/admin/AdminOfflineScreen").default,
  () => import("../screens/admin/AdminOfflineScreen"),
  { screenName: "AdminOfflineScreen" }
);
export const AdminStoreSellingScreen = createLazyScreenDevSafe(
  () => require("../screens/admin/AdminStoreSellingScreen").default,
  () => import("../screens/admin/AdminStoreSellingScreen"),
  { screenName: "AdminStoreSellingScreen" }
);

export const AdminSettingsScreen = createLazyScreenDevSafe(
  () => require("../screens/admin/AdminSettingsScreen").default,
  () => import("../screens/admin/AdminSettingsScreen"),
  { screenName: "AdminSettingsScreen" }
);
