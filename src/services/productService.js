import { getApiBaseUrl } from "./apiBase";
import { HOME_VIEW_DEFAULTS } from "../content/appContent";
import { normalizeHeroSubtitle, normalizeHeroTitle } from "../utils/homeMarketingCopy";
import { normalizeProduct } from "./normalizeProduct";

export { normalizeProduct };

function apiUrl(path) {
  return `${getApiBaseUrl()}${path}`;
}

const PRODUCTS_CACHE_TTL_MS = 60 * 1000;
const PRODUCT_DETAIL_CACHE_TTL_MS = 5 * 60 * 1000;
let productsCache = {
  data: null,
  fetchedAt: 0,
  promise: null,
};
const productDetailCache = new Map();

export async function getProducts() {
  const now = Date.now();
  if (productsCache.data && now - productsCache.fetchedAt < PRODUCTS_CACHE_TTL_MS) {
    return productsCache.data;
  }
  if (productsCache.promise) {
    return productsCache.promise;
  }

  productsCache.promise = (async () => {
    const response = await fetch(apiUrl("/products"));
    const data = await response.json().catch(() => []);
    if (!response.ok) {
      const msg =
        typeof data?.message === "string" && data.message.trim()
          ? data.message.trim()
          : "Unable to load products.";
      throw new Error(msg);
    }
    const normalized = data.map(normalizeProduct);
    productsCache = {
      data: normalized,
      fetchedAt: Date.now(),
      promise: null,
    };
    return normalized;
  })();

  try {
    return await productsCache.promise;
  } catch (error) {
    productsCache.promise = null;
    throw error;
  }
}

export function invalidateProductsCache() {
  productsCache = {
    data: null,
    fetchedAt: 0,
    promise: null,
  };
}

export async function getProductById(id) {
  const key = String(id || "").trim();
  if (!key) return null;

  const cached = productDetailCache.get(key);
  if (cached && Date.now() - cached.fetchedAt < PRODUCT_DETAIL_CACHE_TTL_MS) {
    return cached.data;
  }

  try {
    const response = await fetch(apiUrl(`/products/${encodeURIComponent(key)}`));
    const data = await response.json().catch(() => null);
    if (response.ok && data) {
      const normalized = normalizeProduct(data);
      productDetailCache.set(key, { data: normalized, fetchedAt: Date.now() });
      return normalized;
    }
  } catch {
    /* fall through to catalog cache */
  }

  const allProducts = await getProducts();
  const fromCatalog = allProducts.find((item) => String(item.id) === key) || null;
  if (fromCatalog) {
    productDetailCache.set(key, { data: fromCatalog, fetchedAt: Date.now() });
  }
  return fromCatalog;
}

export function invalidateProductDetailCache(id) {
  if (id) productDetailCache.delete(String(id));
  else productDetailCache.clear();
}

export async function getProductReviews(productId) {
  const response = await fetch(apiUrl(`/products/${productId}/reviews`));
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.message || "Unable to load reviews.");
  }
  return {
    ratingAverage: Number(data.ratingAverage || 0),
    reviewCount: Number(data.reviewCount || 0),
    reviews: Array.isArray(data.reviews) ? data.reviews : [],
  };
}

export async function submitProductReview(token, productId, payload) {
  const response = await fetch(apiUrl(`/products/${productId}/reviews`), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.message || "Unable to submit review.");
  }
  return {
    ratingAverage: Number(data.ratingAverage || 0),
    reviewCount: Number(data.reviewCount || 0),
    reviews: Array.isArray(data.reviews) ? data.reviews : [],
  };
}

export async function uploadReviewPhoto(token, productId, { imageBase64, mimeType }) {
  const response = await fetch(apiUrl(`/products/${productId}/reviews/photos`), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ imageBase64, mimeType }),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.message || "Unable to upload review photo.");
  }
  return { url: String(data.url || "").trim() };
}

export async function voteProductReview(token, productId, reviewId, helpful = true) {
  const response = await fetch(apiUrl(`/products/${productId}/reviews/${reviewId}/vote`), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ helpful }),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.message || "Unable to register vote.");
  }
  return {
    helpfulCount: Number(data.helpfulCount || 0),
    notHelpfulCount: Number(data.notHelpfulCount || 0),
  };
}

const DEFAULT_HOME_VIEW = { ...HOME_VIEW_DEFAULTS };

/** Never throws — uses defaults if API is down or route missing (older backends). */
export async function getHomeViewConfig() {
  try {
    const response = await fetch(apiUrl("/home-view"));
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      return { ...DEFAULT_HOME_VIEW };
    }
    return {
      heroTitle: normalizeHeroTitle(data.heroTitle || DEFAULT_HOME_VIEW.heroTitle),
      heroSubtitle: normalizeHeroSubtitle(data.heroSubtitle || DEFAULT_HOME_VIEW.heroSubtitle),
      primeSectionTitle: data.primeSectionTitle || DEFAULT_HOME_VIEW.primeSectionTitle,
      productTypeTitle: data.productTypeTitle || DEFAULT_HOME_VIEW.productTypeTitle,
      showPrimeSection: data.showPrimeSection !== false,
      showHomeSections: data.showHomeSections !== false,
      showProductTypeSections: data.showProductTypeSections !== false,
      productCardStyle: data.productCardStyle === "comfortable" ? "comfortable" : "compact",
      dealsRail: Array.isArray(data.dealsRail)
        ? data.dealsRail
            .map((entry, idx) => ({
              productId: String(entry?.productId || entry?._id || entry?.id || "").trim(),
              endsAt: entry?.endsAt ? new Date(entry.endsAt).toISOString() : null,
              rank: Number.isFinite(Number(entry?.rank)) ? Number(entry.rank) : idx,
            }))
            .filter((entry) => Boolean(entry.productId))
        : [],
    };
  } catch {
    return { ...DEFAULT_HOME_VIEW };
  }
}
