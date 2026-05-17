import { APP_META } from "../content/appContent";
import { buildBreadcrumbSchema, buildProductSchema } from "./webMeta";
import { buildResponsiveImageSources, pickProductOgImage } from "./responsiveImage";
import { resolveImageUri } from "./image";

const BRAND_NAME = APP_META.brand?.name || "Zeevan";

/**
 * Parse weight from unit labels like "500g", "500 g", "1 kg".
 * @returns {{ value: number, unitCode: 'GRM' } | null}
 */
export function parseWeightFromUnit(unit) {
  const raw = String(unit || "").trim().toLowerCase();
  if (!raw) return null;

  const grams = raw.match(/(\d+(?:\.\d+)?)\s*g(?:ram)?s?\b/);
  if (grams) {
    const value = Number(grams[1]);
    return Number.isFinite(value) && value > 0 ? { value, unitCode: "GRM" } : null;
  }

  const kg = raw.match(/(\d+(?:\.\d+)?)\s*kg\b/);
  if (kg) {
    const value = Number(kg[1]) * 1000;
    return Number.isFinite(value) && value > 0 ? { value, unitCode: "GRM" } : null;
  }

  return null;
}

function productCanonicalPath(product, productId) {
  const slug = String(product?.slug || product?.id || productId || "").trim();
  return slug ? `/product/${encodeURIComponent(slug)}` : "";
}

function normalizeTopReviews(reviews = []) {
  return (Array.isArray(reviews) ? reviews : [])
    .slice(0, 5)
    .map((r) => ({
      rating: r.rating,
      authorName: r.userName || r.authorName,
      comment: r.comment || r.body,
      createdAt: r.createdAt,
      title: r.title,
    }));
}

/**
 * Route meta + JSON-LD overrides for `useRouteMeta('product', …)`.
 */
export function buildProductRouteMetaOverrides({
  product,
  productId,
  selectedVariantLabel = "",
  cartLine,
  reviews = [],
}) {
  if (!product) return {};

  const siteUrl = String(APP_META.brand?.siteUrl || "").replace(/\/$/, "");
  const name = String(product.name || "").trim();
  const size = String(selectedVariantLabel || product.unit || "").trim();
  const category = String(product.category || "").trim();
  const shortDescription = String(product.shortDescription || product.description || "").trim();
  const slug = String(product.slug || product.id || productId || "").trim();
  const stockQty = Number(product.stockQty || 0);
  const inStock = product.inStock !== false && stockQty > 0;
  const priceAmount = cartLine?.price ?? product.price;
  const canonicalPath = productCanonicalPath(product, productId);
  const canonical = canonicalPath ? `${siteUrl}${canonicalPath}` : siteUrl;

  const galleryImages = (Array.isArray(product.images) ? product.images : [])
    .map((u) => resolveImageUri(u))
    .filter(Boolean);
  const primaryImage = resolveImageUri(product.image) || galleryImages[0] || "";
  const ogImage = pickProductOgImage(product, siteUrl) || primaryImage;
  const lcpSources = buildResponsiveImageSources(primaryImage);

  const weightUnit = String(selectedVariantLabel || product.unit || "").trim();
  const weight = parseWeightFromUnit(weightUnit);

  const schemaProduct = {
    ...product,
    slug,
    shortDescription,
    description: String(product.description || shortDescription).trim(),
    price: priceAmount,
    inStock,
    stockQty,
    brand: String(product.brand || "").trim() || BRAND_NAME,
    topReviews: normalizeTopReviews(reviews),
    weight,
  };

  const productSchema = buildProductSchema(schemaProduct, {
    siteUrl,
    brandName: BRAND_NAME,
  });

  const breadcrumbSchema = buildBreadcrumbSchema(
    [
      { name: "Home", url: "/" },
      { name: category || "Shop", url: category ? `/category/${encodeURIComponent(category.toLowerCase())}` : "/shop" },
      { name, url: canonicalPath },
    ],
    { siteUrl }
  );

  return {
    name,
    size,
    category,
    shortDescription,
    slug,
    canonical,
    priceAmount: priceAmount != null && Number.isFinite(Number(priceAmount)) ? Number(priceAmount) : undefined,
    priceCurrency: "INR",
    availability: inStock ? "in stock" : "out of stock",
    ogImage,
    ogImageAlt: name,
    lcpImage: lcpSources.src || primaryImage,
    lcpImageSrcSet: lcpSources.srcSet,
    lcpImageSizes: lcpSources.sizes,
    structuredData: [productSchema, breadcrumbSchema],
  };
}
