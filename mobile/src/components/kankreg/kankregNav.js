/** Shared nav keys / route matching for KankregSiteHeader + KankregMobileNav */

import {
  KANKREG_NAV_ITEMS,
  KANKREG_ROLE_NAV_ITEMS,
  KANKREG_WEB_NAV_ITEMS,
} from "../../content/appContent";

export const ADMIN_ROUTES = new Set([
  "AdminDashboard",
  "AdminProducts",
  "AdminInventory",
  "AdminAddProduct",
  "AdminOrders",
  "AdminOrderDetail",
  "AdminUsers",
  "AdminNotifications",
  "AdminAnalytics",
  "AdminCoupons",
  "AdminRewards",
  "AdminSupport",
  "AdminHomeView",
]);

const ROUTE_GROUPS = {
  Home: ["Home"],
  Shop: ["Shop"],
  About: ["About", "Privacy", "Terms"],
  Product: ["Product"],
  Cart: ["Cart"],
  Checkout: ["Checkout"],
  Orders: ["MyOrders"],
  Rewards: ["RedeemRewards"],
  Account: ["Profile", "EditProfile", "ManageAddress", "Settings", "Notifications", "Support"],
  Admin: [...ADMIN_ROUTES],
  Delivery: ["DeliveryDashboard"],
  Auth: ["Login", "Register"],
};

const NAV_HANDLERS = {
  Home: ({ go }) => () => go("Home"),
  Shop: ({ go }) => () => go("Shop"),
  About: ({ go }) => () => go("About"),
  Product: ({ goProduct }) => goProduct,
  Cart: ({ go }) => () => go("Cart", true),
  Checkout: ({ go }) => () => go("Checkout", true),
  Orders: ({ go }) => () => go("MyOrders", true),
  Rewards: ({ go }) => () => go("RedeemRewards", true),
  Account: ({ go }) => () => go("Profile", true),
  Admin: ({ go }) => () => go("AdminDashboard", true),
  Delivery: ({ go }) => () => go("DeliveryDashboard", true),
};

export function routeMatchesNav(navKey, routeName) {
  if (!routeName) return false;
  if (navKey === routeName) return true;
  return (ROUTE_GROUPS[navKey] || []).includes(routeName);
}

export function buildKankregNavItems({ go, goProduct, user }) {
  const ctx = { go, goProduct, user };
  const roleItems = buildRoleNavItems(ctx);
  return [
    ...KANKREG_WEB_NAV_ITEMS.map(({ key, label }) => ({
      key,
      label,
      onPress: NAV_HANDLERS[key](ctx),
    })),
    ...roleItems,
  ];
}

/** Full-screen phone menu — primary destinations + About. */
export function buildKankregMobileNavItems({ go, goProduct, user }) {
  const ctx = { go, goProduct, user };
  const roleItems = buildRoleNavItems(ctx);
  const mobileKeys = new Set(["Home", "Shop", "About", "Cart", "Orders", "Rewards", "Account"]);
  const labels = Object.fromEntries(KANKREG_NAV_ITEMS.map(({ key, label }) => [key, label]));
  labels.About = KANKREG_WEB_NAV_ITEMS.find((i) => i.key === "About")?.label || "About";

  return [
    ...[...mobileKeys].map((key) => ({
      key,
      label: labels[key] || key,
      onPress: NAV_HANDLERS[key](ctx),
    })),
    ...roleItems,
  ];
}

function buildRoleNavItems(ctx) {
  const roleItems = [];
  const { user } = ctx;
  if (user?.isAdmin) {
    const { key, label } = KANKREG_ROLE_NAV_ITEMS.admin;
    roleItems.push({
      key,
      label,
      onPress: NAV_HANDLERS.Admin(ctx),
    });
  }
  if (user?.isDeliveryPartner) {
    const { key, label } = KANKREG_ROLE_NAV_ITEMS.delivery;
    roleItems.push({
      key,
      label,
      onPress: NAV_HANDLERS.Delivery(ctx),
    });
  }
  return roleItems;
}
