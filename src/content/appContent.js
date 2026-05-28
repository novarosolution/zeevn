/**
 * Central customer-facing copy for Zeevan — edit here instead of scattering strings in screens.
 *
 * **Brand & shell:** `APP_DISPLAY_NAME`, `APP_TAGLINE`, `SEARCH_PLACEHOLDER`, `SUPPORT_EMAIL_DISPLAY`, footers, nav.
 * **Home:** `HOME_VIEW_DEFAULTS`, `HOME_*` marketing blocks, stats, testimonials, catalog intros.
 * **Commerce:** `CART_*`, `PRODUCT_SCREEN`, `MY_ORDERS_UI`, `ORDER_LIVE_TRACKING`, `PAYMENT_METHODS`.
 * **Account:** `PROFILE_SCREEN`, `SETTINGS_SCREEN`, `SUPPORT_SCREEN`, `LOCATION_BAR`.
 * **Auth:** `AUTH_SCREEN` (`AuthShell`), `APP_CONTENT_AUTH` (legacy), aliases `LOGIN_SCREEN`, `REGISTER_SCREEN`.
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

/** Rotating hero strings for web header search (premium shell). */
export const SEARCH_PLACEHOLDERS = [
  SEARCH_PLACEHOLDER,
  "Search ghee, atta & oils…",
  "Find spices, rice & pickles…",
  "Discover small-batch staples…",
];

/** Accessibility + chrome copy for [`WebAppHeader`](src/components/WebAppHeader.js). */
export const WEB_HEADER_UI = {
  skipToContentLabel: "Skip to main content",
  primaryNavigationLabel: "Primary",
  searchShortcutApple: "⌘K",
  searchShortcutWin: "Ctrl+K",
  locationNoAddressHint: "Set your delivery location",
  locationWithAddressHint: "Delivery address",
  locationManageAction: "Manage addresses",
};

/** Full-screen / overlay search chrome. */
export const SEARCH_OVERLAY_UI = {
  placeholder: "Search the pantry…",
  searchA11y: "Search products",
  closeA11y: "Close search",
  recentTitle: "Recent",
  trendingTitle: "Trending",
  productsTitle: "Products",
};

/** 404 / not found page. */
export const NOT_FOUND_SCREEN = {
  code: "404",
  title: "This page took a detour.",
  primaryCta: "Back to home",
  secondaryCta: "Browse shop",
  stripTitle: "While you're here…",
};

/** Suggested trending queries (header popover overlay). */
export const TRENDING_SEARCHES = [
  "A2 ghee",
  "cold pressed oil",
  "aged basmati",
  "single origin spices",
];

