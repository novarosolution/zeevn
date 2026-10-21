/** Native: customer screens eager; heavy routes (maps, charts) lazy-loaded. */
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
export * from "./adminLazyScreens";
export const YoupiCheckoutScreen = createLazyScreen(
  () => import("../screens/YoupiCheckoutScreen"),
  { screenName: "YoupiCheckoutScreen" }
);
