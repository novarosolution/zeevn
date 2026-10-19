/**
 * Storefront content — the one file that manages what the native app's
 * Home / Shop / Profile / bottom nav say and show.
 *
 *  - Festival themes (greeting, countdown, banner, colours, bento tiles, picks, section order) switch
 *    automatically by date via `FESTIVAL_CALENDAR`. Add or edit entries each year.
 *  - The admin console (Home view editor → "Festival look") switches the look with no app release: it
 *    saves `festivalKey` ("" = Auto, "everyday" or "diwali") on the server home-view config,
 *    and the app uses it first. "" or an unknown key falls through to the rules below.
 *  - Force a theme in the build with `STORE_FESTIVAL_OVERRIDE` ("auto" = follow the calendar,
 *    "everyday" = never show a festival look).
 *  - `STORE_HOME.layout` sets which Home sections show and in what order (a theme can bring its own).
 *  - Products, categories and prices always come from the API; this file only holds copy,
 *    layout choices and brand imagery.
 *
 * Icons use `{ glyph: "ghee" }` (Zeevan range glyphs: all, ghee, tel, masala, honey, gifts), `{ ion: "name" }` (Ionicons)
 * or `{ mci: "name" }` (MaterialCommunityIcons).
 * Routes use `{ name, params }` and are passed straight to `navigation.navigate`.
 */

/** "auto" | "everyday" | "diwali" */
export const STORE_FESTIVAL_OVERRIDE = "auto";

/**
 * Dates are local `YYYY-MM-DD`, inclusive. First matching window wins.
 * Update these when the festival dates for the new year are known.
 * Diwali 2026: Dhanteras 6 Nov · Lakshmi Puja 8 Nov · Bhai Dooj 11 Nov — the window opens four weeks ahead
 * for gifting and closes the day after Bhai Dooj.
 */
export const FESTIVAL_CALENDAR = [{ key: "diwali", from: "2026-10-10", to: "2026-11-12" }];

export const STORE_BRAND = {
  name: "Zeevan",
  tagline: "Taste of Purity",
  madeIn: "Made with care in Gujarat, India",
};

/** Free-delivery threshold copy — shared by the header chip and the promo card. */
export const STORE_FREE_DELIVERY = "Free delivery over ₹1,499";

/** Top block of Home. */
export const STORE_HEADER = {
  /**
   * Chips under the location bar, left to right: the festival countdown (festival themes), “Delivers in 1–2 days”
   * (the most common `eta` set on your products), the free-delivery threshold, and — when the farm-shop pin and
   * the customer's location are both known — the distance. Set `showDeliveryPromise` to false to drop the ETA chip.
   */
  showDeliveryPromise: true,
  /** “Delivers in 10 mins” — a time that does not start with a number (“Same day”) is shown as it is. */
  etaChip: (eta) => (/^\d/.test(eta) ? `Delivers in ${eta}` : eta),
  deliveryChip: STORE_FREE_DELIVERY,
  distanceSuffix: "from our farm shop",
  /** Small label above the delivery address in the top bar. */
  locationLabel: "Deliver to",
  locationFallback: "Set delivery location",
  signIn: "Sign in",
  /** Spoken labels (screen readers). */
  a11y: {
    account: "Your account",
    accountUnread: "Your account, new notifications",
    rewards: (points) => `Zeevan rewards, ${points} points`,
    location: (text) => `Delivery location ${text}`,
    search: "Search products",
  },
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
  { key: "all", label: "All", icon: { glyph: "all" } },
  { key: "ghee", label: "Ghee", lineKey: "ghee", icon: { glyph: "ghee" } },
  { key: "tel", label: "Tel", lineKey: "tel", icon: { glyph: "tel" } },
  { key: "masala", label: "Masala", lineKey: "masala", icon: { glyph: "masala" } },
  { key: "honey", label: "Honey", lineKey: "honey", icon: { glyph: "honey" } },
  { key: "gifts", label: "Gifting", lineKey: "gifts", icon: { glyph: "gifts" } },
];

