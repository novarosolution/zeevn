/**
 * Central admin-facing copy — titles, subtitles, empty states, gate messages.
 */

export const ADMIN_GATE = {
  title: "Admin access required",
  message: "Sign in with an admin account to use this tool.",
  backHome: "Back to Home",
  goLogin: "Go to login",
};

export const ADMIN_SCREEN_COPY = {
  dashboard: {
    title: "Dashboard",
    subtitle: "What needs you now",
  },
  delivery: {
    title: "Zones",
    subtitle: "Shops, areas, and riders",
    emptyZones: "No zones yet — tap Create zone, add 3+ points, then save",
    emptyPartners: "No delivery partners enabled yet",
    stepPin: "Select a shop, then tap the map to move its pin",
    stepDraw: "Tap to add a point. Tap a numbered point to remove it. 3+ to save.",
    stepSave: "Area ready — save below. Tap a point to remove it.",
  },
  products: {
    title: "Products",
    subtitle: "Price, stock, publish",
    empty: "No products yet — add your first jar",
    emptySearch: "No products match that search",
  },
  orders: {
    title: "Orders",
    subtitle: "Confirm, assign, track",
    emptyFilter: "No orders match this filter",
    empty: "No orders yet",
  },
  users: {
    title: "Users",
    subtitle: "Roles and riders",
    empty: "No users found",
  },
  notifications: {
    title: "Notifications",
    subtitle: "Broadcast to customers",
    empty: "No broadcasts sent yet",
  },
  analytics: {
    title: "Analytics",
    subtitle: "Revenue and trends",
  },
  coupons: {
    title: "Coupons",
    subtitle: "Codes and redemptions",
    empty: "No coupons yet",
  },
  rewards: {
    title: "Rewards",
    subtitle: "Points catalog",
    empty: "No rewards yet",
  },
  support: {
    title: "Support",
    subtitle: "Reply to customers",
    empty: "No support messages yet",
    selectThread: "Select a conversation to reply",
  },
  homeView: {
    title: "Store",
    subtitle: "Hero, festival, shop pin",
  },
  addProduct: {
    title: "Add product",
    subtitle: "Name, price, stock, photos",
  },
  inventory: {
    title: "Stock",
    subtitle: "Qty and availability",
    empty: "No stock rows yet",
  },
};

/** Shared empty / loading strings for list screens. */
export const ADMIN_LIST_UI = {
  loading: "Loading…",
  refresh: "Refresh",
  searchPlaceholder: "Search…",
};
