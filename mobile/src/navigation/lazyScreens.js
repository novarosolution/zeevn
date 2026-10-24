/** Native: customer routes load on first visit. Admin is web-only. */
import { createLazyScreen } from "./createLazyScreen";

export const ShopScreen = createLazyScreen(() => import("../screens/ShopScreen"), {
  screenName: "ShopScreen",
});
export const CheckoutScreen = createLazyScreen(() => import("../screens/CheckoutScreen"), {
  screenName: "CheckoutScreen",
});
export const ProductScreen = createLazyScreen(() => import("../screens/ProductScreen"), {
  screenName: "ProductScreen",
});
export const CartScreen = createLazyScreen(() => import("../screens/CartScreen"), {
  screenName: "CartScreen",
});
export const ProfileScreen = createLazyScreen(() => import("../screens/ProfileScreen"), {
  screenName: "ProfileScreen",
});
export const EditProfileScreen = createLazyScreen(() => import("../screens/EditProfileScreen"), {
  screenName: "EditProfileScreen",
});
export const OrderConfirmedScreen = createLazyScreen(() => import("../screens/OrderConfirmedScreen"), {
  screenName: "OrderConfirmedScreen",
});
export const NotificationsScreen = createLazyScreen(() => import("../screens/NotificationsScreen"), {
  screenName: "NotificationsScreen",
});
export const SettingsScreen = createLazyScreen(() => import("../screens/SettingsScreen"), {
  screenName: "SettingsScreen",
});
export const RedeemRewardsScreen = createLazyScreen(() => import("../screens/RedeemRewardsScreen"), {
  screenName: "RedeemRewardsScreen",
});
export const ManageAddressScreen = createLazyScreen(() => import("../screens/ManageAddressScreen"), {
  screenName: "ManageAddressScreen",
});
export const PickLocationScreen = createLazyScreen(() => import("../screens/PickLocationScreen"), {
  screenName: "PickLocationScreen",
});
export const SupportScreen = createLazyScreen(() => import("../screens/SupportScreen"), {
  screenName: "SupportScreen",
});
export const AboutScreen = createLazyScreen(() => import("../screens/AboutScreen"), {
  screenName: "AboutScreen",
});
export const LegalDocumentScreen = createLazyScreen(() => import("../screens/LegalDocumentScreen"), {
  screenName: "LegalDocumentScreen",
});
export const MyOrdersScreen = createLazyScreen(() => import("../screens/MyOrdersScreen"), {
  screenName: "MyOrdersScreen",
});
export const WishlistScreen = createLazyScreen(() => import("../screens/WishlistScreen"), {
  screenName: "WishlistScreen",
});
export const DeliveryDashboardScreen = createLazyScreen(
  () => import("../screens/DeliveryDashboardScreen"),
  { screenName: "DeliveryDashboardScreen" }
);
export const YoupiCheckoutScreen = createLazyScreen(() => import("../screens/YoupiCheckoutScreen"), {
  screenName: "YoupiCheckoutScreen",
});
