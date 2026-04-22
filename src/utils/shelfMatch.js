/**
 * Default shelf for accent / upsell rules (category / type / name align with label, e.g. Ghee).
 */
export const DEFAULT_HOME_SHELF = "Ghee";

/**
 * Pass this as the second argument to `matchesShelfProduct` to include **every** product
 * (e.g. Home catalog — admin still controls visibility with `showOnHome`).
 */
export const HOME_CATALOG_ALL = "all";

export function matchesShelfProduct(product, shelfLabel = DEFAULT_HOME_SHELF) {
  const needle = String(shelfLabel || "").trim().toLowerCase();
  if (!needle) return false;
  /** Full storefront list — no name/category keyword filter */
  if (needle === HOME_CATALOG_ALL) return true;
  const cat = String(product?.category || "").trim().toLowerCase();
  const ptype = String(product?.productType || "").trim().toLowerCase();
  const name = String(product?.name || "").trim().toLowerCase();
  if (cat === needle || ptype === needle) return true;
  if (cat.includes(needle) || ptype.includes(needle)) return true;
  if (name.includes(needle)) return true;
  return false;
}