/** Copy for the tab landing page (non-“All” tabs). */
export const STORE_LINE_PAGES = {
  ghee: { title: "Pure A2 Bilona ghee", shopPill: "Ghee" },
  tel: { title: "Cold-pressed tel", shopPill: "Tel" },
  masala: { title: "Fresh masala", shopPill: "Masala" },
  honey: { title: "Haldar honey", shopPill: "Honey" },
  gifts: { title: "Gifts & hampers", category: "Gift Sets" },
  empty: { title: "Coming soon", subtitle: "New arrivals in this range will appear here." },
  seeAll: "See all products",
  landing: {
    browseByType: "Browse by type",
    all: (label) => `All ${String(label).toLowerCase()}`,
  },
};

/** Product tile copy (Home rails, Shop grid, Wishlist) and the ADD control. */
export const STORE_CARD = {
  comingSoon: "COMING SOON",
  off: (pct) => `${pct}% OFF`,
  outOfStock: "Out of stock",
  from: "From",
  add: "ADD",
  soldOut: "Sold out",
  soon: "SOON",
  added: (n) => `${n} added`,
  wishlistAdd: "Save to wishlist",
  wishlistRemove: "Remove from wishlist",
  a11y: {
    tile: (name, price) => `${name}, ${price}`,
    chooseSize: (name) => `Choose size for ${name}`,
    changeOptions: (n, name) => `${n} of ${name} in bag. Change options`,
    addToBag: (name) => `Add ${name} to bag`,
    addOne: (name) => `Add one more ${name}`,
    removeOne: (name) => `Remove one ${name}`,
  },
};

/* ---- Festival themes ---- */

/*
 * A theme is plain data — no component changes are needed to add or retire a festival.
 *  - `greeting` / `occasion`  festival chip in the header ("20 days to Diwali"; the greeting shows when there is no date)
 *  - `header`                 gradient behind the header (light + dark) and the chip accent colour
 *  - `banner`                 hero: `title`, call to action + `route`, `spotlight` (which product's photo it shows) and its
 *                             colours (`palette.light` / `palette.dark`). Add an optional `eyebrow` / `subtitle` for more copy.
 *  - `ornament`               artwork: "diya" (lamps, fairy lights, rangoli) or "none" (calm olive sprigs)
 *  - `layout`                 optional section order — omit it to use `STORE_HOME.layout`
 *  - `tabBadges`              small badge on a category tab ({ gifts: "Diwali" })
 *  - `bento` / `picks`        festive collections (heading, route, tiles); `bento.colors` optionally recolours the tiles
 *  - `shopBanner`             the strip on top of the Shop screen
 */

