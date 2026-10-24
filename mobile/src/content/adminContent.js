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
    subtitle: "Open orders, stock, and what needs you now",
  },
  delivery: {
    title: "Zones",
    subtitle: "Pin the shop, draw the area, save the zone",
    emptyZones: "No zones yet — draw on the map, then save",
    emptyPartners: "No delivery partners enabled yet",
    stepPin: "Tap the map to move the shop pin",
    stepDraw: "Tap the map to add points. 3+ points draw the area.",
    stepSave: "Area ready — name it and create the zone",
  },
  products: {
    title: "Products",
    subtitle: "Add, price, and publish catalogue items",
    empty: "No products yet — add your first jar",
    emptySearch: "No products match that search",
  },
  orders: {
    title: "Orders",
    subtitle: "Confirm, assign, and track every run",
    emptyFilter: "No orders match this filter",
    empty: "No orders yet",
  },
  users: {
    title: "Users",
    subtitle: "Customers, admins, and delivery partners",
    empty: "No users found",
  },
  notifications: {
    title: "Notifications",
    subtitle: "Send a broadcast to customers",
    empty: "No broadcasts sent yet",
  },
  analytics: {
    title: "Analytics",
    subtitle: "Revenue, orders, and catalogue trends",
  },
  coupons: {
    title: "Coupons",
    subtitle: "Create codes and track redemptions",
    empty: "No coupons yet",
  },
  rewards: {
    title: "Rewards",
    subtitle: "Points catalog and claim status",
    empty: "No rewards yet",
  },
  support: {
    title: "Support",
    subtitle: "Reply to customer conversations",
    empty: "No support messages yet",
    selectThread: "Select a conversation to reply",
  },
  homeView: {
    title: "Store",
    subtitle: "Hero, festival look, and shop pin",
  },
  addProduct: {
    title: "Add product",
    subtitle: "Name, price, stock, and photos",
  },
  inventory: {
    title: "Stock",
    subtitle: "Change qty or mark out of stock",
    empty: "No stock rows yet",
  },
};

/** Shared empty / loading strings for list screens. */
export const ADMIN_LIST_UI = {
  loading: "Loading…",
  refresh: "Refresh",
  searchPlaceholder: "Search…",
};