export const SUPPORT_EMAIL_DISPLAY = RUNTIME_SUPPORT_EMAIL;
export const APP_META = {
  brand: {
    name: "Zeevan",
    legalName: "Zeevan Pantry Private Limited",
    logo: "/seo/icon-512.png",
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
    ogImage: "/seo/og-image.png",
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
    notifications: { title: "Notifications", noindex: true, canonical: "/notifications" },
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
    shipping: { title: "Shipping Policy", canonical: "/shipping" },
    returns: { title: "Returns & Refunds", canonical: "/returns" },
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
  dealsRail: [],
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

/** Trust badges used in footer + About (no longer a home mid-page strip). */
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

/** Thin commerce banner shown above home catalog sections. */
export const HOME_TRUST_BANNER = "Free shipping over ₹1,499 · Same-day in Ahmedabad · 30-day returns";

/**
 * Animated stats strip (count-up). `target` numeric, `prefix` and `suffix` cosmetic,
 * `precision` controls decimals.
 * @deprecated for Home usage; keep for About page.
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
 * @deprecated for Home usage; keep for About + PDP social proof.
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
  { key: "dryfruits", label: "Dry fruits", icon: "leaf-outline", filter: "dry", tint: "#E2E8F0" },
  { key: "beverages", label: "Drinks", icon: "wine-outline", filter: "beverage", tint: "#E5E7EB" },
  { key: "snacks", label: "Snacks", icon: "fast-food-outline", filter: "snack", tint: "#F3F4F6" },
  { key: "wellness", label: "Wellness", icon: "heart-outline", filter: "wellness", tint: "#E7E5E4" },
];

export const HOME_CATEGORY_UI = {
  overline: "Browse the pantry",
  title: "Shop by category",
  viewAllLabel: "View all",
};

export const HOME_REORDER_STRIP = {
  overline: "Order again",
  title: "Your usual basket",
  subtitle: "Restock your weekly essentials",
  seeAll: "See all",
  restockLabel: "Time to restock",
  emptyHidden: true,
};

export const HOME_TOAST = {
  addedToBag: "Added to bag",
  viewBag: "View bag",
  undo: "Undo",
  closeMenu: "Close menu",
};

export const HOME_OFFERS_BAND = {
  overline: "Replenish",
  title: "15% off your favourite restocks",
  subtitle: "When you order an item you've bought twice before.",
  cta: "Open my pantry",
};

export const HOME_DEALS_RAIL = {
  title: "Deals",
  subtitle: "Limited-time pantry picks.",
  endingSoon: "Ending soon",
  seeAll: "See all deals",
  savePrefix: "Save",
  countdownPrefix: "Ends in",
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

/** Product listing (search / category browse) — filters, sort, empty states. */
export const PLP_UI = {
  breadcrumbHome: "Home",
  breadcrumbCategories: "Categories",
  breadcrumbSearch: "Search results",
  breadcrumbJoiner: " › ",
  categoryPageTitle: "Shop by category",
  categoryHubBreadcrumb: "Home › Categories",
  introTitle: "Find something delicious",
  introBody: "Use the search field in the header to look up products, or browse by category from the grid below.",
  introCta: "Go home",
  filtersCta: "Filters",
  filtersSheetTitle: "Filters",
  sortCta: "Sort",
  sortSheetTitle: "Sort by",
  activeFiltersLabel: "Active filters",
  sectionCategory: "Category",
  sectionType: "Product type",
  sectionAvailability: "Availability",
  inStockOnly: "In stock only",
  clearFiltersCta: "Clear filters",
  noMatchesTitle: "No matches",
  noMatchesBody: "Try adjusting filters or broaden your search.",
  resultsForQuery: (q) => `Results for “${q}”`,
  browseCategoryTitle: (label) => (label ? `Browse ${label}` : "Browse category"),
  sortFeatured: "Featured",
  sortNewest: "Newest",
  sortPriceAsc: "Price · Low to high",
  sortPriceDesc: "Price · High to low",
  sortRating: "Best rated",
  sortPopular: "Most popular",
  sortName: "Name A–Z",
  clearAllFiltersCta: "Clear all",
  sectionPrice: "Price",
  sectionSize: "Size",
  sectionColor: "Color",
  sectionBrand: "Brand",
  sectionRating: "Rating",
  sectionDiscount: "Discount",
  discountOnly: "On sale only",
  priceMinLabel: "Min",
  priceMaxLabel: "Max",
  priceUnderTemplate: (amount) => `Under ₹${amount}`,
  priceOverTemplate: (amount) => `Over ₹${amount}`,
  ratingChipTemplate: (stars) => `${stars}+ stars`,
  searchSuggestionsLabel: "Try searching for",
  popularCategoriesLabel: "Popular categories",
  loadMoreCta: "Load more",
  loadMoreShowing: (shown, total) => `Showing ${shown} of ${total}`,
  categoryEmpty: {
    title: "No products in this category yet",
    body: "We're stocking up — browse other categories in the meantime.",
    browseCta: "Browse categories",
  },
  chipRemoveA11y: "Remove filter",
  filterSheetCloseA11y: "Close filters",
  sortSheetCloseA11y: "Close sort options",
  /** Stack header when no query/category context yet */
  screenTitleDefault: "Search",
};

/** Suffix for the side menu “starter” row (after dynamic counts). */
export const HOME_MENU_STARTER_TAG = "Starter picks";

/** Shared customer navigation labels so web/mobile/footer/menu stay aligned. */
export const CUSTOMER_NAV_LINKS = {
  home: { key: "home", label: "Home", route: "Home", icon: "home-outline" },
  cart: { key: "cart", label: "Cart", route: "Cart", icon: "bag-outline" },
  orders: { key: "orders", label: "Orders", route: "Profile", accountScreen: "Orders", icon: "receipt-outline" },
  profile: { key: "profile", label: "Profile", route: "Profile", icon: "person-outline" },
  settings: { key: "settings", label: "Settings", route: "Profile", accountScreen: "AccountProfile", icon: "settings-outline" },
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
  { ...CUSTOMER_NAV_LINKS.orders },
  { ...CUSTOMER_NAV_LINKS.profile },
  { ...CUSTOMER_NAV_LINKS.support },
];

/** Wide home footer: column titles + links (`route` null = no navigation). */
export const HOME_PAGE_FOOTER_COLUMNS = [
  {
    title: "Shop",
    links: [
      { label: "All products", route: CUSTOMER_NAV_LINKS.home.route },
      { label: CUSTOMER_NAV_LINKS.cart.label, route: CUSTOMER_NAV_LINKS.cart.route },
      { ...CUSTOMER_NAV_LINKS.orders },
    ],
  },
  {
    title: "Support",
    links: [
      { label: CUSTOMER_NAV_LINKS.support.label, route: CUSTOMER_NAV_LINKS.support.route },
      { label: "Delivery", route: "Profile", accountScreen: "Addresses" },
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
        { ...CUSTOMER_NAV_LINKS.orders },
        { label: "Categories", route: "Categories" },
      ],
    },
    {
      key: "help",
      title: "Help",
      links: [
        { label: CUSTOMER_NAV_LINKS.support.label, route: CUSTOMER_NAV_LINKS.support.route },
        { label: "FAQ", route: "Faq" },
        { label: "Contact", route: "Contact" },
        { label: "Delivery", route: "Profile", accountScreen: "Addresses" },
        { ...CUSTOMER_NAV_LINKS.orders, label: "Track order" },
      ],
    },
    {
      key: "company",
      title: "Company",
      links: [
        { label: "About Zeevan", route: "About" },
        { label: "Our process", route: "ProcessInfo" },
        { label: "Quality promise", route: "QualityInfo" },
        { label: "Journal", route: "Blog" },
      ],
    },
    {
      key: "legal",
      title: "Legal",
      links: [
        { label: "Privacy policy", route: "Privacy" },
        { label: "Terms of use", route: "Terms" },
        { label: "Refund policy", route: "ReturnsPolicy" },
        { label: "Shipping policy", route: "ShippingPolicy" },
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

/** Account overview dashboard (`AccountOverview` inside `AccountShell`). */
export const ACCOUNT_OVERVIEW_SCREEN = {
  pageTitle: "Overview",
  greetingTemplate: "Good {time}, {firstName}.",
  greetingMorning: "morning",
  greetingAfternoon: "afternoon",
  greetingEvening: "evening",
  subline: "Here's everything from your account today.",

  profileCompleteness: {
    percentTemplate: "Your profile is {percent}% complete",
    completeLine: "Profile complete · You're all set",
    missingLinkTemplate: "Add {label} →",
  },

  stats: {
    activeOrders: "Active orders",
    wishlist: "Wishlist",
    loyalty: "Loyalty points",
    saved: "Saved this year",
  },

  activeOrder: {
    trackCta: "Track order",
    etaTemplate: "Arrives by {time}",
    summaryTemplate: "{count} items · {total}",
  },

  progressSteps: ["Placed", "Packed", "Out", "Delivered"],

  sections: {
    recentOrders: { overline: "RECENT ORDERS", title: "Your latest", trailing: "View all" },
    wishlist: { overline: "WISHLIST", title: "Saved for later", trailing: "View all" },
    quickAccess: { addressLabel: "Default address", paymentLabel: "Default payment", change: "Change" },
    support: {
      title: "Need help?",
      body: "We respond within one business day.",
      whatsapp: "Chat on WhatsApp",
      email: "Email us",
    },
  },

  offer: {
    headline: "Replenish your pantry — 15% off on repeats",
    cta: "Shop now",
    dismissA11y: "Dismiss offer",
  },

  loyaltyModal: {
    title: "Your loyalty points",
    bodyTemplate: "You have {points} points ready to redeem on your next order.",
    redeemCta: "Redeem rewards",
    closeCta: "Close",
  },

  empty: {
    recentOrders: {
      body: "Start shopping to see your orders here",
      link: "Browse the shop",
    },
  },
};

/** Account orders list (`AccountOrdersScreen`). */
export const MY_ORDERS_SCREEN = {
  pageTitle: "Orders",
  pageSubtitle: "Track your orders, returns, and replacements.",
  searchPlaceholder: "Search by order ID or product",
  filters: {
    all: "All",
    active: "Active",
    delivered: "Delivered",
    cancelled: "Cancelled",
    returned: "Returned",
  },
  sort: {
    label: "Sort",
    newest: "Newest",
    oldest: "Oldest",
    valueHigh: "Highest value",
    valueLow: "Lowest value",
  },
  orderIdTemplate: "Order #{id}",
  placedOnTemplate: "Placed on {date}",
  totalTemplate: "Total {amount}",
  delivery: {
    arrivingTemplate: "Arriving by {date} · {time}",
    deliveredTemplate: "Delivered on {date}",
    cancelledTemplate: "Cancelled on {date}",
  },
  actions: {
    viewOrder: "View order",
    track: "Track",
    reorder: "Reorder",
    returnItem: "Return",
    loadMore: "Load more",
  },
  empty: {
    title: "No orders yet",
    description: "When you place an order, it will show up here.",
    cta: "Start shopping",
    whileHere: "While you're here…",
  },
  moreItemsTemplate: "+{count} more",
};

/** Account order detail (`AccountOrderDetailScreen`). */
export const ORDER_DETAIL_SCREEN = {
  breadcrumbOrders: "Orders",
  orderTitleTemplate: "Order #{id}",
  notFound: "Order not found",
  backToOrders: "Back to orders",
  timeline: {
    placed: "Placed",
    packed: "Packed",
    out: "Out for delivery",
    delivered: "Delivered",
    returned: "Returned",
    currentDescriptions: {
      placed: "We've received your order.",
      packed: "Your items are being packed.",
      out: "Your order is on the way with our delivery partner.",
      delivered: "Your order was delivered successfully.",
      returned: "This order was returned.",
    },
  },
  sections: {
    shipping: { overline: "SHIPPING", title: "Delivery address" },
    payment: { overline: "PAYMENT", title: "Order summary" },
    help: { overline: "SUPPORT", title: "Need help?" },
  },
  payment: {
    subtotal: "Subtotal",
    shipping: "Shipping",
    shippingFree: "Free",
    discount: "Discount",
    tax: "Tax",
    total: "Total",
    paidWithTemplate: "Paid with {method}",
  },
  actions: {
    downloadInvoice: "Download invoice",
    reorder: "Reorder",
    returnItem: "Return",
    track: "Track order",
    getHelp: "Get help",
    changeAddress: "Change",
    whatsapp: "WhatsApp",
    email: "Email",
    call: "Call",
  },
  reorderModal: {
    titleTemplate: "Add these {count} items to your bag?",
    confirm: "Add to bag",
    cancel: "Cancel",
    adding: "Adding…",
  },
  invoiceSoon: "Invoice downloads are coming soon.",
};

/** Nested account profile (`AccountProfileScreen` inside `AccountShell`). */
export const ACCOUNT_PROFILE_SCREEN = {
  breadcrumbAccount: "Account",
  breadcrumbProfile: "Profile",
  pageTitle: "Profile",
  pageSubtitle: "Manage your personal information, photo, and password.",

  avatar: {
    changePhoto: "Change photo",
    remove: "Remove",
    uploadingLabel: "Uploading…",
  },

  identity: {
    verified: "Verified",
    unverified: "Unverified",
    verify: "Verify",
    memberSinceTemplate: "Member since {month} {year} · {orderCount} orders",
    editName: "Edit name",
  },

  sections: {
    personalDetails: { overline: "PERSONAL DETAILS", title: "About you" },
    security: { overline: "SECURITY", title: "Password & sign-in" },
    addresses: { overline: "ADDRESSES", title: "Saved addresses", trailing: "Manage all" },
    payment: { overline: "PAYMENT", title: "Saved payment methods", trailing: "Manage all" },
    preferences: { overline: "PREFERENCES", title: "App preferences" },
    dataPrivacy: { overline: "DATA & PRIVACY", title: "Your data" },
  },

  fields: {
    fullName: { label: "Full name", placeholder: "Your full name" },
    displayName: {
      label: "Display name",
      placeholder: "How you want to be seen",
      helper: "Shown on your reviews and orders.",
    },
    email: { label: "Email", changeLink: "Change email" },
    phone: { label: "Phone", verifyLink: "Verify" },
    dob: { label: "Date of birth", helper: "We'll send you a small gift on your birthday." },
    gender: { label: "Gender", options: ["Prefer not to say", "Female", "Male", "Other"] },
  },

  emailVerifyBanner: {
    message: "Verify your email to unlock all features.",
    cta: "Send verification",
  },

  avatarOptions: {
    title: "Profile photo",
    takePhoto: "Take photo",
    chooseLibrary: "Choose from library",
    removePhoto: "Remove photo",
    cancel: "Cancel",
    removeConfirmTitle: "Remove profile photo?",
    removeConfirmBody: "Your photo will be removed from your account.",
    removeConfirmCta: "Remove",
  },

  conflictModal: {
    title: "Profile was updated elsewhere",
    body: "Refresh to see the latest, or overwrite with your changes.",
    cancel: "Cancel",
    refresh: "Refresh",
    overwrite: "Overwrite",
  },

  offlineSaveToast: "You're offline. Changes saved locally and will sync when you're back.",
  offlineSyncToast: "Profile synced successfully.",

  buttons: {
    save: "Save changes",
    saving: "Saving…",
    saved: "Saved",
    discard: "Discard",
    changePassword: "Change password",
    add: "Add",
    manageAll: "Manage all",
    downloadData: "Download my data",
    privacyPrefs: "Privacy preferences",
    deleteAccount: "Delete account",
    signOut: "Sign out",
  },

  security: {
    passwordLastChangedTemplate: "Last changed {time}",
    passwordNever: "Never changed",
    twoFactorEnabled: "Enabled",
    twoFactorDisabled: "Disabled",
    biometricLabel: "Biometric sign-in",
    activeSessionsTemplate: "{count} devices signed in",
    manageSessions: "Manage devices",
    twoFactorManage: "Manage devices",
    changePasswordTitle: "Change password",
    changePasswordBody: "Enter your current password, then choose a new one.",
    sessionsTitle: "Active sessions",
    revokeSession: "Revoke",
    thisDevice: "This device",
    activityLink: "Recent account activity",
  },

  passwordChange: {
    currentLabel: "Current password",
    newLabel: "New password",
    confirmLabel: "Confirm new password",
    submit: "Update password",
    mismatch: "New passwords do not match.",
    success: "Password updated.",
    wrongPassword: "Current password is incorrect.",
  },

  emailChange: {
    title: "Change email",
    newLabel: "New email address",
    currentPasswordLabel: "Current password",
    submit: "Request change",
    success: "Check your current inbox for confirmation, then verify the new address.",
  },

  phoneChange: {
    title: "Change phone",
    newLabel: "New phone number",
    otpLabel: "Verification code",
    sendOtp: "Send code",
    verify: "Verify & save",
    success: "Phone number updated.",
  },

  activityScreen: {
    title: "Account activity",
    subtitle: "Sign-ins and sensitive changes from the last 90 days.",
    empty: "No recent activity recorded.",
  },

  preferences: {
    languageLabel: "Language",
    currencyLabel: "Currency",
    timezoneLabel: "Time zone",
    themeLabel: "Theme",
    themeOptions: ["Light", "Dark", "System"],
    unitsLabel: "Measurement units",
    unitsOptions: ["Metric (kg, ml)", "Imperial (lb, fl oz)"],
  },

  deleteFlow: {
    title: "Delete your account?",
    body: "All order history, addresses, payment methods, and personal data will be permanently removed within 30 days. This cannot be undone.",
    confirmLabel: "Type DELETE to confirm",
    reasonPrompt: "We're sad to see you go. Why are you leaving?",
    reasonOptions: [
      "Privacy concerns",
      "Too expensive",
      "Found an alternative",
      "Didn't use it enough",
      "Other",
    ],
    feedbackPlaceholder: "Anything else we should know? (optional)",
    cancelCta: "Cancel",
    confirmCta: "Delete my account",
    confirmDisabledLabel: "Type DELETE to enable",
    deleting: "Deleting…",
  },

  discardModal: {
    title: "Discard changes?",
    body: "You have unsaved changes. Leave without saving?",
    stay: "Keep editing",
    leave: "Discard",
  },

  toasts: {
    profileSaved: "Profile updated",
    photoUploaded: "Photo updated",
    photoRemoved: "Photo removed",
    saveError: "Couldn't save changes. Please try again.",
    networkError: "Check your connection and try again.",
    dataExportRequested: "We'll email your data export shortly.",
    verifySoon: "Verification is coming soon.",
    verifySent: "Verification email sent. Check your inbox.",
    verifyDevLink: "Dev verification link copied to clipboard.",
    deletionRequested: "Account deletion requested. Signing you out.",
  },

  empty: {
    noAddresses: {
      title: "No saved addresses",
      body: "Add an address to make checkout faster.",
      cta: "Add address",
    },
    noPayment: {
      title: "No saved methods",
      body: "Add a card or UPI for one-tap checkout.",
      cta: "Add method",
    },
  },
};

/** Saved addresses — [`AccountAddressesScreen.js`](../screens/account/AccountAddressesScreen.js). */
export const ADDRESSES_SCREEN = {
  breadcrumbAccount: "Account",
  breadcrumbCurrent: "Addresses",
  pageTitle: "Addresses",
  pageSubtitle: "Delivery locations for checkout and order updates.",
  addCardLabel: "Add new address",
  addCardA11y: "Add a new delivery address",
  defaultBadge: "Default",
  setDefaultLink: "Set as default",
  editA11y: "Edit address",
  deleteA11y: "Delete address",
  modalAddTitle: "Add address",
  modalEditTitle: "Edit address",
  fields: {
    fullName: { label: "Full name", placeholder: "Full name" },
    phone: { label: "Phone", placeholder: "Mobile number" },
    countryCode: "+91",
    pincode: { label: "Pincode", placeholder: "6-digit PIN" },
    city: { label: "City", placeholder: "City" },
    state: { label: "State", placeholder: "State" },
    line1: { label: "Address line 1", placeholder: "House no., building name" },
    line2: { label: "Address line 2", placeholder: "Street, area" },
    landmark: {
      label: "Landmark",
      placeholder: "Optional",
      helper: "E.g., near park, bus stop",
    },
    tag: { label: "Address tag" },
    customTag: { label: "Custom label", placeholder: "e.g. Parents, Studio" },
    makeDefault: "Make this my default address",
  },
  tagOptions: [
    { id: "HOME", label: "Home" },
    { id: "WORK", label: "Work" },
    { id: "OTHER", label: "Other" },
  ],
  saveCta: "Save address",
  savingCta: "Saving…",
  cancelCta: "Cancel",
  deleteModal: {
    title: "Delete this address?",
    body: "This address will be removed from your account. You can add it again anytime.",
    cancel: "Cancel",
    confirm: "Delete",
    deleting: "Deleting…",
  },
  empty: {
    title: "No saved addresses yet",
    description: "Save a delivery address for faster checkout and accurate order updates.",
    cta: "Add your first address",
  },
  errors: {
    load: "Couldn't load addresses. Pull to refresh or try again.",
    save: "Couldn't save this address. Check the fields and try again.",
    delete: "Couldn't delete this address.",
    missingFields: "Fill all required fields before saving.",
  },
};

/**
 * Saved payment methods — [`AccountPaymentScreen.js`](../screens/account/AccountPaymentScreen.js).
 *
 * **PCI:** Card/UPI capture must use the payment gateway hosted page only (`openPaymentGatewayHostedPage`).
 * Never collect full card numbers in this app.
 */
export const PAYMENT_SCREEN = {
  breadcrumbAccount: "Account",
  breadcrumbCurrent: "Payment methods",
  pageTitle: "Payment methods",
  pageSubtitle: "Cards and UPI for faster checkout.",
  securityBanner:
    "Your payment info is stored securely with Razorpay/Stripe. Zeevan never sees your full card number.",
  cardsSection: { overline: "CARDS", title: "Saved cards" },
  upiSection: { overline: "UPI", title: "UPI IDs" },
  addCardLabel: "Add payment method",
  addCardA11y: "Add a card or UPI via secure payment page",
  addCardHint: "You'll complete setup on our secure payment partner page.",
  defaultBadge: "Default",
  setDefaultLink: "Set as default",
  deleteCardA11y: "Remove card",
  deleteUpiA11y: "Remove UPI ID",
  maskedCardTemplate: "•••• •••• •••• {last4}",
  expiryTemplate: "Expires {expiry}",
  maskedUpiTemplate: "{masked}",
  gatewayRedirectTitle: "Continue on secure payment page",
  gatewayRedirectBody:
    "To protect your card details, we open Razorpay's hosted page. Zeevan never stores your full card number.",
  gatewayContinueCta: "Continue securely",
  gatewayCancelCta: "Not now",
  gatewayMissingTitle: "Payment page unavailable",
  gatewayMissingBody: "Set EXPO_PUBLIC_RAZORPAY_PAYMENT_LINK to enable adding payment methods.",
  empty: {
    title: "No payment methods saved",
    description: "Add a card or UPI for one-tap checkout on your next order.",
    cta: "Add a card or UPI",
  },
  deleteCard: {
    title: "Remove this card?",
    body: "It will be removed from saved methods on this device.",
    cancel: "Cancel",
    confirm: "Remove",
  },
  deleteUpi: {
    title: "Remove this UPI ID?",
    body: "It will be removed from saved methods on this device.",
    cancel: "Cancel",
    confirm: "Remove",
  },
};

/** Wishlist — [`AccountWishlistScreen.js`](../screens/account/AccountWishlistScreen.js). */
export const WISHLIST_SCREEN = {
  breadcrumbAccount: "Account",
  breadcrumbCurrent: "Wishlist",
  pageTitle: "Wishlist",
  subtitleTemplate: "{count} items saved",
  subtitleOne: "1 item saved",
  subtitleEmpty: "No items saved yet",
  moveAllCta: "Move all to bag",
  sortCta: "Sort by",
  sortTitle: "Sort wishlist",
  sortOptions: [
    { id: "recent", label: "Recently added" },
    { id: "priceAsc", label: "Price: low to high" },
    { id: "priceDesc", label: "Price: high to low" },
    { id: "nameAsc", label: "Name: A–Z" },
  ],
  empty: {
    title: "Your wishlist is empty",
    description: "Save pieces you love — they'll wait here until you're ready.",
    cta: "Browse products",
  },
  trending: {
    overline: "TRENDING",
    title: "Trending now",
  },
  removedToast: "Removed",
  undoToastAction: "Undo",
  moveAllModal: {
    title: "Move items to bag?",
    bodyTemplate: "{inStock} of {total} items are in stock and will be added.",
    outOfStockNote: "{count} out-of-stock items will be skipped.",
    confirm: "Add to bag",
    cancel: "Cancel",
    adding: "Adding…",
    allOutOfStock: "All saved items are currently out of stock.",
  },
  loading: "Loading wishlist…",
};

/** Notification preferences — [`AccountNotificationPrefsScreen.js`](../screens/account/AccountNotificationPrefsScreen.js). */
export const NOTIFICATION_PREFS_SCREEN = {
  breadcrumbAccount: "Account",
  breadcrumbCurrent: "Notifications",
  pageTitle: "Notifications",
  pageSubtitle: "Choose what you want to hear from us, and how.",
  channels: {
    email: "Email",
    sms: "SMS",
    whatsapp: "WhatsApp",
    push: "Push",
  },
  categories: {
    orderUpdates: {
      label: "Order updates",
      helper: "Required for order status",
      locked: true,
    },
    delivery: { label: "Delivery notifications" },
    offers: { label: "Offers & promotions" },
    memberDrops: { label: "Member-only drops" },
    recipe: { label: "Recipe & inspiration" },
    backInStock: { label: "Product back in stock" },
    wishlistPriceDrops: { label: "Wishlist price drops" },
    surveys: { label: "Surveys & feedback" },
  },
  privacy: {
    overline: "DATA",
    title: "Personal data",
    personalized: {
      label: "Personalized recommendations",
      helper: "We use your order history to suggest products you might love.",
    },
    marketingPartners: {
      label: "Share with marketing partners",
    },
    downloadData: "Download my data",
    deleteAccount: "Delete my account",
  },
  saveCta: "Save preferences",
  savingCta: "Saving…",
  savedToast: "Preferences saved",
  dataExportToast: "We'll email your data export shortly.",
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

/** Editorial imagery + quote — auth split layout (tablet/desktop left rail). */
export const AUTH_EDITORIAL_LAYOUT = {
  heroBannerA11y: `${APP_DISPLAY_NAME} heritage storytelling imagery`,
  heroImageUri:
    "https://images.unsplash.com/photo-1556912173-671ae26ea723?auto=format&fit=crop&w=1600&q=80",
  heroOverline: "HERITAGE",
  heroQuote: "Crafted with intention — remembered long after the moment passes.",
  heroQuoteAttribution: `— ${APP_DISPLAY_NAME}`,
};

/** Auth shell copy — login, register, forgot, reset (`AuthShell.js`). */
export const AUTH_SCREEN = {
  layout: {
    heroImageUri: AUTH_EDITORIAL_LAYOUT.heroImageUri,
    heroBannerA11y: AUTH_EDITORIAL_LAYOUT.heroBannerA11y,
    wordmarkSubline: "HERITAGE PANTRY",
  },
  shared: {
    backToHome: "Back to home",
    requiredField: "Required",
    invalidEmail: "Enter a valid email address",
    passwordTooShort: "Password must be at least 8 characters",
    passwordMismatch: "Passwords do not match",
    serverError: "Something went wrong. Please try again.",
    networkError: "Check your connection and try again.",
    timeoutError: "Request timed out. Please try again.",
    retryCta: "Retry",
    sessionExpiredBanner: "Your session expired. Please sign in again.",
    alreadySignedInToast: "You're already signed in.",
    stillTrying: "Still trying…",
    signInWithBiometric: "Sign in with {label}",
  },
  gateShell: {
    title: "Sign in to your account",
    subtitle: "Continue to view orders, saved addresses, and account settings.",
    signInCta: "Sign in",
    guestCta: "Continue as guest",
  },
  login: {
    leftPane: {
      overline: "WELCOME BACK",
      headline: "Welcome back to the pantry.",
      subline: "Pick up where you left off — your bag, addresses, and orders are waiting.",
    },
    formTitle: "Sign in",
    formSubtitle: "Enter your details to continue.",
    emailLabel: "Email",
    emailPlaceholder: "you@example.com",
    passwordLabel: "Password",
    passwordPlaceholder: "Your password",
    forgotLink: "Forgot password?",
    showPassword: "Show password",
    hidePassword: "Hide password",
    rememberMe: "Keep me signed in",
    submitCta: "Sign in",
    submitLoading: "Signing in…",
    socialDivider: "or continue with",
    socialGoogle: "Continue with Google",
    socialApple: "Continue with Apple",
    footerLabel: "New here?",
    footerLink: "Create an account",
    invalidCredentials: "Email or password is incorrect.",
    accountDeletionPending:
      "This account is being deleted. If you didn't request this, contact support.",
    oauthUnavailableHint: "This sign-in option is not available yet.",
  },
  register: {
    leftPane: {
      overline: "JOIN THE PANTRY",
      headline: "Begin a new ritual.",
      subline: "Premium pantry essentials, member-only drops, and faster checkout.",
    },
    formTitle: "Create your account",
    formSubtitle: "Takes less than a minute.",
    nameLabel: "Full name",
    namePlaceholder: "Your full name",
    emailLabel: "Email",
    emailPlaceholder: "you@example.com",
    passwordLabel: "Password",
    passwordPlaceholder: "Create a strong password",
    passwordHint: "At least 8 characters with a mix of letters, numbers, and symbols.",
    confirmPasswordLabel: "Confirm password",
    strengthLabels: ["Too weak", "Weak", "Okay", "Strong", "Excellent"],
    marketingOptIn: "Send me occasional updates, recipes, and member offers.",
    termsPrefix: "By continuing you agree to our",
    termsLink: "Terms",
    termsAnd: "and",
    privacyLink: "Privacy Policy",
    submitCta: "Create account",
    submitLoading: "Creating your account…",
    socialDivider: "or continue with",
    socialGoogle: "Continue with Google",
    socialApple: "Continue with Apple",
    footerLabel: "Already a member?",
    footerLink: "Sign in",
    showPassword: "Show password",
    hidePassword: "Hide password",
    emailExists: "An account already exists with this email.",
    emailExistsSignIn: "Sign in instead",
    welcomeToast: "Welcome to {brand}.",
    successTitle: "Check your email",
    successBody: "We sent a verification link to {email}. Tap it to activate your account.",
    openMailApp: "Open mail app",
    resendEmail: "Resend email",
    resendCooldown: "Resend in {seconds}s",
    useDifferentEmail: "Use a different email",
    oauthUnavailableHint: "This sign-in option is not available yet.",
  },
  forgot: {
    leftPane: {
      overline: "ACCOUNT RECOVERY",
      headline: "Let's get you back in.",
      subline: "Enter your email and we'll send you a secure reset link.",
    },
    formTitle: "Reset your password",
    formSubtitle: "We'll email you a one-time link.",
    emailLabel: "Email",
    emailPlaceholder: "you@example.com",
    submitCta: "Send reset link",
    submitLoading: "Sending…",
    successTitle: "Check your email",
    successBody: "We sent a reset link to {email}.",
    expiryNote: "The link expires in 30 minutes.",
    spamNote: "If you don't see it, check your spam folder.",
    devResetLink: "Dev reset link (SMTP off):",
    openMailApp: "Open mail app",
    useDifferentEmail: "Use a different email",
    resendCta: "Resend",
    resendCooldown: "Resend in {seconds}s",
    footerLabel: "Remember your password?",
    footerLink: "Sign in",
    oauthUnavailableHint: "This sign-in option is not available yet.",
  },
  reset: {
    leftPane: {
      overline: "ALMOST DONE",
      headline: "Set a new password.",
      subline: "Choose something memorable and at least 8 characters long.",
    },
    formTitle: "New password",
    formSubtitle: "You'll be signed in after saving.",
    newPasswordLabel: "New password",
    confirmPasswordLabel: "Confirm new password",
    submitCta: "Save and sign in",
    submitLoading: "Saving…",
    successTitle: "Password updated",
    successBody: "Your password was updated. Sign in with your new password.",
    successSubtitle: "You're all set",
    signInCta: "Sign in",
    errorTitle: "Reset link expired",
    requestNewLinkCta: "Request new link",
    validating: "Validating reset link...",
    missingParams: "This reset link is incomplete. Request a new link from Forgot password.",
    passwordTooShort: "Password must be at least 6 characters.",
    passwordMismatch: "Passwords do not match.",
    error: "Could not reset your password. The link may have expired.",
  },
  verifyEmail: {
    title: "Verify your email",
    subtitle: "Confirming your email address…",
    verifying: "Verifying your link…",
    successTitle: "Email verified",
    success: "Your email is verified. You can use all account features.",
    errorTitle: "Verification failed",
    error: "This link is invalid or has expired.",
    missingParams: "This verification link is incomplete. Request a new email from your profile.",
    goToProfile: "Go to profile",
    backToLogin: "Back to sign in",
  },
};

/** Canonical auth copy (`APP_CONTENT.auth`). Aliases below preserve legacy imports. */
export const APP_CONTENT_AUTH = {
  layout: AUTH_EDITORIAL_LAYOUT,
  signIn: {
    title: "Welcome back",
    subtitle: "Sign in to save addresses, track orders, and checkout faster.",
    labelEmail: "Email",
    labelEmailA11y: "Email address",
    labelSecret: PASSWORD_LABEL,
    labelSecretA11y: PASSWORD_LABEL,
    submitCta: "Sign in",
    submitLoading: "Please wait…",
    dividerContinueWith: "or continue with",
    googleCta: "Continue with Google",
    appleCta: "Continue with Apple",
    forgotPasswordLink: "Forgot password?",
    footerLeadNew: "New here?",
    footerLinkNew: "Create an account →",
    footerNavigateRegisterHint: "Opens registration",
    guestCta: "Continue as guest",
    guestNavigateHint: "Browse the storefront without signing in",
    oauthUnavailableHint: "This sign-in option is not available yet.",
    genericError: "Unable to sign in. Please try again.",
  },
  signUp: {
    title: "Create your account",
    subtitle: "Save your details for quicker checkout and order tracking.",
    labelFullName: "Full name",
    labelFullNameA11y: "Full name",
    labelEmail: "Email",
    labelEmailA11y: "Email address",
    labelSecret: PASSWORD_LABEL,
    labelSecretA11y: PASSWORD_LABEL,
    labelConfirmSecret: CONFIRM_PASSWORD_LABEL,
    labelConfirmSecretA11y: CONFIRM_PASSWORD_LABEL,
    credentialHelper: "Use at least 8 characters with letters and numbers.",
    submitCta: "Create account",
    submitLoading: "Please wait…",
    dividerContinueWith: "or continue with",
    googleCta: "Continue with Google",
    appleCta: "Continue with Apple",
    footerLeadExisting: "Already have an account?",
    footerLinkExisting: "Sign in →",
    footerNavigateLoginHint: "Go back to sign in",
    oauthUnavailableHint: "This sign-in option is not available yet.",
    emailRequired: "Please enter your email.",
    emailInvalid: "Please enter a valid email address.",
    credentialMismatch: PASSWORD_MISMATCH_TEXT,
    genericError: "Unable to register. Please try again.",
  },
  forgot: {
    title: "Reset your password",
    subtitle: "Enter your email and we’ll send reset instructions if an account exists.",
    labelEmail: "Email",
    labelEmailA11y: "Email address",
    submitCta: "Send reset link",
    submitLoading: "Please wait…",
    dividerContinueWith: "or continue with",
    googleCta: "Continue with Google",
    appleCta: "Continue with Apple",
    successTitle: "Check your inbox",
    successBody:
      "If an account exists for that email, you’ll receive reset instructions shortly.",
    footerLeadRemembered: "Remember your password?",
    footerLinkSignIn: "Sign in →",
    footerNavigateLoginHint: "Return to sign in",
    oauthUnavailableHint: "This sign-in option is not available yet.",
    genericError: "Something went wrong. Please try again.",
    validationEmail: "Please enter a valid email address.",
  },
};

/** @deprecated Prefer `AUTH_SCREEN.login` */
export const LOGIN_SCREEN = AUTH_SCREEN.login;

/** @deprecated Prefer `AUTH_SCREEN.register` */
export const REGISTER_SCREEN = AUTH_SCREEN.register;

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

/**
 * Account hub nav — consumed by `AccountShell` (nested stack screen names in `screen`).
 * `route` values are legacy / deep-link aliases (see AppNavigator redirects).
 */
export const ACCOUNT_NAV = [
  { key: "overview", label: "Overview", icon: "home-outline", screen: "Overview", route: "AccountOverview" },
  { key: "orders", label: "Orders", icon: "receipt-outline", screen: "Orders", route: "MyOrders" },
  { key: "wishlist", label: "Wishlist", icon: "heart-outline", screen: "Wishlist", route: "Wishlist" },
  { key: "addresses", label: "Addresses", icon: "location-outline", screen: "Addresses", route: "ManageAddress" },
  { key: "payment", label: "Payment", icon: "card-outline", screen: "Payment", route: "PaymentMethods" },
  { key: "profile", label: "Profile", icon: "person-outline", screen: "AccountProfile", route: "Profile" },
  {
    key: "notifications",
    label: "Notifications",
    icon: "notifications-outline",
    screen: "NotificationPrefs",
    route: "NotificationPreferences",
  },
  { key: "help", label: "Help", icon: "help-circle-outline", screen: null, route: "Help", rootRoute: "Support" },
];

/** Account hub copy — `AccountShell` / `AccountLayout` + nested `AccountNavigator` (`Profile`). */
export const ACCOUNT_UI = {
  kicker: "Account",
  navOverview: "Overview",
  navOrders: "Orders",
  navWishlist: "Wishlist",
  navAddresses: "Addresses",
  navPayment: "Payment",
  navProfile: "Profile",
  navNotifications: "Notifications",
  navSignOut: "Sign out",
  verifiedBadge: "Verified",
  editProfileA11y: "Edit profile",
  signOutConfirmTitle: "Sign out of {brand}?",
  signOutConfirmCta: "Sign out",
  skipToContent: "Skip to account content",
  sectionSubtitles: {
    overview: "Here's everything from your account today.",
    orders: "Track your orders, returns, and replacements.",
    wishlist: "Items you've saved for later.",
    addresses: "Delivery locations for checkout.",
    payment: "Cards and payment options.",
    profile: "Manage your personal information, photo, and password.",
    notifications: "Choose how we reach you.",
    help: "FAQs and support when you need it.",
  },
  greetingTemplate: "Good {time}, {firstName}",
  greetingMorning: "morning",
  greetingAfternoon: "afternoon",
  greetingEvening: "evening",
  statActiveOrders: "Active orders",
  statWishlist: "Wishlist",
  statLoyalty: "Loyalty points",
  recentOrderTitle: "Recent order",
  viewOrderCta: "View order",
  noRecentOrder: "No orders yet",
  ordersEmptyTitle: "No orders yet",
  ordersEmptyBody: "When you place an order, it will show up here.",
  orderOverline: "Order",
  startShoppingCta: "Start shopping",
  orderDatePrefix: "Placed",
  orderDetailTitle: "Order detail",
  reorderCta: "Reorder",
  returnCta: "Return / exchange",
  wishlistTitle: "Wishlist",
  moveAllToBagCta: "Move all to bag",
  wishlistEmptyTitle: "Nothing saved yet",
  wishlistEmptyBody: "Tap the heart on a product to save it here.",
  browseWishlistCta: "Browse products",
  addressesTitle: "Addresses",
  addressPrimaryLabel: "Primary delivery address",
  addAddressCta: "+ Add new address",
  saveAddressCta: "Save address",
  cancelCta: "Cancel",
  editAddressA11y: "Edit address",
  deleteAddressA11y: "Remove address",
  addressModalTitle: "Address details",
  paymentTitle: "Payment methods",
  paymentTrustLine: "Stored securely with {provider}",
  cardEnding: "•••• {last4}",
  profileEmailLabel: "Email",
  profilePasswordCta: "Change password",
  profileSaveCta: "Save profile",
  notificationPrefsTitle: "Notification preferences",
  topicOrders: "Orders & delivery",
  topicPromos: "Offers & inspiration",
  topicAccount: "Account & security",
  channelEmail: "Email",
  channelSms: "SMS",
  channelWhatsApp: "WhatsApp",
  inboxLink: "Open notification inbox",
  timelinePlaced: "Placed",
  timelinePacked: "Packed",
  timelineOut: "Out for delivery",
  timelineDelivered: "Delivered",
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
  couponAppliedChip: "{code} applied",
  giftWrapLabel: "Add as a gift",
  giftWrapHint: "Include a short gift message at checkout.",
  giftMessageLabel: "Gift message",
  movedToWishlist: "Moved to wishlist.",
  locationError: "Unable to get current location.",
};

/** Slide-over cart (web header / quick bag). */
export const CART_DRAWER_UI = {
  title: "Your bag",
  closeA11y: "Close cart",
  freeShippingDone: "You’ve unlocked free shipping on this order.",
  freeShippingAway: "{amount} away from free shipping",
  freeShippingProgress: "Add {amount} more for free shipping · {percent}%",
  subtotal: "Subtotal",
  checkoutCta: "Checkout",
  viewBagCta: "View bag",
  emptyTitle: "Your bag is empty",
  emptyDescription: "Add your first essentials to continue.",
  browseCta: "Continue shopping",
  removeLineA11y: "Remove line",
  moveToWishlist: "Move to wishlist",
};

/** Single-page checkout (Cart screen when `checkout` param is true). */
export const CHECKOUT_UI = {
  secureLine: "Secure checkout",
  contactLine: "Need help? support@zeevan.com",
  stepContact: "Contact & shipping",
  stepDelivery: "Delivery method",
  stepPayment: "Payment",
  deliveryStandard: "Standard delivery",
  deliveryStandardSub: "Typically 2–4 business days",
  deliveryExpress: "Express",
  deliveryExpressSub: "Where available · 1–2 business days",
  placeOrderTemplate: "Place order · {total}",
  editBag: "Edit bag",
  trackOrderCta: "Track order",
  continueShoppingCta: "Continue shopping",
  successTitle: "Order placed",
  successBody: "Order {id}. Estimated delivery: {eta}.",
  paymentTabUpi: "UPI",
  paymentTabCards: "Cards",
  paymentTabNetbanking: "Net banking",
  paymentTabWallet: "Wallet",
  paymentTabCod: "Cash on delivery",
  paymentTabOnline: "Online payment",
  paymentOnlineComingSoon: "Coming soon",
  paymentOnlineHint: "You will be redirected to a secure payment page.",
  validationRequired: "Required",
  invalidPhone: "Enter a valid phone number",
  invalidPostal: "Enter a valid postal code",
  invalidEmail: "Enter a valid email",
  emailLabel: "Email",
  summaryTaxes: "Taxes & fees",
  summaryDiscount: "Discount",
  summaryShipping: "Shipping",
  summarySubtotal: "Subtotal",
  summaryTotal: "Total",
  addonsOverline: "Complete your order",
  addonsTitle: "Recommended add-ons",
  successRecommendationsOverline: "Pair with this order",
  successRecommendationsTitle: "Recommended products",
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
  pincodeFillSuccess: "Address auto-filled from pincode.",
  fullNameLabel: "Full name",
  phoneLabel: "Phone",
  phonePrefix: "+91",
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
  reviewsSubtitleHasCount: "{rating} · {count} reviews",
  reviewsSubtitleOne: "{rating} · 1 review",
  reviewsEmptySubtitle: "No reviews yet",
  reviewRatingError: "Pick 1–5 stars.",
  reviewSubmitSuccess: "Thanks — your review is live.",
  reviewSubmitErrorFallback: "Couldn’t post review.",
  reviewListLatest: "",
  reviewNoWrittenNote: "—",
  reviewFirstHint: "",
  /** Customer reviews section (ProductReviews). */
  reviews: {
    sectionOverline: "Ratings",
    sectionTitle: "Customer reviews",
    emptySubtitle: "No reviews yet — be the first to share your experience.",
    basedOn: "Based on {count} reviews",
    basedOnOne: "Based on 1 review",
    verifiedPct: "{pct}% verified",
    filterAll: "All",
    filterStars: "{n}★",
    filterStarsA11y: "Filter {n} star reviews",
    filterPhotos: "With photos",
    filterVerified: "Verified only",
    sortTitle: "Sort reviews",
    sortHelpful: "Most helpful",
    sortRecent: "Most recent",
    sortHigh: "Highest rated",
    sortLow: "Lowest rated",
    sortA11y: "Change review sort order",
    verifiedPurchase: "Verified purchase",
    noBody: "No written review.",
    readMore: "Read more",
    helpfulQuestion: "Was this helpful?",
    writeReview: "Write a review",
    writeReviewA11y: "Write a product review",
    titleLabel: "Review title",
    titlePlaceholder: "Sum it up in a few words",
    titleCharCount: "{current}/{max}",
    bodyLabel: "Your review",
    bodyPlaceholder: "Share your experience",
    bodyCharCount: "{current}/{max}",
    cancel: "Cancel",
    submit: "Submit review",
    submitting: "Submitting…",
    loadMore: "Load more reviews ({n} remaining)",
    photoPermissionError: "Photo library access is required to add images.",
    photoReadError: "Could not read that photo. Try another.",
    photoUploadError: "Could not upload photo.",
    removePhotoA11y: "Remove photo",
    beFirstToReview: "Be the first to review",
    beFirstToReviewA11y: "Write the first review for this product",
    sectionTitleShort: "Reviews",
  },
  stickyPriceLabel: "Price",
  dockThumbA11y: "Scroll to top of product",
  galleryFabA11y: "Back to product gallery",
  viewedRecentlyOverline: "VIEWED RECENTLY",
  variantUnavailableMessage: "This size is unavailable.",
  variantUnavailableNotify: "Notify me when back?",
  lowStockAlert: "Only {count} left in stock — order soon.",
  addedToBagToast: "Added — {price} added to your bag",
  addedToBagToastAction: "View bag →",
  wishlistSavedToast: "Saved to wishlist",
  wishlistSavedToastAction: "View wishlist →",
  addToCart: "Add to bag",
  /** Primary + sticky CTA when line is not purchasable */
  outOfStock: "Out of stock",
  productOutOfStockA11y: "Unavailable",
  addToCartA11y: "Add to bag",
  /** `{count}` stepper label */
  inCartCount: "{count} in cart",
  /** `{count}` stock fact */
  stockCountLabel: "{count} in stock",
  stockOutLabel: "Out of stock",
  unitFallback: "1 pc",
  /** `{pct}` discount chip */
  savePctChip: "Save {pct}%",
  stickyInCart: "In cart ({count})",
  /** Breadcrumb row under PageHeader (`{category}`) */
  detailBreadcrumb: "Shop › {category}",
  brandFallback: APP_DISPLAY_NAME,
  trustFresh: "Fresh dispatch",
  trustSecure: "Secure pay",
  trustReturns: "Easy returns",
  trustQuality: "QC passed",
  trustFreeShipping: "Free shipping",
  trustEasyReturns: "Easy 30-day returns",
  trustCod: "COD available",
  trustGenuine: "100% genuine",
  verifiedBadge: "Verified",
  reviewSingular: "review",
  reviewPlural: "reviews",
  priceTaxLine: "Inclusive of all taxes · Free shipping over ₹1,499",
  savePctChipUpper: "SAVE {pct}%",
  variantTitleWithSelection: "Choose your size: {selection}",
  variantSoldPer: "Sold per {unit}",
  addToCartWithPrice: "Add to bag · {price}",
  addingToBag: "Adding…",
  notifyWhenBack: "Notify me when back",
  notifyWhenBackA11y: "Notify when back in stock",
  saveLabel: "Save",
  savedLabel: "Saved",
  saveWishlistA11y: "Save to wishlist",
  removeWishlistA11y: "Remove from wishlist",
  shareLabel: "Share",
  askLabel: "Ask",
  askModalTitle: "Ask about this product",
  askModalBody: "I have a question about {name}…",
  askPrefill: "Hi, I have a question about {name}.",
  askEmailSubject: "Question about {name}",
  askWhatsApp: "WhatsApp",
  askEmail: "Email us",
  notifyModalTitle: "Notify me when available",
  notifyModalBody: "We will email you when this item is back in stock.",
  notifyEmailLabel: "Email",
  notifyEmailPlaceholder: "you@example.com",
  notifySubmit: "Notify me",
  pincodeHeading: "DELIVERY",
  pincodeLabel: "Delivery pincode",
  pincodePlaceholder: "Enter pincode",
  pincodeCheckCta: "Check",
  pincodeDeliversBy: "Delivers by {date}",
  pincodeDispatchNote: "Order in next {hours}h {minutes}m for same-day dispatch",
  pincodeNotServiceable: "Not serviceable yet. Notify me?",
  pincodeUnavailable: "We could not verify this pincode right now. Please try again shortly.",
  pincodeCheckMockShort: "Enter a valid 6-digit pincode.",
  accordionDescription: "Description",
  accordionMaterial: "Material & care",
  accordionShipping: "Shipping & returns",
  accordionFaq: "FAQ",
  accordionMaterialBody:
    "Store in a cool, dry place. Refer to the packaging for batch-specific guidance.",
  accordionShippingBody:
    "Standard delivery timelines apply. Returns accepted on eligible items within the policy window.",
  accordionFaqBody: "Questions? Reach out via Support and we will help within one business day.",
  detailsOverline: "Product info",
  detailsTitle: "Specifications",
  metaSku: "SKU {sku}",
  metaCategory: "{category}",
  metaType: "{type}",
  metaEta: "Delivers {eta}",
  metaRating: "{rating} · {count} reviews",
  metaRatingOne: "{rating} · 1 review",
  processTitleFallback: "How it's made",
  usageTitle: "How to use",
  rich: {
    quoteAttributionFallback: "Master maker, sourcing notes",
    uspsOverline: "WHY YOU'LL LOVE IT",
    uspsTitle: "Crafted for everyday excellence",
    uspsSubtitle: "",
    processOverline: "THE CRAFT",
    processTitleFallback: "How it's made",
    usageOverline: "ENJOY DAILY",
    usageTitle: "Rituals & recipes",
    usageSubtitle: "",
    ritualCta: "Try this →",
    sourcingOverline: "TRACEABILITY",
    sourcingTitle: "From source to shelf",
    sourcingSubtitle: "Transparent origins and certifications.",
    sourcingOrigin: "Sourced from {region}",
    sourcingHarvest: "Harvested {date}",
    sourcingCertsLabel: "Certifications",
  },
  completeLookOverline: "Pair it",
  completeLookTitle: "Complete the look",
  youMayAlsoLikeOverline: "Discover",
  youMayAlsoLikeTitle: "You may also like",
  recentlyViewedOverline: "Jump back",
  recentlyViewedTitle: "Recently viewed",
  zoomOpenA11y: "Enlarge image",
  zoomCloseA11y: "Close enlarged image",
  galleryRegionLabel: "Product gallery",
  galleryA11y: "Product gallery, image {current} of {total}",
  galleryThumbA11y: "View image {n}",
  variantSelectedLive: "Selected: {variant}, price {price}",
  addedToBagLive: "{name}, {variant}, added to bag",
  pincodeSuccessLive: "Delivers by {date}",
  zoomInA11y: "Open full-screen zoom",
  swipeNextA11y: "Next image",
  swipePrevA11y: "Previous image",
  galleryVideoPlayA11y: "Play product video",
  galleryVideoMuteA11y: "Unmute video",
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

/** Admin / delivery ops dashboard copy (design-system screens). */
export const OPS_UI = {
  adminKicker: "Admin",
  deliveryKicker: "Delivery",
  overviewTitle: "Overview",
  accessTitle: "Admin access required",
  accessDescription: "This account does not have admin privileges.",
  backHomeCta: "Back to home",
  refreshCta: "Refresh",
  expandAll: "Expand all",
  collapseAll: "Collapse all",
  quickOpen: "Quick open",
  allTools: "All tools",
  allToolsHint: "Tap a section to expand shortcuts.",
  stats: {
    products: "Products",
    productsCaption: "Catalog SKUs",
    orders: "Orders",
    ordersCaption: "All time",
    users: "Users",
    usersCaption: "Registered",
    admins: "Admins",
    adminsCaption: "With admin role",
    pending: "Pending",
    pendingAttention: "Needs attention",
    pendingClear: "Queue clear",
  },
  delivery: {
    routeMap: "Route map",
    assignedOrders: "Assigned orders",
    noDeliveriesTitle: "No active deliveries",
    noDeliveriesDescription: "Assigned active orders will appear here.",
    waitingAdvance:
      "Waiting for admin to advance this order before you can mark delivered.",
    activeDelivery: "Active delivery",
    elapsed: "Elapsed",
    openRoute: "Open route",
  },
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
 * named exports (`LOGIN_SCREEN`, `REGISTER_SCREEN`) or `APP_CONTENT_AUTH` (`layout`, `signIn`, `signUp`, `forgot`).
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
    trustBanner: HOME_TRUST_BANNER,
    statsStrip: HOME_STATS_STRIP,
    testimonials: HOME_TESTIMONIALS,
    offersBand: HOME_OFFERS_BAND,
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
  auth: APP_CONTENT_AUTH,
  authScreen: AUTH_SCREEN,
  notifications: NOTIFICATIONS_SCREEN,
  editProfile: EDIT_PROFILE_SCREEN,
  manageAddress: MANAGE_ADDRESS_SCREEN,
  addressesScreen: ADDRESSES_SCREEN,
  paymentScreen: PAYMENT_SCREEN,
  wishlistScreen: WISHLIST_SCREEN,
  notificationPrefsScreen: NOTIFICATION_PREFS_SCREEN,
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
  ops: OPS_UI,
  adminHomeView: ADMIN_HOME_VIEW_COPY,
};

/** Global error / offline UX — observability surfaces. */
export const OBSERVABILITY_UI = {
  errorBoundaryTitle: "Something went wrong",
  errorBoundaryBody: "We hit an unexpected error. You can try again — your bag and account data are safe on this device.",
  errorBoundaryRetry: "Try again",
  offlineBanner: "You're offline. Changes will sync when you're back online.",
  offlineSyncing: "Back online — syncing your changes…",
};

/** Android-web diagnostics and development HUD copy. */
export const DEV_DEBUG_UI = {
  routeTitle: "Device debug",
  lockedTitle: "Debug key required",
  lockedBody: "Use /dev-debug?key=zeevan-debug on the target Android browser.",
  keyLabel: "Access key",
  snapshotTitle: "Runtime snapshot",
  refresh: "Refresh",
  notesTitle: "How to report",
  notesBody: "Capture this page + the broken screen on the same device.",
  ua: "User Agent",
  windowSize: "window.inner",
  docSize: "document.client",
  viewportSize: "visualViewport",
  dpr: "DPR",
  touch: "Touch",
  supportsBackdrop: "backdrop-filter",
  supportsDvh: "100dvh",
  supportsLvh: "100lvh",
  supportsVhVar: "--app-vh",
  yes: "Yes",
  no: "No",
  unavailable: "n/a",
  missing: "missing",
  hudFps: "FPS",
  hudScroll: "scrollY",
  hudWindow: "inner",
  hudViewport: "visualViewport",
};
