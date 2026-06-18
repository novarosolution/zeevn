/**
 * Central customer-facing copy for Zeevan.
 * Product lines (ghee, tel, masala, honey): `zeevanCatalogContent.js`
 */

import {
  ZEEVAN_CATALOG_SUBLINE,
  ZEEVAN_CATALOG_TAGLINE,
  ZEEVAN_HOME_MARQUEE,
  ZEEVAN_PRODUCT_LINES,
  ZEEVAN_SEARCH_PLACEHOLDER,
  ZEEVAN_TRUST_STRIP,
  buildHomeCategoryDefaults,
} from "./zeevanCatalogContent";
import { CATEGORY_SECTION_UI } from "./categorySectionContent";
import { HOME_WEB_INTRO } from "./homeHeroContent";

/** @type {string} */
export const APP_DISPLAY_NAME = "Zeevan";

/** Bundled Zeevan wordmark & mark — replaces legacy kankreg PNGs. */
export const ZEEVAN_BRAND_ASSETS = {
  wordmark: require("../../assets/zeevan-brand.png"),
  wordmarkLight: require("../../assets/zeevan-brand-light.png"),
  mark: require("../../assets/zeevan-logo.png"),
  markLight: require("../../assets/zeevan-brand-light.png"),
};

/**
 * `BrandLogo` heights (width scales via `BRAND_LOGO_ASPECT`). Tune here — import via `src/constants/brand`.
 */
export const BRAND_LOGO_SIZE = {
  /** Logo height — width follows `BRAND_LOGO_ASPECT` (full wordmark + tagline). */
  headerCompact: 30,
  /** Web top bar. */
  headerDefault: 44,
  /** Native home header. */
  homeTopBar: 40,
  /** Home hero block. */
  homeHero: 64,
  footerCompact: 44,
  footerWide: 50,
  authHero: 58,
  startup: 88,
};
export const APP_TAGLINE = ZEEVAN_CATALOG_TAGLINE;
export const APP_SPLASH_TAGLINE = ZEEVAN_CATALOG_TAGLINE;
export const APP_WORDMARK_SUBLINE = ZEEVAN_CATALOG_SUBLINE;
export const APP_HERO_KICKER = `${APP_DISPLAY_NAME} · ${APP_WORDMARK_SUBLINE}`;
export const SEARCH_PLACEHOLDER = ZEEVAN_SEARCH_PLACEHOLDER;
export const SUPPORT_EMAIL_DISPLAY = "support@zeevan.app";

/** Razorpay payment page (UPI, cards, wallet) — used as a hosted-page fallback. */
export const RAZORPAY_PAY_URL = "https://razorpay.me/@chaudharydhirajpadmabhai";

/** How long the order stays in `pending_payment` before the server sweep cancels it. */
export const RAZORPAY_PAYMENT_TIMEOUT_MIN = 30;

/**
 * Methods rendered by `PaymentMethodSelector`. `id` is the value that gets
 * sent as `paymentMethod` to the backend — keep aligned with the backend
 * enum on `Order.paymentMethod`.
 */
export const PAYMENT_METHODS = [
  {
    id: "Razorpay",
    title: "Pay online",
    eyebrow: "ONLINE",
    subtitle: "UPI, cards & wallets",
    icon: "card-outline",
    badge: "",
    brandStrip: [],
    secureNote: "",
  },
  {
    id: "Cash on Delivery",
    title: "Cash on delivery",
    eyebrow: "COD",
    subtitle: "Pay when delivered",
    icon: "cash-outline",
    secureNote: "",
  },
];

/** Fallback hero when API is offline — also seed defaults for new HomeViewConfig documents. */
export const HOME_HERO_TITLE_DEFAULT = ZEEVAN_CATALOG_TAGLINE;
export const HOME_HERO_SUBTITLE_DEFAULT =
  "Ghee · tel · masala · Haldar honey — sourced with care, delivered fresh.";

/** Premium ghee story blocks — import from `gheeHomeContent.js` (not re-exported here to keep bundle lean). */
export const HOME_HERO_BANNER = {
  kicker: "New season",
  badge: "Bestseller",
  cta: "Shop now",
};

/** Static brand quote on wide web home (not from reviews API). */
export const HOME_BRAND_QUOTE = {
  text: "Quietly premium — essentials you notice every morning.",
  attribution: "— Zeevan",
};

/**
 * Home screen — shared copy for app + web (`KankregHomeScreen.js` and home sections).
 * API fields from `/home-view` override titles where noted in screen code.
 */
