/**
 * Nested stack under root route `Profile`.
 * @typedef {"Overview"|"Orders"|"OrderDetail"|"Wishlist"|"Addresses"|"Payment"|"AccountProfile"|"NotificationPrefs"|"AccountActivity"} AccountNestedScreen
 */

export const ACCOUNT_NESTED = {
  Overview: "Overview",
  Orders: "Orders",
  OrderDetail: "OrderDetail",
  Wishlist: "Wishlist",
  Addresses: "Addresses",
  Payment: "Payment",
  AccountProfile: "AccountProfile",
  NotificationPrefs: "NotificationPrefs",
  AccountActivity: "AccountActivity",
};

/** Maps nested stack screen → `AccountShell` `activeSection` key. */
export const ACCOUNT_SECTION_BY_SCREEN = {
  [ACCOUNT_NESTED.Overview]: "overview",
  [ACCOUNT_NESTED.Orders]: "orders",
  [ACCOUNT_NESTED.OrderDetail]: "orders",
  [ACCOUNT_NESTED.Wishlist]: "wishlist",
  [ACCOUNT_NESTED.Addresses]: "addresses",
  [ACCOUNT_NESTED.Payment]: "payment",
  [ACCOUNT_NESTED.AccountProfile]: "profile",
  [ACCOUNT_NESTED.NotificationPrefs]: "notifications",
  [ACCOUNT_NESTED.AccountActivity]: "profile",
};

export function accountSectionForScreen(screenName) {
  return ACCOUNT_SECTION_BY_SCREEN[screenName] || "overview";
}

/**
 * @param {import("@react-navigation/native").NavigationProp<any>} navigation
 * @param {AccountNestedScreen} screen
 * @param {object} [params]
 */
export function navigateToAccount(navigation, screen, params) {
  navigation.navigate("Profile", { screen, params });
}

/** Navigate using shared nav items (`CUSTOMER_NAV_LINKS`, footer rows, etc.). */
export function navigateCustomerNav(navigation, item) {
  if (!navigation || !item?.route) return;
  if (item.accountScreen) {
    navigation.navigate(item.route, { screen: item.accountScreen });
    return;
  }
  navigation.navigate(item.route);
}
