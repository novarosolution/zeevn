/**
 * Central admin-facing copy — titles, subtitles, empty states, gate messages.
 */

export const ADMIN_GATE = {
  title: "Admin access required",
  message: "Sign in with an admin account to use this tool.",
  backHome: "Back to Home",
  goLogin: "Go to login",
};

/** Popup + chime when a new order lands on the desk. */
export const ADMIN_NEW_ORDER = {
  title: "New order",
  one: "A new order is waiting. Confirm it to start the work.",
  many: (n) => `${n} new orders are waiting. Confirm them to start the work.`,
  open: "Open orders",
  dismiss: "Later",
  bannerNeed: (n) => (n === 1 ? "1 order needs you" : `${n} orders need you`),
  bannerLive: (n) => (n === 1 ? "1 order still going" : `${n} orders still going`),
  bannerUntil: "Shows until delivered",
};

export const ADMIN_SCREEN_COPY = {
  shopDesk: {
    title: "Shop desk",
    subtitle: "Open, pause, today’s queue",
  },
  dashboard: {
    title: "Dashboard",
    subtitle: "Gold tiles need you. Tap to open.",
    emptySales: "No sales in this period",
    emptySalesLink: "Last 30 days",
    emptyStores: "No stores yet",
    addStore: "Add a store",
    emptyOrders: "No orders in this period.",
    emptyTop: "No delivered sales in this period.",
  },
  delivery: {
    title: "Zones",
    subtitle: "Areas, fees, riders",
    emptyZones: "No zones yet — tap Create zone, add 3+ points, then save.",
    emptyPartners: "No delivery partners enabled yet",
    stepPin: "Select a shop, then tap the map to move its pin",
    stepDraw: "Tap to add a point. Tap a numbered point to remove it. 3+ to save.",
    stepSave: "Area ready — save below. Tap a point to remove it.",
  },
  settings: {
    title: "Settings",
    subtitle: "Orders, hours, payments and contact",
  },
  products: {
    title: "Products",
    subtitle: "Price, stock, publish",
    empty: "No products yet — add your first jar",
    emptySearch: "No products match that search",
  },
  prices: {
    title: "Prices",
    subtitle: "Today’s prices",
    empty: "No products yet — add your first jar",
    mrpError: "MRP must be above the selling price.",
  },
  categories: {
    title: "Categories",
    subtitle: "Ghee, tel, masala, honey",
    emptyLine: "No jars in {line} yet.",
  },
  orders: {
    title: "Orders",
    subtitle: "Confirm, assign, track",
    emptyFilter: "No orders match this filter",
    empty: "No orders yet",
  },
  returns: {
    title: "Returns",
    subtitle: "Review a delivered order",
    emptyPending: "No returns waiting",
    empty: "No returns",
  },
  dispatch: {
    title: "Dispatch",
    subtitle: "Who was asked, who accepted",
    empty: "No dispatch attempts in this period.",
  },
  riders: {
    title: "Riders",
    subtitle: "Who can take a run",
    empty: "No delivery partners enabled yet.",
    stop: "Stop assigning orders to {name}?",
  },
  riderMap: {
    title: "Rider locations",
    subtitle: "Where they are now",
    empty: "No delivery partners enabled yet.",
  },
  cash: {
    title: "Cash to collect",
    subtitle: "COD after delivery",
    empty: "No cash waiting.",
    confirm: "Mark ₹{amount} received for {ref}?",
  },
  riderMessages: {
    title: "Rider messages",
    subtitle: "Ping every rider",
    empty: "No rider messages yet.",
    noRiders: "No delivery partners enabled yet.",
    confirm: "Send this to {n} riders?",
  },
  riderPerformance: {
    title: "Rider performance",
    subtitle: "Delivered, late, declined",
    empty: "No delivery partners enabled yet.",
  },
  customers: {
    title: "Customers",
    subtitle: "Online and walk-in spend",
    empty: "No customers yet.",
    emptySearch: "No customers match that search.",
  },
  deletions: {
    title: "Deletion requests",
    subtitle: "Close an account",
    emptyPending: "No deletion requests.",
    emptyApproved: "No approved requests.",
    emptyRejected: "No rejected requests.",
    confirm: (name) => `Wipe ${name}’s profile? Their orders stay.`,
  },
  users: {
    title: "Users",
    subtitle: "Admins and riders",
    empty: "No users found.",
  },
  notifications: {
    title: "Notifications",
    subtitle: "Broadcast push",
    empty: "No broadcasts sent yet.",
    confirm: "Send this to all customers?",
  },
  analytics: {
    title: "Analytics",
    subtitle: "Online vs counter, revenue, and top jars",
  },
  coupons: {
    title: "Coupons",
    subtitle: "Discount codes",
    empty: "No coupons yet.",
  },
  rewards: {
    title: "Rewards",
    subtitle: "Loyalty catalog",
    empty: "No rewards yet.",
  },
  faqs: {
    title: "FAQs",
    subtitle: "Help questions",
    empty: "Add a question for Help.",
  },
  support: {
    title: "Support",
    subtitle: "Customer threads",
    empty: "No support messages yet.",
    emptyTab: "Nothing in this tab.",
    selectThread: "Select a conversation to reply",
    closeAsk: "Close this conversation?",
  },
  health: {
    title: "System health",
    subtitle: "Is the shop up",
    up: "Shop is up",
    down: "Shop is down",
    unreachable: "Can't reach the API",
    retry: "Retry",
    noOrders: "No orders yet.",
  },
  logs: {
    title: "Logs",
    subtitle: "Who changed what",
    empty: "No admin activity in this period.",
  },
  help: {
    title: "How to run the shop",
    subtitle: "Each step opens that screen.",
  },
  homeView: {
    title: "Store",
    subtitle: "Hero, festival, shop pin",
  },
  homeSections: {
    title: "Home sections",
    subtitle: "Order the rails",
    empty: "No products yet — add your first jar.",
    hiddenRail: "Nothing from this rail is on the home screen.",
  },
  addProduct: {
    title: "Add product",
    subtitle: "Name, price, stock, photos",
  },
  inventory: {
    title: "Stock",
    subtitle: "Online pile and shop floor",
    empty: "No products yet — add your first jar",
    emptySearch: "No products match that search",
  },
  stockIn: {
    title: "Stock in",
    subtitle: "Choose online or shop floor",
    emptyDrafts: "No delivery waiting to book",
    emptyReceived: "No deliveries booked",
    confirm: "Add these jars to stock?",
    emptyConfirm: "Add at least one jar",
    printBill: "Print bill",
  },
  reorders: {
    title: "Reorders",
    subtitle: "What to bring in",
    emptyNeeds: "Nothing to reorder.",
    emptyLow: "Nothing low or out",
    emptyAll: "No products to review",
  },
  closing: {
    title: "Daily closing",
    subtitle: "Count online and floor",
    emptyPast: "No closing saved yet.",
    confirm: "Save this count? Stock will not change.",
    submitBlocked: "Count every jar before you submit.",
  },
  stockReport: {
    title: "Stock report",
    subtitle: "Online, floor, total, and value",
    empty: "No products yet — add your first jar.",
  },
  stockHistory: {
    title: "Stock history",
    subtitle: "By pile and reason",
    empty: "No stock changes in this period.",
  },
};

/** Shared empty / loading strings for list screens. */
export const ADMIN_LIST_UI = {
  loading: "Loading…",
  refresh: "Refresh",
  searchPlaceholder: "Search…",
};
