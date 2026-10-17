/**
 * Storefront data helpers — derive lines, tiles, pricing and labels from the API catalog.
 * Pure functions, no React.
 */
import { ZEEVAN_PRODUCT_LINES, matchProductLine } from "../content/zeevanCatalogContent";
import { STORE_HEADER } from "../content/storefrontContent";
import { productCoverUri } from "./adminProductHelpers";
import { getImageUriCandidates } from "./image";
import { isProductComingSoon, isProductOutOfStock } from "./productAvailability";

const GIFT_RE = /\b(gift|gifting|hamper|combo)\b/i;
const LOW_STOCK_MAX = 5;

/** Line order used by tabs, rails and the category grid. */
export const STORE_LINE_ORDER = ["ghee", "tel", "masala", "honey", "gifts"];

function norm(value) {
  return String(value || "").trim().toLowerCase();
}

export function isGiftProduct(product) {
  const hay = [product?.category, product?.productType, product?.name].map((v) => String(v || "")).join(" ");
  return GIFT_RE.test(hay);
}

/** Which storefront line a product belongs to: ghee | tel | masala | honey | gifts | null. */
export function getProductLine(product) {
  if (!product) return null;
  if (isGiftProduct(product)) return "gifts";
  const category = norm(product.category);
  for (const line of ZEEVAN_PRODUCT_LINES) {
    if (category && (category === line.key || category === norm(line.label) || category === norm(line.shopPill))) {
      return line.key;
    }
  }
  for (const line of ZEEVAN_PRODUCT_LINES) {
    if (matchProductLine(product, line.key)) return line.key;
  }
  return null;
}

export function productsForLine(products, lineKey) {
  const list = Array.isArray(products) ? products : [];
  if (!lineKey || lineKey === "all") return list;
  return list.filter((p) => getProductLine(p) === lineKey);
}

/** Resolve a bento/pick `match` rule into an ordered product list. */
export function resolveMatchProducts(products, match = {}) {
  const list = Array.isArray(products) ? products : [];
  if (match.featured) {
    const special = list.filter((p) => p.isSpecial);
    const pool = special.length ? special : list;
    return [...pool].sort((a, b) => (Number(b.ratingAverage) || 0) - (Number(a.ratingAverage) || 0));
  }
  const keys = match.lineKeys || (match.lineKey ? [match.lineKey] : []);
  if (!keys.length) return list;
  return keys.flatMap((key) => productsForLine(list, key));
}

/** The single product that illustrates a bento tile. */
export function pickTileProduct(products, match = {}) {
  const pool = resolveMatchProducts(products, match).filter((p) => productImageUri(p));
  if (!pool.length) return null;
  const index = Number(match.index) || 0;
  return pool[index % pool.length] || pool[0];
}

/** Optimised cover image URL for a product, sized for the given display width (points). */
export function productImageUri(product, width = 480) {
  const raw = productCoverUri(product);
  if (!raw) return "";
  return getImageUriCandidates(raw, { width: Math.round(width * 2), quality: "auto:good" })[0] || "";
}

/** Gallery image URLs (up to `max`) for the card carousel dots. */
export function productGalleryUris(product, width = 480, max = 4) {
  const imgs = Array.isArray(product?.images) ? product.images : [];
  const urls = imgs
    .map((u) => String(u || "").trim())
    .filter(Boolean)
    .map((raw) => getImageUriCandidates(raw, { width: Math.round(width * 2), quality: "auto:good" })[0])
    .filter(Boolean);
  const unique = [...new Set(urls)];
  if (unique.length) return unique.slice(0, max);
  const single = productImageUri(product, width);
  return single ? [single] : [];
}

/** Display pricing: honours variants (“From ₹449”) and MRP discounts. */
export function getProductPricing(product) {
  const variants = Array.isArray(product?.variants) ? product.variants.filter((v) => v?.label) : [];
  const hasOptions = variants.length > 1;
  const base = Number(product?.price) || 0;

  if (variants.length) {
    const prices = variants.map((v) => Number(v.price) || 0);
    const price = hasOptions ? Math.min(...prices) : prices[0];
    return { price, mrp: null, discountPct: null, hasOptions, optionCount: variants.length, from: hasOptions };
  }

  const mrpRaw = Number(product?.mrp);
  const mrp = Number.isFinite(mrpRaw) && mrpRaw > base ? mrpRaw : null;
  const discountPct = mrp ? Math.max(1, Math.round((1 - base / mrp) * 100)) : null;
  return { price: base, mrp, discountPct, hasOptions: false, optionCount: 0, from: false };
}

