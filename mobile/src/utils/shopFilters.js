import { formatINR } from "./currency";
import { matchProductLinePill } from "../content/zeevanCatalogContent";
import { SHOP_PRICE_PRESETS } from "../content/shopPageContent";
import { getShopCatalogProducts, isProductComingSoon } from "./productAvailability";

export { SHOP_PRICE_PRESETS };

/** Home / Figma labels → product `category` / `productType` values in the catalog. */
const CATEGORY_ALIASES = {
  home: ["home & kitchen", "home and kitchen", "home", "kitchen"],
  kitchen: ["home & kitchen", "kitchen", "home and kitchen"],
  wellness: ["wellness"],
  lifestyle: ["lifestyle"],
  accessories: ["accessories"],
  general: ["general"],
  ghee: ["ghee", "a2 ghee", "bilona"],
  tel: ["tel", "oil", "cooking oil"],
  masala: ["masala", "spice", "spices"],
  honey: ["honey", "haldar honey", "haldar"],
};

function normalizeCategoryLabel(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
}

export function getProductCategoryLabels(product) {
  const cat = String(product?.category || "").trim();
  const type = String(product?.productType || "").trim();
  return [...new Set([cat, type].filter(Boolean))];
}

/** Match selected shop categories (from chips / home deep links). */
export function matchShopCategories(product, selectedCategories = []) {
  if (!selectedCategories.length) return true;

  const productLabels = getProductCategoryLabels(product).map(normalizeCategoryLabel);
  if (!productLabels.length) return false;

  return selectedCategories.some((filter) => {
    const f = normalizeCategoryLabel(filter);
    if (!f) return true;

    if (productLabels.some((pl) => pl === f || pl.includes(f) || f.includes(pl))) {
      return true;
    }

    const aliases = CATEGORY_ALIASES[f] || [];
    return aliases.some((alias) => {
      const a = normalizeCategoryLabel(alias);
      return productLabels.some((pl) => pl === a || pl.includes(a) || a.includes(pl));
    });
  });
}

export function getProductRating(product) {
  const raw = product?.ratingAverage ?? product?.rating ?? product?.averageRating;
  const value = Number(raw);
  return Number.isFinite(value) ? value : 0;
}

export function getProductPrice(product) {
  const value = Number(product?.price);
  return Number.isFinite(value) && value >= 0 ? value : 0;
}

export function isProductOnSale(product) {
  const mrp = Number(product?.mrp);
  const price = getProductPrice(product);
  return Number.isFinite(mrp) && mrp > price;
}

export function isProductPremium(product) {
  return getProductPrice(product) >= 1500;
}

/** Catalog min/max for price slider labels. */
export function getCatalogPriceBounds(products = []) {
  const prices = (Array.isArray(products) ? products : [])
    .map(getProductPrice)
    .filter((n) => n > 0);
  if (!prices.length) {
    return { min: 500, max: 8000 };
  }
  const min = Math.floor(Math.min(...prices) / 100) * 100;
  const max = Math.ceil(Math.max(...prices) / 100) * 100;
  return { min: Math.max(0, min), max: Math.max(min + 100, max) };
}

export function pricePresetFromRange(minPrice, maxPrice) {
  const match = SHOP_PRICE_PRESETS.find(
    (p) => p.min === minPrice && p.max === maxPrice
  );
  return match?.id || (minPrice == null && maxPrice == null ? "any" : "custom");
}

export function rangeFromPricePreset(presetId) {
  const preset = SHOP_PRICE_PRESETS.find((p) => p.id === presetId);
  if (!preset) return { min: null, max: null };
  return { min: preset.min, max: preset.max };
}

export function formatPriceRangeLabel(minPrice, maxPrice) {
  if (minPrice == null && maxPrice == null) return "Any price";
  if (minPrice != null && maxPrice != null) {
    return `${formatINR(minPrice)} – ${formatINR(maxPrice)}`;
  }
  if (minPrice != null) return `${formatINR(minPrice)}+`;
  if (maxPrice != null) return `Under ${formatINR(maxPrice + 1)}`;
  return "Any price";
}

export function getPriceRangeFill(minPrice, maxPrice, bounds) {
  const floor = bounds?.min ?? 0;
  const ceil = bounds?.max ?? 8000;
  const span = Math.max(ceil - floor, 1);
  const lo = minPrice != null ? minPrice : floor;
  const hi = maxPrice != null ? maxPrice : ceil;
  const leftPct = Math.max(0, Math.min(100, ((lo - floor) / span) * 100));
  const rightPct = Math.max(leftPct + 4, Math.min(100, ((hi - floor) / span) * 100));
  return {
    leftPct,
    rightPct,
    left: `${leftPct}%`,
    width: `${Math.max(4, rightPct - leftPct)}%`,
  };
}

