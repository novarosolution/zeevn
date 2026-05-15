import { Platform } from "react-native";
import { APP_META } from "../content/appContent";

const MANAGED_ATTR = "zeevan-meta";
const SCHEMA_MANAGED_PREFIX = "zeevan-meta-schema-";
const FAVICON_16_PATH = "/assets/seo/favicon-16.png";
const FAVICON_32_PATH = "/assets/seo/favicon-32.png";
const APPLE_TOUCH_ICON_PATH = "/assets/seo/apple-touch-icon.png";
const PWA_ICON_512_PATH = "/assets/seo/icon-512.png";

const ROUTE_KEYS = new Set([
  "home",
  "shop",
  "product",
  "cart",
  "checkout",
  "orders",
  "account",
  "about",
  "contact",
  "faq",
  "privacy",
  "terms",
  "blog",
  "blogPost",
  "category",
  "search",
  "notFound",
]);

function removeManagedTags() {
  if (typeof document === "undefined") return;
  document.head
    .querySelectorAll(`[data-managed="${MANAGED_ATTR}"], [data-managed^="${SCHEMA_MANAGED_PREFIX}"]`)
    .forEach((node) => node.remove());
}

function appendManaged(tagName, attrs = {}) {
  if (typeof document === "undefined") return null;
  const node = document.createElement(tagName);
  node.setAttribute("data-managed", MANAGED_ATTR);
  Object.entries(attrs).forEach(([k, v]) => {
    if (v != null) node.setAttribute(k, String(v));
  });
  document.head.appendChild(node);
  return node;
}

function appendMeta(attrs) {
  return appendManaged("meta", attrs);
}

function appendLink(attrs) {
  return appendManaged("link", attrs);
}