const everydayTheme = {
  key: "everyday",
  greeting: "",
  ornament: "none",
  /** Small badge on a category tab, e.g. { gifts: "Diwali" }. */
  tabBadges: {},
  header: {
    gradient: ["#F2D082", "#F7E0A8", "#FAEECF", "#FFFFFF"],
    gradientDark: ["#3C2D12", "#2B2110", "#1B150C", "#0F0D0A"],
    accent: { light: "#5C6834", dark: "#C4D088" },
  },
  banner: {
    title: "Taste of Purity",
    cta: "Shop now",
    route: { name: "Shop" },
    spotlight: { match: { featured: true } },
    palette: {
      light: {
        gradient: ["#1D3A1E", "#2D5629", "#587534"],
        eyebrow: "#EDC27D",
        title: "#FBF7EA",
        subtitle: "#DDE6C6",
        ctaBg: "#EDC27D",
        ctaText: "#22300F",
        gold: "#E8BC84",
        border: "rgba(237, 194, 125, 0.42)",
      },
      dark: {
        gradient: ["#141D0E", "#21321A", "#394D22"],
        eyebrow: "#E8BC84",
        title: "#F6EFE0",
        subtitle: "#CFD8B6",
        ctaBg: "#E8BC84",
        ctaText: "#1A2410",
        gold: "#E8BC84",
        border: "rgba(232, 188, 132, 0.3)",
      },
    },
  },
  bento: {
    title: "Pantry essentials",
    action: "See all",
    route: { name: "Shop" },
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

const diwaliTheme = {
  key: "diwali",
  greeting: "Shubh Deepavali",
  ornament: "diya",
  tabBadges: { gifts: "Diwali" },
  /** Counts down to the main day (Lakshmi Puja) in the header badge. Update the date every year. */
  occasion: {
    date: "2026-11-08",
    days: (n) => `${n} days to Diwali`,
    tomorrow: "Diwali is tomorrow",
    today: "Happy Diwali",
  },
  header: {
    gradient: ["#EFA33A", "#F6C877", "#FAE3B2", "#FFFFFF"],
    gradientDark: ["#4A2D0E", "#321F0C", "#1C130A", "#0F0D0A"],
    accent: { light: "#7A3A08", dark: "#F2CE9B" },
  },
  banner: {
    title: "Shubh Deepavali",
    cta: "Shop festive",
    route: { name: "Shop", params: { category: "Gift Sets" } },
    /** Prefer gift sets; FestiveBanner falls back to honey/ghee so the tilted jar card always shows. */
    spotlight: { match: { lineKeys: ["gifts", "honey", "ghee"] } },
    palette: {
      light: {
        gradient: ["#3F1409", "#7B2A0D", "#C8691A"],
        eyebrow: "#F7CE7A",
        title: "#FFF4DC",
        subtitle: "#F6DFB4",
        ctaBg: "#F7C766",
        ctaText: "#3A1604",
        gold: "#F6C453",
        border: "rgba(247, 199, 102, 0.5)",
      },
      dark: {
        gradient: ["#2A0A0B", "#561810", "#A25A10"],
        eyebrow: "#F2CE9B",
        title: "#FFF1D6",
        subtitle: "#E6CFA4",
        ctaBg: "#E8BC84",
        ctaText: "#2A1405",
        gold: "#E8BC84",
        border: "rgba(232, 188, 132, 0.34)",
      },
    },
  },
  /** Gifting first, then the everyday shelves. */
  layout: ["tracker", "promos", "bento", "picks", "categories", "bestsellers", "lines", "trust", "footer"],
  bento: {
    title: "Diwali gifting",
    action: "See all",
    route: { name: "Shop", params: { category: "Gift Sets" } },
    colors: {
      light: {
        tall: ["#FFD27A", "#EC9A2E"],
        tiles: [
          ["#FFF0CC", "#F7D27F"],
          ["#FFE3CC", "#F6BC8C"],
          ["#FDF1D6", "#EFD28F"],
          ["#FFE8D6", "#F4C69A"],
        ],
      },
      dark: {
        tall: ["#6A3A10", "#3F2008"],
        tiles: [
          ["#4A3112", "#33220C"],
          ["#4A2A18", "#34190F"],
          ["#3E3314", "#2B240D"],
          ["#4A2C16", "#331E0F"],
        ],
      },
    },
    tall: {
      key: "hamper",
      title: "Diwali Hampers",
      caption: "Gift hamper",
      match: { lineKey: "gifts" },
      showPrice: true,
      route: { name: "Shop", params: { category: "Gift Sets" } },
    },
    tiles: [
      { key: "diya", title: "Ghee for Diyas", match: { lineKey: "ghee" }, route: { name: "Shop", params: { pill: "Ghee" } } },
      { key: "mithai", title: "Mithai Makers", match: { lineKey: "ghee", index: 1 }, route: { name: "Shop", params: { pill: "Ghee" } } },
      { key: "cooking", title: "Festive Cooking", match: { lineKey: "tel" }, route: { name: "Shop", params: { pill: "Tel" } } },
      { key: "honey", title: "Honey & Haldi", match: { lineKey: "honey" }, route: { name: "Shop", params: { pill: "Honey" } } },
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
 * A key the app does not know (for example a look that has been retired) is skipped.
 */
export function resolveFestivalTheme({ now = new Date(), remoteKey } = {}) {
  const remote = String(remoteKey || "").trim().toLowerCase();
  if (remote && Object.prototype.hasOwnProperty.call(FESTIVAL_THEMES, remote)) return FESTIVAL_THEMES[remote];
  if (STORE_FESTIVAL_OVERRIDE !== "auto" && FESTIVAL_THEMES[STORE_FESTIVAL_OVERRIDE]) {
    return FESTIVAL_THEMES[STORE_FESTIVAL_OVERRIDE];
  }
  const today = toDateKey(now);
  const hit = FESTIVAL_CALENDAR.find((w) => today >= w.from && today <= w.to);
  return (hit && FESTIVAL_THEMES[hit.key]) || FESTIVAL_THEMES.everyday;
}

/**
 * Header badge text for a theme with an `occasion` ("21 days to Diwali"), or "" when the theme has none
 * or the day has passed. Counts local calendar days, so it changes at midnight.
 */
export function getFestivalCountdown(theme, now = new Date()) {
  const occasion = theme?.occasion;
  if (!occasion?.date) return "";
  const [y, m, d] = String(occasion.date).split("-").map(Number);
  if (!y || !m || !d) return "";
  const target = new Date(y, m - 1, d);
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const days = Math.round((target.getTime() - today.getTime()) / 86400000);
  if (days < 0) return "";
  if (days === 0) return occasion.today;
  if (days === 1) return occasion.tomorrow;
  return occasion.days(days);
}

/* ---- Home layout ---- */

/**
 * Sections on the Home "All" tab, top to bottom. Delete a key to hide that section, or reorder to move it:
 *  tracker     live order card (only while a signed-in customer has an order in progress)
 *  banner      festival / brand hero with a product spotlight
 *  promos      rewards card + admin hero slides
 *  categories  "Shop by category" grid
 *  bento       festive (or range) collection tiles
 *  bestsellers best-rated products rail
 *  picks       tabbed festive picks rail
 *  lines       one rail per range (ghee, tel, masala, honey, gifting) — delete it for a shorter Home
 *  trust       the four "Why Zeevan" icons
 *  footer      the Zeevan wordmark sign-off (keep it last)
 * A festival theme can set its own `layout` (Diwali puts its gifting collections first).
 * Long-form storytelling (how it's made, comparison, reviews, certifications) lives on the About page and the
 * website, not on the app Home.
 */
export const STORE_HOME = {
  layout: ["tracker", "promos", "categories", "bento", "bestsellers", "picks", "lines", "trust", "footer"],

  /** Live order card. The status ("Out for delivery") comes from the order; its hint is read out to screen readers only. */
  tracker: {
    live: "Live",
    cta: "Track",
    ctaA11y: "Open order tracking",
    more: (n) => `+${n} more`,
    items: (n) => (n === 1 ? "1 item" : `${n} items`),
  },
};

/* ---- Home sections ---- */

export const STORE_SECTIONS = {
  categories: {
    title: "Shop by category",
    action: "See all",
    moreSuffix: "more",
    allTile: "See all",
    tileA11y: (label, n) => `${label}, ${n} ${n === 1 ? "product" : "products"}`,
  },
  /** `rankTop` products get a gold #1 / #2 / #3 badge. */
  bestsellers: { title: "Bestsellers", action: "See all", rankTop: 3, rankA11y: (n) => `Bestseller number ${n}` },
  picks: { action: "See all" },
  newArrivals: { title: "New arrivals", action: "See all" },
  lineRail: { action: "See all" },
  /** Call to action on admin hero slides that have none of their own. */
  promoCta: "Shop now",
  promoA11y: "Promotion",
  empty: {
    title: "Fresh stock on the way",
    body: "New products will appear here as soon as they are added.",
    cta: "Browse shop",
  },
  error: { title: "Could not load the store", cta: "Try again" },
};

/**
 * Promo carousel cards. Admin hero slides (Home View in the admin console) take priority;
 * these are the brand defaults when none are configured. The built-in photo banners already carry their own
 * headline, so they show the picture only (`a11y` is what screen readers say).
 * The rewards card shows `signedIn` copy to a signed-in customer ({points} is their balance).
 */
export const STORE_PROMOS = [
  {
    key: "rewards",
    kind: "rewards",
    eyebrow: "Zeevan Rewards",
    title: "Earn on every order",
    cta: "Start now",
    signedIn: {
      title: (points) => `${points} points`,
      cta: "Redeem now",
    },
    route: { name: "RedeemRewards" },
    requiresAuth: true,
  },
  {
    key: "ghee",
    kind: "image",
    image: require("../../assets/promo-slider-ghee.jpg"),
    ratio: 9 / 16,
    eyebrow: "Festive favourites",
    title: "A2 Desi Cow Ghee",
    subtitle: "Bilona craft for the Diwali table",
    cta: "Shop ghee",
    a11y: "A2 Desi Cow Ghee — Diwali",
    route: { name: "Shop", params: { pill: "Ghee" } },
  },
  {
    key: "tel",
    kind: "image",
    image: require("../../assets/promo-slider-tel.jpg"),
    ratio: 9 / 16,
    eyebrow: "Cold pressed",
    title: "Fresh Filtered Tel",
    subtitle: "Mustard purity, bottle to kitchen",
    cta: "Shop tel",
    a11y: "Fresh Filtered Tel — Diwali",
    route: { name: "Shop", params: { pill: "Tel" } },
  },
  {
    key: "masala",
    kind: "image",
    image: require("../../assets/promo-slider-masala.jpg"),
    ratio: 9 / 16,
    eyebrow: "Fresh ground",
    title: "Kitchen Masala",
    subtitle: "Spice that wakes every feast",
    cta: "Shop masala",
    a11y: "Fresh Ground Masala — Diwali",
    route: { name: "Shop", params: { pill: "Masala" } },
  },
  {
    key: "honey",
    kind: "image",
    image: require("../../assets/promo-slider-honey.jpg"),
    ratio: 9 / 16,
    eyebrow: "Taste of purity",
    title: "Haldar Honey",
    subtitle: "Golden jars for sweet gifting",
    cta: "Shop honey",
    a11y: "Haldar Honey — Diwali",
    route: { name: "Shop", params: { pill: "Honey" } },
  },
];

/** The four “Why Zeevan” icons (a line break in a label splits it over two lines). */
export const STORE_TRUST = [
  {
    key: "a2",
    label: "A2 desi\ncow milk",
    icon: { glyph: "trustCow" },
    image: require("../../assets/trust/a2-cow.jpg"),
  },
  {
    key: "bilona",
    label: "Bilona\nmethod",
    icon: { glyph: "trustBilona" },
    image: require("../../assets/trust/bilona.jpg"),
  },
  {
    key: "natural",
    label: "100%\nnatural",
    icon: { glyph: "trustLeaf" },
    image: require("../../assets/trust/natural.jpg"),
  },
  {
    key: "gujarat",
    label: "Made in\nGujarat",
    icon: { glyph: "trustPin" },
    image: require("../../assets/trust/gujarat.jpg"),
  },
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
    { key: "Shop", label: "Categories", route: "Shop", icon: { glyph: "all" } },
    { key: "Orders", label: "Order Again", route: "MyOrders", requiresAuth: true, icon: { mci: "repeat" }, iconActive: { mci: "repeat" } },
    { key: "Profile", label: "Account", route: "Profile", requiresAuth: true, icon: { ion: "person-outline" }, iconActive: { ion: "person" } },
  ],
  cart: { route: "Cart", requiresAuth: true, label: "Cart", icon: { ion: "bag-handle-outline" }, iconActive: { ion: "bag-handle" } },
  /** Which routes light up which tab. */
  activeRoutes: {
    Home: ["Home"],
    Shop: ["Shop", "Product"],
    Orders: ["MyOrders", "OrderConfirmed"],
    Profile: ["Profile", "Wishlist", "EditProfile", "Settings", "ManageAddress", "Notifications", "Support", "RedeemRewards"],
  },
};

/* ---- Product detail ---- */

export const STORE_PRODUCT = {
  back: "Back",
  share: "Share",
  shareMessage: (name) => `${name} — pure A2 ghee, tel, masala & honey from Zeevan.`,
  wishlistAdd: "Save to wishlist",
  wishlistRemove: "Remove from wishlist",
  bag: (count) => (count > 0 ? `Bag, ${count} ${count === 1 ? "item" : "items"}` : "Bag"),
  ratingCount: (n) => (n === 1 ? "1 rating" : `${n} ratings`),
  newBadge: "New",
  inclusiveTax: "Inclusive of all taxes",
  savePct: (pct) => `Save ${pct}%`,
  lowStock: (n) => `Only ${n} left`,
  unavailable: { sold: "Out of stock", soon: "Coming soon" },
  options: { title: "Choose a size", from: "Pick one — the price updates for you." },
  delivery: { fallbackTitle: "Doorstep delivery", fallbackBody: "Live tracking from our farm to your home." },
  about: { title: "About this item", more: "Read more", less: "Show less" },
  highlightsTitle: "Why you'll love it",
  sections: {
    details: "Product details",
    nutrition: "Ingredients & nutrition",
    usage: "How to enjoy",
    story: "Our story",
    care: "Storage & delivery",
    faq: "Questions answered",
  },
  labels: {
    ingredients: "Ingredients",
    nutrition: "Nutrition facts",
    storage: "Storage",
    shipping: "Shipping",
    why: "Why Zeevan",
  },
  reviews: {
    title: "Ratings & reviews",
    empty: "No reviews yet — be the first to share a few words.",
    composerTitle: "Rate this product",
    placeholder: "Add a few words (optional)",
    post: "Post review",
    posting: "Posting…",
    signIn: "Sign in to review",
    noNote: "Rated without a note",
    customer: "Customer",
  },
  related: { title: "You may also like" },
  dock: {
    price: "Price",
    total: "Total",
    add: "Add to bag",
    buyNow: "Buy now",
    inBag: (n) => `${n} in bag`,
    lessA11y: "Remove one",
    moreA11y: "Add one more",
  },
  state: {
    notFoundTitle: "Product not found",
    notFoundBody: "This product may have been removed. Browse the shop for something fresh.",
    notFoundCta: "Back to home",
  },
};

/* ---- Cart & checkout ---- */

export const STORE_CART = {
  back: "Back",
  bag: {
    navTitle: "Cart",
    title: "Your bag",
    count: (n) => (n === 1 ? "1 item" : `${n} items`),
    inBagHeading: "In your bag",
    trust: "Secure checkout · Handled with care",
  },
  empty: {
    title: "Your bag is empty",
    body: "Ghee, tel, masala & honey — add something for your table.",
    cta: "Start shopping",
  },
  /** Numeric twin of `STORE_FREE_DELIVERY` — drives the progress strip. Keep both in step. */
  freeDelivery: {
    threshold: 1499,
    progress: (left) => `Add ${left} more for free delivery`,
    unlocked: "You've unlocked free delivery",
    pill: "Free delivery",
  },
  line: { each: (price) => `${price} each`, remove: "Remove", removeA11y: (name) => `Remove ${name} from bag` },
  coupon: {
    title: "Have a coupon?",
    placeholder: "Enter coupon code",
    apply: "Apply",
    applied: "Coupon applied",
  },
  bill: {
    title: "Bill details",
    items: "Item total",
    delivery: "Delivery",
    free: "FREE",
    unavailable: "Unavailable",
    service: "Service fee",
    discount: "Coupon discount",
    total: "Grand total",
    saved: (amount) => `You save ${amount} on this order`,
  },
  cta: {
    checkout: "Checkout",
    signIn: "Sign in to checkout",
    pay: "Pay now",
    place: "Place order",
    total: "Total",
  },
  gate: {
    title: "Sign in to checkout",
    body: "Your bag stays with you — sign in only to place the order.",
    cta: "Sign in",
    secondary: "Back to bag",
  },
  checkout: {
    title: "Checkout",
    heading: "Delivery & payment",
    steps: ["Bag", "Address", "Pay"],
    summaryTitle: "Order summary",
    editBag: "Edit bag",
    address: {
      title: "Delivery address",
      subtitle: "Where should we bring it?",
      useSaved: "Use saved",
      useGps: "Use current location",
      locating: "Locating…",
      contact: "Contact",
      where: "Address",
      note: "Delivery note",
      typeLabel: "Save address as",
      types: [
        { key: "Home", label: "Home", icon: "home" },
        { key: "Work", label: "Work", icon: "briefcase" },
        { key: "Other", label: "Other", icon: "location" },
      ],
      blocked: "We do not deliver to this pincode yet.",
      fields: {
        fullName: "Full name",
        phone: "Mobile number",
        houseNumber: "House / flat / building no.",
        line1: "Street / area / colony",
        landmark: "Landmark (optional)",
        city: "City",
        postalCode: "Pincode",
        country: "Country",
        note: "Instructions for delivery",
      },
      placeholders: {
        houseNumber: "e.g. 14B, Sea View Apartments",
        line1: "e.g. Marine Drive, Bandra West",
        landmark: "Near city mall, opposite park…",
        country: "India",
        note: "Gate code, floor, call on arrival…",
      },
    },
    payment: {
      title: "Payment",
      subtitle: "Choose how you'd like to pay.",
      online: { title: "Pay online", caption: "UPI, cards & wallets", icon: "card-outline" },
      cod: { title: "Cash on delivery", caption: "Pay when it arrives", icon: "cash-outline" },
      secure: "Payments are processed securely.",
    },
  },
};

/* ---- Orders ("Order Again") & confirmation ---- */

export const STORE_ORDERS = {
  back: "Back",
  navTitle: "Orders",
  eyebrow: "Order again",
  title: "Your orders",
  subtitle: "Track, reorder and download invoices.",
  stats: { total: "Orders", active: "Active", delivered: "Delivered", spent: "Spent" },
  filters: [
    { key: "all", label: "All" },
    { key: "active", label: "Active" },
    { key: "delivered", label: "Delivered" },
    { key: "cancelled", label: "Cancelled" },
  ],
  sections: {
    active: { title: "On the way", caption: "Being prepared or out for delivery." },
    history: { title: "Past orders", caption: "Delivered and cancelled orders." },
    filtered: { title: "Orders" },
  },
  card: {
    order: (id) => `Order #${id}`,
    items: (n) => (n === 1 ? "1 item" : `${n} items`),
    more: (n) => `+${n} more`,
    deliverTo: "Delivering to",
    live: "Live",
    paymentPending: "Awaiting payment",
    partnerOnWay: "On the way to you",
    callPartner: "Call delivery partner",
    partnerPending: "Partner is confirming this run.",
  },
  actions: {
    reorder: "Order again",
    reordering: "Adding…",
    details: "Details",
    hideDetails: "Hide",
    invoice: "Invoice",
    invoiceBusy: "Preparing…",
    editAddress: "Edit address",
    reward: "Claim reward",
    rewardBusy: "Claiming…",
    rewardDone: "Reward claimed",
  },
  detail: {
    title: "Order breakdown",
    items: "Item total",
    delivery: "Delivery",
    platform: "Service fee",
    discount: "Discount",
    coupon: "Coupon",
    paymentMethod: "Payment",
    paymentStatus: "Payment status",
    paymentId: "Payment ID",
    tax: "Tax",
    invoice: "Invoice no.",
    total: "Order total",
    address: "Delivering to",
    free: "FREE",
  },
  edit: {
    title: "Update delivery address",
    subtitle: "You can change this for a few minutes after ordering.",
    save: "Save address",
    saving: "Saving…",
    cancel: "Cancel",
  },
  empty: {
    title: "No orders yet",
    body: "Your orders appear here after checkout, with live tracking.",
    cta: "Start shopping",
  },
  loadMore: "Show more orders",
  refresh: "Refresh",
  /** Full-screen “Order confirmed” (route + post-checkout popup). */
  confirmed: {
    eyebrow: "Order placed",
    title: "Order confirmed",
    lead: "Thank you — we're preparing your essentials with care.",
    ref: "Order",
    eta: "Arriving soon",
    stepsTitle: "What happens next",
    steps: [
      { key: "confirmed", icon: "checkmark-circle-outline", label: "Confirmed", detail: "We received your order and payment details." },
      { key: "preparing", icon: "cube-outline", label: "Preparing", detail: "Your items are being packed at the farm shop." },
      { key: "tracking", icon: "navigate-outline", label: "On the way", detail: "Follow live updates anytime in Your orders." },
    ],
    summaryTitle: "Order summary",
    labels: { items: "Items", payment: "Payment", delivery: "Delivering to", total: "Total" },
    payments: { cod: "Cash on delivery", online: "Paid online" },
    trust: [
      { key: "track", icon: "navigate-outline", label: "Live tracking" },
      { key: "secure", icon: "shield-checkmark-outline", label: "Secure checkout" },
      { key: "care", icon: "heart-outline", label: "Handled with care" },
    ],
    primary: "Track order",
    secondary: "Continue shopping",
    tertiary: "Back to home",
    missingTitle: "Order not found",
    missingBody: "We couldn't load this confirmation. Check Your orders for your latest purchases.",
    missingCta: "Go to your orders",
  },
};
