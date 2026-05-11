/**
 * Single source for admin IA — dashboard sections + utilities for header / shell.
 */

export const ADMIN_MANAGE_SECTIONS = [
  {
    id: "catalog",
    label: "Catalog & inventory",
    items: [
      {
        title: "Manage products",
        subtitle: "List, edit, and remove items",
        icon: "cube-outline",
        route: "AdminProducts",
      },
      {
        title: "Inventory & stock",
        subtitle: "Set quantities, low-stock view, in / out of stock (admin only)",
        icon: "layers-outline",
        route: "AdminInventory",
      },
      {
        title: "Add product",
        subtitle: "Create new catalog entries",
        icon: "add-circle-outline",
        route: "AdminAddProduct",
      },
      {
        title: "Manage storefront content",
        subtitle: "Hero, sections, layout & links to products",
        icon: "home-outline",
        route: "AdminHomeView",
      },
    ],
  },
  {
    id: "orders",
    label: "Orders & customers",
    items: [
      {
        title: "Manage orders",
        subtitle: "Status, details, and fulfillment",
        icon: "receipt-outline",
        route: "AdminOrders",
      },
      {
        title: "Manage users",
        subtitle: "Roles and account controls",
        icon: "people-outline",
        route: "AdminUsers",
      },
    ],
  },
  {
    id: "growth",
    label: "Marketing & engagement",
    items: [
      {
        title: "Send notification",
        subtitle: "Broadcast messages to customers",
        icon: "notifications-outline",
        route: "AdminNotifications",
      },
      {
        title: "Manage coupons",
        subtitle: "Discount codes and visibility",
        icon: "pricetag-outline",
        route: "AdminCoupons",
      },
      {
        title: "Loyalty rewards",
        subtitle: "Point-cost catalog → customer redeem coupons",
        icon: "gift-outline",
        route: "AdminRewards",
      },
      {
        title: "Support inbox",
        subtitle: "Threads and replies",
        icon: "chatbubbles-outline",
        route: "AdminSupport",
      },
    ],
  },
  {
    id: "insights",
    label: "Insights",
    items: [
      {
        title: "Analytics",
        subtitle: "Revenue, stock, carts, and trends",
        icon: "bar-chart-outline",
        route: "AdminAnalytics",
      },
    ],
  },
];

const ADMIN_ROUTE_NAMES = new Set(
  ["AdminDashboard"].concat(
    ADMIN_MANAGE_SECTIONS.flatMap((s) => s.items.map((i) => i.route))
  )
);

export function isAdminRouteName(routeName) {
  return Boolean(routeName && ADMIN_ROUTE_NAMES.has(String(routeName)));
}

/** Flat links for web header dropdown (Overview first). */
export function getAdminMenuFlatLinks() {
  const links = [{ route: "AdminDashboard", label: "Overview", icon: "speedometer-outline" }];
  for (const sec of ADMIN_MANAGE_SECTIONS) {
    for (const item of sec.items) {
      links.push({ route: item.route, label: item.title, icon: item.icon });
    }
  }
  return links;
}
