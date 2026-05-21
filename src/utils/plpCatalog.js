/** @typedef {{ categories: Set<string>, types: Set<string>, brands: Set<string>, sizes: Set<string>, colors: Set<string>, priceMin: number|null, priceMax: number|null, minRating: number|null, discountOnly: boolean, inStockOnly: boolean }} PlpFilters */

export const PLP_PAGE_SIZE = 12;

export const PLP_COLOR_SWATCHES = [
  { key: "black", label: "Black", hex: "#1A1A1A", match: ["black", "charcoal"] },
  { key: "white", label: "White", hex: "#F5F5F4", match: ["white", "ivory", "cream"] },
  { key: "brown", label: "Brown", hex: "#8B6914", match: ["brown", "tan", "beige", "gold"] },
  { key: "green", label: "Green", hex: "#4A7C59", match: ["green", "olive", "herb"] },
  { key: "red", label: "Red", hex: "#B91C1C", match: ["red", "maroon", "crimson"] },
  { key: "blue", label: "Blue", hex: "#2563EB", match: ["blue", "navy", "indigo"] },
];

const RATING_THRESHOLDS = [4, 3, 2];

function productSearchBlob(p) {
  return [p.name, p.category, p.productType, p.brand, p.unit, p.description]
    .concat((p.variants || []).map((v) => v.label))
    .join(" ")
    .toLowerCase();
}

function hasDiscount(p) {
  const price = Number(p.price || 0);
  const mrp = Number(p.mrp || 0);
  return p.featuredDeal === true || (mrp > 0 && price < mrp);
}

function productSizes(p) {
  const set = new Set();
  const unit = String(p.unit || "").trim();
  if (unit) set.add(unit);
  (p.variants || []).forEach((v) => {
    const label = String(v.label || "").trim();
    if (label) set.add(label);
  });
  return [...set];
}

function productMatchesColor(p, colorKey) {
  const sw = PLP_COLOR_SWATCHES.find((c) => c.key === colorKey);
  if (!sw) return false;
  const blob = productSearchBlob(p);
  return sw.match.some((term) => blob.includes(term));
}

export function extractFacets(products) {
  const categories = new Set();
  const types = new Set();
  const brands = new Set();
  const sizes = new Set();
  let priceMin = Infinity;
  let priceMax = 0;

  products.forEach((p) => {
    const cat = String(p.category || "").trim();
    if (cat) categories.add(cat);
    const type = String(p.productType || "").trim();
    if (type) types.add(type);
    const brand = String(p.brand || "").trim();
    if (brand) brands.add(brand);
    productSizes(p).forEach((s) => sizes.add(s));
    const price = Number(p.price || 0);
    if (Number.isFinite(price)) {
      priceMin = Math.min(priceMin, price);
      priceMax = Math.max(priceMax, price);
    }
  });

  if (!Number.isFinite(priceMin)) priceMin = 0;
  if (priceMax < priceMin) priceMax = priceMin;

  return {
    categories: [...categories].sort((a, b) => a.localeCompare(b)),
    types: [...types].sort((a, b) => a.localeCompare(b)),
    brands: [...brands].sort((a, b) => a.localeCompare(b)),
    sizes: [...sizes].sort((a, b) => a.localeCompare(b)),
    priceBounds: { min: Math.floor(priceMin), max: Math.ceil(priceMax) },
    ratingOptions: RATING_THRESHOLDS,
    colors: PLP_COLOR_SWATCHES,
  };
}

/** @returns {PlpFilters} */
export function createEmptyFilters(priceBounds = { min: 0, max: 0 }) {
  return {
    categories: new Set(),
    types: new Set(),
    brands: new Set(),
    sizes: new Set(),
    colors: new Set(),
    priceMin: priceBounds.min,
    priceMax: priceBounds.max,
    minRating: null,
    discountOnly: false,
    inStockOnly: false,
  };
}

export function applyPlpFilters(products, filters, priceBounds) {
  let list = products;
  const lo = filters.priceMin ?? priceBounds.min;
  const hi = filters.priceMax ?? priceBounds.max;

  list = list.filter((p) => {
    const price = Number(p.price || 0);
    if (price < lo || price > hi) return false;
    if (filters.inStockOnly && (p.inStock === false || Number(p.stockQty || 0) <= 0)) return false;
    if (filters.discountOnly && !hasDiscount(p)) return false;
    if (filters.minRating != null && Number(p.ratingAverage || 0) < filters.minRating) return false;
    if (filters.categories.size && !filters.categories.has(String(p.category || "").trim())) return false;
    if (filters.types.size && !filters.types.has(String(p.productType || "").trim())) return false;
    if (filters.brands.size && !filters.brands.has(String(p.brand || "").trim())) return false;
    if (filters.sizes.size) {
      const pSizes = productSizes(p);
      if (!pSizes.some((s) => filters.sizes.has(s))) return false;
    }
    if (filters.colors.size) {
      const ok = [...filters.colors].some((c) => productMatchesColor(p, c));
      if (!ok) return false;
    }
    return true;
  });

  return list;
}