function toSchemaKey(raw) {
  const value = String(raw || "schema")
    .toLowerCase()
    .replace(/[^a-z0-9-_]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
  return value || "schema";
}

function appendSchemaScript(schemaKey, payload) {
  if (typeof document === "undefined" || !payload) return null;
  const script = document.createElement("script");
  script.type = "application/ld+json";
  script.setAttribute("data-managed", `${SCHEMA_MANAGED_PREFIX}${toSchemaKey(schemaKey)}`);
  script.text = JSON.stringify(payload);
  document.head.appendChild(script);
  return script;
}

function toAbsolute(siteUrl, value) {
  if (!value) return siteUrl;
  if (/^https?:\/\//i.test(value)) return value;
  const base = String(siteUrl || "").replace(/\/$/, "");
  const path = String(value).startsWith("/") ? value : `/${value}`;
  return `${base}${path}`;
}

function toSchemaAvailability(isInStock) {
  return isInStock ? "https://schema.org/InStock" : "https://schema.org/OutOfStock";
}

function buildTemplateTokens(overrides = {}) {
  const safeName = String(overrides.name || "").trim();
  const safeSize = String(overrides.size || "").trim();
  const safeCategory = String(overrides.category || "").trim();
  const safeShortDescription = String(overrides.shortDescription || "").trim();
  const safeTitle = String(overrides.title || "").trim();
  const fallbackS = safeTitle || safeName || safeCategory || "";
  return {
    ...overrides,
    slug: encodeURIComponent(String(overrides.slug || "")),
    q: encodeURIComponent(String(overrides.q || "")),
    s: fallbackS,
    name: safeName,
    size: safeSize,
    category: safeCategory,
    shortDescription: safeShortDescription,
  };
}

function replaceTokens(value, tokens = {}) {
  if (typeof value !== "string") return value;
  return value.replace(/%([a-zA-Z_]\w*)/g, (_, tokenKey) => {
    const raw = tokens[tokenKey];
    if (raw == null) return "";
    return String(raw);
  });
}

function applyTemplate(template, overrides = {}) {
  if (typeof template !== "string" || !template.trim()) return "";
  const tokenMatches = Array.from(template.matchAll(/%([a-zA-Z_]\w*)/g));
  const tokens = buildTemplateTokens(overrides);
  const hasMissing = tokenMatches.some((match) => {
    const value = tokens[match[1]];
    return value == null || String(value).trim() === "";
  });
  if (hasMissing) return "";
  return replaceTokens(template, tokens).replace(/\s+/g, " ").trim();
}

function resolveRouteConfigByKey(routeKey, routes = {}) {
  const baseConfig = routes?.[routeKey] || routes?.notFound || {};
  if (routeKey === "product") {
    return { ...baseConfig, ...(routes?.productTemplate || {}) };
  }
  if (routeKey === "category") {
    return { ...baseConfig, ...(routes?.categoryTemplate || {}) };
  }
  return baseConfig;
}

function resolveTitle(routeKey, defaults, routeConfig, overrides) {
  const titleTemplate = overrides.titleTemplate ?? routeConfig.titleTemplate ?? defaults.titleTemplate;
  const explicitTitle = overrides.title ?? routeConfig.title;

  if (explicitTitle != null) {
    const rawTitle = String(explicitTitle).trim();
    if (!rawTitle) return defaults.titleFallback || "Zeevan";
    if (typeof titleTemplate === "string" && titleTemplate.includes("%s")) {
      return titleTemplate.replace(/%s/g, rawTitle);
    }
    return rawTitle;
  }

  const rendered = applyTemplate(titleTemplate, overrides);
  if (rendered) return rendered;
  return defaults.titleFallback || "Zeevan";
}

function resolveCanonical(siteUrl, routeConfig, overrides) {
  if (overrides.canonical) return toAbsolute(siteUrl, overrides.canonical);
  if (routeConfig.canonicalTemplate) {
    return toAbsolute(siteUrl, applyTemplate(routeConfig.canonicalTemplate, overrides));
  }
  if (routeConfig.canonical) return toAbsolute(siteUrl, routeConfig.canonical);
  return siteUrl;
}

function resolveDescription(defaults, routeConfig, overrides) {
  if (overrides.description != null) return String(overrides.description).trim();
  if (routeConfig.description != null) return String(routeConfig.description).trim();
  const template = overrides.descriptionTemplate ?? routeConfig.descriptionTemplate;
  const fromTemplate = applyTemplate(template, overrides);
  if (fromTemplate) return fromTemplate;
  return String(defaults.description || "").trim();
}

function normalizeReviewNode(review) {
  if (!review) return null;
  const ratingValue = Number(review.rating || 0);
  if (!ratingValue) return null;
  return {
    "@type": "Review",
    author: {
      "@type": "Person",
      name: String(review.authorName || review.userName || "Customer").trim() || "Customer",
    },
    datePublished: review.createdAt,
    reviewBody: String(review.body || review.comment || "").trim(),
    reviewRating: { "@type": "Rating", ratingValue, bestRating: 5 },
  };
}

export function buildProductSchema(product = {}, options = {}) {
  const siteUrl = options.siteUrl || APP_META.brand?.siteUrl || "";
  const brandName = options.brandName || APP_META.brand?.name || "Zeevan";
  const slug = String(product.slug || product.id || "").trim();
  const resolvedUrl =
    product.url || (slug ? `${String(siteUrl).replace(/\/$/, "")}/product/${encodeURIComponent(slug)}` : siteUrl);
  const description = String(product.description || product.shortDescription || "").trim();
  const imageList = Array.isArray(product.images) ? product.images : [product.image];
  const images = imageList.filter(Boolean).map((img) => toAbsolute(siteUrl, img));
  const numericPrice = Number(product.price);
  const hasPrice = Number.isFinite(numericPrice);
  const inStock = product.inStock !== false && Number(product.stockQty ?? 1) > 0;
  const ratingValue = Number(product.rating || product.ratingAverage || 0);
  const reviewCount = Number(product.reviewCount || 0);
  const topReviews = Array.isArray(product.topReviews)
    ? product.topReviews
    : Array.isArray(product.reviews)
      ? product.reviews.slice(0, 3)
      : [];
  const reviewNodes = topReviews.map((r) => normalizeReviewNode(r)).filter(Boolean);

  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: String(product.name || "").trim(),
    description,
    image: images,
    sku: product.sku || undefined,
    brand: { "@type": "Brand", name: brandName },
    category: product.category || undefined,
    offers: hasPrice
      ? {
          "@type": "Offer",
          url: resolvedUrl,
          priceCurrency: "INR",
          price: numericPrice,
          priceValidUntil:
            product.priceValidUntil ||
            new Date(Date.now() + 1000 * 60 * 60 * 24 * 365).toISOString().slice(0, 10),
          availability: toSchemaAvailability(inStock),
          itemCondition: "https://schema.org/NewCondition",
          seller: { "@type": "Organization", name: brandName },
          shippingDetails: {
            "@type": "OfferShippingDetails",
            shippingRate: { "@type": "MonetaryAmount", value: "0", currency: "INR" },
            shippingDestination: { "@type": "DefinedRegion", addressCountry: "IN" },
            deliveryTime: {
              "@type": "ShippingDeliveryTime",
              handlingTime: { "@type": "QuantitativeValue", minValue: 0, maxValue: 1, unitCode: "DAY" },
              transitTime: { "@type": "QuantitativeValue", minValue: 1, maxValue: 4, unitCode: "DAY" },
            },
          },
          hasMerchantReturnPolicy: {
            "@type": "MerchantReturnPolicy",
            applicableCountry: "IN",
            returnPolicyCategory: "https://schema.org/MerchantReturnFiniteReturnWindow",
            merchantReturnDays: 30,
            returnMethod: "https://schema.org/ReturnByMail",
            returnFees: "https://schema.org/FreeReturn",
          },
        }
      : undefined,
    aggregateRating:
      ratingValue > 0
        ? { "@type": "AggregateRating", ratingValue, reviewCount: Math.max(reviewCount, 1) }
        : undefined,
    review: reviewNodes.length ? reviewNodes : undefined,
  };
}

export function buildBreadcrumbSchema(crumbs = [], options = {}) {
  const siteUrl = options.siteUrl || APP_META.brand?.siteUrl || "";
  const itemListElement = (Array.isArray(crumbs) ? crumbs : [])
    .filter(Boolean)
    .map((crumb, idx) => ({
      "@type": "ListItem",
      position: idx + 1,
      name: String(crumb.name || crumb.label || "").trim(),
      item: toAbsolute(siteUrl, crumb.url || ""),
    }))
    .filter((item) => item.name);
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement,
  };
}

