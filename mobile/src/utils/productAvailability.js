/** Catalog availability & visibility — single source of truth for home, shop, and PDP. */

import { parseCatalogBoolean } from "./catalogBoolean";

export function isProductPublished(product) {
  return product?.isPublished !== false;
}

/** Visible in shop catalog and deep links (admin can unpublish without deleting). */
export function isProductShopVisible(product) {
  return isProductPublished(product);
}

/** Visible on home grid when admin enables Show on Home. */
export function isProductHomeVisible(product) {
  return isProductPublished(product) && product?.showOnHome !== false;
}

export function isProductComingSoon(product) {
  return parseCatalogBoolean(product?.comingSoon, false);
}

export function isProductOutOfStock(product) {
  if (isProductComingSoon(product)) return false;
  return product?.inStock === false || Number(product?.stockQty || 0) <= 0;
}

/** Online is 0 but the shop floor still has jars — show, do not sell on the web. */
export function isAvailableAtCounter(product) {
  if (isProductComingSoon(product)) return false;
  if (Number(product?.stockQty || 0) > 0 && product?.inStock !== false) return false;
  return Number(product?.stockCounter || 0) > 0;
}

export function isProductPurchasable(product) {
  return isProductShopVisible(product) && !isProductComingSoon(product) && !isProductOutOfStock(product);
}

export function getComingSoonNote(product, fallback = "") {
  const note = String(product?.comingSoonNote || "").trim();
  return note || fallback;
}

export function getMaxOrderQuantity(product) {
  if (!isProductPurchasable(product)) return 0;
  if (product?.inStock === false) return 0;
  return Math.max(0, Number(product?.stockQty) || 0);
}

export function getProductCardFlags(product, noteFallback = "") {
  return {
    isComingSoon: isProductComingSoon(product),
    isOutOfStock: isProductOutOfStock(product),
    isAvailableAtCounter: isAvailableAtCounter(product),
    comingSoonNote: getComingSoonNote(product, noteFallback),
  };
}

function sortProductsForHome(a, b) {
  const oa = Number(a.homeOrder) || 0;
  const ob = Number(b.homeOrder) || 0;
  if (oa !== ob) return oa - ob;
  return String(a.name || "").localeCompare(String(b.name || ""));
}

/** Shop catalog — published products; stock does not hide cards (sold-out badge instead). */
export function getShopCatalogProducts(products = []) {
  return (Array.isArray(products) ? products : []).filter(isProductShopVisible);
}

/** Home catalog — published + showOnHome; stock does not hide cards. */
export function getHomeCatalogProducts(products = [], { limit } = {}) {
  const list = getShopCatalogProducts(products).filter(isProductHomeVisible).sort(sortProductsForHome);
  return typeof limit === "number" ? list.slice(0, limit) : list;
}
