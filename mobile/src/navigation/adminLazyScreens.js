import { createLazyScreenDevSafe } from "./createLazyScreenDevSafe";

export const AdminDashboardScreen = createLazyScreenDevSafe(
  () => require("../screens/admin/AdminDashboardScreen").default,
  () => import("../screens/admin/AdminDashboardScreen"),
  { screenName: "AdminDashboardScreen" }
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
export const AdminInventoryScreen = createLazyScreenDevSafe(
  () => require("../screens/admin/AdminInventoryScreen").default,
  () => import("../screens/admin/AdminInventoryScreen"),
  { screenName: "AdminInventoryScreen" }
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
export const AdminNotificationsScreen = createLazyScreenDevSafe(
  () => require("../screens/admin/AdminNotificationsScreen").default,
  () => import("../screens/admin/AdminNotificationsScreen"),
  { screenName: "AdminNotificationsScreen" }
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