export function buildFaqSchema(items = []) {
  const mainEntity = (Array.isArray(items) ? items : [])
    .filter(Boolean)
    .map((item) => ({
      "@type": "Question",
      name: String(item.question || item.q || "").trim(),
      acceptedAnswer: {
        "@type": "Answer",
        text: String(item.answer || item.a || "").trim(),
      },
    }))
    .filter((item) => item.name && item.acceptedAnswer.text);
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity,
  };
}

export function buildArticleSchema(post = {}, options = {}) {
  const siteUrl = options.siteUrl || APP_META.brand?.siteUrl || "";
  const authorName = String(post.authorName || post.author || APP_META.brand?.name || "Zeevan").trim();
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: String(post.headline || post.title || "").trim(),
    author: { "@type": "Person", name: authorName || "Zeevan" },
    datePublished: post.datePublished || post.publishedAt || undefined,
    dateModified: post.dateModified || post.updatedAt || post.publishedAt || undefined,
    image: post.image ? [toAbsolute(siteUrl, post.image)] : [],
    articleBody: String(post.articleBody || post.excerpt || "").trim(),
    mainEntityOfPage: post.url ? toAbsolute(siteUrl, post.url) : undefined,
  };
}

export function buildLocalBusinessSchema(options = {}) {
  const brand = APP_META.brand || {};
  const contact = brand.contact || {};
  const address = contact.address || {};
  if (!address.addressCountry && !address.addressLocality && !address.streetAddress && !options.force) {
    return null;
  }
  return {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    name: brand.name || "Zeevan",
    telephone: contact.phone || undefined,
    email: contact.email || undefined,
    url: brand.siteUrl || undefined,
    address: { "@type": "PostalAddress", ...address },
    geo: options.geo
      ? {
          "@type": "GeoCoordinates",
          latitude: options.geo.latitude,
          longitude: options.geo.longitude,
        }
      : undefined,
    openingHoursSpecification: Array.isArray(options.openingHoursSpecification)
      ? options.openingHoursSpecification
      : undefined,
  };
}

