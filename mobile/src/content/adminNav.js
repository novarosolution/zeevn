import { Linking, Platform } from "react-native";

/**
 * Single source for admin desk navigation — groups, labels, icons, copy.
 * Used by sidebar, mobile nav, and Command “All tools” launcher.
 */

export function openAdminNavLink(navigation, link) {
  if (link.href) {
    if (Platform.OS === "web" && typeof window !== "undefined") {
      window.open(link.href, "_blank", "noopener,noreferrer");
      return;
    }
    Linking.openURL(link.href).catch(() => {});
    return;
  }
  navigation.navigate(link.key);
}

export const ADMIN_NAV_GROUPS = [
  {
    key: "ops",
    label: "Live Ops",
    links: [
      {
        key: "AdminDashboard",
        label: "Command",
        hint: "What needs you now",
        icon: "flash-outline",
        image: "command",
        tone: "#c9a227",
      },
      {
        key: "AdminOrders",
        label: "Orders",
        hint: "Confirm · assign · track",
        icon: "receipt-outline",
        image: "orders",
        tone: "#2a7559",
      },
      {
        key: "AdminDelivery",
        label: "Zones",
        hint: "Areas, fees, riders",
        icon: "bicycle-outline",
        image: "zones",
        tone: "#3d6b8c",
      },
      {
        key: "YoupiAdmin",
        label: "YouPI",
        hint: "Gateway login",
        icon: "card-outline",
        image: "command",
        tone: "#1f6f5b",
        href: "https://www.zeevan.shop/youpi-admin/",
      },
    ],
  },
  {
    key: "catalog",
    label: "Catalogue",
    links: [
      {
        key: "AdminProducts",
        label: "Products",
        hint: "Catalogue & pricing",
        icon: "cube-outline",
        image: "products",
        tone: "#8b5e3c",
      },
      {
        key: "AdminAddProduct",
        label: "Add product",
        hint: "New SKU wizard",
        icon: "add-circle-outline",
        image: "add",
        tone: "#5a7a45",
      },
      {
        key: "AdminInventory",
        label: "Stock",
        hint: "Qty & availability",
        icon: "layers-outline",
        image: "stock",
        tone: "#6b5b95",
      },
      {
        key: "AdminAnalytics",
        label: "Analytics",
        hint: "Revenue & trends",
        icon: "bar-chart-outline",
        image: "analytics",
        tone: "#1f6f5b",
      },
    ],
  },
  {
    key: "growth",
    label: "Growth",
    links: [
      {
        key: "AdminHomeView",
        label: "Store",
        hint: "Home & hero",
        icon: "storefront-outline",
        image: "store",
        tone: "#a06b3a",
      },
      {
        key: "AdminCoupons",
        label: "Coupons",
        hint: "Discount codes",
        icon: "pricetag-outline",
        image: "coupons",
        tone: "#b85c38",
      },
      {
        key: "AdminRewards",
        label: "Rewards",
        hint: "Loyalty catalog",
        icon: "gift-outline",
        image: "rewards",
        tone: "#9b4d6c",
      },
      {
        key: "AdminNotifications",
        label: "Notify",
        hint: "Broadcast push",
        icon: "megaphone-outline",
        image: "notify",
        tone: "#4a6fa5",
      },
    ],
  },
  {
    key: "people",
    label: "People",
    links: [
      {
        key: "AdminUsers",
        label: "Users",
        hint: "Roles & partners",
        icon: "people-outline",
        image: "users",
        tone: "#3f6f6a",
      },
      {
        key: "AdminSupport",
        label: "Support",
        hint: "Customer threads",
        icon: "chatbubbles-outline",
        image: "support",
        tone: "#6d5a4a",
      },
    ],
  },
];

export const ADMIN_NAV_FLAT = ADMIN_NAV_GROUPS.flatMap((g) =>
  g.links.map((link) => ({ ...link, group: g.label, groupKey: g.key }))
);

export const ADMIN_NAV_ICON_IMAGES = {
  command: require("../../assets/admin-icons/admin-icon-command.jpg"),
  orders: require("../../assets/admin-icons/admin-icon-orders.jpg"),
  zones: require("../../assets/admin-icons/admin-icon-zones.jpg"),
  products: require("../../assets/admin-icons/admin-icon-products.jpg"),
  add: require("../../assets/admin-icons/admin-icon-add.jpg"),
  stock: require("../../assets/admin-icons/admin-icon-stock.jpg"),
  analytics: require("../../assets/admin-icons/admin-icon-analytics.jpg"),
  store: require("../../assets/admin-icons/admin-icon-store.jpg"),
  coupons: require("../../assets/admin-icons/admin-icon-coupons.jpg"),
  rewards: require("../../assets/admin-icons/admin-icon-rewards.jpg"),
  notify: require("../../assets/admin-icons/admin-icon-notify.jpg"),
  users: require("../../assets/admin-icons/admin-icon-users.jpg"),
  support: require("../../assets/admin-icons/admin-icon-support.jpg"),
};