export const HOME_SCREEN_UI = {
  hero: {
    eyebrow: HOME_HERO_BANNER.kicker,
    titleFallback: "Morning ritual",
    subtitleFallback: "",
    cta: HOME_HERO_BANNER.cta,
    loadingCta: "Loading…",
    fromLabel: "From",
  },
  heroSlider: {
    maxProductSlides: 4,
    autoPlayMs: 7000,
    imagesOnly: true,
    /** Desktop web slider — packaging wide banner + product slides. */
    desktopBannerOnly: false,
  },
  categories: {
    title: CATEGORY_SECTION_UI.title,
    action: CATEGORY_SECTION_UI.viewAllLabel,
    webOverline: CATEGORY_SECTION_UI.eyebrow,
    webShopBy: CATEGORY_SECTION_UI.eyebrow,
    webTitleFallback: CATEGORY_SECTION_UI.titleFallback,
    webSubtitle: CATEGORY_SECTION_UI.subtitle,
    webTileIcons: ZEEVAN_PRODUCT_LINES.map((l) => l.icon).concat(["gift-outline", "sparkles-outline"]),
    itemsSuffix: CATEGORY_SECTION_UI.itemsSuffix,
    shopNowLabel: CATEGORY_SECTION_UI.shopCta,
  },
  bestsellers: {
    titleFallback: "Bestsellers",
    action: "See all",
    webEyebrow: "Bestsellers",
    webAction: "View all",
    webSectionTitle: "Top picks",
  },
  comingSoon: {
    stripEyebrow: "Soon",
    stripTitle: "Coming soon",
    stripBody: "",
  },
  timelineVideo: {
    eyebrow: "Behind the craft",
    title: "From pasture to jar",
    kicker: "",
    filmLabel: "",
    filmDuration: "",
    loopingLabel: "",
    journeyPills: [],
    railMeta: "",
    /** Compact labels for the 6-step strip under the brand film. */
    processSteps: ["Pasture", "A2 milk", "Curd", "Bilona", "Wood fire", "Jar"],
  },
  ourStory: {
    eyebrow: "Our story",
    kicker: "Ghee, tel, masala & Haldar honey — crafted for Indian kitchens.",
    readMore: "Read more",
    shopStory: "Shop",
    galleryEyebrow: "Range",
    filmLabel: "Film",
    pullQuote: "Nothing rushed.\nNothing added.\nPure craft.",
    videoCaptionFallback: "From farm to pantry.",
    highlightsEyebrow: "Promise",
    highlightsTitle: "Every product",
  },
  editorial: {
    overline: "Essentials",
    ctaExplore: "Shop",
    ctaRewards: "Rewards",
    featuredLabel: "Featured",
    shopNowLabel: "Shop",
    ctaShop: "Shop",
  },
  featured: {
    sectionLabel: "Featured",
    eyebrow: "New",
    title: "Slow rituals, well made.",
    body: "Essentials for home and kitchen.",
    ctaPrimary: "Shop",
    ctaSecondary: "Browse",
  },
  marquee: ZEEVAN_HOME_MARQUEE,
  empty: {
    productsTitle: "No products yet",
    productsDescription: "New arrivals will appear here soon.",
    productsCta: "Browse shop",
    categoriesTitle: "No categories yet",
    categoriesDescription: "Collections appear when products are added.",
    categoriesCta: "Browse shop",
  },
  quote: HOME_BRAND_QUOTE,
  trust: {
    overline: "Why Zeevan",
  },
  /** Web-only home layout toggles (`KankregHomeScreen.js`). Lean web = catalog + API hero only. */
  native: {
    heroEyebrow: ZEEVAN_CATALOG_SUBLINE,
    showNativeHero: true,
  },
  web: {
    leanHome: true,
    showWebHero: true,
    showThreeBackground: false,
    enableHomeGsap: false,
    heroEyebrow: ZEEVAN_CATALOG_SUBLINE,
    showHeroTrustChips: true,
    showIntroBand: true,
    showTimelineSection: false,
    showProcessSection: false,
    showAboutSection: false,
    showCommunitySection: false,
    showGheePremiumSections: false,
    showStatsStrip: false,
    showTestimonials: false,
    showBrandQuote: false,
    showMarquee: false,
    showTrustStrip: false,
    showFeaturedEditorial: false,
    welcomeTag: "",
    heroStats: [],
    statsSectionIndex: 2,
    testimonialsSectionIndex: 7,
    quoteSectionIndex: 8,
  },
  webIntro: HOME_WEB_INTRO,
};

/** Default category tiles — ghee, tel, masala, honey (+ gifts & new). */
export const HOME_CATEGORY_DEFAULTS = buildHomeCategoryDefaults();

/** Light-mode tagline under the home top wordmark (same voice as `APP_TAGLINE`). */
export const HOME_WORDMARK_TAGLINE = APP_TAGLINE;

/** Trust strip under the hero (icon = Ionicons name). */
export const HOME_TRUST_STRIP = ZEEVAN_TRUST_STRIP;

/**
 * Animated stats strip (count-up). `target` numeric, `prefix` and `suffix` cosmetic,
 * `precision` controls decimals.
 */
export const HOME_STATS_STRIP = {
  overline: "Trusted by Indian kitchens",
  items: [],
};

/**
 * Customer testimonials shown under the stats strip.
 */
export const HOME_TESTIMONIALS = {
  overline: "Loved by our customers",
  title: "Stories from our kitchens",
  items: [],
};

/** Small uppercase labels above home sections (trust row, shop block). */
export const HOME_PAGE_LABELS = {
  trustOverline: "Why Zeevan",
  shopOverline: "Browse the shop",
  /** Hint under shop overline — empty string hides it. */
  shopHint: "",
};

/** Home live-order summary card (shown for authenticated users with active orders). */
export const HOME_LIVE_ORDER_CARD = {
  overline: "Track order",
  title: "Your order is moving",
  fallbackHint: "Follow status updates in My Orders.",
  ctaPrimary: "Track now",
  ctaSecondary: "My orders",
};

/** Catalog section intro (when not searching). */
export const HOME_CATALOG_INTRO = {
  starter: "Hand-picked to start you off right",
  all: "From our shelves to your kitchen",
};

/** Suffix for the side menu “starter” row (after dynamic counts). */
export const HOME_MENU_STARTER_TAG = "Starter picks";

/** Compact footer (auth screens, etc.). */
export const FOOTER_COMPACT = {
  offerLine: "",
  needHelp: "Need help?",
  customerCare: "Email us",
  chatSupport247: "",
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
  { key: "secure", label: "Secure checkout", icon: "lock-closed-outline" },
];

export const HOME_PAGE_FOOTER_META = "Made with care in India";

/** Footer credit — studio that built the product. */
export const APP_ENGINEER_CREDIT = {
  prefix: "Created by ",
  name: "NovaRo Solution",
  url: "https://novarosolution.com/",
};

/** Web header action labels (routes wired in kankregNav.js). */
export const KANKREG_HEADER = {
  signInLabel: "Sign in",
  accountLabel: "Account",
  searchA11y: "Search shop",
  cartA11y: "Cart",
  menuOpenA11y: "Open menu",
  menuCloseA11y: "Close menu",
};