export function buildSiteSearchSchema(siteUrl, siteName) {
  const resolvedSiteUrl = String(siteUrl || APP_META.brand?.siteUrl || "").replace(/\/$/, "");
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: siteName || APP_META.brand?.name || "Zeevan",
    url: resolvedSiteUrl,
    potentialAction: {
      "@type": "SearchAction",
      target: `${resolvedSiteUrl}/search?q={search_term_string}`,
      "query-input": "required name=search_term_string",
    },
  };
}

function buildOrganizationSchema(brand, siteUrl) {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: brand.name || "Zeevan",
    legalName: brand.legalName,
    url: siteUrl,
    logo: toAbsolute(siteUrl, brand.logo || PWA_ICON_512_PATH),
    sameAs: Array.isArray(brand.sameAs) ? brand.sameAs : [],
    contactPoint: [
      {
        "@type": "ContactPoint",
        contactType: "customer support",
        email: brand.contact?.email,
        telephone: brand.contact?.phone,
        areaServed: "IN",
        availableLanguage: ["en", "hi"],
      },
    ],
    address: brand.contact?.address
      ? { "@type": "PostalAddress", ...brand.contact.address }
      : undefined,
  };
}

function injectStructuredData(overrides, siteUrl, brand) {
  const raw = overrides.structuredData;
  if (!raw) return;
  const schemas = Array.isArray(raw) ? raw : [raw];
  schemas.filter(Boolean).forEach((schema, idx) => {
    const key = schema["@type"] ? String(schema["@type"]).toLowerCase() : `schema-${idx}`;
    appendSchemaScript(key, schema);
  });
}

