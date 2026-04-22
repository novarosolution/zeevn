import { getApiBaseUrl } from "./apiBase";
import { HOME_VIEW_DEFAULTS } from "../content/appContent";
import { normalizeHeroSubtitle, normalizeHeroTitle } from "../utils/homeMarketingCopy";

function apiUrl(path) {
  return `${getApiBaseUrl()}${path}`;
}

function normalizeProduct(raw) {
  const primaryImage =
    raw.image || (Array.isArray(raw.images) && raw.images.length ? raw.images[0] : "");

  const priceNum = Number(raw.price);
  const price = Number.isFinite(priceNum) && priceNum >= 0 ? priceNum : 0;

  const mrpNum = Number(raw.mrp);
  const mrp =
    Number.isFinite(mrpNum) && mrpNum > 0 ? mrpNum : null;

  const id = raw._id ?? raw.id;
  const name = String(raw.name ?? "").trim() || "Untitled product";
  const description = String(raw.description ?? "").trim();
  const unit = String(raw.unit ?? "").trim() || "1 pc";

  const variants = Array.isArray(raw.variants)
    ? raw.variants
        .map((v) => ({
          label: String(v?.label ?? "").trim(),
          price: Math.max(0, Number(v?.price) || 0),
        }))
        .filter((v) => v.label && Number.isFinite(v.price))
    : [];

  const usps = Array.isArray(raw.usps)
    ? raw.usps
        .map((b) => ({
          icon: String(b?.icon ?? "checkmark-circle-outline").trim() || "checkmark-circle-outline",
          title: String(b?.title ?? "").trim(),
          description: String(b?.description ?? "").trim(),
        }))
        .filter((b) => b.title || b.description)
    : [];

  const usageRituals = Array.isArray(raw.usageRituals)
    ? raw.usageRituals
        .map((b) => ({
          icon: String(b?.icon ?? "sunny-outline").trim() || "sunny-outline",
          title: String(b?.title ?? "").trim(),
          description: String(b?.description ?? "").trim(),
        }))
        .filter((b) => b.title || b.description)
    : [];

  const processSteps = Array.isArray(raw.processSteps)
    ? raw.processSteps.map((s) => String(s ?? "").trim()).filter(Boolean)
    : [];

  const ratingAvg = Number(raw.ratingAverage);
  const reviewCt = Number(raw.reviewCount);

  return {
    ...raw,
    id,
    name,
    description,
    price,
    mrp,
    image: primaryImage,
    images:
      Array.isArray(raw.images) && raw.images.length
        ? raw.images
        : primaryImage
          ? [primaryImage]
          : [],
    category: String(raw.category ?? "").trim() || "General",
    homeSection: String(raw.homeSection ?? "").trim() || "Prime Products",
    productType: String(raw.productType ?? raw.category ?? "").trim() || "General",
    showOnHome: raw.showOnHome !== false,
    homeOrder: Number.isFinite(Number(raw.homeOrder)) ? Number(raw.homeOrder) : 0,
    brand: String(raw.brand ?? "").trim(),
    sku: String(raw.sku ?? "").trim(),
    unit,
    eta: raw.eta ? String(raw.eta).trim() : "",
    isSpecial: Boolean(raw.isSpecial),
    inStock: raw.inStock !== false,
    stockQty: Number.isFinite(Number(raw.stockQty)) ? Math.max(0, Number(raw.stockQty)) : 0,
    ratingAverage: Number.isFinite(ratingAvg) ? Math.min(5, Math.max(0, ratingAvg)) : 0,
    reviewCount: Number.isFinite(reviewCt) ? Math.max(0, Math.floor(reviewCt)) : 0,
    badgeText: String(raw.badgeText ?? "").trim(),
    lifestyleImage: String(raw.lifestyleImage ?? "").trim(),
    variants,
    usps,
    processTitle: String(raw.processTitle ?? "").trim(),
    processSteps,
    highlightQuote: String(raw.highlightQuote ?? "").trim(),
    usageRituals,
    richProductPage: raw.richProductPage === true,
  };
}

export async function getProducts() {
  const response = await fetch(apiUrl("/products"));
  const data = await response.json().catch(() => []);
  if (!response.ok) {
    const msg =
      typeof data?.message === "string" && data.message.trim()
        ? data.message.trim()
        : "Unable to load products.";
    throw new Error(msg);
  }
  return data.map(normalizeProduct);
}

export async function getProductById(id) {
  const allProducts = await getProducts();
  return allProducts.find((item) => item.id === id) || null;
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
    };
  } catch {
    return { ...DEFAULT_HOME_VIEW };
  }
}
