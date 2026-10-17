/**
 * Storefront content — the one file that manages what the native app's
 * Home / Shop / Profile / bottom nav say and show.
 *
 *  - Festival themes (greeting, colours, banner, bento tiles, picks) switch
 *    automatically by date via `FESTIVAL_CALENDAR`. Add or edit entries each year.
 *  - Force a theme with `STORE_FESTIVAL_OVERRIDE` ("auto" = follow the calendar,
 *    "everyday" = never show a festival look). The server home-view config can also
 *    send `festivalKey` to override it remotely.
 *  - Products, categories and prices always come from the API; this file only holds copy,
 *    layout choices and brand imagery.
 *
 * Icons use `{ ion: "name" }` (Ionicons) or `{ mci: "name" }` (MaterialCommunityIcons).
 * Routes use `{ name, params }` and are passed straight to `navigation.navigate`.
 */
import { KANKREG_ANNOUNCE_COPY } from "./appContent";

/** "auto" | "everyday" | "navratri" | "diwali" */
export const STORE_FESTIVAL_OVERRIDE = "auto";

/**
 * Dates are local `YYYY-MM-DD`, inclusive. First matching window wins.
 * Update these when the festival dates for the new year are known.
 */
export const FESTIVAL_CALENDAR = [
  { key: "navratri", from: "2026-10-10", to: "2026-10-20" },
  { key: "diwali", from: "2026-10-28", to: "2026-11-12" },
];

export const STORE_BRAND = {
  name: "Zeevan",
  tagline: "Taste of Purity",
  madeIn: "Made with care in Gujarat, India",
};

/** Greeting header — top block of Home. */
export const STORE_HEADER = {
  eyebrow: "Zeevan · Taste of Purity",
  greetingByPart: { morning: "Good morning", afternoon: "Good afternoon", evening: "Good evening" },
  signedInTitle: (firstName) => `Namaste, ${firstName}`,
  guestTitle: "Namaste",
  /** Info chip next to the greeting (like “1.5 km away”). Distance chip is added when the shop pin is set. */
  deliveryChip: KANKREG_ANNOUNCE_COPY.delivery || "Free delivery over ₹1,499",
  distanceSuffix: "from our farm shop",
  locationFallback: "Set delivery location",
  rewardsA11y: "Zeevan rewards",
  profileA11y: "Your account",
  searchPrefix: "Search",
  searchHints: [
    "A2 desi cow ghee",
    "kachi ghani mustard oil",
    "Haldar honey",
    "Kashmiri mirch powder",
    "festive gift hamper",
  ],
  backToTop: "Back to top",
};

/** Category tabs under the search bar. `lineKey` links a tab to a product line (see `zeevanCatalogContent`). */
export const STORE_TABS = [
  { key: "all", label: "All", icon: { mci: "view-grid-outline" }, iconActive: { mci: "view-grid" } },
  { key: "ghee", label: "Ghee", lineKey: "ghee", icon: { mci: "pot-steam-outline" }, iconActive: { mci: "pot-steam" } },
  { key: "tel", label: "Tel", lineKey: "tel", icon: { mci: "oil" }, iconActive: { mci: "oil" } },
  { key: "masala", label: "Masala", lineKey: "masala", icon: { mci: "chili-mild-outline" }, iconActive: { mci: "chili-mild" } },
  { key: "honey", label: "Honey", lineKey: "honey", icon: { mci: "beehive-outline" }, iconActive: { mci: "beehive-outline" } },
  { key: "gifts", label: "Gifting", lineKey: "gifts", icon: { mci: "gift-outline" }, iconActive: { mci: "gift" } },
];

