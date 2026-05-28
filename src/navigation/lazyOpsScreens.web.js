import React, { lazy, Suspense } from "react";
import AppStartupScreen from "../components/AppStartupScreen";

function lazyScreen(importer) {
  const Lazy = lazy(importer);
  return function LazyScreenWrapper(props) {
    return (
      <Suspense fallback={<AppStartupScreen />}>
        <Lazy {...props} />
      </Suspense>
    );
  };
}

/** Admin + delivery screens are out of customer critical path. */
export const LazyDeliveryDashboardScreen = lazyScreen(() =>
  import("../screens/DeliveryDashboardScreen")
);
export const LazyAdminDashboardScreen = lazyScreen(() => import("../screens/admin/AdminDashboardScreen"));
export const LazyAdminProductsScreen = lazyScreen(() => import("../screens/admin/AdminProductsScreen"));
export const LazyAdminInventoryScreen = lazyScreen(() => import("../screens/admin/AdminInventoryScreen"));
export const LazyAdminAddProductScreen = lazyScreen(() => import("../screens/admin/AdminAddProductScreen"));
export const LazyAdminOrdersScreen = lazyScreen(() => import("../screens/admin/AdminOrdersScreen"));
export const LazyAdminUsersScreen = lazyScreen(() => import("../screens/admin/AdminUsersScreen"));
export const LazyAdminNotificationsScreen = lazyScreen(() =>
  import("../screens/admin/AdminNotificationsScreen")
);
export const LazyAdminAnalyticsScreen = lazyScreen(() => import("../screens/admin/AdminAnalyticsScreen"));
export const LazyAdminCouponsScreen = lazyScreen(() => import("../screens/admin/AdminCouponsScreen"));
export const LazyAdminRewardsScreen = lazyScreen(() => import("../screens/admin/AdminRewardsScreen"));
export const LazyAdminSupportScreen = lazyScreen(() => import("../screens/admin/AdminSupportScreen"));
export const LazyAdminHomeViewScreen = lazyScreen(() => import("../screens/admin/AdminHomeViewScreen"));
