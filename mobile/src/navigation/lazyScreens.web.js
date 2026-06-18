/**
 * Web — only Home/Login/Register are eager (via screenRegistryCore.web).
 * All other routes load on first navigation (smaller FCP/LCP/TBT on phone web).
 */
import { createLazyScreenDevSafe } from "./createLazyScreenDevSafe";

export const ShopScreen = createLazyScreenDevSafe(
  () => require("../screens/ShopScreen").default,
  () => import("../screens/ShopScreen"),
  { screenName: "ShopScreen" }
);
export const CheckoutScreen = createLazyScreenDevSafe(
  () => require("../screens/CheckoutScreen").default,
  () => import("../screens/CheckoutScreen"),
  { screenName: "CheckoutScreen" }
);
export const ProductScreen = createLazyScreenDevSafe(
  () => require("../screens/ProductScreen").default,
  () => import("../screens/ProductScreen"),
  { screenName: "ProductScreen" }
);
export const CartScreen = createLazyScreenDevSafe(
  () => require("../screens/CartScreen").default,
  () => import("../screens/CartScreen"),
  { screenName: "CartScreen" }
);
export const ProfileScreen = createLazyScreenDevSafe(
  () => require("../screens/ProfileScreen").default,
  () => import("../screens/ProfileScreen"),
  { screenName: "ProfileScreen" }
);
export const EditProfileScreen = createLazyScreenDevSafe(
  () => require("../screens/EditProfileScreen").default,
  () => import("../screens/EditProfileScreen"),
  { screenName: "EditProfileScreen" }
);
export const OrderConfirmedScreen = createLazyScreenDevSafe(
  () => require("../screens/OrderConfirmedScreen").default,
  () => import("../screens/OrderConfirmedScreen"),
  { screenName: "OrderConfirmedScreen" }
);
export const NotificationsScreen = createLazyScreenDevSafe(
  () => require("../screens/NotificationsScreen").default,
  () => import("../screens/NotificationsScreen"),
  { screenName: "NotificationsScreen" }
);
export const SettingsScreen = createLazyScreenDevSafe(
  () => require("../screens/SettingsScreen").default,
  () => import("../screens/SettingsScreen"),
  { screenName: "SettingsScreen" }
);
export const RedeemRewardsScreen = createLazyScreenDevSafe(
  () => require("../screens/RedeemRewardsScreen").default,
  () => import("../screens/RedeemRewardsScreen"),
  { screenName: "RedeemRewardsScreen" }
);
export const ManageAddressScreen = createLazyScreenDevSafe(
  () => require("../screens/ManageAddressScreen").default,
  () => import("../screens/ManageAddressScreen"),
  { screenName: "ManageAddressScreen" }
);
export const SupportScreen = createLazyScreenDevSafe(
  () => require("../screens/SupportScreen").default,
  () => import("../screens/SupportScreen"),
  { screenName: "SupportScreen" }
);
export const AboutScreen = createLazyScreenDevSafe(
  () => require("../screens/AboutScreen").default,
  () => import("../screens/AboutScreen"),
  { screenName: "AboutScreen" }
);
export const LegalDocumentScreen = createLazyScreenDevSafe(
  () => require("../screens/LegalDocumentScreen").default,
  () => import("../screens/LegalDocumentScreen"),
  { screenName: "LegalDocumentScreen" }
);
export const MyOrdersScreen = createLazyScreenDevSafe(
  () => require("../screens/MyOrdersScreen").default,
  () => import("../screens/MyOrdersScreen"),
  { screenName: "MyOrdersScreen" }
);
export const DeliveryDashboardScreen = createLazyScreenDevSafe(
  () => require("../screens/DeliveryDashboardScreen").default,
  () => import("../screens/DeliveryDashboardScreen"),
  { screenName: "DeliveryDashboardScreen" }
);
export const AdminDashboardScreen = createLazyScreenDevSafe(
  () => require("../screens/admin/AdminDashboardScreen").default,
  () => import("../screens/admin/AdminDashboardScreen"),
  { screenName: "AdminDashboardScreen" }
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
export const AdminUsersScreen = createLazyScreenDevSafe(
  () => require("../screens/admin/AdminUsersScreen").default,
  () => import("../screens/admin/AdminUsersScreen"),
  { screenName: "AdminUsersScreen" }
);
export const AdminNotificationsScreen = createLazyScreenDevSafe(
  () => require("../screens/admin/AdminNotificationsScreen").default,
  () => import("../screens/admin/AdminNotificationsScreen"),
  { screenName: "AdminNotificationsScreen" }
);
export const AdminAnalyticsScreen = createLazyScreenDevSafe(
  () => require("../screens/admin/AdminAnalyticsScreen").default,
  () => import("../screens/admin/AdminAnalyticsScreen"),
  { screenName: "AdminAnalyticsScreen" }
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
export const AdminSupportScreen = createLazyScreenDevSafe(
  () => require("../screens/admin/AdminSupportScreen").default,
  () => import("../screens/admin/AdminSupportScreen"),
  { screenName: "AdminSupportScreen" }
);
export const AdminHomeViewScreen = createLazyScreenDevSafe(
  () => require("../screens/admin/AdminHomeViewScreen").default,
  () => import("../screens/admin/AdminHomeViewScreen"),
  { screenName: "AdminHomeViewScreen" }
);
export const AdminInventoryScreen = createLazyScreenDevSafe(
  () => require("../screens/admin/AdminInventoryScreen").default,
  () => import("../screens/admin/AdminInventoryScreen"),
  { screenName: "AdminInventoryScreen" }
);