/** Primary header nav order (Admin / Delivery appended by role in buildKankregNavItems). */
export const KANKREG_NAV_ITEMS = [
  { key: "Home", label: "Home" },
  { key: "Shop", label: "Shop" },
  { key: "Product", label: "Product" },
  { key: "Cart", label: "Cart" },
  { key: "Checkout", label: "Checkout" },
  { key: "Orders", label: "Orders" },
  { key: "Rewards", label: "Rewards" },
  { key: "Account", label: "Account" },
];

/** Desktop web header — essential links only. */
export const KANKREG_WEB_NAV_ITEMS = [
  { key: "Home", label: "Home" },
  { key: "Shop", label: "Shop" },
  { key: "About", label: "About" },
];

/** About page — editorial copy (web + native). Section body defaults in `aboutPageContent.js`. */
export const ABOUT_SCREEN_UI = {
  header: {
    eyebrow: "Our story",
    title: "About Zeevan",
    subtitle: "",
  },
  hero: {
    kicker: "Our story",
    title: "Premium pantry for Indian kitchens",
    lead: "Ghee, tel, masala & Haldar honey — sourced with care, delivered with live tracking.",
    ctaPrimary: "Shop all",
    ctaSecondary: "Our range",
    badge: "Gujarat, India",
    floatQuote: "",
  },
  mission: {
    eyebrow: "Mission",
    title: "Food that feels unmistakably real",
    paragraphs: [
      "Small-batch partners, honest labels, ingredients you'd serve at your table.",
      "Rewards on every order, live delivery tracking, and clear product pages.",
    ],
  },
  pillars: [
    {
      key: "source",
      icon: "leaf-outline",
      title: "Thoughtful sourcing",
      body: "Ghee, tel, masala & honey from partners we trust.",
    },
    {
      key: "craft",
      icon: "flame-outline",
      title: "Slow craft",
      body: "Traditional methods — Bilona ghee, cold-pressed tel, fresh-ground masala.",
    },
    {
      key: "fair",
      icon: "heart-outline",
      title: "Fair pricing",
      body: "Premium quality without inflated markups.",
    },
    {
      key: "deliver",
      icon: "bicycle-outline",
      title: "Delivered with care",
      body: "Secure checkout and live order tracking.",
    },
  ],
  craft: {
    eyebrow: "Process",
    title: "Farm to your kitchen",
    steps: [
      { key: "source", label: "01", title: "Source", body: "Pure ingredients from trusted farms and apiaries." },
      { key: "craft", label: "02", title: "Craft", body: "Small batches — ghee, tel, masala & honey." },
      { key: "pack", label: "03", title: "Pack", body: "Sealed fresh, labelled honestly." },
      { key: "ship", label: "04", title: "Deliver", body: "Live tracking to your door." },
    ],
  },
  stats: [],
  ctaBand: {
    title: "Taste the difference",
    body: "Browse bestsellers and earn rewards on your first order.",
    cta: "Shop",
    ctaSecondary: "Support",
  },
};

/** Privacy & Terms — static legal pages linked from site footer. */
export const LEGAL_PAGES = {
  privacy: {
    title: "Privacy policy",
    eyebrow: "Legal",
    updated: "Last updated June 2025",
    intro:
      "Zeevan respects your privacy. This policy explains what we collect, how we use it, and the choices you have when you shop with us.",
    sections: [
      {
        title: "Information we collect",
        body: "When you create an account or place an order, we collect your name, phone number, email, delivery address, and payment references processed securely through Razorpay. We also collect device and usage data to improve the app and website.",
      },
      {
        title: "How we use your data",
        body: "We use your information to fulfil orders, send delivery updates, provide customer support, process rewards, and improve our products. We do not sell your personal data to third parties.",
      },
      {
        title: "Cookies & analytics",
        body: "Our website may use cookies and similar technologies to remember preferences and measure performance. You can control cookies through your browser settings.",
      },
      {
        title: "Data retention & security",
        body: "We retain order and account data as long as needed for legal, tax, and support purposes. We apply industry-standard safeguards to protect your information in transit and at rest.",
      },
      {
        title: "Your rights",
        body: "You may request access, correction, or deletion of your personal data by contacting us at support@zeevan.app. We will respond within a reasonable timeframe.",
      },
      {
        title: "Contact",
        body: "Questions about this policy? Email support@zeevan.app and we will be glad to help.",
      },
    ],
  },
  terms: {
    title: "Terms of service",
    eyebrow: "Legal",
    updated: "Last updated June 2025",
    intro:
      "By using Zeevan — on web or in the app — you agree to these terms. Please read them before placing an order.",
    sections: [
      {
        title: "Using our service",
        body: "You must provide accurate delivery details and be available to receive orders. Misuse of the platform, fraudulent payments, or abusive behaviour toward staff or delivery partners may result in account suspension.",
      },
      {
        title: "Orders & pricing",
        body: "Prices, offers, and product availability may change without notice. An order is confirmed only after successful payment (or COD acceptance). We reserve the right to cancel orders affected by stock or pricing errors.",
      },
      {
        title: "Payments",
        body: "Online payments are processed by Razorpay. Cash on delivery is available where shown at checkout. Failed or abandoned online payments may release reserved stock after the payment timeout window.",
      },
      {
        title: "Delivery",
        body: "Estimated delivery times are indicative. Live tracking is provided when available. Risk of loss passes to you upon successful delivery to the address provided.",
      },
      {
        title: "Returns & quality",
        body: "If you receive a damaged or incorrect item, contact support within 48 hours with photos. We will arrange a replacement or refund at our discretion, in line with applicable consumer laws.",
      },
      {
        title: "Rewards",
        body: "Reward points have no cash value, may expire, and are subject to programme rules shown in the app. We may amend the rewards programme with reasonable notice.",
      },
      {
        title: "Governing law",
        body: "These terms are governed by the laws of India. Disputes shall be subject to the courts of Ahmedabad, Gujarat, unless otherwise required by law.",
      },
    ],
  },
};

export const KANKREG_ROLE_NAV_ITEMS = {
  admin: { key: "Admin", label: "Admin" },
  delivery: { key: "Delivery", label: "Delivery" },
};

