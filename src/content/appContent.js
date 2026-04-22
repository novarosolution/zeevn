/**
 * Central customer-facing copy for KankreG.
 *
 * - Brand: name, taglines, search, support email.
 * - Home view defaults: same shape as API `/home-view` and Admin → Home View (Mongo).
 * - Home marketing: hero image strip, trust row, catalog intros (editable separately from API hero title/subtitle).
 * - Footers & support: compact footer, wide home footer, support screen header.
 *
 * Keep `backend/src/models/HomeViewConfig.js` defaults aligned with HOME_VIEW_DEFAULTS.
 */

/** @type {string} */
export const APP_DISPLAY_NAME = "KankreG";
/**
 * Square `BrandLogo` sizes (width = height). Tune here — screens import via `src/constants/brand`.
 */
export const BRAND_LOGO_SIZE = {
  /** Inner screens: back + logo + title (keep ≤ ~48 so the row does not wrap). */
  headerCompact: 44,
  /** Web top bar + full brand mark (no back chevron). */
  headerDefault: 56,
  /** Home top bar wordmark (with tagline below) — only affects Home, not `WebAppHeader`. */
  homeTopBar: 80,
  /** Home hero block logo. */
  homeHero: 108,
  footerCompact: 56,
  footerWide: 64,
  authHero: 72,
  startup: 96,
};
export const APP_TAGLINE = "Premium essentials · Fair prices";
export const APP_WORDMARK_SUBLINE = "Premium essentials";
export const APP_HERO_KICKER = `${APP_DISPLAY_NAME} · ${APP_WORDMARK_SUBLINE}`;
export const SEARCH_PLACEHOLDER = "Search KankreG — ghee, staples…";
export const SUPPORT_EMAIL_DISPLAY = "support@kankreg.app";

/** Fallback hero when API is offline — also seed defaults for new HomeViewConfig documents. */
export const HOME_HERO_TITLE_DEFAULT = "Pure Heritage in Every Drop";
export const HOME_HERO_SUBTITLE_DEFAULT =
  "Slow-churned from the milk of grass-fed cows — golden clarity and aroma rooted in tradition.";

export const HOME_VIEW_DEFAULTS = {
  heroTitle: HOME_HERO_TITLE_DEFAULT,
  heroSubtitle: HOME_HERO_SUBTITLE_DEFAULT,
  primeSectionTitle: "Prime Products",
  productTypeTitle: "Shop by category",
  showPrimeSection: true,
  showHomeSections: true,
  showProductTypeSections: true,
  productCardStyle: "compact",
};

/** Hero image card (above-the-fold marketing, not the same fields as API hero title). */
export const HOME_HERO_BANNER = {
  kicker: "Heritage craft · Small batch",
  badge: "100% PURE AND NATURAL",
  cta: "Explore collection",
};

/** Light-mode tagline under the home top wordmark (same voice as `APP_TAGLINE`). */
export const HOME_WORDMARK_TAGLINE = APP_TAGLINE;

/** Trust strip under the hero image (icon = Ionicons name). */
export const HOME_TRUST_STRIP = [
  { key: "source", label: "Authentic source", icon: "shield-checkmark-outline" },
  { key: "batch", label: "Small batch", icon: "leaf-outline" },
  { key: "cod", label: "COD delivery", icon: "car-outline" },
];

/** Catalog section intro (when not searching). */
export const HOME_CATALOG_INTRO = {
  starter: "Hand-picked to start you off right",
  all: "From our shelves to your kitchen",
};

/** Suffix for the side menu “starter” row (after dynamic counts). */
export const HOME_MENU_STARTER_TAG = "Starter picks";

/** Compact footer (auth screens, etc.). */
export const FOOTER_COMPACT = {
  offerLine: "Fresh staples • Fair prices • Careful sourcing",
  needHelp: "Need help?",
  customerCare: "Customer care",
  chatSupport247: "24×7 chat support",
};

export const APP_FOOTER_NAV_LINKS = [
  { label: "Home", route: "Home" },
  { label: "Cart", route: "Cart" },
  { label: "Orders", route: "MyOrders" },
  { label: "Profile", route: "Profile" },
  { label: "Help", route: "Support" },
];

/** Wide home footer: column titles + links (`route` null = no navigation). */
export const HOME_PAGE_FOOTER_COLUMNS = [
  {
    title: "Shop",
    links: [
      { label: "All products", route: "Home" },
      { label: "Cart", route: "Cart" },
      { label: "My orders", route: "MyOrders" },
    ],
  },
  {
    title: "Help",
    links: [
      { label: "Support", route: "Support" },
      { label: "Delivery", route: "ManageAddress" },
      { label: "Account", route: "Profile" },
    ],
  },
  {
    title: "Trust",
    links: [
      { label: "Secure checkout", route: null },
      { label: "Cash on delivery", route: null },
      { label: "Quality promise", route: null },
    ],
  },
];

/** `icon`: "brand" = logo mark; else Ionicons name. */
export const HOME_PAGE_TRUST_BADGES = [
  { key: "quality", label: "Trusted quality", icon: "shield-checkmark-outline" },
  { key: "process", label: "Traditional process", icon: "leaf-outline" },
  { key: "fair", label: "Fair prices", icon: "ribbon-outline" },
];

export const HOME_PAGE_FOOTER_META = "Made with care in India";

/** Support screen (customer). */
export const SUPPORT_SCREEN = {
  pageSubtitle: "We reply fast — 24×7",
  liveChatTitle: "Live chat",
};

/** Admin → Home View screen: labels, hints, and quick links to related tools. */
export const ADMIN_HOME_VIEW_COPY = {
  title: "Manage storefront content",
  subtitle:
    "Hero copy and home layout live here. Each product’s name, price, image, stock, “Show on Home”, and which block it appears in (e.g. Prime Products) are set under Products.",
  heroSection: "Hero banner",
  heroHint: "Shown on the large home hero (title + subtitle under the brand).",
  sectionTitles: "Home catalog headings",
  sectionTitlesHint:
    "Prime title is the default section name for products without a custom Home section, and the heading for the main list when sections are merged. Product type title is saved with this profile for layout features (same API as the storefront).",
  visibilitySection: "Home layout switches",
  visibilityHint:
    "These flags are read by the live Home screen. Each product still needs “Show on Home” and a Home section in the product editor.",
  cardLayoutSection: "Product card density",
  cardLayoutHint: "Stored as compact or comfortable (wired when the storefront reads this setting).",
  quickLinks: "Catalog & items",
  linkProductsTitle: "Manage products",
  linkProductsSubtitle: "Edit listings, MRP, discount, photos, stock, home section, and visibility on Home.",
  linkAddProductTitle: "Add product",
  linkAddProductSubtitle: "Create a new SKU and assign it to a home section.",
};
