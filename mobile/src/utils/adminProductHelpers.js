import { getProductPackagingImageUri } from "../content/productPackagingImages";
import { parseCatalogBoolean } from "./catalogBoolean";

const LOW_STOCK_MAX = 5;

export const PRODUCT_FILTER_TABS = [
  { key: "all", label: "All" },
  { key: "published", label: "Published" },
  { key: "draft", label: "Draft" },
  { key: "soon", label: "Coming soon" },
  { key: "low", label: "Low stock" },
  { key: "out", label: "Out of stock" },
];

export function productCoverUri(p) {
  const packaging = getProductPackagingImageUri(p);
  if (packaging) return packaging;
  const imgs = Array.isArray(p?.images) ? p.images : [];
  const first = imgs.find((u) => String(u || "").trim());
  if (first) return String(first).trim();
  if (p?.image && String(p.image).trim()) return String(p.image).trim();
  return "";
}

export function productStockMeta(p) {
  if (p?.isPublished === false) {
    return { label: "Draft", tone: "pend", pill: "soon" };
  }
  if (parseCatalogBoolean(p?.comingSoon, false)) {
    return { label: "Coming soon", tone: "soon", pill: "soon" };
  }
  const q = Math.max(0, Number(p?.stockQty) || 0);
  if (p?.inStock === false || q < 1) {
    return { label: "Out of stock", tone: "low", pill: "low" };
  }
  if (q <= LOW_STOCK_MAX) {
    return { label: "Low stock", tone: "pend", pill: "pend" };
  }
  return { label: "In stock", tone: "ok", pill: "ok" };
}

export function catalogSummary(products) {
  let inStock = 0;
  let low = 0;
  let out = 0;
  let draft = 0;
  let soon = 0;
  for (const p of products) {
    if (p.isPublished === false) {
      draft += 1;
      continue;
    }
    if (parseCatalogBoolean(p.comingSoon, false)) {
      soon += 1;
      continue;
    }
    const meta = productStockMeta(p);
    if (meta.pill === "low") out += 1;
    else if (meta.pill === "pend") low += 1;
    else inStock += 1;
  }
  return { total: products.length, inStock, low, out, draft, soon };
}

export function matchesProductFilter(p, filterKey) {
  if (filterKey === "all") return true;
  const meta = productStockMeta(p);
  if (filterKey === "published") return p.isPublished !== false && !p.comingSoon;
  if (filterKey === "draft") return p.isPublished === false;
  if (filterKey === "soon") return parseCatalogBoolean(p.comingSoon, false);
  if (filterKey === "low") return meta.pill === "pend" && p.isPublished !== false && !p.comingSoon;
  if (filterKey === "out") return meta.pill === "low";
  return true;
}

export const PRODUCT_FORM_TABS = [
  { key: "basics", label: "Basics" },
  { key: "listing", label: "Store listing" },
  { key: "page", label: "Product page" },
];

export const PRODUCT_PAGE_TABS = [
  { key: "hero", label: "Hero & buy" },
  { key: "story", label: "Story & USPs" },
  { key: "nutrition", label: "Nutrition" },
  { key: "usage", label: "Usage" },
];

export const COMMON_IONICONS = [
  "shield-checkmark-outline",
  "leaf-outline",
  "flask-outline",
  "heart-outline",
  "star-outline",
  "cafe-outline",
  "water-outline",
  "nutrition-outline",
  "sparkles-outline",
  "checkmark-circle-outline",
];

function filledCount(checks) {
  return checks.filter(Boolean).length;
}

function pct(done, total) {
  if (!total) return 100;
  return Math.round((done / total) * 100);
}

/** Progress % for admin add/edit product wizard. */
export function computeProductFormProgress(snapshot) {
  const s = snapshot || {};
  const basicsDone = filledCount([
    String(s.name || "").trim(),
    String(s.price || "").trim(),
    s.primaryImage || (Array.isArray(s.photoUrls) && s.photoUrls.length),
    String(s.category || "").trim(),
  ]);
  const basics = pct(basicsDone, 4);

  const listingDone = filledCount([
    String(s.homeSection || "").trim(),
    String(s.productType || "").trim(),
    s.isPublished !== undefined,
  ]);
  const listing = pct(listingDone, 3);

  const pageFields = [
    String(s.description || "").trim(),
    String(s.pageEyebrow || "").trim(),
    s.richProductPage,
    Array.isArray(s.trustRows) && s.trustRows.some((r) => r?.label),
    Array.isArray(s.variantRows) && s.variantRows.some((r) => r?.label),
    String(s.storyTitle || "").trim(),
    Array.isArray(s.uspRows) && s.uspRows.some((r) => r?.title),
    String(s.nutritionTitle || "").trim(),
    Array.isArray(s.usageRows) && s.usageRows.some((r) => r?.title),
  ];
  const pageDone = filledCount(pageFields);
  const page = pct(pageDone, Math.max(pageFields.length, 1));

  return {
    basics,
    listing,
    page,
    overall: Math.round((basics + listing + page) / 3),
  };
}

export function buildFormProgressItems(progress) {
  const p = progress || { basics: 0, listing: 0, page: 0 };
  return [
    {
      key: "basics",
      label: "Basics",
      percent: p.basics,
      hint: p.basics >= 100 ? "Ready to publish" : "Name, price, photo, category",
    },
    {
      key: "listing",
      label: "Store listing",
      percent: p.listing,
      hint: "Shop, home & launch settings",
    },
    {
      key: "page",
      label: "Product page",
      percent: p.page,
      hint: "Optional rich PDP content",
    },
  ];
}