/** kankreg.html `.foot` — newsletter + columns + legal (routes optional). */
export const KANKREG_FOOTER_NEWSLETTER = {
  showOnWeb: false,
  title: "Join the list",
  body: "First access to new drops, member-only offers, and 100 bonus points on signup.",
  placeholder: "your@email.com",
  cta: "Subscribe",
  successMessage: "Thanks — you're on the list.",
};

export const KANKREG_FOOTER_TAGLINE = APP_TAGLINE;

export const KANKREG_FOOTER_COLUMNS = [
  {
    title: "Shop",
    links: [
      { label: "All products", route: "Shop" },
      { label: "Ghee", route: "Shop", params: { pill: "Ghee" } },
      { label: "Tel", route: "Shop", params: { pill: "Tel" } },
      { label: "Masala", route: "Shop", params: { pill: "Masala" } },
      { label: "Haldar Honey", route: "Shop", params: { pill: "Honey" } },
    ],
  },
  {
    title: "Account",
    links: [
      { label: "My orders", route: "MyOrders", requiresAuth: true },
      { label: "Rewards", route: "RedeemRewards", requiresAuth: true },
      { label: "Addresses", route: "ManageAddress", requiresAuth: true },
      { label: "Support", route: "Support", requiresAuth: true },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "About", route: "About" },
      { label: "Privacy", route: "Privacy" },
      { label: "Terms", route: "Terms" },
    ],
  },
];

export const KANKREG_FOOTER_COPYRIGHT = "© 2026 Zeevan. Crafted in India.";

/** Native header: announce + topbar (no fixed announce on very small native optional). */
export const KANKREG_ANNOUNCE_COPY = {
  delivery: "Free delivery over ₹1,499",
  rewards: "",
  seasonCta: "",
};

/**
 * Web UI — single place to manage web copy, nav, and home section toggles.
 */
export const WEB_CONTENT = {
  get nav() {
    return KANKREG_WEB_NAV_ITEMS;
  },
  get header() {
    return KANKREG_HEADER;
  },
  get announce() {
    return KANKREG_ANNOUNCE_COPY;
  },
  get home() {
    return HOME_SCREEN_UI;
  },
  get footer() {
    return {
      tagline: KANKREG_FOOTER_TAGLINE,
      columns: KANKREG_FOOTER_COLUMNS,
      copyright: KANKREG_FOOTER_COPYRIGHT,
      trust: HOME_PAGE_TRUST_BADGES,
    };
  },
};

/** Shared actions / empty states across customer screens. */
export const COMMON_UI = {
  retry: "Retry",
  refresh: "Refresh",
  save: "Save",
  cancel: "Cancel",
  loading: "Loading…",
  errorFallback: "Something went wrong. Try again.",
};

/** Cart screen section chrome — see `CartScreen.js`. */
export const CART_UI = {
  pageEyebrow: "Your bag",
  pageTitle: "Shopping cart",
  checkoutTitle: "Checkout",
  emptyTitle: "Your cart is empty",
  emptyDescription: "Discover ghee, tel, masala, honey & more — add something you love.",
  browseCta: "Browse shop",
  itemsSectionLabel: "Your items",
  summaryTitle: "Order summary",
  trustLine: "Secure checkout · Free delivery · Easy returns",
  stickySubtotalLabel: "Subtotal",
  shippingLabel: "Delivery",
  shippingFree: "FREE",
  serviceFeeLabel: "Service fee",
  totalLabel: "Total",
  checkoutCta: "Checkout",
  checkoutCtaArrow: "Checkout →",
  payCta: "Pay now",
  placeOrderCta: "Place order",
  itemCount: "{count} item",
  itemCountPlural: "{count} items",
  unitPrice: "{price} each",
  removeItem: "Remove",
  couponPlaceholder: "Coupon code",
  couponApply: "Apply",
  couponApplied: "Coupon applied",
  loginTitle: "Sign in to continue",
  loginDescription: "Access your bag, saved address, and checkout on any device.",
  loginCta: "Sign in",
  browseGuestCta: "Continue browsing",
};

/** Cart — deliver-to panel and profile address prompts. */
export const CART_ADDRESS = {
  panelTitle: "Delivery address",
  contactSection: "Contact",
  addressSection: "Address",
  noteSection: "Note",
  useSaved: "Use saved",
  useGps: "Use current location",
  useGpsLoading: "Locating…",
  gpsFillSuccess: "Location added.",
};

/** Shop catalog — re-export from `shopPageContent.js`. */
export {
  SHOP_SCREEN_UI,
  SHOP_PRICE_PRESETS,
  buildShopCollectionLines,
  formatShopResultCount,
  shopRatingChipLabels,
  shopRatingLabelFromValue,
} from "./shopPageContent";

/** Notifications — `NotificationsScreen.js`. */
export const NOTIFICATIONS_SCREEN_UI = {
  pageTitle: "Notifications",
  pageEyebrow: "Inbox",
  refresh: COMMON_UI.refresh,
  loadingCaption: "Loading notifications…",
  filters: {
    all: "All",
    unread: "Unread",
    archived: "Archived",
  },
  groups: {
    today: "Today",
    week: "This week",
    earlier: "Earlier",
  },
  emptyTitle: "You're all caught up",
  emptyDescription: "We'll notify you when something arrives.",
};

/** Rewards — `RedeemRewardsScreen.js`. */
export const REWARDS_SCREEN_UI = {
  pageTitle: "Rewards",
  pageEyebrow: "Points",
  pageSubtitle: "",
  balanceLabel: "Your balance",
  catalogTitle: "Redeem",
  walletTitle: "My coupons",
  emptyCatalogTitle: "No rewards yet",
  emptyCatalogDescription: "Check back for new offers.",
  redeemCta: "Redeem",
  redeeming: "Redeeming…",
  copied: "Code copied",
  copyFailed: "Could not copy",
  loadingCaption: "Loading rewards…",
  errorFallback: "Unable to load rewards.",
};

