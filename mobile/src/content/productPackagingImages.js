/**
 * Official Zeevan packaging stills — used as product cover/gallery for each line
 * across app + web (overrides stale API / Cloudinary photos).
 *
 * Resolve URIs lazily: Expo web `require()` is often a string/`{uri}` object, and
 * early module-init resolution can return empty before the asset registry is ready.
 *
 * Phone/APK: never stringify `require()` to a Metro `127.0.0.1:8081` / `file://`
 * URI — expo-image `{ uri }` cannot load those. Use live `/aws/media` instead
 * (or pass the module via `getPackagingImageModuleForLine`).
 */
import { Platform } from "react-native";
import { ZEEVAN_API_LIVE_URL } from "../services/apiBase";
import { resolveBundledModuleSrc } from "../utils/image";
import { ZEEVAN_PRODUCT_LINES, matchProductLine } from "./zeevanCatalogContent";

const PACKAGING_MODULES = {
  // JPG — not packaging-portrait.png (hero WebP rewrite turns hashed .png into a 404).
  ghee: require("../../assets/zeevan-pack-ghee-v2.jpg"),
  tel: require("../../assets/zeevan-tel-product.jpg"),
  masala: require("../../assets/zeevan-masala-product.jpg"),
  honey: require("../../assets/zeevan-honey-product.jpg"),
};

const LIVE_PACKAGING_URIS = {
  ghee: `${ZEEVAN_API_LIVE_URL}/media/zeevan-pack-ghee-v2.jpg`,
  tel: `${ZEEVAN_API_LIVE_URL}/media/zeevan-pack-tel-v2.jpg`,
  masala: `${ZEEVAN_API_LIVE_URL}/media/zeevan-pack-masala-v2.jpg`,
  honey: `${ZEEVAN_API_LIVE_URL}/media/zeevan-pack-honey-v2.jpg`,
};

const uriCache = Object.create(null);

/** First matching Zeevan line key for a catalog product, or null. */
export function resolveProductLineKey(product) {
  if (!product) return null;
  for (const line of ZEEVAN_PRODUCT_LINES) {
    if (matchProductLine(product, line.key)) return line.key;
  }
  return null;
}

/** Bundled packaging URI for a line key (ghee / tel / masala / honey). */
export function getPackagingImageUriForLine(lineKey) {
  const key = String(lineKey || "").trim().toLowerCase();
  if (!key || !PACKAGING_MODULES[key]) return "";
  if (Platform.OS !== "web") return LIVE_PACKAGING_URIS[key] || "";
  if (uriCache[key]) return uriCache[key];
  const uri = resolveBundledModuleSrc(PACKAGING_MODULES[key]) || LIVE_PACKAGING_URIS[key] || "";
  if (uri) uriCache[key] = uri;
  return uri;
}

/** Packaging URI for a product when it belongs to a known Zeevan line. */
export function getProductPackagingImageUri(product) {
  return getPackagingImageUriForLine(resolveProductLineKey(product));
}

/** Metro module id — for Image `source={mod}` when a URI string is not needed. */
export function getPackagingImageModuleForLine(lineKey) {
  const key = String(lineKey || "").trim().toLowerCase();
  return PACKAGING_MODULES[key] || null;
}
