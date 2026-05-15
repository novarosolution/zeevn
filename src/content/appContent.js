/**
 * Central customer-facing copy for Zeevan — edit here instead of scattering strings in screens.
 *
 * **Brand & shell:** `APP_DISPLAY_NAME`, `APP_TAGLINE`, `SEARCH_PLACEHOLDER`, `SUPPORT_EMAIL_DISPLAY`, footers, nav.
 * **Home:** `HOME_VIEW_DEFAULTS`, `HOME_*` marketing blocks, stats, testimonials, catalog intros.
 * **Commerce:** `CART_*`, `PRODUCT_SCREEN`, `MY_ORDERS_UI`, `ORDER_LIVE_TRACKING`, `PAYMENT_METHODS`.
 * **Account:** `PROFILE_SCREEN`, `SETTINGS_SCREEN`, `SUPPORT_SCREEN`, `LOCATION_BAR`.
 * **Auth:** `LOGIN_SCREEN`, `REGISTER_SCREEN`.
 * **Inbox:** `NOTIFICATIONS_SCREEN`.
 * **Delivery:** `DELIVERY_*`.
 * **Admin content hints:** `ADMIN_HOME_VIEW_COPY`.
 * **Discovery map:** `APP_CONTENT_INDEX` groups shell, home, footer, payments, location, and screen blobs for tooling — screens still import named exports.
 *
 * Placeholders: use `{key}` in strings and `fillPlaceholders(template, { key: value })`.
 * Keep `backend/src/models/HomeViewConfig.js` defaults aligned with `HOME_VIEW_DEFAULTS`.
 */

import {
  RUNTIME_BRAND_NAME,
  RUNTIME_BRAND_SUBLINE,
  RUNTIME_BRAND_TAGLINE,
  RUNTIME_ENGINEER_NAME,
  RUNTIME_ENGINEER_URL,
  RUNTIME_RAZORPAY_PAYMENT_LINK,
  RUNTIME_SEARCH_PLACEHOLDER,
  RUNTIME_SUPPORT_EMAIL,
  RUNTIME_SUPPORT_WHATSAPP_URL,
} from "../constants/runtimeConfig";

/** @type {string} */
export const APP_DISPLAY_NAME = RUNTIME_BRAND_NAME;
/**
 * Typographic scale for [`BrandWordmark`](src/components/BrandWordmark.js) (`fontSize`, dp).
 * Alias `BRAND_LOGO_SIZE` kept for older imports.
 */
export const BRAND_WORDMARK_SIZE = {
  /** Inner screens: header row beside back affordance. */
  headerCompact: 22,
  /** Web top bar / default header wordmark. */
  headerDefault: 26,
  /** Home top bar (tagline sits below). */
  homeTopBar: 28,
  /** Home marketing hero slide. */
  homeHero: 38,
  footerCompact: 20,
  footerWide: 22,
  authHero: 34,
  startup: 42,
};
/** @deprecated Same object as `BRAND_WORDMARK_SIZE`. */
export const BRAND_LOGO_SIZE = BRAND_WORDMARK_SIZE;

/** Layout: home top bar stack (wordmark + tagline) for menu offset math — not font size. */
export const BRAND_HOME_TOP_BAR_LAYOUT_HEIGHT = 56;

/** Layout: minimum touch row height next to back/cart icons. */
export const BRAND_HEADER_ROW_MIN_HEIGHT = 44;
export const APP_TAGLINE = RUNTIME_BRAND_TAGLINE;
export const APP_WORDMARK_SUBLINE = RUNTIME_BRAND_SUBLINE;
export const APP_HERO_KICKER = `${APP_DISPLAY_NAME} · ${APP_WORDMARK_SUBLINE}`;
export const SEARCH_PLACEHOLDER = RUNTIME_SEARCH_PLACEHOLDER;
export const SUPPORT_EMAIL_DISPLAY = RUNTIME_SUPPORT_EMAIL;
export const APP_META = {
  brand: {
    name: "Zeevan",
    legalName: "Zeevan Pantry Private Limited",
    logo: "/assets/seo/icon-512.png",
    sameAs: [
      "https://www.instagram.com/zeevan",
      "https://www.facebook.com/zeevan",
      "https://www.youtube.com/@zeevan",
      "https://twitter.com/zeevan",
    ],
    contact: {
      email: "support@zeevan.com",
      phone: "+91-XXXXXXXXXX",
      address: {
        streetAddress: "...",
        addressLocality: "Ahmedabad",
        addressRegion: "GJ",
        postalCode: "...",
        addressCountry: "IN",
      },
    },
    themeColor: "#0E1729",
    siteUrl: "https://zeevan.com",
  },
  defaults: {
    titleTemplate: "%s — Zeevan",
    titleFallback: "Zeevan — Heritage Pantry Essentials, Delivered",
    description:
      "Small-batch staples, traceable sourcing, and reliable doorstep delivery from Zeevan — the premium pantry for modern Indian kitchens.",
    ogImage: "/assets/seo/og-image.png",
    ogImageAlt: "Zeevan — Heritage Pantry Essentials",
    locale: "en_IN",
    type: "website",
  },
  routes: {
    home: {
      title: "Zeevan — Heritage Pantry Essentials, Delivered",
      description:
        "Small-batch staples, traceable sourcing, and reliable doorstep delivery. The premium pantry, designed for modern Indian kitchens.",
      canonical: "/",
      keywords: ["heritage pantry", "premium grocery", "small batch staples", "ghee", "saffron", "basmati", "Indian kitchen essentials"],
    },
    shop: {
      title: "Shop the Pantry — Zeevan",
      description:
        "Browse hand-selected pantry essentials: pure cow ghee, single-origin spices, aged basmati, cold-pressed oils, and more. Free delivery over ₹1,499.",
      canonical: "/shop",
    },
    product: {
      canonicalTemplate: "/product/%slug",
    },
    cart: {
      title: "Your Bag",
      description: "Review your selection and proceed to checkout.",
      canonical: "/cart",
      noindex: true,
    },
    checkout: { title: "Checkout", noindex: true, canonical: "/checkout" },
    orders: { title: "Your Orders", noindex: true, canonical: "/orders" },
    account: { title: "Your Account", noindex: true, canonical: "/account" },
    about: {
      title: "Our Story — Zeevan",
      description:
        "Built on the belief that everyday staples deserve heritage-grade care. Meet the makers, the sourcing, and the kitchens that shaped Zeevan.",
      canonical: "/about",
    },
    contact: {
      title: "Contact Us — Zeevan",
      description: "Questions, feedback, or wholesale inquiries — the Zeevan team responds within one business day.",
      canonical: "/contact",
    },
    faq: {
      title: "Help & FAQ — Zeevan",
      description:
        "Answers on shipping, returns, sourcing, ingredients, and ordering. Can't find what you need? Write to us.",
      canonical: "/faq",
    },
    privacy: { title: "Privacy Policy", canonical: "/privacy" },
    terms: { title: "Terms of Service", canonical: "/terms" },
    blog: {
      title: "Journal — Zeevan",
      description: "Recipes, sourcing stories, and the craft behind the pantry. Slow-read writing from the Zeevan team.",
      canonical: "/blog",
    },
    blogPost: { titleTemplate: "%s — Journal", canonicalTemplate: "/blog/%slug" },
    category: { canonicalTemplate: "/category/%slug" },
    categoryTemplate: {
      titleTemplate: "%s — Shop Pantry Essentials — Zeevan",
      descriptionTemplate: "Hand-selected %s from trusted Indian makers. Reliable doorstep delivery, 30-day returns.",
    },
    productTemplate: {
      titleTemplate: "%name (%size) — %category — Zeevan",
      descriptionTemplate: "%shortDescription Free delivery over ₹1,499. 30-day returns.",
    },
    search: { titleTemplate: 'Search: "%s"', canonicalTemplate: "/search?q=%q", noindex: true },
    notFound: { title: "Page Not Found", noindex: true },
  },
};

