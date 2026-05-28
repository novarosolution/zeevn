import { ADMIN_MANAGE_SECTIONS } from "./adminNav";

export const OPS_ADMIN_KICKER = "Admin";
export const OPS_DELIVERY_KICKER = "Delivery";

export const OPS_ADMIN_OVERVIEW = {
  route: "AdminDashboard",
  label: "Dashboard",
  icon: "speedometer-outline",
};

/** Flat admin sidebar — matches ops shell IA. */
export const OPS_ADMIN_FLAT_NAV = [
  OPS_ADMIN_OVERVIEW,
  { route: "AdminProducts", label: "Products", icon: "cube-outline" },
  { route: "AdminInventory", label: "Inventory", icon: "layers-outline" },
  { route: "AdminOrders", label: "Orders", icon: "receipt-outline" },
  { route: "AdminUsers", label: "Users", icon: "people-outline" },
  { route: "AdminAnalytics", label: "Analytics", icon: "bar-chart-outline" },
  { route: "AdminCoupons", label: "Coupons", icon: "pricetag-outline" },
  { route: "AdminRewards", label: "Rewards", icon: "gift-outline" },
  { route: "AdminNotifications", label: "Notifications", icon: "notifications-outline" },
  { route: "AdminSupport", label: "Support", icon: "chatbubbles-outline" },
  { route: "AdminHomeView", label: "HomeView", icon: "home-outline" },
];

export function getOpsAdminSidebarSections() {
  return [{ id: "admin", items: OPS_ADMIN_FLAT_NAV }];
}

export function getOpsAdminFlatRoutes() {
  return OPS_ADMIN_FLAT_NAV.map((item) => item.route);
}

export const OPS_DELIVERY_NAV = [
  { route: "DeliveryDashboard", label: "Dashboard", icon: "bicycle-outline" },
  { route: "Home", label: "Storefront", icon: "storefront-outline" },
];

export function getOpsAdminSectionTitle(route) {
  const item = OPS_ADMIN_FLAT_NAV.find((i) => i.route === route);
  if (item) return item.label;
  for (const sec of ADMIN_MANAGE_SECTIONS) {
    for (const navItem of sec.items) {
      if (navItem.route === route) return navItem.title;
    }
  }
  return "Admin";
}
