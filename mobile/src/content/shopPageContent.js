/**
 * Shop page — copy, filters, layout & collection defaults.
 * @see screens/ShopScreen.js and components/shop/*
 */
import { ZEEVAN_PRODUCT_LINES } from "./zeevanCatalogContent";

const LINE_PILLS = ZEEVAN_PRODUCT_LINES.map((line) => line.shopPill);

/** Price filter presets — shared by sidebar & chip UI. */
export const SHOP_PRICE_PRESETS = [
  { id: "any", label: "Any", min: null, max: null },
  { id: "under-1k", label: "Under ₹1k", min: 0, max: 999 },
  { id: "1k-2.5k", label: "₹1k – 2.5k", min: 1000, max: 2500 },
  { id: "2.5k-5k", label: "₹2.5k – 5k", min: 2500, max: 5000 },
  { id: "5k-plus", label: "₹5k+", min: 5000, max: null },
];

/** Quick-pick collection cards — maps to shop pills. */
export function buildShopCollectionLines() {
  return ZEEVAN_PRODUCT_LINES.map((line) => ({
    key: line.key,
    pill: line.shopPill,
    label: line.label,
    icon: line.icon,
    gradient: line.gradient,
    gradientDark: line.gradientDark,
    accent: line.accent,
  }));
}

export const SHOP_SCREEN_UI = {
  pageEyebrow: "",
  pageTitle: "Shop",
  pageTitleWide: "Shop",
  pageSubtitle: "",
  searchPlaceholder: "Search products…",
  refineTitle: "Filters",
  resetFilters: "Clear",
  sortA11y: "Sort",
  filterSort: "Sort",
  categoryRailTitle: "",
  lineQuickPickTitle: "",
  countFormat: "items",
  clearFilters: "Clear",
  filtersOpen: "Filters",
  filtersClose: "Close",
  emptyTitle: "Nothing here yet",
  emptyDescription: "",
  emptyCta: "Refresh",
  emptyMatchesTitle: "No results",
  emptyMatchesDescription: "",
  viewAllCta: "View all",
  filterCollection: "Range",
  filterCategory: "Category",
  filterRating: "Rating",
  filterPrice: "Price",
  priceMin: "₹500",
  priceMax: "₹8,000",
  collectionPills: ["All", ...LINE_PILLS],
  ratingOptions: [
    { min: 4, label: "4★+" },
    { min: 3, label: "3★+" },
    { min: 0, label: "Any" },
  ],
  sortOptions: [
    { key: "featured", label: "Featured" },
    { key: "price-asc", label: "Price ↑" },
    { key: "price-desc", label: "Price ↓" },
    { key: "newest", label: "New" },
  ],
  hero: {
    eyebrow: "",
    title: "",
    body: "",
    totalLabel: "Total",
    inStockLabel: "In stock",
    comingSoonLabel: "Soon",
    onSaleLabel: "Sale",
  },
  trustLine: "",
  trustBadges: [],
  features: [],
  deliveryNote: "",
  layout: {
    showPageHeader: false,
    showPageSubtitle: false,
    showCatalogHero: false,
    showFeaturesStrip: false,
    showDeliveryNote: false,
    showTrustStrip: false,
    showCategoryRail: false,
    showLineQuickPick: true,
    showHeroTitle: false,
    showHeroBody: false,
    showCategoryRailTitle: false,
    showNativeMetaLine: false,
    showNativeSortRow: false,
    showToolbarSort: true,
    hideToolbarPillsWhenQuickPick: true,
    premiumLean: true,
  },
  card: {
    addA11y: "Add to cart",
    soldOut: "Sold out",
    comingSoon: "Soon",
    comingSoonNoteFallback: "Launching soon",
    comingSoonPreview: "Preview",
    unitFallback: "1 pc",
    noImage: "No image",
    imageUnavailable: "Unavailable",
  },
};

/** Rating chip label for current minRating value. */
export function shopRatingLabelFromValue(minRating) {
  const opts = SHOP_SCREEN_UI.ratingOptions;
  if (minRating >= 4) return opts.find((o) => o.min === 4)?.label || "4★+";
  if (minRating >= 3) return opts.find((o) => o.min === 3)?.label || "3★+";
  return opts.find((o) => o.min === 0)?.label || "Any";
}

/** Rating chip labels for filter UI. */
export function shopRatingChipLabels() {
  return SHOP_SCREEN_UI.ratingOptions.map((o) => o.label);
}

/** Toolbar product count — lean copy. */
export function formatShopResultCount(filtered, total) {
  const n = Number(filtered) || 0;
  if (SHOP_SCREEN_UI.countFormat === "items") {
    return n === 1 ? "1 item" : `${n} items`;
  }
  return `${n} / ${Number(total) || 0}`;
}