/** Short stock hint like “2 left”, or "" when plenty. */
export function getStockHint(product) {
  if (isProductComingSoon(product) || isProductOutOfStock(product)) return "";
  const qty = Number(product?.stockQty);
  if (Number.isFinite(qty) && qty > 0 && qty <= LOW_STOCK_MAX) return `${qty} left`;
  return "";
}

/** Admin-entered delivery note (e.g. “10 mins”) — only shown when explicitly set. */
export function getEtaLabel(product) {
  const raw = String(product?.eta || "").trim();
  if (!raw) return "";
  const lower = raw.toLowerCase();
  return lower.charAt(0).toUpperCase() + lower.slice(1);
}

export function getUnitLabel(product) {
  const pricing = getProductPricing(product);
  if (pricing.hasOptions) return `${pricing.optionCount} sizes`;
  const variants = Array.isArray(product?.variants) ? product.variants : [];
  if (variants.length === 1 && variants[0]?.label) return String(variants[0].label);
  return String(product?.unit || "").trim() || "1 pc";
}

/**
 * Category grid tiles from the catalog — grouped by product type (falls back to category).
 * Each tile carries a cover image from its first product and the full product list.
 */
export function buildCategoryTiles(products, { max = 8 } = {}) {
  const groups = new Map();
  (Array.isArray(products) ? products : []).forEach((product) => {
    const type = String(product.productType || "").trim();
    const category = String(product.category || "").trim();
    const generic = (v) => !v || norm(v) === "general";
    const label = !generic(type) ? type : !generic(category) ? category : "More";
    const key = norm(label);
    if (!groups.has(key)) {
      groups.set(key, { key, label, line: getProductLine(product), products: [], image: "" });
    }
    const group = groups.get(key);
    group.products.push(product);
    if (!group.image) group.image = productImageUri(product, 200);
  });

  const lineRank = (line) => {
    const idx = STORE_LINE_ORDER.indexOf(line);
    return idx < 0 ? STORE_LINE_ORDER.length : idx;
  };
  return [...groups.values()]
    .sort((a, b) => lineRank(a.line) - lineRank(b.line) || b.products.length - a.products.length)
    .slice(0, max)
    .map((g) => ({ ...g, count: g.products.length }));
}

/** Tabs that actually have products (plus “All”). Falls back to all tabs when the catalog is empty. */
export function visibleTabs(tabs, products) {
  const list = Array.isArray(products) ? products : [];
  if (!list.length) return tabs;
  const present = new Set(list.map(getProductLine).filter(Boolean));
  return tabs.filter((tab) => tab.key === "all" || !tab.lineKey || present.has(tab.lineKey));
}

export function getGreetingPart(date = new Date()) {
  const h = date.getHours();
  if (h < 12) return "morning";
  if (h < 17) return "afternoon";
  return "evening";
}

export function getGreetingLabel(date = new Date()) {
  return STORE_HEADER.greetingByPart[getGreetingPart(date)];
}

export function getFirstName(user) {
  const name = String(user?.name || "").trim();
  if (!name) return "";
  return name.split(/\s+/)[0];
}

/** Great-circle distance in km, or null when a point is missing. */
export function distanceKm(a, b) {
  const lat1 = Number(a?.latitude);
  const lon1 = Number(a?.longitude);
  const lat2 = Number(b?.latitude);
  const lon2 = Number(b?.longitude);
  if (![lat1, lon1, lat2, lon2].every(Number.isFinite)) return null;
  const rad = Math.PI / 180;
  const dLat = (lat2 - lat1) * rad;
  const dLon = (lon2 - lon1) * rad;
  const h =
    Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * rad) * Math.cos(lat2 * rad) * Math.sin(dLon / 2) ** 2;
  return 6371 * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
}

export function formatDistanceKm(km) {
  if (!Number.isFinite(km)) return "";
  if (km < 1) return `${Math.max(100, Math.round((km * 1000) / 50) * 50)} m`;
  return `${km < 10 ? km.toFixed(1).replace(/\.0$/, "") : Math.round(km)} km`;
}