/** Digital product partner — linked from customer footers. */
export const APP_ENGINEER_NAME = RUNTIME_ENGINEER_NAME;
export const APP_ENGINEER_URL = RUNTIME_ENGINEER_URL;

/** Razorpay payment page (UPI, cards, wallet) — used as a hosted-page fallback. */
export const RAZORPAY_PAY_URL = RUNTIME_RAZORPAY_PAYMENT_LINK;

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
    eyebrow: "INSTANT",
    subtitle: "UPI, cards, wallets, netbanking",
    icon: "card-outline",
    badge: "RECOMMENDED",
    brandStrip: ["UPI", "Visa", "MC", "RuPay", "Wallets"],
    secureNote: "Secured by Razorpay · 256-bit SSL",
  },
  {
    id: "Cash on Delivery",
    title: "Cash on delivery",
    eyebrow: "RELAXED",
    subtitle: "Pay in cash when your order arrives",
    icon: "cash-outline",
    secureNote: "Available across serviceable pin codes",
  },
];

/** Fallback hero when API is offline — also seed defaults for new HomeViewConfig documents. */
export const HOME_HERO_TITLE_DEFAULT = "Classically crafted pantry essentials";
export const HOME_HERO_SUBTITLE_DEFAULT =
  "Pure ingredients, elegant shopping, and reliable doorstep delivery.";

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
  kicker: "Signature collection",
  badge: "New season",
  cta: "Shop the edit",
  editorialNote: "Crafted staples with timeless quality for modern kitchens.",
  highlights: [],
};

/** Shared hero slide copy; marketing assets choose only platform-specific imagery/layout. */
export const HOME_HERO_SLIDE_COPY = [
  {
    key: "heritage",
    title: "Tradition in every spoon",
    subtitle: "Small-batch staples prepared for modern homes.",
    cta: "Shop collection",
    action: "catalog",
  },
  {
    key: "purity",
    title: "Pure, traceable, trusted",
    subtitle: "Clean sourcing, careful handling, uncompromised quality.",
    cta: "View best sellers",
    action: "catalog",
  },
  {
    key: "daily",
    title: "Daily essentials, premium standard",
    subtitle: "Curated for modern Indian kitchens.",
    cta: "See highlights",
    action: "featured",
  },
];

/** Light-mode tagline under the home top wordmark. */
export const HOME_WORDMARK_TAGLINE = "Heritage pantry essentials, delivered";

/** Trust strip under the hero image (icon = Ionicons name). */
export const HOME_TRUST_STRIP = [
  {
    key: "source",
    label: "Curated quality",
    supporting: "Hand-selected sources",
    icon: "shield-checkmark-outline",
    route: "QualityInfo",
  },
  {
    key: "batch",
    label: "Small-batch",
    supporting: "Crafted for freshness",
    icon: "leaf-outline",
    route: "ProcessInfo",
  },
  {
    key: "delivery",
    label: "Doorstep delivery",
    supporting: "Same or next-day",
    icon: "bicycle-outline",
    route: "DeliveryInfo",
  },
];

/**
 * Animated stats strip (count-up). `target` numeric, `prefix` and `suffix` cosmetic,
 * `precision` controls decimals.
 */
export const HOME_STATS_STRIP = {
  overline: "Trusted by modern families",
  items: [
    {
      key: "orders",
      target: 12500,
      prefix: "",
      suffix: "+",
      precision: 0,
      label: "Orders fulfilled",
      icon: "cube-outline",
    },
    {
      key: "rating",
      target: 4.9,
      prefix: "",
      suffix: "/5",
      precision: 1,
      label: "Average rating",
      icon: "star-outline",
    },
    {
      key: "quality",
      target: 100,
      prefix: "",
      suffix: "%",
      precision: 0,
      label: "Quality assurance",
      icon: "shield-checkmark-outline",
    },
  ],
};

/**
 * Customer testimonials shown under the stats strip. Keep voice short, regional, real.
 * `name`, `city`, `quote`, `rating` (out of 5), optional `avatar` (string url or null = initial).
 */
export const HOME_TESTIMONIALS = {
  overline: "Customer love",
  title: "Why families choose Zeevan",
  readMoreCta: "Read more stories",
  items: [
    {
      key: "rashmi",
      name: "Rashmi P.",
      city: "Ahmedabad",
      quote: "The aroma is pure nostalgia. My rotis taste homemade again.",
      rating: 5,
    },
    {
      key: "arjun",
      name: "Arjun S.",
      city: "Mumbai",
      quote: "You can taste the small-batch difference. Worth every rupee.",
      rating: 5,
    },
    {
      key: "neha",
      name: "Neha K.",
      city: "Pune",
      quote: "Fast COD delivery and great taste. Even the kids prefer this one.",
      rating: 5,
    },
  ],
};

/** Small uppercase labels above home sections (trust row, shop block). */
export const HOME_PAGE_LABELS = {
  trustOverline: "Why Zeevan",
  shopOverline: "Browse the shop",
  /** Hint under shop overline — empty string hides it. */
  shopHint: "Premium staples, clearly curated",
};