/** Edit profile — `EditProfileScreen.js`. */
export const EDIT_PROFILE_SCREEN_UI = {
  pageTitle: "Edit profile",
  pageEyebrow: "Account",
  pageSubtitle: "",
  sectionPersonal: "Personal",
  sectionContact: "Contact",
  saveCta: COMMON_UI.save,
  saving: "Saving…",
  success: "Profile updated.",
  errorFallback: "Unable to save profile.",
};

/** Saved addresses — `ManageAddressScreen.js`. */
export const MANAGE_ADDRESS_SCREEN_UI = {
  pageTitle: "Saved addresses",
  pageEyebrow: "Delivery",
  pageSubtitle: "",
  sectionDefault: "Default address",
  useGps: "Use current location",
  useGpsLoading: "Locating…",
  saveCta: COMMON_UI.save,
  saving: "Saving…",
  success: "Address saved.",
  errorFallback: "Unable to save address.",
  coordsHint: "GPS coordinates help live order tracking.",
};

/** Native location onboarding — `FindLocationScreen.js`. */
export const FIND_LOCATION_UI = {
  title: "Where should we deliver?",
  subtitle: "Set your area for accurate delivery and tracking.",
  cta: "Confirm location",
  skip: "Skip for now",
  loading: "Finding location…",
};

/** Support screen (customer). */
export const SUPPORT_SCREEN = {
  pageTitle: "Help & support",
  pageEyebrow: "Support",
  pageSubtitle: "",
  liveChatTitle: "Live chat",
  contactChatSub: "Usually minutes",
  contactEmailSub: SUPPORT_EMAIL_DISPLAY,
  contactWhatsAppSub: "Anytime",
  faqTitle: "Common questions",
  chatPlaceholder: "Type your message…",
  sendCta: "Send",
  sending: "Sending…",
  emptyThread: "Start a conversation — we typically reply within minutes.",
  faqs: [
    {
      q: "When will my order arrive?",
      a: "Track status in My Orders. Same-day in many areas.",
    },
    {
      q: "How do I change my order?",
      a: "My Orders → update address before pickup.",
    },
    {
      q: "Can I pay on delivery?",
      a: "Yes — Cash on Delivery and online checkout.",
    },
    {
      q: "How do refunds work?",
      a: "Refunds return to your original payment method.",
    },
  ],
};

/**
 * Profile screen (customer). Centralised copy so labels stay editable in one
 * place rather than hard-coded in [src/screens/ProfileScreen.js].
 */
export const PROFILE_SCREEN = {
  pageTitle: "My profile",
  pageEyebrow: "Account",
  eyebrow: "Zeevan member",
  memberSincePrefix: "Member since",
  pageSubtitle: "",
  fallbackName: "Welcome",
  emptyPhone: "Add phone in Edit profile",
  roleAdmin: "Admin",
  roleDelivery: "Delivery partner",
  roleCustomer: "Customer",
  addressTitle: "Default delivery address",
  addressEyebrow: "DELIVERY",
  addressDefaultRibbon: "DEFAULT",
  addressMissingTitle: "No saved address yet",
  addressMissingHint: "Add an address for quicker checkout.",
  addressChangeCta: "Change address",
  addressAddCta: "Add address",
  quickActionsEyebrow: "Account hub",
  quickActionsTitle: "Account options",
  quickActionsSubtitle: "Profile, orders, support",
  adminRibbonTitle: "Admin dashboard",
  adminRibbonHint: "Storefront & orders",
  deliveryRibbonTitle: "Delivery dashboard",
  deliveryRibbonHint: "Your assigned runs",
  dangerTitle: "Account safety",
  dangerHint: "Signed-in data stays on this device until you remove it.",
  signOutLabel: "Sign out",
};

/** Settings screen — short labels for density. */
export const SETTINGS_SCREEN = {
  pageTitle: "Settings",
  pageEyebrow: "Preferences",
  pageSubtitle: "",
  appearanceGroup: "Appearance",
  appearanceGroupSub: "Theme & app icon",
  themeSectionTitle: "Theme",
  themeSectionSub: "Tap to cycle Light · Dark · System",
  appIconTitle: "App icon",
  appIconSub: "Gold K mark — light cream or dark charcoal on your home screen.",
  appIconApplied: "App icon updated.",
  appIconAppliedAuto: "App icon will follow your theme.",
  appIconFailed: "Could not change the app icon. Try again.",
  appIconNeedsBuild: "App icon switching needs a native build (not Expo Go).",
  appIconSavedExpoGo: "Preference saved. It will apply on your home screen in a dev or store build.",
  appIconExpoGoHint:
    "Preview only in Expo Go. To change your home screen icon, run npm run ios (or android) once to install a dev build.",
  appIconWebHint: "App icon choice applies on iPhone and Android installs.",
  appIconIosHint: "iOS may show a brief confirmation when the icon changes.",
  appIconAndroidHint: "Android updates the icon when you leave the app or return home.",
  accountGroup: "Account",
  accountGroupSub: "Profile & orders",
  accountSectionTitle: "Account options",
  accountSectionSub: "Profile, address, orders",
  notificationsGroup: "Notifications",
  notificationsGroupSub: "Alerts",
  alertsSectionTitle: "Alerts",
  alertsSectionSub: "Orders & support",
  orderUpdatesHint: "Dispatch & delivery",
  marketingHint: "Offers & promos",
  deliveryGroup: "Delivery",
  deliveryGroupSub: "Partner tools",
  adminGroup: "Admin",
  adminGroupSub: "Operations",
};

/** Delivery dashboard — partner sharing GPS with customers (foreground). */
export const DELIVERY_LIVE_SHARE = {
  title: "Share live location",
  hintBeforeBold: "While enabled, your position updates for customers when the order is ",
  hintBold: "packed, shipped, or out for delivery",
  hintAfterBold: ". Stops when you leave this screen or turn it off.",
  webHint:
    "On the web, your browser will ask for location. Keep this tab active when possible—background tabs may send updates less often.",
  switchA11yLabel: "Share live location",
  sharingActive: "Sharing live",
  lastSentPrefix: "Last sent",
};