/** Copy for the tab landing page (non-“All” tabs). */
export const STORE_LINE_PAGES = {
  ghee: { title: "Pure A2 Bilona ghee", subtitle: "Hand-churned, golden and grainy.", shopPill: "Ghee" },
  tel: { title: "Cold-pressed tel", subtitle: "Kachi ghani oils for everyday cooking.", shopPill: "Tel" },
  masala: { title: "Fresh masala", subtitle: "Small-batch spices with real aroma.", shopPill: "Masala" },
  honey: { title: "Haldar honey", subtitle: "Raw honey with haldi — wellness in every spoon.", shopPill: "Honey" },
  gifts: { title: "Gifts & hampers", subtitle: "Thoughtful pantry gifts, beautifully packed.", category: "Gift Sets" },
  empty: { title: "Coming soon", subtitle: "New arrivals in this range will appear here." },
  seeAll: "See all products",
};

/* ---- Festival themes ---- */

const everydayTheme = {
  key: "everyday",
  greeting: "",
  ornament: "none",
  header: {
    gradient: ["#F2D082", "#F7E0A8", "#FAEECF", "#FAF6EC"],
    gradientDark: ["#3C2D12", "#2B2110", "#1B150C", "#0F0D0A"],
  },
  banner: {
    eyebrow: "Zeevan",
    title: "Taste of Purity",
    subtitle: "A2 · Bilona · Made in Gujarat",
  },
  bento: {
    tall: {
      key: "bestseller",
      title: "Bestseller",
      caption: "Most loved",
      match: { featured: true },
      showPrice: true,
    },
    tiles: [
      { key: "ghee", title: "Pure Ghee", match: { lineKey: "ghee" }, route: { name: "Shop", params: { pill: "Ghee" } } },
      { key: "tel", title: "Cold-pressed Tel", match: { lineKey: "tel" }, route: { name: "Shop", params: { pill: "Tel" } } },
      { key: "masala", title: "Fresh Masala", match: { lineKey: "masala" }, route: { name: "Shop", params: { pill: "Masala" } } },
      { key: "honey", title: "Haldar Honey", match: { lineKey: "honey" }, route: { name: "Shop", params: { pill: "Honey" } } },
    ],
  },
  picks: {
    title: "Pantry Picks",
    items: [
      { key: "ghee", title: "Ghee", match: { lineKeys: ["ghee"] }, route: { name: "Shop", params: { pill: "Ghee" } } },
      { key: "tel", title: "Tel", match: { lineKeys: ["tel"] }, route: { name: "Shop", params: { pill: "Tel" } } },
      { key: "masala", title: "Masala", match: { lineKeys: ["masala"] }, route: { name: "Shop", params: { pill: "Masala" } } },
      { key: "honey", title: "Honey", match: { lineKeys: ["honey"] }, route: { name: "Shop", params: { pill: "Honey" } } },
    ],
  },
  shopBanner: { title: "Pure from the farm", subtitle: "Small batches, honest labels" },
};

const navratriTheme = {
  key: "navratri",
  greeting: "Shubh Navratri",
  ornament: "marigold",
  header: {
    gradient: ["#F4B84A", "#F8D48A", "#FBE9BF", "#FAF6EC"],
    gradientDark: ["#4A3210", "#33240E", "#1D160B", "#0F0D0A"],
  },
  banner: {
    eyebrow: "Navratri special",
    title: "Shubh Navratri",
    subtitle: "Pure ghee for vrat, aarti & prasad",
  },
  bento: {
    tall: {
      key: "corner",
      title: "Festive Corner",
      caption: "Gift Hamper",
      match: { lineKey: "gifts" },
      showPrice: true,
      route: { name: "Shop", params: { category: "Gift Sets" } },
    },
    tiles: [
      { key: "vrat", title: "Vrat Essentials", match: { lineKey: "ghee" }, route: { name: "Shop", params: { pill: "Ghee" } } },
      { key: "aarti", title: "Diya & Aarti", match: { lineKey: "ghee", index: 1 }, route: { name: "Shop", params: { pill: "Ghee" } } },
      { key: "prasad", title: "Prasad & Mithai", match: { lineKey: "honey" }, route: { name: "Shop", params: { pill: "Honey" } } },
      { key: "kitchen", title: "Kitchen Staples", match: { lineKey: "masala" }, route: { name: "Shop", params: { pill: "Masala" } } },
    ],
  },
  picks: {
    title: "Festive Picks",
    items: [
      { key: "gifts", title: "Gift Hampers", match: { lineKeys: ["gifts"] }, route: { name: "Shop", params: { category: "Gift Sets" } } },
      { key: "ghee", title: "Ghee for Vrat", match: { lineKeys: ["ghee"] }, route: { name: "Shop", params: { pill: "Ghee" } } },
      { key: "honey", title: "Honey & Wellness", match: { lineKeys: ["honey"] }, route: { name: "Shop", params: { pill: "Honey" } } },
      { key: "pantry", title: "Tel & Masala", match: { lineKeys: ["tel", "masala"] }, route: { name: "Shop", params: { pill: "Tel" } } },
    ],
  },
  shopBanner: { title: "Celebrate Navratri", subtitle: "Bring home pure, festive flavours" },
};

