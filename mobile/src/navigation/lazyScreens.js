/** Native: customer screens eager; heavy routes (maps, charts, admin) lazy-loaded. */
import { createLazyScreen } from "./createLazyScreen";

export {
  ShopScreen,
  CheckoutScreen,
  ProductScreen,
  CartScreen,
  ProfileScreen,
  EditProfileScreen,
  OrderConfirmedScreen,
  NotificationsScreen,
  SettingsScreen,
  RedeemRewardsScreen,
  ManageAddressScreen,
  SupportScreen,
  AboutScreen,
  LegalDocumentScreen,
} from "./screenRegistryCustomer";

export const MyOrdersScreen = createLazyScreen(() => import("../screens/MyOrdersScreen"), {
  screenName: "MyOrdersScreen",
});
export const DeliveryDashboardScreen = createLazyScreen(
  () => import("../screens/DeliveryDashboardScreen"),
  { screenName: "DeliveryDashboardScreen" }
);
export const AdminDashboardScreen = createLazyScreen(
  () => import("../screens/admin/AdminDashboardScreen"),
  { screenName: "AdminDashboardScreen" }
);
export const AdminProductsScreen = createLazyScreen(
  () => import("../screens/admin/AdminProductsScreen"),
  { screenName: "AdminProductsScreen" }
);
export const AdminAddProductScreen = createLazyScreen(
  () => import("../screens/admin/AdminAddProductScreen"),
  { screenName: "AdminAddProductScreen" }
);
export const AdminOrdersScreen = createLazyScreen(
  () => import("../screens/admin/AdminOrdersScreen"),
  { screenName: "AdminOrdersScreen" }
);
export const AdminOrderDetailScreen = createLazyScreen(
  () => import("../screens/admin/AdminOrderDetailScreen"),
  { screenName: "AdminOrderDetailScreen" }
);
export const AdminUsersScreen = createLazyScreen(
  () => import("../screens/admin/AdminUsersScreen"),
  { screenName: "AdminUsersScreen" }
);
export const AdminNotificationsScreen = createLazyScreen(
  () => import("../screens/admin/AdminNotificationsScreen"),
  { screenName: "AdminNotificationsScreen" }
);
export const AdminAnalyticsScreen = createLazyScreen(
  () => import("../screens/admin/AdminAnalyticsScreen"),
  { screenName: "AdminAnalyticsScreen" }
);
export const AdminCouponsScreen = createLazyScreen(
  () => import("../screens/admin/AdminCouponsScreen"),
  { screenName: "AdminCouponsScreen" }
);
export const AdminRewardsScreen = createLazyScreen(
  () => import("../screens/admin/AdminRewardsScreen"),
  { screenName: "AdminRewardsScreen" }
);
export const AdminSupportScreen = createLazyScreen(
  () => import("../screens/admin/AdminSupportScreen"),
  { screenName: "AdminSupportScreen" }
);
export const AdminHomeViewScreen = createLazyScreen(
  () => import("../screens/admin/AdminHomeViewScreen"),
  { screenName: "AdminHomeViewScreen" }
);
export const AdminInventoryScreen = createLazyScreen(
  () => import("../screens/admin/AdminInventoryScreen"),
  { screenName: "AdminProductsScreen" }
);