/** Delivery partner dashboard — order cards and navigation. */
export const DELIVERY_DASHBOARD_COPY = {
  navigateDropoff: "Navigate",
  dropoffEyebrow: "Drop-off",
  customerCallA11y: "Call customer",
  /** Shown when address text is missing or looks invalid (never polyline/encoded blobs). */
  addressUnavailable: "Full address in details below",
};

/** Home location row — tap-through to saved address. */
export const LOCATION_BAR = {
  kicker: "Deliver to",
  /** Visible label when no address saved (short). */
  emptyLabel: "Add address",
  /** Screen reader / full phrasing. */
  emptyA11y: "Add delivery address",
};

/** Auth screens — Login / Register (kankreg.html `#auth`). */
export const AUTH_UI = {
  loginTitle: "Sign in",
  loginSubtitle: "Access your orders, rewards and saved items.",
  loginFormEyebrow: "Welcome back",
  loginHeroEyebrow: `Zeevan · ${ZEEVAN_CATALOG_SUBLINE}`,
  loginHeroTitle: "Goods worth\ncoming back for.",
  loginPerks: [
    { icon: "gift-outline", label: "Rewards on every order" },
    { icon: "location-outline", label: "Live order tracking" },
    { icon: "shield-checkmark-outline", label: "Secure online checkout" },
  ],
  registerTitle: "Create account",
  registerSubtitle: "Join Zeevan — earn rewards on every delivered order.",
  registerFormEyebrow: "Join Zeevan",
  registerHeroTitle: "Start earning\nfrom your first order.",
  registerPerks: [
    { icon: "star-outline", label: "Member rewards & offers" },
    { icon: "heart-outline", label: "Save favourites & addresses" },
    { icon: "notifications-outline", label: "Order updates in real time" },
  ],
  socialDivider: "or continue with",
  forgotPassword: "Forgot password?",
  forgotPasswordStub: "Password reset is coming soon. Contact support if you need help.",
  googleLabel: "Google",
  appleLabel: "Apple",
  socialComingSoon: "Coming soon",
  socialDisabledHint: "Google & Apple sign-in will be enabled once OAuth is configured.",
  continueGuest: "Continue as guest",
  haveAccount: "Already have an account?",
  needAccount: "New here?",
};

/** My Orders — shared copy for app + web (`MyOrdersScreen.js`). */
export const MY_ORDERS_UI = {
  pageTitle: "Your orders",
  pageSubtitle: "Track, reorder, and download invoices.",
  pageEyebrowActive: "In transit",
  pageEyebrowDefault: "Order history",
  summaryKicker: "Overview",
  emptyTitle: "No orders yet",
  emptyDescription: "Your orders appear here after checkout with live tracking.",
  emptyCta: "Start shopping",
  loadingCaption: "Loading orders…",
  refresh: "Refresh",
  orderPrefix: "ORDER",
  itemsLabel: "items",
  sectionActive: "Active orders",
  sectionActiveOverline: "Live",
  sectionActiveSubtitle: "On the way or being prepared.",
  sectionHistory: "Past orders",
  sectionHistoryOverline: "History",
  sectionHistorySubtitle: "Delivered and cancelled.",
  detailTitle: "Order breakdown",
  detailItems: "Items total",
  detailDelivery: "Delivery",
  detailPlatform: "Platform fee",
  detailDiscount: "Discount",
  detailCoupon: "Coupon",
  detailPaymentMethod: "Payment method",
  detailPaymentStatus: "Payment status",
  detailPaymentId: "Payment ID",
  detailTax: "Tax",
  detailInvoice: "Invoice no.",
  detailTotal: "Order total",
  detailAddress: "Deliver to",
  callPartner: "Call delivery partner",
  trackTitle: "Track order",
  trackCancelledTitle: "Order cancelled",
  trackCancelledSub: "This order will not be fulfilled.",
  filters: {
    all: "All",
    active: "Active",
    delivered: "Delivered",
    cancelled: "Cancelled",
  },
  filterIcons: {
    all: "apps-outline",
    active: "flash-outline",
    delivered: "checkmark-done-outline",
    cancelled: "ban-outline",
  },
  icons: {
    items: "leaf-outline",
    date: "time-outline",
    ship: "navigate-outline",
    statusDelivered: "checkmark-done-circle",
    statusCancelled: "close-circle",
    statusPending: "hourglass-outline",
    call: "call-outline",
    details: "reader-outline",
    detailsCollapse: "chevron-up-outline",
    address: "create-outline",
    invoice: "download-outline",
    reward: "sparkles-outline",
    rewardDone: "sparkles",
    reorder: "cart-outline",
    statTotal: "albums-outline",
    statActive: "pulse-outline",
    statDelivered: "shield-checkmark-outline",
    statSpend: "wallet-outline",
  },
  partnerOnWay: "On the way to you",
  detailsExpand: "Breakdown",
  detailsCollapse: "Close",
  changeAddress: "Edit",
  editAddressTitle: "Update delivery address",
  saveAddress: "Save address",
  savingAddress: "Saving…",
  cancel: "Cancel",
  reorder: "Reorder items",
  reorderLoading: "Adding…",
  invoiceDownload: "Invoice",
  invoiceGenerating: "Generating…",
  claimReward: "Claim reward",
  claimRewardLoading: "Claiming…",
  claimedReward: "Claimed",
  loadMore: "Load more",
  statTotal: "Orders",
  statInFlight: "Active",
  statDelivered: "Delivered",
  statSpend: "Total spend",
  addressFields: {
    fullName: { label: "Full name", icon: "person-outline", autoCapitalize: "words" },
    phone: { label: "Phone", icon: "call-outline", keyboardType: "phone-pad" },
    line1: { label: "Address", icon: "home-outline", autoCapitalize: "sentences" },
    city: { label: "City", autoCapitalize: "words" },
    state: { label: "State", autoCapitalize: "words" },
    postalCode: { label: "Postal code", keyboardType: "number-pad" },
    country: { label: "Country", autoCapitalize: "words" },
    note: { label: "Note (optional)", icon: "chatbubble-ellipses-outline" },
  },
  addressFieldRows: [
    ["fullName"],
    ["phone"],
    ["line1"],
    ["city", "state"],
    ["postalCode", "country"],
    ["note"],
  ],
  /** @deprecated */
  lineSingular: "line",
  /** @deprecated */
  linePlural: "lines",
  /** @deprecated */
  itemsMoreLabel: "more items",
  /** @deprecated */
  itemsPreviewTitle: "Items",
  /** @deprecated */
  invoiceHintWeb: "Save as PDF from print.",
  /** @deprecated */
  etaPrefix: "Arriving in",
  /** @deprecated */
  etaFallback: "Soon",
  /** @deprecated */
  partnerRole: "Delivery partner",
  /** @deprecated */
  trackSteps: ["Placed", "Packed", "On the way", "Delivered"],
  /** @deprecated */
  inFlightTitle: "Active orders",
  /** @deprecated */
  historyTitle: "History",
  /** @deprecated use emptyDescription */
  emptyDescriptionShort: "Orders show up here after checkout.",
};

