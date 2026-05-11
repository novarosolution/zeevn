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
export const HOME_HERO_TITLE_DEFAULT = "Premium pantry staples, delivered with care";
export const HOME_HERO_SUBTITLE_DEFAULT =
  "Small-batch essentials, trusted sourcing, and a smoother everyday shop.";

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
  kicker: "Zeevan heritage pantry",
  badge: "CURATED QUALITY",
  cta: "Explore collection",
  editorialNote: "Thoughtfully sourced staples with faster delivery and a calmer shopping experience.",
  highlights: [
    { key: "source", label: "Trusted sourcing", icon: "leaf-outline" },
    { key: "delivery", label: "Fast delivery", icon: "flash-outline" },
    { key: "secure", label: "Secure pay", icon: "shield-checkmark-outline" },
  ],
};

/** Light-mode tagline under the home top wordmark (same voice as `APP_TAGLINE`). */
export const HOME_WORDMARK_TAGLINE = APP_TAGLINE;

/** Trust strip under the hero image (icon = Ionicons name). */
export const HOME_TRUST_STRIP = [
  { key: "source", label: "Curated quality", icon: "shield-checkmark-outline" },
  { key: "batch", label: "Small-batch sourcing", icon: "leaf-outline" },
  { key: "cod", label: "Fast doorstep delivery", icon: "car-outline" },
];

/**
 * Animated stats strip (count-up). `target` numeric, `prefix` and `suffix` cosmetic,
 * `precision` controls decimals.
 */
export const HOME_STATS_STRIP = {
  overline: "Trusted in real kitchens",
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
      suffix: "★",
      precision: 1,
      label: "Average rating",
      icon: "star-outline",
    },
    {
      key: "purity",
      target: 100,
      prefix: "",
      suffix: "%",
      precision: 0,
      label: "Pure A2 ghee",
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
};

/** Catalog section intro (when not searching). */
export const HOME_CATALOG_INTRO = {
  starter: "Hand-picked to begin your basket",
  all: "Curated essentials for everyday cooking",
};

/** Suffix for the side menu “starter” row (after dynamic counts). */
export const HOME_MENU_STARTER_TAG = "Starter picks";

