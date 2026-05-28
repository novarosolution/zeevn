import { resolveImageUri } from "./image";

const DEFAULT_WIDTHS = [320, 480, 640, 960, 1200];

function isCloudinaryUrl(uri) {
  return /res\.cloudinary\.com/i.test(String(uri || ""));
}

function cloudinaryTransform(uri, width) {
  const url = String(uri || "");
  if (!url.includes("/upload/")) return url;
  return url.replace("/upload/", `/upload/c_limit,w_${width},f_webp,q_auto/`);
}

/**
 * Build src/srcSet for responsive heroes when CDN supports width transforms (Cloudinary).
 */
export function buildResponsiveImageSources(rawUri, widths = DEFAULT_WIDTHS) {
  const resolved = resolveImageUri(rawUri);
  if (!resolved) {
    return { src: "", srcSet: undefined, sizes: undefined };
  }

  if (!isCloudinaryUrl(resolved)) {
    return { src: resolved, srcSet: undefined, sizes: undefined };
  }

  const srcSet = widths.map((w) => `${cloudinaryTransform(resolved, w)} ${w}w`).join(", ");
  const src = cloudinaryTransform(resolved, widths[widths.length - 1]);
  return {
    src,
    srcSet,
    sizes: "(max-width: 768px) 100vw, min(520px, 42vw)",
  };
}

/** Prefer a wide OG image (1200px) when Cloudinary; otherwise first gallery image. */
export function pickProductOgImage(product = {}, siteUrl = "") {
  const candidates = [];
  if (Array.isArray(product.images)) candidates.push(...product.images);
  if (product.image) candidates.unshift(product.image);
  const first = candidates.map((u) => String(u || "").trim()).find(Boolean);
  if (!first) return "";
  const { src } = buildResponsiveImageSources(first, [630, 960, 1200]);
  return src || resolveImageUri(first);
}