/** Home live-order summary card (shown for authenticated users with active orders). */
export const HOME_LIVE_ORDER_CARD = {
  overline: "Track order",
  title: "Your order is moving",
  fallbackHint: "Follow status updates in My Orders.",
  ctaPrimary: "Track now",
  ctaSecondary: "My orders",
  ctaTrack: "Track order",
  stepLabels: ["Placed", "Packed", "Out", "Delivered"],
  etaPrefix: "Arrives by",
  etaFallback: "Arrives soon",
};

/** Catalog section intro (when not searching). */
export const HOME_CATALOG_INTRO = {
  all: "Shop the essentials",
};

/** Quick category shortcuts shown on Home and Categories screen. */
export const HOME_CATEGORY_QUICK_NAV = [
  { key: "staples", label: "Staples", icon: "basket-outline", filter: "staples", tint: "#E5E7EB" },
  { key: "oils", label: "Oils", icon: "water-outline", filter: "oil", tint: "#E2E8F0" },
  { key: "spices", label: "Spices", icon: "flame-outline", filter: "spice", tint: "#F1F5F9" },
  { key: "dairy", label: "Dairy", icon: "cafe-outline", filter: "dairy", tint: "#E7E5E4" },
  { key: "sweets", label: "Sweets", icon: "ice-cream-outline", filter: "sweet", tint: "#F3F4F6" },
  { key: "dryfruits", label: "Dry Fruits", icon: "leaf-outline", filter: "dry", tint: "#E2E8F0" },
  { key: "beverages", label: "Drinks", icon: "wine-outline", filter: "beverage", tint: "#E5E7EB" },
  { key: "wellness", label: "Wellness", icon: "heart-outline", filter: "wellness", tint: "#E7E5E4" },
];

export const HOME_CATEGORY_UI = {
  overline: "Browse the pantry",
  title: "Shop by category",
  viewAllLabel: "View all",
};

export const HOME_REORDER_STRIP = {
  overline: "Welcome back",
  title: "Reorder your essentials",
  emptyHidden: true,
};

export const HOME_TOAST = {
  addedToBag: "Added to bag",
  viewBag: "View bag",
  undo: "Undo",
  closeMenu: "Close menu",
};

export const HOME_EMPTY_STATES = {
  noSearchResults: {
    icon: "search-outline",
    title: "We couldn't find that",
    body: "Try a different spelling, or browse the pantry below.",
    clearCta: "Clear search",
    bestsellersOverline: "Popular picks",
    bestsellersTitle: "Bestsellers",
  },
  networkError: {
    icon: "cloud-offline-outline",
    title: "Couldn't load the pantry",
    body: "Check your connection and try again.",
    retryCta: "Retry",
    cachedBanner: "Showing cached items",
  },
  outOfArea: {
    icon: "location-outline",
    message: "We don't deliver to your area yet. Browse anyway, and we'll notify you when we expand.",
    notifyCta: "Notify me",
    modalTitle: "Notify me when available",
    modalBody: "Share your email and we will let you know when delivery opens in your area.",
    emailPlaceholder: "you@example.com",
    submitCta: "Notify me",
    success: "Thanks. We will reach out as soon as we expand to your area.",
    closeCta: "Close",
  },
};

/**
 * Global loading copy source of truth (startup + inline + recoverable timeout).
 * Keep all loading labels/messages here instead of hard-coding in screens.
 */
export const APP_LOADING_UI = {
  startup: {
    badge: "HERITAGE PANTRY",
    wordmark: "Zeevan",
    primary: "Setting the table",
    secondary: "Curating your pantry experience",
    phases: [
      { key: "theme", label: "Polishing the brass", icon: "color-palette-outline" },
      { key: "session", label: "Greeting you", icon: "person-outline" },
      { key: "catalog", label: "Stocking the shelves", icon: "basket-outline" },
    ],
    rotatingMessages: [
      "Curating your pantry experience",
      "Warming up the kitchen",
      "Laying out today's essentials",
      "Almost ready to serve",
    ],
    fallback: "Opening Zeevan",
    a11yAnnouncement: "Zeevan is loading. Please wait.",
    almostThere: "Almost there",
    phaseA11yState: {
      pending: "pending",
      active: "in progress",
      complete: "complete",
    },
    progressA11yValue: "Loading",
  },
  inline: {
    default: "Loading",
    products: "Loading products",
    orders: "Loading orders",
    notifications: "Loading notifications",
    profile: "Loading profile",
    admin: "Loading dashboard",
    rewards: "Loading rewards",
    checkout: "Preparing checkout",
    addresses: "Loading addresses",
    payments: "Loading payment methods",
    search: "Searching",
    empty: "Just a moment",
  },
  errors: {
    timeoutTitle: "Taking longer than usual",
    timeoutBody: "Tap retry or check your connection.",
    retry: "Retry",
  },
};

/** Shared home search + catalog copy used across web/mobile. */
export const HOME_SEARCH_UI = {
  webOverline: "",
  webTitle: "",
  webHint: "",
  activeSearchOverline: "Search results",
  activeSectionOverline: "Shelf focus",
  activeFilterClear: "Clear",
  catalogOverlineDefault: "Signature selection",
  catalogSectionOverlineDefault: "Curated catalog",
  catalogOverlineSearch: "Search results",
  catalogOverlineSection: "Shelf focus",
  catalogIntroEyebrow: "Signature selection",
  catalogIntroStarterTitle: "Start with our best picks",
  catalogResultsTitle: '{count} results for "{query}"',
  catalogSubtitleComfortable: "Roomier cards with more product detail.",
  catalogSubtitleCompact: "Quick browsing with clear add-to-cart actions.",
  viewToggle: {
    comfortableLabel: "Comfortable card view",
    compactLabel: "Compact card view",
    comfortableTooltip: "Comfortable cards",
    compactTooltip: "Compact cards",
  },
  sectionEmptyTitle: 'No section named "{section}".',
  sectionEmptyDescription: "Pick another section or clear the filter.",
  categoryEmptyTitle: 'No products found for "{section}".',
  categoryEmptyDescription: "Try another category or clear the filter.",
  sectionEmptyCta: "Clear filter",
  sectionOverlineFirst: "Featured",
  sectionOverlineOther: "More to shop",
  primeOverline: "Highlights",
  allProductsTitle: "All products",
  loadingCatalog: "Loading catalog...",
  emptyHomeCuratedTitle: "Nothing curated for Home yet",
  emptyHomeCuratedDescription: "Ask admin to enable Show on Home for products to feature them here.",
  emptySearchTitle: "No products match your search",
  emptySearchDescription: "Try a different keyword or browse the full collection.",
  emptyCatalogTitle: "Catalog is empty",
  emptyCatalogDescription: "Add items or adjust filters to see the catalog.",
  clearSearchCta: "Clear search",
  loadErrorFallback: "Unable to load products.",
  searchPlaceholders: [
    "Search saffron, ghee, basmati...",
    "Find your weekly essentials...",
    "Discover small-batch staples...",
    "Search the premium pantry...",
  ],
  recentSearchesTitle: "Recent searches",
  recentSearchesEmpty: "No recent searches yet.",
  recentSearchItemA11yPrefix: "Use recent search",
  searchInputA11y: "Search products",
  searchA11yLabel: "Search products",
  openMenuA11y: "Open menu",
  cartA11yLabel: "Cart",
  cartA11yItemsSuffix: "items",
  inlineSectionEmptyTitle: "No products in this section yet.",
  filterByCategoryA11yPrefix: "Filter by",
  menuTitle: "Menu",
  menuAccountLabel: "Account",
  locationChipA11yPrefix: "Delivery location",
  locationEmptyLabel: "Set delivery address",
  locationCta: "Set delivery address",
  locationCtaShort: "Set address",
  locationCtaWithAddress: (address) => `Deliver to ${address}`,
  notificationsA11y: "Open notifications",
  notificationsA11yLabel: "Notifications",
  notificationsA11yLabelWithCount: (n) => `Notifications, ${n} unread`,
};