const diwaliTheme = {
  key: "diwali",
  greeting: "Shubh Deepavali",
  ornament: "diya",
  header: {
    gradient: ["#F0A93A", "#F6CB77", "#FAE4B4", "#FAF6EC"],
    gradientDark: ["#4F3410", "#36240D", "#1E160A", "#0F0D0A"],
  },
  banner: {
    eyebrow: "Diwali special",
    title: "Shubh Deepavali",
    subtitle: "Light every diya with pure ghee",
  },
  bento: {
    tall: {
      key: "hamper",
      title: "Diwali Hampers",
      caption: "Gift Hamper",
      match: { lineKey: "gifts" },
      showPrice: true,
      route: { name: "Shop", params: { category: "Gift Sets" } },
    },
    tiles: [
      { key: "diya", title: "Diya Ghee", match: { lineKey: "ghee" }, route: { name: "Shop", params: { pill: "Ghee" } } },
      { key: "mithai", title: "Mithai Makers", match: { lineKey: "ghee", index: 1 }, route: { name: "Shop", params: { pill: "Ghee" } } },
      { key: "cooking", title: "Festive Cooking", match: { lineKey: "tel" }, route: { name: "Shop", params: { pill: "Tel" } } },
      { key: "honey", title: "Honey & Dry Fruit", match: { lineKey: "honey" }, route: { name: "Shop", params: { pill: "Honey" } } },
    ],
  },
  picks: {
    title: "Diwali Picks",
    items: [
      { key: "gifts", title: "Gift Hampers", match: { lineKeys: ["gifts"] }, route: { name: "Shop", params: { category: "Gift Sets" } } },
      { key: "ghee", title: "Ghee for Diyas", match: { lineKeys: ["ghee"] }, route: { name: "Shop", params: { pill: "Ghee" } } },
      { key: "honey", title: "Honey", match: { lineKeys: ["honey"] }, route: { name: "Shop", params: { pill: "Honey" } } },
      { key: "pantry", title: "Tel & Masala", match: { lineKeys: ["tel", "masala"] }, route: { name: "Shop", params: { pill: "Tel" } } },
    ],
  },
  shopBanner: { title: "Celebrate Diwali", subtitle: "Gift purity, light up every home" },
};

export const FESTIVAL_THEMES = {
  everyday: everydayTheme,
  navratri: navratriTheme,
  diwali: diwaliTheme,
};

