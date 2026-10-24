import { Image as RNImage, Platform } from "react-native";
import { Image } from "expo-image";
import { getApiBaseUrl, ZEEVAN_API_LIVE_URL } from "../services/apiBase";

function isLocalHost(hostname) {
  return hostname === "localhost" || hostname === "127.0.0.1" || hostname === "0.0.0.0";
}

function isIpHostname(hostname) {
  return /^\d+\.\d+\.\d+\.\d+$/.test(String(hostname || ""));
}

function unique(items) {
  return Array.from(new Set(items.filter(Boolean)));
}

/** Metro / Expo web bundled media. Remote shop `/assets/…` hashes are not Metro. */
function isBundlerMediaPath(uri) {
  const value = String(uri || "");
  if (value.startsWith("data:image/") || value.startsWith("data:video/")) return true;
  if (value.includes("unstable_path=")) return true;
  if (value.startsWith("/assets")) return true;
  try {
    const url = new URL(value);
    if (isLocalHost(url.hostname) && url.pathname.includes("/assets")) return true;
  } catch {
    if (value.includes("/assets/") && !/^https?:\/\//i.test(value)) return true;
  }
  return false;
}

/** Phone / APK must never prefix `/media` with empty or loopback. */
function mediaApiBase() {
  const api = getApiBaseUrl();
  if (!api) return ZEEVAN_API_LIVE_URL;
  try {
    const host = new URL(api.includes("://") ? api : `https://${api}`).hostname;
    if (Platform.OS !== "web" && isLocalHost(host)) return ZEEVAN_API_LIVE_URL;
  } catch {
    return ZEEVAN_API_LIVE_URL;
  }
  return api;
}

/** `https://www.zeevan.shop/media/x` is the SPA (HTML). Real files are under `/aws/media`. */
function rewriteShopMediaUrl(uri) {
  try {
    const url = new URL(uri);
    const host = url.hostname.toLowerCase();
    const shop = /(^|\.)zeevan\.(shop|app)$/.test(host) || host.endsWith(".vercel.app");
    if (!shop) return uri;
    if (url.pathname.startsWith("/aws/")) return uri;
    if (url.pathname.startsWith("/media/")) {
      url.pathname = `/aws${url.pathname}`;
      return url.toString();
    }
  } catch {
    return uri;
  }
  return uri;
}

/** Same-origin absolute URL for bundled web assets (Metro dev + static export). */
function resolveBundlerMediaUri(uri) {
  const value = String(uri || "").trim();
  if (!value) return "";
  if (/^https?:\/\//i.test(value)) return value;
  if (Platform.OS === "web" && typeof window !== "undefined" && window.location?.origin) {
    return `${window.location.origin}${value.startsWith("/") ? value : `/${value}`}`;
  }
  return value;
}

function withHost(urlString, hostname) {
  try {
    const url = new URL(urlString);
    url.hostname = hostname;
    return url.toString();
  } catch {
    return urlString;
  }
}

/** Map `http://127.0.0.1:5001/media/…` → current API base (incl. `/aws` path). */
function rewriteLocalApiUrl(urlString) {
  try {
    const url = new URL(urlString);
    if (!isLocalHost(url.hostname)) return null;
    if (url.pathname.includes("/assets") || url.search.includes("unstable_path=")) return null;
    const apiBase = mediaApiBase();
    if (!apiBase) return null;
    const base = new URL(apiBase.includes("://") ? apiBase : `https://${apiBase}`);
    const prefix = base.pathname.replace(/\/+$/, "");
    return rewriteShopMediaUrl(`${base.origin}${prefix}${url.pathname}${url.search}${url.hash}`);
  } catch {
    return null;
  }
}

function hostVariants(urlString) {
  try {
    const url = new URL(urlString);
    const currentHost = url.hostname;
    const candidates = [];

    if (isLocalHost(currentHost)) {
      const rewritten = rewriteLocalApiUrl(urlString);
      if (rewritten) candidates.push(rewritten);
      // Images served from local API — emulator / device need host variants.
      if (Platform.OS === "android") {
        candidates.push(withHost(urlString, "10.0.2.2"));
      }
      candidates.push(urlString);
    } else {
      // CDN / Cloudinary / remote URLs — never rewrite hostname to the API dev host (that breaks loads on Android).
      candidates.push(urlString);
    }

    // Prefer HTTPS for remote http URLs — but never for bare IPs (EC2 has no TLS).
    if (!isLocalHost(url.hostname) && !isIpHostname(url.hostname) && url.protocol === "http:") {
      const httpsUrl = new URL(urlString);
      httpsUrl.protocol = "https:";
      candidates.unshift(httpsUrl.toString());
    }
    return unique(candidates);
  } catch {
    return [urlString];
  }
}

/** `require()` module id / web asset object / URL → usable image URI. */
export function resolveBundledModuleSrc(moduleRef) {
  if (moduleRef == null || moduleRef === "") return "";

  // Expo web often returns a string URL or `{ uri }` instead of a Metro numeric id.
  if (typeof moduleRef === "string") {
    const raw = moduleRef.trim();
    if (!raw) return "";
    return resolveImageUri(raw) || raw;
  }
  if (typeof moduleRef === "object") {
    const raw = String(moduleRef.uri || moduleRef.default || "").trim();
    if (!raw) return "";
    return resolveImageUri(raw) || raw;
  }
  if (typeof moduleRef !== "number") return "";

  const asset = RNImage.resolveAssetSource(moduleRef);
  const raw = String(asset?.uri || "").trim();
  if (!raw) return "";
  const resolved = resolveImageUri(raw);
  if (resolved) return resolved;
  // Phone cannot load Metro 127.0.0.1 / relative asset paths as `{ uri }`.
  if (Platform.OS !== "web") return "";
  return raw;
}

export function resolveImageUri(rawUri) {
  const raw = String(rawUri || "").trim();
  if (!raw) return "";
  // Metro `unstable_path` URLs are pre-encoded — encodeURI turns %2F into %252F (404 on web).
  if (isBundlerMediaPath(raw)) {
    const bundled = resolveBundlerMediaUri(raw);
    if (Platform.OS !== "web") {
      try {
        const host = new URL(bundled).hostname;
        // Phone cannot fetch Metro at 127.0.0.1 — callers should use require() or /media.
        if (isLocalHost(host)) return "";
      } catch {
        return "";
      }
    }
    return bundled;
  }

  const uri = encodeURI(raw);
  const apiBase = mediaApiBase();
  if (uri.startsWith("/")) return rewriteShopMediaUrl(`${apiBase}${uri}`);
  if (!/^https?:\/\//i.test(uri)) return rewriteShopMediaUrl(`${apiBase}/${uri.replace(/^\/+/, "")}`);

  try {
    const url = new URL(uri);

    if (isLocalHost(url.hostname)) {
      return rewriteLocalApiUrl(uri) || (Platform.OS === "web" ? url.toString() : "");
    }

    return rewriteShopMediaUrl(upgradeRemoteImageUrl(url.toString()));
  } catch {
    return uri;
  }
}

function upgradeRemoteImageUrl(uri) {
  if (!uri || !/^http:\/\//i.test(uri)) return uri;
  try {
    const host = new URL(uri).hostname;
    if (isLocalHost(host) || isIpHostname(host)) return uri;
  } catch {
    return uri;
  }
  if (Platform.OS === "web" && typeof window !== "undefined" && window.location?.protocol === "https:") {
    return uri.replace(/^http:\/\//i, "https://");
  }
  return uri;
}

export function getImageUriCandidates(rawUri, { width, quality = "auto" } = {}) {
  if (typeof rawUri === "number") {
    const bundled = resolveBundledModuleSrc(rawUri);
    return bundled ? [bundled] : [];
  }
  const raw = String(rawUri || "").trim();
  if (!raw) return [];

  let candidates = [];
  if (isBundlerMediaPath(raw)) {
    const bundled = resolveImageUri(raw);
    candidates = bundled ? [bundled] : [];
  } else {
    const uri = encodeURI(raw);
    const apiBase = mediaApiBase();
    if (uri.startsWith("/")) {
      candidates = hostVariants(rewriteShopMediaUrl(`${apiBase}${uri}`));
    } else if (!/^https?:\/\//i.test(uri)) {
      candidates = hostVariants(rewriteShopMediaUrl(`${apiBase}/${uri.replace(/^\/+/, "")}`));
    } else {
      candidates = hostVariants(resolveImageUri(uri));
    }
  }

  if (!width) return candidates;
  return unique(
    candidates.map((candidate) => optimizeDisplayImageUrl(candidate, { width, quality })).filter(Boolean)
  );
}

/** Product PDP — main hero (smaller delivery size, faster load). */
export function getProductHeroImageUri(rawUri) {
  return getImageUriCandidates(rawUri, { width: 840, quality: "auto:good" })[0] || "";
}

/** Product PDP — gallery thumb strip. */
export function getProductThumbImageUri(rawUri) {
  const width = Platform.OS === "web" ? 96 : 220;
  return getImageUriCandidates(rawUri, { width, quality: Platform.OS === "web" ? "auto:low" : "auto:good" })[0] || "";
}

/** Product PDP — lifestyle / story supporting image. */
export function getProductSectionImageUri(rawUri) {
  return getImageUriCandidates(rawUri, { width: 720, quality: "auto:good" })[0] || "";
}

/** Max delivery width for home hero slider (web). */
export const HERO_SLIDE_DESKTOP_MAX_WIDTH = 960;
/** Max pixel width delivered to phone hero `<img>` (bundled assets may still be 720 WebP). */
export const HERO_SLIDE_MOBILE_DELIVERY_MAX = 480;
/** Bundled portrait WebP width on disk. */
export const HERO_SLIDE_MOBILE_ASSET_WIDTH = 720;
/** @deprecated Use {@link HERO_SLIDE_MOBILE_DELIVERY_MAX} */
export const HERO_SLIDE_MOBILE_MAX_WIDTH = HERO_SLIDE_MOBILE_DELIVERY_MAX;

/** Bundled hero WebP width suffixes (largest → smallest). */
const HERO_WEBP_WIDTHS = [960, 720];

/** CSS layout width → capped pixel width for hero `<img>` (respects DPR, never oversized). */
export function getHeroSlideDisplayWidth(layoutWidth = 960, { isMobileWeb = false } = {}) {
  const css = Math.max(320, Number(layoutWidth) || 960);
  let dpr = 1;
  if (Platform.OS === "web" && typeof window !== "undefined") {
    dpr = Math.min(window.devicePixelRatio || 1, isMobileWeb ? 1.25 : 1.75);
  } else {
    dpr = 2;
  }
  const cap = isMobileWeb ? HERO_SLIDE_MOBILE_DELIVERY_MAX : HERO_SLIDE_DESKTOP_MAX_WIDTH;
  return Math.min(Math.ceil(css * dpr), cap);
}

function isPortraitHeroBundlerUri(uri) {
  return /portrait|packaging-portrait/i.test(String(uri || ""));
}

function isWideHeroBundlerUri(uri) {
  return /21x9|hero-web-wide/i.test(String(uri || ""));
}

/** Pick committed WebP suffix — portrait assets only exist at 720, wide at 960. */
function pickHeroWebpSuffix(uri, deliveryWidth) {
  if (isPortraitHeroBundlerUri(uri)) {
    return `-web-${HERO_SLIDE_MOBILE_ASSET_WIDTH}.webp`;
  }
  if (isWideHeroBundlerUri(uri)) {
    return `-web-${HERO_SLIDE_DESKTOP_MAX_WIDTH}.webp`;
  }
  const target = Math.min(
    deliveryWidth,
    deliveryWidth <= HERO_SLIDE_MOBILE_DELIVERY_MAX
      ? HERO_SLIDE_MOBILE_ASSET_WIDTH
      : HERO_SLIDE_DESKTOP_MAX_WIDTH
  );
  const sorted = [...HERO_WEBP_WIDTHS].sort((a, b) => a - b);
  const bucket = sorted.find((w) => w >= target) || sorted[sorted.length - 1];
  return `-web-${bucket}.webp`;
}

function preferWebHeroBundlerVariant(uri, deliveryWidth) {
  const value = String(uri || "");
  if (!value || Platform.OS !== "web") return value;

  const isBundled =
    isBundlerMediaPath(value) || value.includes("/assets/") || value.includes("unstable_path=");
  if (!isBundled) return value;

  const suffix = pickHeroWebpSuffix(value, deliveryWidth);
  const safeSuffix =
    isPortraitHeroBundlerUri(value) && suffix.includes("-web-960.")
      ? `-web-${HERO_SLIDE_MOBILE_ASSET_WIDTH}.webp`
      : suffix;

  for (const width of HERO_WEBP_WIDTHS) {
    const token = `-web-${width}.webp`;
    if (value.includes(token)) {
      if (value.endsWith(safeSuffix) || value.includes(safeSuffix)) return value;
      return value.replace(token, safeSuffix);
    }
  }

  const webpMatch = value.match(/^(.*)-web-\d+\.webp(\?.*)?$/i);
  if (webpMatch) {
    return `${webpMatch[1]}${safeSuffix}${webpMatch[2] || ""}`;
  }

  // Only rewrite hero PNGs that already have an optimized sibling stem
  // (`…-web-720.webp`). Blind `.png` → `-web-N.webp` breaks hashed Metro
  // packaging assets (e.g. product covers) with a 404.
  const pngMatch = value.match(/^(.*zeevan-ghee-packaging-portrait)\.[a-f0-9]+\.png(\?.*)?$/i);
  if (pngMatch) {
    return `${pngMatch[1]}${safeSuffix}${pngMatch[2] || ""}`;
  }

  return value;
}

/** Hero slider delivery URL — WebP variants on web, Cloudinary `w_` cap, never full 4K originals. */
export function getHeroSlideImageUri(rawUri, { layoutWidth = 960, isMobileWeb = false, quality = "auto:good" } = {}) {
  const deliveryWidth = getHeroSlideDisplayWidth(layoutWidth, { isMobileWeb });

  if (rawUri == null || rawUri === "") return "";

  if (typeof rawUri === "number") {
    const bundled = resolveBundledModuleSrc(rawUri);
    return preferWebHeroBundlerVariant(bundled, deliveryWidth) || bundled;
  }

  let resolved = "";
  if (typeof rawUri === "string") {
    resolved = resolveImageUri(rawUri) || rawUri;
  } else if (typeof rawUri === "object" && rawUri?.uri) {
    resolved = resolveImageUri(rawUri.uri) || rawUri.uri;
  }
  if (!resolved) return "";

  const bundled = preferWebHeroBundlerVariant(resolved, deliveryWidth);
  if (isBundlerMediaPath(bundled) || bundled.includes("/assets/")) {
    return bundled;
  }

  return optimizeDisplayImageUrl(bundled, { width: deliveryWidth, quality }) || bundled;
}

/** Shared expo-image placeholder while remote heroes / catalog images resolve. */
export const PRODUCT_HERO_BLURHASH = "LEHV6nWB2yk8pyo0adR*.7kCMdnj";

const CLOUDINARY_UPLOAD = "/upload/";

function cloudinaryHasTransform(segment) {
  return /^(f_|q_|w_|c_|h_|dpr_|g_)/.test(segment);
}

/**
 * Delivery-time Cloudinary transforms — smaller WebP/AVIF, faster home/process/compare loads.
 * Bundled Metro assets are returned unchanged (absolute URL on web).
 */
function buildCloudinaryTransform({ width, quality }) {
  return `f_auto,q_${quality},w_${width},c_limit`;
}

function applyCloudinaryDeliveryTransform(uri, { width, quality }) {
  const uploadIdx = uri.indexOf(CLOUDINARY_UPLOAD);
  const prefix = uri.slice(0, uploadIdx + CLOUDINARY_UPLOAD.length);
  const suffix = uri.slice(uploadIdx + CLOUDINARY_UPLOAD.length);
  const transform = buildCloudinaryTransform({ width, quality });

  if (suffix.includes(`${transform}/`)) return uri;

  const parts = suffix.split("/");
  const firstSegment = parts[0] || "";

  if (cloudinaryHasTransform(firstSegment)) {
    parts[0] = transform;
    return `${prefix}${parts.join("/")}`;
  }

  if (/^v\d+$/i.test(firstSegment)) {
    return `${prefix}${transform}/${suffix}`;
  }

  return `${prefix}${transform}/${suffix}`;
}

export function optimizeDisplayImageUrl(rawUri, { width = 960, quality = "auto" } = {}) {
  const uri = resolveImageUri(String(rawUri || "").trim());
  if (!uri) return "";
  if (isBundlerMediaPath(uri)) {
    const resolved = resolveBundlerMediaUri(uri);
    return preferWebHeroBundlerVariant(resolved, width) || resolved;
  }
  if (!uri.includes("res.cloudinary.com") || !uri.includes(CLOUDINARY_UPLOAD)) {
    return uri;
  }

  return applyCloudinaryDeliveryTransform(uri, { width, quality });
}

/** Tiny LQIP URL — bundled `-preview-48.webp` or Cloudinary w_48. */
export function getPreviewImageUri(rawUri, { width = 48, quality = "auto:low" } = {}) {
  const raw = String(rawUri || "").trim();
  if (!raw) return "";

  if (typeof raw === "number" || (typeof raw === "object" && raw?.uri)) {
    return getPreviewImageUri(typeof raw === "number" ? resolveBundledModuleSrc(raw) : raw.uri, {
      width,
      quality,
    });
  }

  const full = optimizeDisplayImageUrl(raw, { width: 1200, quality: "auto:good" });
  if (!full) return "";

  // Bundled heroes — tiny LQIP sibling when optimize:web has run.
  if (isBundlerMediaPath(full)) {
    const preview = full.replace(/-web-\d+\.webp/i, "-preview-48.webp").replace(/\.png(\?.*)?$/i, "-preview-48.webp");
    if (preview !== full && preview.includes("-preview-48.webp")) return preview;
    return "";
  }

  if (full.includes("res.cloudinary.com")) {
    return optimizeDisplayImageUrl(raw, { width, quality }) || "";
  }

  const preview = full.replace(/-web-\d+\.webp/i, "-preview-48.webp");
  if (preview !== full && preview.includes("-preview-48.webp")) return preview;

  return optimizeDisplayImageUrl(raw, { width: Math.min(width, 64), quality }) || "";
}

/** Full-quality display URL with optional width cap. */
export function getDisplayImageUri(rawUri, { width = 960, quality = "auto:good" } = {}) {
  const raw = String(rawUri || "").trim();
  if (!raw) return "";
  if (typeof raw === "number") {
    return resolveBundledModuleSrc(raw) || "";
  }
  return optimizeDisplayImageUrl(raw, { width, quality }) || resolveImageUri(raw) || raw;
}

/** Warm product PDP gallery — thumbs first (instant placeholders), then hero. */
export function prefetchProductGalleryImages(rawUris = [], { heroCount = 2 } = {}) {
  const uris = rawUris.map((u) => String(u || "").trim()).filter(Boolean);
  if (!uris.length) return;

  const thumbUrls = unique(uris.map((u) => getProductThumbImageUri(u)).filter(Boolean));
  const heroUrls = unique(uris.slice(0, heroCount).map((u) => getProductHeroImageUri(u)).filter(Boolean));

  if (Platform.OS === "web") {
    prefetchDisplayImages(thumbUrls, { eagerCount: thumbUrls.length, width: 220 });
    prefetchDisplayImages(heroUrls, { eagerCount: heroUrls.length, width: 840 });
    return;
  }

  thumbUrls.forEach((url) => {
    Image.prefetch(url).catch(() => {});
  });
  heroUrls.forEach((url) => {
    Image.prefetch(url).catch(() => {});
  });
}

export function prefetchProductHeroImage(rawUri) {
  const uri = String(rawUri || "").trim();
  if (!uri) return;
  prefetchProductGalleryImages([uri], { heroCount: 1 });
}

/** Web: warm browser cache for upcoming section images. */
export function prefetchDisplayImages(
  sources,
  { eagerCount = 1, width = 960, quality = "auto:good", warmupAll = false } = {}
) {
  if (Platform.OS !== "web" || typeof document === "undefined") return;

  const seen = new Set();
  sources.forEach((raw, index) => {
    let uri =
      typeof raw === "string" && (isBundlerMediaPath(raw) || raw.includes("/assets/"))
        ? raw
        : optimizeDisplayImageUrl(
            typeof raw === "object" && raw?.uri ? raw.uri : raw,
            { width, quality }
          );
    if (!uri || seen.has(uri)) return;
    seen.add(uri);

    if (index < eagerCount) {
      if (!document.querySelector(`link[data-kankreg-preload="${uri}"]`)) {
        const link = document.createElement("link");
        link.rel = "preload";
        link.as = "image";
        link.href = uri;
        link.setAttribute("data-kankreg-preload", uri);
        if ("fetchPriority" in link) {
          link.fetchPriority = "high";
        }
        document.head.appendChild(link);
      }
    }

    if (warmupAll || index < eagerCount) {
      const preview = getPreviewImageUri(raw);
      if (preview && preview !== uri) {
        const previewImg = new window.Image();
        previewImg.decoding = "async";
        previewImg.src = preview;
      }
      const img = new window.Image();
      img.decoding = "async";
      if (index < eagerCount && "fetchPriority" in img) {
        img.fetchPriority = "high";
      }
      img.src = uri;
    }
  });
}