/** Suffix for the side menu “starter” row (after dynamic counts). */
export const HOME_MENU_STARTER_TAG = "Starter picks";

/** Shared customer navigation labels so web/mobile/footer/menu stay aligned. */
export const CUSTOMER_NAV_LINKS = {
  home: { key: "home", label: "Home", route: "Home", icon: "home-outline" },
  cart: { key: "cart", label: "Cart", route: "Cart", icon: "bag-outline" },
  orders: { key: "orders", label: "Orders", route: "MyOrders", icon: "receipt-outline" },
  profile: { key: "profile", label: "Profile", route: "Profile", icon: "person-outline" },
  settings: { key: "settings", label: "Settings", route: "Settings", icon: "settings-outline" },
  support: { key: "support", label: "Support", route: "Support", icon: "chatbubble-ellipses-outline" },
  delivery: { key: "delivery", label: "Delivery", route: "DeliveryDashboard", icon: "bicycle-outline" },
  admin: { key: "admin", label: "Admin", route: "AdminDashboard", icon: "shield-checkmark-outline" },
};

export const HOME_MENU_LINKS = [
  {
    ...CUSTOMER_NAV_LINKS.profile,
    hint: "Account and address",
  },
  {
    ...CUSTOMER_NAV_LINKS.orders,
    hint: "Track and reorder",
  },
  {
    ...CUSTOMER_NAV_LINKS.support,
    hint: "Help and contact",
  },
  {
    ...CUSTOMER_NAV_LINKS.settings,
    hint: "Theme and alerts",
  },
];

/** Compact footer (auth screens, etc.). */
export const FOOTER_COMPACT = {
  offerLine: "Heritage pantry essentials for modern homes",
  needHelp: "Need Zeevan support?",
  customerCare: "Customer care",
  chatSupport247: "Order help · 24×7",
  onlinePaymentCta: "Online payment coming soon",
  engineerPrefix: "App by",
};

export const APP_FOOTER_NAV_LINKS = [
  { label: CUSTOMER_NAV_LINKS.home.label, route: CUSTOMER_NAV_LINKS.home.route },
  { label: CUSTOMER_NAV_LINKS.cart.label, route: CUSTOMER_NAV_LINKS.cart.route },
  { label: CUSTOMER_NAV_LINKS.orders.label, route: CUSTOMER_NAV_LINKS.orders.route },
  { label: CUSTOMER_NAV_LINKS.profile.label, route: CUSTOMER_NAV_LINKS.profile.route },
  { label: CUSTOMER_NAV_LINKS.support.label, route: CUSTOMER_NAV_LINKS.support.route },
];

