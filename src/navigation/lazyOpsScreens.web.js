/**
 * Web static export: eager imports avoid React.lazy chunk IDs that fail at runtime.
 */
import DeliveryDashboardScreen from "../screens/DeliveryDashboardScreen";
import AdminDashboardScreen from "../screens/admin/AdminDashboardScreen";
import AdminProductsScreen from "../screens/admin/AdminProductsScreen";
import AdminInventoryScreen from "../screens/admin/AdminInventoryScreen";
import AdminAddProductScreen from "../screens/admin/AdminAddProductScreen";
import AdminOrdersScreen from "../screens/admin/AdminOrdersScreen";
import AdminUsersScreen from "../screens/admin/AdminUsersScreen";
import AdminNotificationsScreen from "../screens/admin/AdminNotificationsScreen";
import AdminAnalyticsScreen from "../screens/admin/AdminAnalyticsScreen";
import AdminCouponsScreen from "../screens/admin/AdminCouponsScreen";
import AdminRewardsScreen from "../screens/admin/AdminRewardsScreen";
import AdminSupportScreen from "../screens/admin/AdminSupportScreen";
import AdminHomeViewScreen from "../screens/admin/AdminHomeViewScreen";

export const LazyDeliveryDashboardScreen = DeliveryDashboardScreen;
export const LazyAdminDashboardScreen = AdminDashboardScreen;
export const LazyAdminProductsScreen = AdminProductsScreen;
export const LazyAdminInventoryScreen = AdminInventoryScreen;
export const LazyAdminAddProductScreen = AdminAddProductScreen;
export const LazyAdminOrdersScreen = AdminOrdersScreen;
export const LazyAdminUsersScreen = AdminUsersScreen;
export const LazyAdminNotificationsScreen = AdminNotificationsScreen;
export const LazyAdminAnalyticsScreen = AdminAnalyticsScreen;
export const LazyAdminCouponsScreen = AdminCouponsScreen;
export const LazyAdminRewardsScreen = AdminRewardsScreen;
export const LazyAdminSupportScreen = AdminSupportScreen;
export const LazyAdminHomeViewScreen = AdminHomeViewScreen;