/**
 * Product detail screen — centralized copy for [`ProductScreen.js`](src/screens/ProductScreen.js).
 * Use `{key}` placeholders with `fillProductScreen(template, { key: value })`.
 */
export const PRODUCT_SCREEN = {
  loadingCaption: "Loading product…",
  loadErrorFallback: "Unable to load product.",
  notFoundTitle: "Product not found",
  notFoundDescriptionFallback: "Unavailable—open Home to browse.",
  backToHomeCta: "Back to home",
  heroImageUnavailable: "No image",
  heroInStock: "In stock",
  heroOutOfStock: "Out of stock",
  heroComingSoon: "Coming soon",
  comingSoonTitle: "Coming soon",
  comingSoonBody: "This item is not available to order yet. Check back for launch updates.",
  comingSoonNoteFallback: "Launching shortly",
  categoryFallback: "General",
  metaNoRatings: "No ratings",
  metaReadyToShip: "Ready to ship",
  metaOutOfStockShort: "Out of stock",
  /** `{rating}` `{count}` for pill text */
  metaRatingSummary: "{rating} ({count})",
  storyOverline: "Details",
  storyTitle: "About this item",
  /** Empty = no subtitle under section header (see ProductScreen). */
  storySubtitle: "",
  defaultDescription: "From Zeevan.",
  variantOverline: "Choose",
  variantTitle: "Options",
  variantSubtitle: "",
  reviewsOverline: "Ratings",
  reviewsTitle: "Reviews",
  /** Kept for templates if needed; header uses count chip + empty-state line only. */
  reviewsSubtitleHasCount: "{rating} · {count} reviews",
  reviewsSubtitleOne: "{rating} · 1 review",
  reviewsEmptySubtitle: "No reviews yet",
  reviewComposerNoteLabel: "",
  reviewComposerA11y: "Review comment (optional)",
  reviewComposerPlaceholder: "Optional",
  reviewPost: "Post",
  reviewPosting: "Posting…",
  reviewRatingError: "Pick 1–5 stars.",
  reviewSubmitSuccess: "Posted.",
  reviewSubmitErrorFallback: "Couldn’t post review.",
  /** Empty = no list section label (see ProductScreen). */
  reviewListLatest: "",
  reviewNoWrittenNote: "—",
  reviewFirstHint: "",
  stickyPriceLabel: "Total",
  addToCart: "Add to cart",
  /** Primary + sticky CTA when line is not purchasable */
  outOfStock: "Out of stock",
  productOutOfStockA11y: "Unavailable",
  addToCartA11y: "Add to cart",
  /** `{count}` stepper label */
  inCartCount: "{count} in cart",
  /** `{count}` stock fact */
  stockCountLabel: "{count} in stock",
  stockOutLabel: "Out of stock",
  unitFallback: "1 pc",
  /** `{pct}` discount chip */
  savePctChip: "Save {pct}%",
  stickyInCart: "In cart ({count})",
};

/** Replace `{placeholders}` in `PRODUCT_SCREEN` template strings. */
export function fillProductScreen(template, vars) {
  let out = String(template ?? "");
  Object.entries(vars || {}).forEach(([k, v]) => {
    out = out.replace(new RegExp(`\\{${k}\\}`, "g"), String(v));
  });
  return out;
}

/** Order confirmed screen + celebration overlays (`OrderConfirmedScreen.js`, `OrderCelebrationOverlay.js`). */
export const ORDER_CELEBRATION_UI = {
  orderPrefix: "ORDER",
  /** Full-screen route after checkout (`OrderConfirmedScreen.js`). */
  screen: {
    eyebrow: "Order placed",
    title: "Order confirmed",
    lead: "Thank you — we're preparing your essentials with care.",
    orderRefLabel: "Reference",
    stepsTitle: "What happens next",
    steps: [
      {
        key: "confirmed",
        icon: "checkmark-circle-outline",
        label: "Confirmed",
        detail: "We received your order and payment details.",
      },
      {
        key: "preparing",
        icon: "cube-outline",
        label: "Preparing",
        detail: "Your items are being packed at the store.",
      },
      {
        key: "tracking",
        icon: "navigate-outline",
        label: "On the way",
        detail: "Track live updates anytime in My Orders.",
      },
    ],
    summaryTitle: "Order summary",
    labels: {
      items: "Items",
      payment: "Payment",
      delivery: "Delivering to",
      total: "Total",
    },
    paymentLabels: {
      "Cash on Delivery": "Cash on delivery",
      Razorpay: "Paid online",
      cod: "Cash on delivery",
      online: "Paid online",
    },
    trustChips: [
      { key: "track", icon: "navigate-outline", label: "Live tracking" },
      { key: "secure", icon: "shield-checkmark-outline", label: "Secure checkout" },
      { key: "care", icon: "heart-outline", label: "Handled with care" },
    ],
    trustLine: "We'll notify you as your order moves — open My Orders for the full timeline.",
    ctaPrimary: "Track order",
    ctaSecondary: "Continue shopping",
    ctaHome: "Back to home",
    missingOrderTitle: "Order not found",
    missingOrderBody: "We couldn't load this confirmation. Check My Orders for your latest purchases.",
    missingOrderCta: "Go to My Orders",
  },
  /** Full-screen popup after checkout (`OrderCelebrationOverlay.js`). */
  confirmed: {
    title: "Order placed",
    subtitle: "Your order {ref} is confirmed. We'll keep you posted as it moves.",
    ctaPrimary: "Track order",
    ctaSecondary: "Continue shopping",
  },
  delivered: {
    title: "Delivered!",
    subtitle: "Your order arrived safely. Enjoy — and thank you for choosing Zeevan.",
    ctaPrimary: "View orders",
    ctaSecondary: "Shop again",
  },
};