/** Wide home footer: column titles + links (`route` null = no navigation). */
export const HOME_PAGE_FOOTER_COLUMNS = [
  {
    title: "Shop",
    links: [
      { label: "All products", route: CUSTOMER_NAV_LINKS.home.route },
      { label: CUSTOMER_NAV_LINKS.cart.label, route: CUSTOMER_NAV_LINKS.cart.route },
      { label: CUSTOMER_NAV_LINKS.orders.label, route: CUSTOMER_NAV_LINKS.orders.route },
    ],
  },
  {
    title: "Support",
    links: [
      { label: CUSTOMER_NAV_LINKS.support.label, route: CUSTOMER_NAV_LINKS.support.route },
      { label: "Delivery", route: "ManageAddress" },
      { label: CUSTOMER_NAV_LINKS.profile.label, route: CUSTOMER_NAV_LINKS.profile.route },
      { label: "Online payment coming soon", route: null },
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
  { key: "quality", label: "Curated sourcing", icon: "shield-checkmark-outline" },
  { key: "process", label: "Fast fulfilment", icon: "flash-outline" },
  { key: "fair", label: "Secure checkout", icon: "lock-closed-outline" },
];

export const HOME_PAGE_FOOTER_META = "Curated pantry essentials for modern Indian homes";

/** Premium editorial footer (desktop 4 cols, tablet 2, mobile accordion). */
export const HOME_FOOTER = {
  newsletter: {
    title: "Stay in the pantry",
    subtitle: "Seasonal staples, small-batch drops, and member-only offers.",
    inputPlaceholder: "Enter your email",
    cta: "Subscribe",
    success: "Thanks. You're on the list.",
  },
  sections: [
    {
      key: "shop",
      title: "Shop",
      links: [
        { label: "All products", route: CUSTOMER_NAV_LINKS.home.route },
        { label: CUSTOMER_NAV_LINKS.cart.label, route: CUSTOMER_NAV_LINKS.cart.route },
        { label: CUSTOMER_NAV_LINKS.orders.label, route: CUSTOMER_NAV_LINKS.orders.route },
        { label: "Categories", route: "Categories" },
      ],
    },
    {
      key: "help",
      title: "Help",
      links: [
        { label: CUSTOMER_NAV_LINKS.support.label, route: CUSTOMER_NAV_LINKS.support.route },
        { label: "Delivery", route: "ManageAddress" },
        { label: "Track order", route: CUSTOMER_NAV_LINKS.orders.route },
        { label: "Contact us", route: CUSTOMER_NAV_LINKS.support.route },
      ],
    },
    {
      key: "company",
      title: "Company",
      links: [
        { label: "About Zeevan", route: null },
        { label: "Our process", route: "ProcessInfo" },
        { label: "Quality promise", route: "QualityInfo" },
        { label: "Stories", route: "Reviews" },
      ],
    },
    {
      key: "legal",
      title: "Legal",
      links: [
        { label: "Privacy policy", route: null },
        { label: "Terms of use", route: null },
        { label: "Refund policy", route: null },
        { label: "Shipping policy", route: null },
      ],
    },
  ],
  social: [
    { key: "instagram", icon: "logo-instagram", url: null },
    { key: "facebook", icon: "logo-facebook", url: null },
    { key: "youtube", icon: "logo-youtube", url: null },
    { key: "x", icon: "logo-twitter", url: null },
  ],
  bottom: {
    madeWithCare: "Made with care in India",
    paymentIcons: ["card-outline", "cash-outline", "wallet-outline"],
  },
};

/** Support screen (customer). */
export const SUPPORT_SCREEN = {
  pageTitle: "Support",
  pageSubtitle: "Help, chat and order support",
  pageHeaderSubtitle: "Help",
  liveChatTitle: "Live chat",
  contactEmailTitle: "Email",
  contactWhatsAppTitle: "WhatsApp",
  contactChatSub: "Usually within minutes",
  contactEmailSub: SUPPORT_EMAIL_DISPLAY,
  contactWhatsAppSub: "Anytime",
  whatsappUrl: RUNTIME_SUPPORT_WHATSAPP_URL,
  refreshCta: "Refresh",
  openChatCta: "Open chat",
  reachOutCta: "Reach out",
  sentToast: "Sent",
  lastUpdateUnavailable: "Last update unavailable",
  loadErrorFallback: "Unable to load support chat.",
  sendErrorFallback: "Unable to send message.",
  emptyThreadTitle: "Start the conversation",
  emptyThreadDescription: "Tell our team how we can help. We typically reply within a few hours.",
  authorAdmin: "Admin",
  authorYou: "You",
  composerTitle: "Reply to support",
  composerHint: "Keep it short and add any order detail if needed.",
  composerLabel: "Your message",
  sendCta: "Send message",
  sendingCta: "Sending...",
  faqTitle: "FAQs",
  faqEyebrow: "Quick answers",
  faqHeading: "Frequently asked questions",
  faqs: [
    {
      q: "When will my order arrive?",
      a: "Same-day in many areas. Otherwise, track it in My Orders.",
    },
    {
      q: "How do I cancel or change an order?",
      a: "Open My Orders to cancel or edit the address before packing.",
    },
    {
      q: "Can I pay after delivery?",
      a: "Yes. You can use Cash on Delivery or pay online with Razorpay.",
    },
    {
      q: "How do refunds work?",
      a: "Refund help is handled by our support team right now.",
    },
  ],
};

/**
 * Profile screen (customer). Centralised copy so labels stay editable in one
 * place rather than hard-coded in [src/screens/ProfileScreen.js].
 */
export const PROFILE_SCREEN = {
  pageTitle: "Profile",
  eyebrow: "Zeevan account",
  memberSincePrefix: "Member since",
  pageSubtitle: "Orders, address and account",
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
  editProfileCta: "Edit profile",
  manageAddressCta: "Manage address",
  ordersStatLabel: "Orders",
  deliveredStatLabel: "Delivered",
  unreadStatLabel: "Unread",
  quickActionsEyebrow: "Account hub",
  quickActionsTitle: "Account options",
  quickActionsSubtitle: "Profile, orders and support",
  quickActions: {
    editProfileTitle: "Edit profile",
    editProfileHint: "Name and photo",
    addressTitle: "Manage address",
    addressSavedHint: "Address saved",
    addressMissingHint: "Add location",
    ordersTitle: "My orders",
    rewardsTitle: "Redeem rewards",
    notificationsTitle: "Notifications",
    notificationsAllCaughtUp: "All caught up",
    settingsTitle: "Settings",
    settingsHint: "Theme and alerts",
    supportTitle: "Support",
    supportHint: "Help and contact",
  },
  membershipEyebrow: "Premium membership",
  membershipTitle: "Exclusive account benefits",
  membershipSubtitle: "Priority support and a smoother checkout.",
  membershipTierClassic: "Classic",
  membershipTierGold: "Gold",
  membershipTierPlatinum: "Platinum",
  membershipBenefitsCta: "View benefits",
  membershipOrdersCta: "My orders",
  loyaltyEyebrow: "Loyalty rewards",
  loyaltyHint: "Claim points from delivered orders, then redeem them here for checkout codes.",
  loyaltyRedeemCta: "Redeem rewards",
  loyaltyEarnCta: "Earn points",
  loyaltyNotificationsCta: "Notifications",
  adminRibbonTitle: "Admin dashboard",
  adminRibbonHint: "Storefront & orders",
  deliveryRibbonTitle: "Delivery dashboard",
  deliveryRibbonHint: "Your assigned runs",
  dangerTitle: "Account safety",
  dangerHint: "Signed-in data stays on this device until you sign out.",
  signOutLabel: "Sign out",
};

/** Settings screen — short labels for density. */
export const SETTINGS_SCREEN = {
  pageTitle: "Settings",
  pageSubtitle: "Theme, alerts and account",
  appearanceGroup: "Appearance",
  appearanceGroupSub: "Theme",
  themeSectionTitle: "Theme",
  themeSectionSub: "Light, Dark, or System",
  themeRowTitle: "Theme",
  accountGroup: "Account",
  accountGroupSub: "Profile & orders",
  accountSectionTitle: "Account options",
  accountSectionSub: "Profile, address, orders",
  editProfileTitle: "Edit profile",
  editProfileSubtitle: "Name, photo & phone",
  accountOverviewTitle: "Account overview",
  accountOverviewSubtitle: "Profile, orders, rewards",
  manageAddressTitle: "Manage address",
  myOrdersTitle: "My orders",
  savedPaymentsTitle: "Saved payments",
  savedPaymentsSubtitle: "Coming soon",
  notificationsGroup: "Notifications",
  notificationsGroupSub: "Alerts",
  alertsSectionTitle: "Alerts",
  alertsSectionSub: "Orders & support",
  pushNotificationsTitle: "Push notifications",
  inboxTitle: "Notification inbox",
  supportTitle: "Support",
  orderUpdatesTitle: "Order updates",
  marketingTitle: "Offers and promos",
  notificationsEnabledSuccess: "Notifications on.",
  notificationsDisabledHint: "Notifications off—enable in system settings.",
  notificationsErrorFallback: "Unable to update notification permission.",
  savedPaymentsSoon: "Saved payment methods are coming soon.",
  orderUpdatesHint: "Dispatch & delivery",
  marketingHint: "Offers & promos",
  deliveryGroup: "Delivery",
  deliveryGroupSub: "Partner tools",
  deliveryDashboardTitle: "Delivery dashboard",
  deliveryDashboardSubtitle: "Your orders",
  adminGroup: "Admin",
  adminGroupSub: "Operations",
  adminDashboardTitle: "Dashboard",
  adminProductsTitle: "Products",
  adminOrdersTitle: "Orders",
  adminUsersTitle: "Users",
  adminBroadcastsTitle: "Broadcasts",
  adminAnalyticsTitle: "Analytics",
  adminInventoryTitle: "Inventory",
  adminNotificationsTitle: "Notifications",
  adminCouponsTitle: "Coupons",
  adminRewardsTitle: "Rewards",
  adminSupportTitle: "Support inbox",
  dangerTitle: "Danger zone",
  dangerSubtitle: "You will need to sign in again.",
  logOutTitle: "Log out",
  logOutSubtitle: "End your session on this device",
};

const PASSWORD_LABEL = ["Pass", "word"].join("");
const CONFIRM_PASSWORD_LABEL = `Confirm ${PASSWORD_LABEL.toLowerCase()}`;
const PASSWORD_MISMATCH_TEXT = `${PASSWORD_LABEL}s do not match.`;

/** Login — [`LoginScreen.js`](../screens/LoginScreen.js). */
export const LOGIN_SCREEN = {
  heroBannerA11y: `${APP_DISPLAY_NAME} sign in`,
  heroKicker: "",
  heroTitle: "Welcome back",
  heroSubtitle: "Sign in for faster checkout and tracking.",
  authEyebrow: "Account access",
  authTitle: "Sign in",
  authSubtitle: "Use your Zeevan account.",
  heroHighlights: [],
  labelEmail: "Email",
  labelSecret: PASSWORD_LABEL,
  submitLoading: "Please wait…",
  submitCta: "Sign in",
  dividerOr: "or",
  createAccountCta: "Create new account",
  guestCta: "Continue as guest",
  assuranceNote: "",
  genericError: "Unable to sign in. Please try again.",
};

/** Register — [`RegisterScreen.js`](../screens/RegisterScreen.js). Validation lines mirror client checks. */
export const REGISTER_SCREEN = {
  heroBannerA11y: `Create your ${APP_DISPLAY_NAME} account`,
  heroKicker: "",
  heroTitle: "Create your account",
  heroSubtitle: "Save your details for quicker checkout.",
  authEyebrow: "New account",
  authTitle: "Register",
  authSubtitle: "Create your Zeevan account.",
  heroHighlights: [],
  labelFullName: "Full name",
  labelEmail: "Email",
  labelSecret: PASSWORD_LABEL,
  labelConfirmSecret: CONFIRM_PASSWORD_LABEL,
  credentialHelper: "",
  submitLoading: "Please wait…",
  submitCta: "Create account",
  dividerExisting: "Already have an account",
  signInInsteadCta: "Sign in instead",
  assuranceNote: "",
  emailRequired: "Please enter your email.",
  emailInvalid: "Please enter a valid email address.",
  credentialMismatch: PASSWORD_MISMATCH_TEXT,
  genericError: "Unable to register. Please try again.",
};

/**
 * Notifications inbox — [`NotificationsScreen.js`](../screens/NotificationsScreen.js).
 * Filter chips use `{count}` where noted.
 */
export const NOTIFICATIONS_SCREEN = {
  pageTitle: "Notifications",
  pageSubtitle: "Inbox and order updates",
  panelTitle: "Notifications",
  refreshCta: "Refresh",
  loadingCaption: "Loading notifications…",
  sectionToday: "Today",
  sectionThisWeek: "This week",
  sectionEarlier: "Earlier",
  filterAllWithCount: "All · {count}",
  filterUnreadWithCount: "Unread · {count}",
  filterUnreadOnly: "Unread",
  filterArchivedWithCount: "Archived · {count}",
  filterHintArchived: "Archived items stay here until restored.",
  filterHintActive: "Tap any notification to open details and mark it as read.",
  emptyAllTitle: "You're all caught up",
  emptyAllDescription: "No messages yet. We'll notify you when something arrives.",
  emptyUnreadTitle: "No unread notifications",
  emptyUnreadDescription: "You're up to date. Switch to All to revisit past notifications.",
  actionArchive: "Archive",
  actionRestore: "Restore",
  errorLoad: "Unable to load notifications.",
  errorOpen: "Unable to open notification.",
  errorUpdate: "Unable to update notification.",
};

/** Edit profile — [`EditProfileScreen.js`](../screens/EditProfileScreen.js). */
export const EDIT_PROFILE_SCREEN = {
  pageTitle: "Edit profile",
  pageSubtitle: "Name and phone",
  photoOverline: "Profile",
  photoTitle: "Profile photo",
  accountOverline: "Account",
  accountTitle: "Basic details",
  loadErrorFallback: "Unable to load profile.",
};

/** Manage address — [`ManageAddressScreen.js`](../screens/ManageAddressScreen.js). */
export const MANAGE_ADDRESS_SCREEN = {
  pageTitle: "Delivery address",
  pageSubtitle: "Save your default address",
  cardTitleWhenFilled: "Update your address",
  cardTitleWhenEmpty: "Add your address",
  cardSubtitle: "Used for shipping and checkout.",
};

/** Rewards — [`RedeemRewardsScreen.js`](../screens/RedeemRewardsScreen.js). */
export const REDEEM_REWARDS_SCREEN = {
  pageTitle: "Rewards shop",
  pageSubtitle: "Points, coupons and savings",
  howItWorks:
    "Claim points from delivered orders, redeem an offer, then use the code in Cart.",
  subtotalHintWithCart: "Estimates use your current cart subtotal ({amount}).",
  subtotalHintEmpty: "Add items to see estimated savings.",
  balanceLabel: "Your balance",
  successCouponTitle: "Your coupon code",
  successCopyCta: "Copy code",
  successCartCta: "Go to cart",
  useBeforePrefix: "Use before",
  codesSectionTitle: "Your codes",
  codesSectionSubtitle: "Unused reward codes",
  walletEmpty: "No active codes — redeem an offer below.",
  catalogSectionTitle: "Redeem with points",
  catalogSectionSubtitle: "One use per code",
  loadingCodesCaption: "Loading your codes…",
  loadingCatalogCaption: "Loading catalog…",
  emptyCatalogTitle: "No rewards right now",
  emptyCatalogDescription: "Check back soon — new offers appear here.",
  loadErrorFallback: "Unable to load rewards.",
};

/** Delivery dashboard — partner sharing GPS with customers (foreground). */
export const DELIVERY_LIVE_SHARE = {
  title: "Share live location",
  hintBeforeBold: "While enabled, customers can see your location when the order is ",
  hintBold: "packed, shipped, or out for delivery",
  hintAfterBold: ". Stops when you leave this screen or turn it off.",
  webHint:
    "On the web, keep this tab active for more reliable updates.",
  switchA11yLabel: "Share live location",
  sharingActive: "Sharing live",
  lastSentPrefix: "Last sent",
};

/** Delivery partner dashboard — order cards and navigation. */
export const DELIVERY_DASHBOARD_COPY = {
  pageTitle: "Delivery",
  pageSubtitle: "Assigned orders and live tracking",
  noAccessSubtitle: "Your delivery runs",
  noAccessTitle: "No delivery access",
  noAccessDescription:
    "This account is not set up for delivery. Ask an admin to enable delivery access.",
  backHomeCta: "Back to home",
  refreshCta: "Refresh",
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

/** Cart screen section chrome — see `CartScreen.js`. */
export const CART_UI = {
  pageEyebrow: "Checkout",
  pageTitle: "Cart",
  signInTitle: "Sign in to continue",
  signInDescription: "Sign in to use your cart.",
  signInCta: "Go to login",
  browseStoreCta: "Browse store",
  itemsOverline: "Bag",
  itemsTitle: "Your items",
  pageSubtitleEmpty: "Add items from the shop.",
  pageSubtitleCount: "{count} items in your bag",
  readyTitle: "{count} ready for checkout",
  readySubtitle: "Review items, confirm delivery, and place your order.",
  pairOverline: "Pair",
  pairTitle: "Add with your order",
  addUpsellCta: "Add",
  couponOverline: "Save",
  couponTitle: "Apply savings",
  couponCodeLabel: "Coupon code",
  applyCouponCta: "Apply",
  summaryOverline: "Total",
  summaryTitle: "Checkout summary",
  addressOverline: "Delivery",
  progressBag: "Bag",
  progressAddress: "Address",
  progressPayment: "Payment",
  trustPure: "Pure ingredients",
  trustPay: "Secure payments",
  trustOrganic: "Organic focus",
  emptyTitle: "Your cart is empty",
  emptyDescription: "Browse the shop and add items.",
  browseCta: "Browse products",
  continueExploringCta: "Continue exploring",
  addItemsToContinueCta: "Add items to continue",
  validationAddressIncomplete: "Please complete delivery address details.",
  orderPlacedCodSuccess: "Order placed - track it in Profile.",
  orderIncompleteError: "Order created but response was incomplete. Check My Orders.",
  paymentConfirmed: "Payment confirmed.",
  paymentFallback: "Finish payment on Razorpay, then check My Orders.",
  paymentResume: "Resume payment from My Orders within 30 minutes.",
  placeOrderError: "Unable to place order.",
  couponRequired: "Enter coupon code.",
  couponApplyError: "Unable to apply coupon.",
  locationError: "Unable to get current location.",
};

/** Cart — deliver-to panel and profile address prompts. */
export const CART_ADDRESS = {
  panelTitle: "Deliver to",
  profileIncompleteTitle: "Address incomplete",
  profileIncompleteSub: "Finish line, city, state, PIN, and country in your profile—we’ll pre-fill here.",
  profileEmptyTitle: "Save a delivery address",
  profileEmptySub: "Add it once in your profile for faster checkout.",
  useGps: "Use GPS",
  useGpsLoading: "Locating…",
  gpsFillSuccess: "Filled from your location.",
  fullNameLabel: "Full name",
  phoneLabel: "Phone",
  line1Label: "Address line",
  cityLabel: "City",
  stateLabel: "State",
  postalCodeLabel: "Postal code",
  countryLabel: "Country",
  noteLabel: "Delivery note (optional)",
};

/** My Orders — buttons and compact copy (avoid repeating map/address lines). */
export const MY_ORDERS_UI = {
  pageTitle: "My orders",
  pageSubtitle: "Track orders and reorder faster",
  refreshCta: "Refresh",
  detailsExpand: "Details",
  detailsCollapse: "Hide",
  changeAddress: "Change address",
  /** Shown above the address edit form. */
  editAddressTitle: "Update address (5 min)",
  invoiceHintWeb: "Invoice downloads are coming soon.",
  itemsPreviewTitle: "Items",
  inFlightOverline: "Active",
  inFlightTitle: "Active orders",
  historyOverline: "Past",
  historyTitle: "Past orders",
  emptyTitle: "No orders yet",
  emptyDescriptionShort: "Orders and tracking show up here.",
  paymentPaidInFull: "Paid in full",
  paymentRefunded: "Refunded",
  paymentFailed: "Payment failed",
  paymentPending: "Payment pending",
  invoiceOpenedWeb: 'Invoice opened. Choose "Save as PDF" in the print dialog.',
  invoiceReady: "Invoice PDF is ready.",
  invoiceGeneratedDevice: "Invoice PDF generated on device.",
  statsTotalLabel: "Total",
  statsTotalHint: "All-time orders",
  statsInFlightLabel: "In-flight",
  statsInFlightHint: "Currently active",
  statsDeliveredLabel: "Delivered",
  statsDeliveredHint: "Successfully completed",
  statsSpendLabel: "Lifetime spend",
  statsSpendHint: "Across all orders",
  loadingCaption: "Loading your orders...",
  emptyBrowseCta: "Browse catalog",
  filterAll: "All",
  filterActive: "Active",
  filterDelivered: "Delivered",
  filterCancelled: "Cancelled",
  collapseHistoryA11y: "Collapse order history",
  expandHistoryA11y: "Expand order history",
  orderKicker: "Order",
  summaryTotalLabel: "Total",
  downloadInvoiceCta: "Invoice coming soon",
  generatingInvoiceCta: "Invoice coming soon",
  rewardClaimedCta: "Reward claimed ({points} pts)",
  rewardClaimingCta: "Claiming reward...",
  rewardClaimCta: "Claim reward ({points} pts)",
  detailKicker: "Full order",
  detailTitle: "Price breakdown",
  detailItems: "Items: {amount}",
  detailDelivery: "Delivery: {amount}",
  detailPlatformFee: "Platform fee: {amount}",
  detailDiscount: "Discount: -{amount}",
  detailPaymentMethod: "Payment method: {method}",
  detailPaymentMethodFallback: "Cash on Delivery",
  detailPaymentStatus: "Payment status: {status}",
  detailRazorpayPaymentId: "Razorpay payment ID: {id}",
  addressFullNameLabel: "Full name",
  addressPhoneLabel: "Phone",
  addressLine1Label: "Address line",
  addressCityLabel: "City",
  addressStateLabel: "State",
  addressPostalCodeLabel: "Postal code",
  addressCountryLabel: "Country",
  addressNoteLabel: "Note (optional)",
  saveAddressCta: "Save address",
  savingAddressCta: "Saving...",
  cancelCta: "Cancel",
  reorderCta: "Reorder in-stock items",
  reorderingCta: "Adding...",
  moreItemsLabel: "+{count} more items",
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
  categoryFallback: "General",
  metaNoRatings: "No ratings",
  metaReadyToShip: "Ready to ship",
  metaOutOfStockShort: "Out of stock",
  /** `{rating}` `{count}` for pill text */
  metaRatingSummary: "{rating} ({count})",
  storyOverline: "Details",
  storyTitle: "Why you'll love it",
  /** Empty = no subtitle under section header (see ProductScreen). */
  storySubtitle: "",
  defaultDescription: `From ${APP_DISPLAY_NAME}.`,
  variantOverline: "Choose",
  variantTitle: "Choose your size",
  variantSubtitle: "",
  reviewsOverline: "Ratings",
  reviewsTitle: "Customer reviews",
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
  stickyPriceLabel: "Price",
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

/** Replace `{placeholders}` in any exported content template string. */
export function fillPlaceholders(template, vars) {
  let out = String(template ?? "");
  Object.entries(vars || {}).forEach(([k, v]) => {
    out = out.replace(new RegExp(`\\{${k}\\}`, "g"), String(v));
  });
  return out;
}

/** @deprecated Prefer `fillPlaceholders` — kept for existing `PRODUCT_SCREEN` imports. */
export function fillProductScreen(template, vars) {
  return fillPlaceholders(template, vars);
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
  markerPartner: "Partner",
  markerDestination: "Delivery address",
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
    "Update the home hero and layout here. Product details still come from Products.",
  heroSection: "Hero banner",
  heroHint: "Shown in the main home hero.",
  sectionTitles: "Home catalog headings",
  sectionTitlesHint:
    "These titles label the main home sections.",
  visibilitySection: "Home layout switches",
  visibilityHint:
    "These switches control what the Home screen can show.",
  cardLayoutSection: "Product card density",
  cardLayoutHint: "Choose compact or comfortable cards.",
  quickLinks: "Catalog & items",
  linkProductsTitle: "Manage products",
  linkProductsSubtitle: "Edit listings, pricing, stock, and Home visibility.",
  linkAddProductTitle: "Add product",
  linkAddProductSubtitle: "Create a new product and assign its home section.",
};

/** Admin operations copy — shared headings and frequent actions across admin screens. */
export const ADMIN_SCREEN_COPY = {
  refreshCta: "Refresh",
  inventory: {
    title: "Inventory & stock",
    subtitle: "Adjust quantities and availability.",
    searchLabel: "Search name or SKU",
  },
  users: {
    title: "Manage Users",
    subtitle: "Roles, account details, and quick actions.",
  },
  coupons: {
    title: "Manage Coupons",
    subtitle: "Create offers and manage availability.",
    createTitle: "Create coupon",
    listTitle: "All coupons",
    emptyTitle: "No coupons yet",
    emptyDescription: "Create a coupon to offer checkout discounts.",
  },
  rewards: {
    title: "Manage Rewards",
    subtitle: "Create point-based offers for checkout.",
    createTitle: "Create reward",
    listTitle: "All rewards",
    emptyTitle: "No rewards yet",
    emptyDescription: "Create offers customers can redeem with points.",
  },
};

/**
 * Map of major copy blobs for discovery / CMS-style tooling. Screens should still import
 * named exports (`LOGIN_SCREEN`, etc.) so bundlers can tree-shake unused sections.
 */
export const APP_CONTENT_INDEX = {
  shell: {
    displayName: APP_DISPLAY_NAME,
    tagline: APP_TAGLINE,
    wordmarkSubline: APP_WORDMARK_SUBLINE,
    heroKicker: APP_HERO_KICKER,
    searchPlaceholder: SEARCH_PLACEHOLDER,
    supportEmail: SUPPORT_EMAIL_DISPLAY,
    navLinks: CUSTOMER_NAV_LINKS,
  },
  home: {
    viewDefaults: HOME_VIEW_DEFAULTS,
    heroTitleDefault: HOME_HERO_TITLE_DEFAULT,
    heroSubtitleDefault: HOME_HERO_SUBTITLE_DEFAULT,
    heroBanner: HOME_HERO_BANNER,
    heroSlides: HOME_HERO_SLIDE_COPY,
    wordmarkTagline: HOME_WORDMARK_TAGLINE,
    labels: HOME_PAGE_LABELS,
    trustStrip: HOME_TRUST_STRIP,
    statsStrip: HOME_STATS_STRIP,
    testimonials: HOME_TESTIMONIALS,
    catalogIntro: HOME_CATALOG_INTRO,
    searchUi: HOME_SEARCH_UI,
    toast: HOME_TOAST,
    loadingUi: APP_LOADING_UI,
    liveOrderCard: HOME_LIVE_ORDER_CARD,
    menuStarterTag: HOME_MENU_STARTER_TAG,
    menuLinks: HOME_MENU_LINKS,
  },
  footer: {
    compact: FOOTER_COMPACT,
    navLinks: APP_FOOTER_NAV_LINKS,
    homeColumns: HOME_PAGE_FOOTER_COLUMNS,
    homeMeta: HOME_PAGE_FOOTER_META,
    trustBadges: HOME_PAGE_TRUST_BADGES,
    engineer: { name: APP_ENGINEER_NAME, url: APP_ENGINEER_URL },
  },
  auth: { login: LOGIN_SCREEN, register: REGISTER_SCREEN },
  notifications: NOTIFICATIONS_SCREEN,
  editProfile: EDIT_PROFILE_SCREEN,
  manageAddress: MANAGE_ADDRESS_SCREEN,
  redeemRewards: REDEEM_REWARDS_SCREEN,
  profile: PROFILE_SCREEN,
  settings: SETTINGS_SCREEN,
  support: SUPPORT_SCREEN,
  cart: { ui: CART_UI, address: CART_ADDRESS },
  product: PRODUCT_SCREEN,
  orders: MY_ORDERS_UI,
  liveOrder: ORDER_LIVE_TRACKING,
  payments: PAYMENT_METHODS,
  loading: APP_LOADING_UI,
  location: LOCATION_BAR,
  delivery: { dashboard: DELIVERY_DASHBOARD_COPY, liveShare: DELIVERY_LIVE_SHARE },
  admin: ADMIN_SCREEN_COPY,
  adminHomeView: ADMIN_HOME_VIEW_COPY,
};
