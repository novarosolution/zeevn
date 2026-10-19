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