export function sortPlpProducts(items, sortKey) {
  const copy = [...items];
  if (sortKey === "priceAsc") copy.sort((a, b) => Number(a.price || 0) - Number(b.price || 0));
  else if (sortKey === "priceDesc") copy.sort((a, b) => Number(b.price || 0) - Number(a.price || 0));
  else if (sortKey === "rating") copy.sort((a, b) => Number(b.ratingAverage || 0) - Number(a.ratingAverage || 0));
  else if (sortKey === "popular") {
    copy.sort((a, b) => {
      const ra = Number(a.reviewCount || 0);
      const rb = Number(b.reviewCount || 0);
      if (rb !== ra) return rb - ra;
      return Number(b.homeOrder || 0) - Number(a.homeOrder || 0);
    });
  } else if (sortKey === "newest") {
    copy.sort((a, b) => {
      const da = new Date(a.createdAt || 0).getTime();
      const db = new Date(b.createdAt || 0).getTime();
      if (db !== da) return db - da;
      return Number(b.homeOrder || 0) - Number(a.homeOrder || 0);
    });
  } else {
    copy.sort((a, b) => {
      const oa = Number.isFinite(Number(a.homeOrder)) ? Number(a.homeOrder) : 0;
      const ob = Number.isFinite(Number(b.homeOrder)) ? Number(b.homeOrder) : 0;
      if (oa !== ob) return oa - ob;
      return String(a.name || "").localeCompare(String(b.name || ""));
    });
  }
  return copy;
}

function splitCsv(value) {
  return String(value || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

export function parsePlpParams(params = {}, priceBounds = { min: 0, max: 0 }) {
  const filters = createEmptyFilters(priceBounds);
  filters.categories = new Set(splitCsv(params.cats));
  filters.types = new Set(splitCsv(params.types));
  filters.brands = new Set(splitCsv(params.brands));
  filters.sizes = new Set(splitCsv(params.sizes));
  filters.colors = new Set(splitCsv(params.colors));
  const pMin = Number(params.priceMin);
  const pMax = Number(params.priceMax);
  if (Number.isFinite(pMin)) filters.priceMin = pMin;
  if (Number.isFinite(pMax)) filters.priceMax = pMax;
  const rating = Number(params.rating);
  if (RATING_THRESHOLDS.includes(rating)) filters.minRating = rating;
  filters.discountOnly = params.discount === "1" || params.discount === true;
  filters.inStockOnly = params.stock === "1" || params.stock === true;
  const sort = String(params.sort || "featured").trim() || "featured";
  return { filters, sort };
}

export function serializePlpParams(filters, sortKey, routeContext = {}) {
  const out = { ...routeContext };
  if (sortKey && sortKey !== "featured") out.sort = sortKey;
  else delete out.sort;

  if (filters.priceMin != null && filters.priceMin > 0) out.priceMin = String(Math.round(filters.priceMin));
  else delete out.priceMin;
  if (filters.priceMax != null) out.priceMax = String(Math.round(filters.priceMax));
  else delete out.priceMax;

  if (filters.categories.size) out.cats = [...filters.categories].join(",");
  else delete out.cats;
  if (filters.types.size) out.types = [...filters.types].join(",");
  else delete out.types;
  if (filters.brands.size) out.brands = [...filters.brands].join(",");
  else delete out.brands;
  if (filters.sizes.size) out.sizes = [...filters.sizes].join(",");
  else delete out.sizes;
  if (filters.colors.size) out.colors = [...filters.colors].join(",");
  else delete out.colors;
  if (filters.minRating != null) out.rating = String(filters.minRating);
  else delete out.rating;
  if (filters.discountOnly) out.discount = "1";
  else delete out.discount;
  if (filters.inStockOnly) out.stock = "1";
  else delete out.stock;

  return out;
}

export function countActiveFilters(filters, priceBounds) {
  let n = 0;
  n += filters.categories.size + filters.types.size + filters.brands.size + filters.sizes.size + filters.colors.size;
  if (filters.inStockOnly) n += 1;
  if (filters.discountOnly) n += 1;
  if (filters.minRating != null) n += 1;
  if (filters.priceMin != null && filters.priceMin > priceBounds.min) n += 1;
  if (filters.priceMax != null && filters.priceMax < priceBounds.max) n += 1;
  return n;
}

export function suggestSearchSpellings(query, catalog = []) {
  const q = String(query || "").trim().toLowerCase();
  if (!q || q.length < 3) return [];
  const names = new Set();
  catalog.forEach((p) => {
    String(p.name || "")
      .split(/\s+/)
      .forEach((w) => {
        if (w.length >= 4) names.add(w.toLowerCase());
      });
  });
  return [...names]
    .filter((w) => w.startsWith(q.slice(0, 2)) && w !== q)
    .slice(0, 4);
}