function matchPriceRange(product, minPrice, maxPrice) {
  const price = getProductPrice(product);
  if (minPrice != null && price < minPrice) return false;
  if (maxPrice != null && price > maxPrice) return false;
  return true;
}

/** Case-insensitive name / category / tag match for shop search. */
export function matchShopSearchQuery(product, query = "") {
  const q = String(query || "").trim().toLowerCase();
  if (!q) return true;

  const tags = Array.isArray(product?.tags) ? product.tags : [];
  const haystack = [
    product?.name,
    product?.description,
    product?.category,
    product?.productType,
    product?.sku,
    ...tags,
  ]
    .flatMap((value) => (Array.isArray(value) ? value : [value]))
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  return q.split(/\s+/).every((token) => haystack.includes(token));
}

function getProductSortTime(product) {
  const raw = product?.createdAt ?? product?.updatedAt;
  const ts = raw ? Date.parse(String(raw)) : NaN;
  if (Number.isFinite(ts)) return ts;
  const order = Number(product?.homeOrder);
  if (Number.isFinite(order)) return order;
  return 0;
}

/**
 * Apply shop catalog filters — shared by native + web `ShopScreen`.
 */
export function applyShopFilters(
  products,
  {
    categories = [],
    pill = "All",
    minRating = 0,
    minPrice = null,
    maxPrice = null,
    sortKey = "featured",
    searchQuery = "",
  } = {}
) {
  let list = getShopCatalogProducts(products);

  const trimmedQuery = String(searchQuery || "").trim();
  if (trimmedQuery) {
    list = list.filter((p) => matchShopSearchQuery(p, trimmedQuery));
  }

  if (categories.length) {
    list = list.filter((p) => matchShopCategories(p, categories));
  }

  if (pill === "Sale" || pill === "On sale") {
    list = list.filter(isProductOnSale);
  } else if (pill === "Premium") {
    list = list.filter(isProductPremium);
  } else if (pill === "Soon" || pill === "Coming soon") {
    list = list.filter(isProductComingSoon);
  } else if (pill === "New" || pill === "New in") {
    list = [...list].sort((a, b) => getProductSortTime(b) - getProductSortTime(a)).slice(0, 8);
  } else if (["Ghee", "Tel", "Masala", "Honey"].includes(pill)) {
    list = list.filter((p) => matchProductLinePill(p, pill));
  }

  if (minRating >= 4) {
    list = list.filter((p) => getProductRating(p) >= 4);
  } else if (minRating >= 3) {
    list = list.filter((p) => getProductRating(p) >= 3);
  }

  if (minPrice != null || maxPrice != null) {
    list = list.filter((p) => matchPriceRange(p, minPrice, maxPrice));
  }

  if (sortKey === "price-asc") {
    list = [...list].sort((a, b) => getProductPrice(a) - getProductPrice(b));
  } else if (sortKey === "price-desc") {
    list = [...list].sort((a, b) => getProductPrice(b) - getProductPrice(a));
  } else if (sortKey === "newest") {
    list = [...list].sort((a, b) => getProductSortTime(b) - getProductSortTime(a));
  }

  return list;
}

export function hasActiveShopFilters({
  pill = "All",
  categories = [],
  minRating = 0,
  minPrice = null,
  maxPrice = null,
  sortKey = "featured",
  searchQuery = "",
} = {}) {
  return (
    pill !== "All" ||
    categories.length > 0 ||
    minRating > 0 ||
    minPrice != null ||
    maxPrice != null ||
    sortKey !== "featured" ||
    Boolean(String(searchQuery || "").trim())
  );
}

export { getHomeCatalogProducts } from "./productAvailability";

export function countShopFilterBadge({
  pill = "All",
  categories = [],
  minRating = 0,
  minPrice = null,
  maxPrice = null,
  sortKey = "featured",
  searchQuery = "",
} = {}) {
  let n = 0;
  if (pill !== "All") n += 1;
  n += categories.length;
  if (minRating > 0) n += 1;
  if (minPrice != null || maxPrice != null) n += 1;
  if (sortKey !== "featured") n += 1;
  if (String(searchQuery || "").trim()) n += 1;
  return n;
}