/** Compact footer (auth screens, etc.). */
export const FOOTER_COMPACT = {
  offerLine: "Heritage pantry essentials for modern homes",
  needHelp: "Need Zeevan support?",
  customerCare: "Customer care",
  chatSupport247: "Order help · 24×7",
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
      { label: "Pay online (Razorpay)", url: RAZORPAY_PAY_URL },
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

/** Support screen (customer). */
export const SUPPORT_SCREEN = {
  pageTitle: "Support",
  pageSubtitle: "Fast help, chat and order support",
  pageHeaderSubtitle: "Fast help",
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
  loadErrorFallback: "Unable to load support chat.",
  sendErrorFallback: "Unable to send message.",
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
      a: "Refunds go back to your original payment method in a few business days.",
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
  pageSubtitle: "Orders, address & rewards",
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
  dangerHint: "Signed-in data stays on this device until you sign out.",
  signOutLabel: "Sign out",
};

/** Settings screen — short labels for density. */
export const SETTINGS_SCREEN = {
  pageTitle: "Settings",
  pageSubtitle: "Theme, alerts and account tools",
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
  savedPaymentsSoon: "Saved payments soon—see Support for help.",
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
  heroKicker: `${APP_DISPLAY_NAME} member sign in`,
  heroTitle: "Welcome back",
  heroSubtitle: "Sign in for quicker checkout, saved addresses, and live delivery updates.",
  authEyebrow: "Account access",
  authTitle: "Sign in",
  authSubtitle: "Use your Zeevan account email to continue smoothly.",
  heroHighlights: [
    { key: "checkout", label: "Fast checkout", icon: "bag-handle-outline" },
    { key: "address", label: "Saved addresses", icon: "location-outline" },
    { key: "tracking", label: "Live tracking", icon: "navigate-outline" },
  ],
  labelEmail: "Email",
  labelSecret: PASSWORD_LABEL,
  submitLoading: "Please wait…",
  submitCta: "Sign in",
  dividerOr: "or",
  createAccountCta: "Create new account",
  guestCta: "Continue as guest",
  assuranceNote: "Protected sign-in for your saved Zeevan details.",
  genericError: "Unable to sign in. Please try again.",
};

/** Register — [`RegisterScreen.js`](../screens/RegisterScreen.js). Validation lines mirror client checks. */
export const REGISTER_SCREEN = {
  heroBannerA11y: `Create your ${APP_DISPLAY_NAME} account`,
  heroKicker: `Create your ${APP_DISPLAY_NAME} account`,
  heroTitle: "Create your account",
  heroSubtitle: "Save addresses, reorder faster, and keep every delivery in view.",
  authEyebrow: "New account",
  authTitle: "Register",
  authSubtitle: "Secure checkout, saved details, and clearer order updates from day one.",
  heroHighlights: [
    { key: "address", label: "Save addresses", icon: "location-outline" },
    { key: "orders", label: "Track orders", icon: "cube-outline" },
    { key: "reorder", label: "Reorder faster", icon: "flash-outline" },
  ],
  labelFullName: "Full name",
  labelEmail: "Email",
  labelSecret: PASSWORD_LABEL,
  labelConfirmSecret: CONFIRM_PASSWORD_LABEL,
  credentialHelper: "Use 8+ characters with at least one letter and one number.",
  submitLoading: "Please wait…",
  submitCta: "Create account",
  dividerExisting: "Already have an account",
  signInInsteadCta: "Sign in instead",
  assuranceNote: "Your Zeevan account keeps your next checkout faster.",
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
  pageSubtitle: "Inbox, offers & order updates",
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
  pageSubtitle: "Name, photo & phone",
  photoOverline: "Profile",
  photoTitle: "Profile photo",
  accountOverline: "Account",
  accountTitle: "Basic details",
  loadErrorFallback: "Unable to load profile.",
};

/** Manage address — [`ManageAddressScreen.js`](../screens/ManageAddressScreen.js). */
export const MANAGE_ADDRESS_SCREEN = {
  pageTitle: "Delivery address",
  pageSubtitle: "Save where we deliver",
  cardTitleWhenFilled: "Update your address",
  cardTitleWhenEmpty: "Add your address",
  cardSubtitle: "Used for shipping and checkout.",
};

/** Rewards — [`RedeemRewardsScreen.js`](../screens/RedeemRewardsScreen.js). */
export const REDEEM_REWARDS_SCREEN = {
  pageTitle: "Rewards shop",
  pageSubtitle: "Points, coupons and premium savings",
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
  pageSubtitle: "Assigned orders",
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
  itemsOverline: "Bag",
  itemsTitle: "Your items",
  pairOverline: "Pair",
  pairTitle: "Add with your order",
  couponOverline: "Save",
  couponTitle: "Apply savings",
  summaryOverline: "Total",
  summaryTitle: "Checkout summary",
  addressOverline: "Delivery",
  trustPure: "Pure ingredients",
  trustPay: "Secure payments",
  trustOrganic: "Organic focus",
  emptyTitle: "Your cart is empty",
  emptyDescription: "Browse the shop and add items.",
  browseCta: "Browse products",
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
};

/** My Orders — buttons and compact copy (avoid repeating map/address lines). */
export const MY_ORDERS_UI = {
  pageTitle: "My orders",
  pageSubtitle: "Track progress and reorder faster",
  refreshCta: "Refresh",
  detailsExpand: "Details",
  detailsCollapse: "Hide",
  changeAddress: "Change address",
  /** Shown above the address edit form. */
  editAddressTitle: "Update address (5 min)",
  invoiceHintWeb: "Tip: print dialog → Save as PDF.",
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
  },
  home: {
    viewDefaults: HOME_VIEW_DEFAULTS,
    heroTitleDefault: HOME_HERO_TITLE_DEFAULT,
    heroSubtitleDefault: HOME_HERO_SUBTITLE_DEFAULT,
    heroBanner: HOME_HERO_BANNER,
    wordmarkTagline: HOME_WORDMARK_TAGLINE,
    labels: HOME_PAGE_LABELS,
    trustStrip: HOME_TRUST_STRIP,
    statsStrip: HOME_STATS_STRIP,
    testimonials: HOME_TESTIMONIALS,
    catalogIntro: HOME_CATALOG_INTRO,
    liveOrderCard: HOME_LIVE_ORDER_CARD,
    menuStarterTag: HOME_MENU_STARTER_TAG,
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
  location: LOCATION_BAR,
  delivery: { dashboard: DELIVERY_DASHBOARD_COPY, liveShare: DELIVERY_LIVE_SHARE },
  admin: ADMIN_SCREEN_COPY,
  adminHomeView: ADMIN_HOME_VIEW_COPY,
};
