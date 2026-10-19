/**
 * Official Zeevan packaging stills — used as product cover/gallery for each line
 * across app + web (overrides stale API / Cloudinary photos).
 */
import { resolveBundledModuleSrc } from "../utils/image";
import { ZEEVAN_PRODUCT_LINES, matchProductLine } from "./zeevanCatalogContent";

const PACKAGING_MODULES = {
  ghee: require("../../assets/zeevan-a2-desi-cow-ghee.jpg"),
  tel: require("../../assets/zeevan-tel-product.jpg"),
  masala: require("../../assets/zeevan-masala-product.jpg"),
  honey: require("../../assets/zeevan-honey-product.jpg"),
};

const uriByLine = {};
for (const key of Object.keys(PACKAGING_MODULES)) {
  uriByLine[key] = resolveBundledModuleSrc(PACKAGING_MODULES[key]) || "";
}

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
  return uriByLine[key] || "";
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