/** Format short order reference for UI (e.g. ORDER #A1B2C3). */
export function formatOrderReference(order, prefix = ORDER_CELEBRATION_UI.orderPrefix) {
  const id = String(order?._id || order?.id || "")
    .slice(-6)
    .toUpperCase();
  return id ? `${prefix} #${id}` : "";
}

/** Public order id for celebration UI (e.g. #KG-20451). */
export function formatOrderPublicRef(order) {
  const id = String(order?._id || order?.id || "")
    .slice(-5)
    .toUpperCase();
  return id ? `#KG-${id}` : "";
}

export function formatOrderPlacedMessage(order) {
  const ref = formatOrderPublicRef(order);
  const template = ORDER_CELEBRATION_UI.confirmed.subtitle;
  return ref ? template.replace("{ref}", ref) : template.replace("{ref}", "your order");
}

/** Item count from order line items. */
export function orderItemCount(order) {
  const lines = Array.isArray(order?.products) ? order.products : [];
  return lines.reduce((sum, line) => sum + Math.max(1, Number(line?.quantity) || 1), 0);
}

/** Human payment label from order payload. */
export function orderPaymentLabel(order) {
  const raw = String(order?.paymentMethod || "").trim();
  const map = ORDER_CELEBRATION_UI.screen.paymentLabels;
  return map[raw] || raw || map.online;
}

/** My Orders — live map + markers while order is out for delivery. */
export const ORDER_LIVE_TRACKING = {
  overline: "Live",
  title: "Delivery tracking",
  loading: "Loading map…",
  errorTitle: "Live tracking",
  loadFailed: "Unable to load live tracking.",
  partnerFallback: "Delivery partner",
  staleBanner: "Partner location paused—weak signal or sharing off.",
  waitingDefault: "Waiting for partner location.",
  webFallback: "For turn-by-turn, open in Maps.",
  /** Shown under the embedded OSM map on web (tiles © OpenStreetMap). */
  osmAttrib: "Map data © OpenStreetMap contributors",
  /** Dark mode uses Carto tiles on web. */
  osmAttribDark: "© OpenStreetMap · © CARTO",
  openMapsCta: "Open in Maps",
  markerPartner: "Delivery partner",
  markerShop: "Shop",
  markerDestination: "Delivery address",
  shopNotConfigured: "Set shop location in Admin → Storefront.",
  deliverToEyebrow: "Deliver to",
  deliverPhoneA11y: "Call delivery phone",
  updatedJustNow: "Updated just now",
  /** Use `{minutes}` placeholder for whole minutes since update. */
  updatedMinutesAgo: "Updated {minutes} min ago",
  /** Appended before locale time when the update is older than ~2 hours. */
  updatedAtPrefix: "Updated ",
  /** Shown when an encoded driving-route polyline is drawn (Google Directions). */
  googleRouteAttrib: "Route © Google",
};

/** Admin → Home View screen: labels, hints, and quick links to related tools. */
export const ADMIN_HOME_VIEW_COPY = {
  title: "Manage storefront content",
  subtitle:
    "Hero copy, slider images, and home layout live here. Product names, prices, photos, stock, and “Show on Home” are set under Products.",
  heroSection: "Hero banner",
  heroHint: "Title and subtitle shown with the home hero (when no slide overrides them).",
  heroMediaSection: "Hero slider",
  heroMediaHint: "Carousel images on web and app home — up to 4 slides, images only.",
  sectionTitles: "Home catalog headings",
  sectionTitlesHint:
    "Prime title is the default section name for products without a custom Home section, and the heading for the main list when sections are merged. Product type title is saved with this profile for layout features (same API as the storefront).",
  visibilitySection: "Home layout switches",
  visibilityHint:
    "These flags are read by the live Home screen. Each product still needs “Show on Home” and a Home section in the product editor.",
  cardLayoutSection: "Product card density",
  cardLayoutHint: "Stored as compact or comfortable (wired when the storefront reads this setting).",
  shopLocationSection: "Shop / pickup location",
  shopLocationHint: "Pin shown on order tracking maps (shop, delivery partner, customer).",
  shopNameLabel: "Shop name",
  shopAddressLabel: "Address line",
  shopCityLabel: "City",
  shopStateLabel: "State",
  shopPostalLabel: "Postal code",
  shopCoordsLabel: "Coordinates",
  shopUseGps: "Use current location",
  shopUseGpsLoading: "Locating…",
  quickLinks: "Catalog & items",
  linkProductsTitle: "Manage products",
  linkProductsSubtitle: "Edit listings, MRP, discount, photos, stock, home section, and visibility on Home.",
  linkAddProductTitle: "Add product",
  linkAddProductSubtitle: "Create a new SKU and assign it to a home section.",
};