function toDateKey(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/**
 * Pick the active storefront theme.
 * Priority: server `festivalKey` → `STORE_FESTIVAL_OVERRIDE` → calendar window → everyday.
 */
export function resolveFestivalTheme({ now = new Date(), remoteKey } = {}) {
  const remote = String(remoteKey || "").trim().toLowerCase();
  if (remote && FESTIVAL_THEMES[remote]) return FESTIVAL_THEMES[remote];
  if (STORE_FESTIVAL_OVERRIDE !== "auto" && FESTIVAL_THEMES[STORE_FESTIVAL_OVERRIDE]) {
    return FESTIVAL_THEMES[STORE_FESTIVAL_OVERRIDE];
  }
  const today = toDateKey(now);
  const hit = FESTIVAL_CALENDAR.find((w) => today >= w.from && today <= w.to);
  return (hit && FESTIVAL_THEMES[hit.key]) || FESTIVAL_THEMES.everyday;
}

/* ---- Home sections ---- */

export const STORE_SECTIONS = {
  categories: { title: "Shop by category", action: "See all", moreSuffix: "more" },
  bestsellers: { title: "Bestsellers", action: "See all" },
  newArrivals: { title: "New arrivals", action: "See all" },
  lineRail: { action: "See all" },
  seeAllProducts: "See all products",
  trustTitle: "Why Zeevan",
  empty: {
    title: "Fresh stock on the way",
    body: "New products will appear here as soon as they are added.",
    cta: "Browse shop",
  },
  error: { title: "Could not load the store", cta: "Try again" },
};

/**
 * Promo carousel cards. Admin hero slides (Home View in the admin console) take priority;
 * these are the brand defaults when none are configured.
 */
export const STORE_PROMOS = [
  {
    key: "rewards",
    kind: "rewards",
    eyebrow: "Zeevan Rewards",
    title: "Earn on every order",
    subtitle: "Get exciting rewards everyday",
    cta: "Start now",
    route: { name: "RedeemRewards" },
    requiresAuth: true,
  },
  {
    key: "ghee",
    kind: "image",
    image: require("../../assets/zeevan-hero-web-21x9-web-960.webp"),
    ratio: 412 / 960,
    title: "A2 Desi Cow Ghee",
    cta: "Shop ghee",
    route: { name: "Shop", params: { pill: "Ghee" } },
  },
  {
    key: "mustard",
    kind: "image",
    image: require("../../assets/zeevan-hero-web-honey-21x9-web-960.webp"),
    ratio: 524 / 960,
    title: "Kachi Ghani Mustard Oil",
    cta: "Shop tel",
    route: { name: "Shop", params: { pill: "Tel" } },
  },
  {
    key: "delivery",
    kind: "feature",
    icon: { mci: "truck-fast-outline" },
    eyebrow: "Doorstep delivery",
    title: KANKREG_ANNOUNCE_COPY.delivery || "Free delivery over ₹1,499",
    subtitle: "Live tracking from our farm to your home",
    cta: "Shop now",
    route: { name: "Shop" },
  },
];

/** “Why Zeevan” trust row. */
export const STORE_TRUST = [
  { key: "a2", label: "A2 desi\ncow milk", icon: { mci: "cow" } },
  { key: "bilona", label: "Bilona\nmethod", icon: { mci: "pot-steam-outline" } },
  { key: "natural", label: "100%\nnatural", icon: { mci: "leaf" } },
  { key: "gujarat", label: "Made in\nGujarat", icon: { mci: "map-marker-outline" } },
];

/* ---- Shop (category listing) ---- */

export const STORE_SHOP = {
  title: "Shop",
  allLabel: "All",
  deliveringTo: "Delivering to",
  searchPlaceholder: "Search products…",
  chips: { filters: "Filters", sort: "Sort", type: "Type", price: "Price" },
  sort: [
    { key: "featured", label: "Featured" },
    { key: "price-asc", label: "Price: low to high" },
    { key: "price-desc", label: "Price: high to low" },
    { key: "newest", label: "Newest first" },
  ],
  sheets: {
    sort: "Sort by",
    type: "Product type",
    price: "Price range",
    filters: "Filters",
    rating: "Customer rating",
    apply: "Apply",
    clear: "Clear all",
    done: "Done",
  },
  results: (n) => (n === 1 ? "1 product" : `${n} products`),
  seeAll: "See all products",
  empty: { title: "No matches", body: "Try a different range or clear your filters.", cta: "Clear filters" },
  share: "Share",
  shareMessage: (name) => `${name} — pure A2 ghee, tel, masala & honey from Zeevan.`,
};

/* ---- Profile ---- */

export const STORE_PROFILE = {
  navTitle: "Profile",
  heading: "Your account",
  guestHeading: "Welcome",
  banner: {
    key: "rewards",
    title: "Your reward points",
    caption: "Redeem for coupons on your next order",
    cta: "Redeem now",
    route: { name: "RedeemRewards" },
  },
  tiles: [
    { key: "rewards", label: "Rewards", icon: { mci: "gift-outline" }, route: { name: "RedeemRewards" } },
    { key: "support", label: "Support", icon: { mci: "headset" }, route: { name: "Support" } },
    { key: "alerts", label: "Alerts", icon: { ion: "notifications-outline" }, route: { name: "Notifications" } },
  ],
  appearance: {
    label: "Appearance",
    options: [
      { key: "light", label: "Light", icon: { ion: "sunny-outline" } },
      { key: "dark", label: "Dark", icon: { ion: "moon-outline" } },
      { key: "system", label: "Auto", icon: { ion: "contrast-outline" } },
    ],
  },
  preferences: {
    key: "preferences",
    label: "App preferences",
    caption: "Theme, app icon & alerts",
    icon: { ion: "options-outline" },
    route: { name: "Settings" },
    highlight: true,
    badge: "",
  },
  sectionTitle: "YOUR INFORMATION",
  rows: [
    { key: "orders", label: "Your orders", icon: { ion: "bag-handle-outline" }, route: { name: "MyOrders" } },
    { key: "wishlist", label: "Your wishlist", icon: { ion: "heart-outline" }, route: { name: "Wishlist" } },
    { key: "address", label: "Address book", icon: { ion: "location-outline" }, route: { name: "ManageAddress" } },
    { key: "editProfile", label: "Edit profile", icon: { ion: "person-outline" }, route: { name: "EditProfile" } },
    { key: "support", label: "Help & support", icon: { ion: "help-buoy-outline" }, route: { name: "Support" } },
  ],
  aboutTitle: "ABOUT ZEEVAN",
  aboutRows: [
    { key: "about", label: "Our story", icon: { ion: "leaf-outline" }, route: { name: "About" } },
    { key: "privacy", label: "Privacy policy", icon: { ion: "shield-checkmark-outline" }, route: { name: "Privacy" } },
    { key: "terms", label: "Terms of service", icon: { ion: "document-text-outline" }, route: { name: "Terms" } },
  ],
  adminRow: { key: "admin", label: "Admin dashboard", icon: { ion: "shield-checkmark-outline" }, route: { name: "AdminDashboard" } },
  deliveryRow: { key: "delivery", label: "Delivery dashboard", icon: { ion: "bicycle-outline" }, route: { name: "DeliveryDashboard" } },
  signOut: "Sign out",
  signingOut: "Signing out…",
  version: (v) => `Zeevan app · v${v}`,
};

export const STORE_WISHLIST = {
  title: "Your wishlist",
  emptyTitle: "Nothing saved yet",
  emptyBody: "Tap the heart on any product to keep it here for later.",
  emptyCta: "Browse shop",
  hint: "Saved on this device",
  added: "Saved to wishlist",
  removed: "Removed from wishlist",
};

/* ---- Bottom navigation ---- */

export const STORE_NAV = {
  items: [
    { key: "Home", label: "Home", route: "Home", icon: { ion: "home-outline" }, iconActive: { ion: "home" } },
    { key: "Shop", label: "Categories", route: "Shop", icon: { mci: "view-grid-outline" }, iconActive: { mci: "view-grid" } },
    { key: "Orders", label: "Order Again", route: "MyOrders", requiresAuth: true, icon: { mci: "repeat" }, iconActive: { mci: "repeat" } },
    { key: "Profile", label: "Account", route: "Profile", requiresAuth: true, icon: { ion: "person-outline" }, iconActive: { ion: "person" } },
  ],
  cart: { route: "Cart", requiresAuth: true, label: "Cart", icon: { ion: "bag-handle-outline" }, iconActive: { ion: "bag-handle" } },
  /** Which routes light up which tab. */
  activeRoutes: {
    Home: ["Home"],
    Shop: ["Shop", "Product", "Wishlist"],
    Orders: ["MyOrders", "OrderConfirmed"],
    Profile: ["Profile", "EditProfile", "Settings", "ManageAddress", "Notifications", "Support", "RedeemRewards"],
  },
};