export function applyRouteMeta(routeKey, dynamicOverrides = {}) {
  if (Platform.OS !== "web" || typeof document === "undefined") return;

  const safeRouteKey = ROUTE_KEYS.has(routeKey) ? routeKey : "notFound";
  const brand = APP_META.brand || {};
  const defaults = APP_META.defaults || {};
  const routeConfig = resolveRouteConfigByKey(safeRouteKey, APP_META.routes || {});
  const merged = { ...defaults, ...routeConfig, ...dynamicOverrides };

  const siteUrl = brand.siteUrl || (typeof window !== "undefined" ? window.location.origin : "");
  const canonicalUrl = resolveCanonical(siteUrl, routeConfig, dynamicOverrides);
  const title = resolveTitle(safeRouteKey, defaults, routeConfig, dynamicOverrides);
  const description = resolveDescription(defaults, routeConfig, dynamicOverrides);
  const ogImageValue = dynamicOverrides.ogImage ?? routeConfig.ogImage ?? defaults.ogImage;
  const ogImageUrl = toAbsolute(siteUrl, ogImageValue);
  const ogImageAlt = dynamicOverrides.ogImageAlt ?? routeConfig.ogImageAlt ?? defaults.ogImageAlt ?? title;
  const ogType =
    safeRouteKey === "product" ? "product" : dynamicOverrides.type ?? routeConfig.type ?? defaults.type ?? "website";
  const locale = dynamicOverrides.locale ?? routeConfig.locale ?? defaults.locale ?? "en_IN";
  const robots = merged.noindex ? "noindex,nofollow" : "index,follow";
  const keywords = Array.isArray(merged.keywords) ? merged.keywords.filter(Boolean).join(", ") : merged.keywords || "";
  const ogPriceAmount = dynamicOverrides.priceAmount ?? dynamicOverrides.price ?? routeConfig.priceAmount;
  const ogPriceCurrency = dynamicOverrides.priceCurrency ?? routeConfig.priceCurrency ?? "INR";
  const ogAvailability = dynamicOverrides.availability ?? routeConfig.availability;

  removeManagedTags();
  document.title = title;

  appendMeta({ name: "description", content: description });
  appendMeta({ name: "robots", content: robots });
  if (keywords) appendMeta({ name: "keywords", content: keywords });
  appendMeta({ property: "og:type", content: ogType });
  appendMeta({ property: "og:locale", content: locale });
  appendMeta({ property: "og:title", content: title });
  appendMeta({ property: "og:description", content: description });
  appendMeta({ property: "og:image", content: ogImageUrl });
  appendMeta({ property: "og:image:alt", content: ogImageAlt });
  appendMeta({ property: "og:url", content: canonicalUrl });
  if (safeRouteKey === "product") {
    if (ogPriceAmount != null && ogPriceAmount !== "") {
      appendMeta({ property: "og:price:amount", content: ogPriceAmount });
      appendMeta({ property: "product:price:amount", content: ogPriceAmount });
    }
    if (ogPriceCurrency) {
      appendMeta({ property: "og:price:currency", content: ogPriceCurrency });
      appendMeta({ property: "product:price:currency", content: ogPriceCurrency });
    }
    if (ogAvailability) {
      appendMeta({ property: "og:availability", content: ogAvailability });
      appendMeta({ property: "product:availability", content: ogAvailability });
    }
  }
  appendMeta({ name: "twitter:card", content: merged.twitterCard || "summary_large_image" });
  appendMeta({ name: "twitter:title", content: title });
  appendMeta({ name: "twitter:description", content: description });
  appendMeta({ name: "twitter:image", content: ogImageUrl });
  appendMeta({ name: "theme-color", content: brand.themeColor || "#0E1729" });

  appendLink({ rel: "canonical", href: canonicalUrl });
  appendLink({ rel: "alternate", hreflang: "en-IN", href: siteUrl });
  appendLink({ rel: "alternate", hreflang: "x-default", href: siteUrl });
  appendLink({ rel: "manifest", href: "/manifest.webmanifest" });
  appendLink({ rel: "icon", type: "image/png", sizes: "16x16", href: toAbsolute(siteUrl, FAVICON_16_PATH) });
  appendLink({ rel: "icon", type: "image/png", sizes: "32x32", href: toAbsolute(siteUrl, FAVICON_32_PATH) });
  appendLink({
    rel: "apple-touch-icon",
    sizes: "180x180",
    href: toAbsolute(siteUrl, APPLE_TOUCH_ICON_PATH),
  });
  appendLink({ rel: "icon", type: "image/png", sizes: "512x512", href: toAbsolute(siteUrl, PWA_ICON_512_PATH) });

  if (safeRouteKey === "home") {
    appendSchemaScript("organization", buildOrganizationSchema(brand, siteUrl));
    appendSchemaScript("website", buildSiteSearchSchema(siteUrl, brand.name));
  }

  if (safeRouteKey === "faq" && Array.isArray(dynamicOverrides.faqItems) && dynamicOverrides.faqItems.length) {
    appendSchemaScript("faqpage", buildFaqSchema(dynamicOverrides.faqItems));
  }

  injectStructuredData(dynamicOverrides, siteUrl, brand);
}

export function applyHomeWebMeta(meta, supportEmail) {
  const overrides = meta
    ? {
        title: meta.title,
        description: meta.description,
        canonical: meta.canonicalUrl,
        ogImage: meta.ogImagePath,
      }
    : {};
  if (supportEmail) {
    overrides.structuredData = {
      "@context": "https://schema.org",
      "@type": "Organization",
      name: APP_META.brand?.name || "Zeevan",
      contactPoint: [
        {
          "@type": "ContactPoint",
          contactType: "customer support",
          email: supportEmail,
        },
      ],
    };
  }
  applyRouteMeta("home", overrides);
}
