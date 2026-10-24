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
    title: "Command",
    subtitle: "What needs you now — open runs, accepts, stock",
  },
  delivery: {
    title: "Zones & riders",
    subtitle: "Shop pin, drawn areas, and 1 km = minutes you set",
    emptyZones: "No delivery zones yet — create one to start",
    emptyPartners: "No delivery partners enabled yet",
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
    title: "Notify",
    subtitle: "Send a broadcast push to customers",
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
    title: "Store & home",
    subtitle: "Hero, festival look, and home sections",
  },
  addProduct: {
    title: "Add product",
    subtitle: "Name, price, stock, and photos",
  },
  inventory: {
    title: "Stock desk",
    subtitle: "Adjust qty or mark out of stock",
    empty: "No stock rows yet",
  },
};

/** Shared empty / loading strings for list screens. */
export const ADMIN_LIST_UI = {
  loading: "Loading…",
  refresh: "Refresh",
  searchPlaceholder: "Search…",
};
