import { HOME_CATEGORY_DEFAULTS } from "../content/appContent";
import { parseCatalogBoolean } from "./catalogBoolean";
import { getProductCategoryLabels, isProductOnSale, isProductPremium } from "./shopFilters";
import { isProductComingSoon, isProductOutOfStock } from "./productAvailability";

export function buildShopCatalogSummary(products = []) {
  const list = Array.isArray(products) ? products : [];
  let inStock = 0;
  let comingSoon = 0;
  let onSale = 0;
  let outOfStock = 0;

  for (const p of list) {
    if (isProductComingSoon(p)) {
      comingSoon += 1;
      continue;
    }
    if (isProductOutOfStock(p)) {
      outOfStock += 1;
      continue;
    }
    inStock += 1;
    if (isProductOnSale(p)) onSale += 1;
  }

  return {
    total: list.length,
    inStock,
    comingSoon,
    onSale,
    outOfStock,
  };
}

/** Category → product count for shop rail; falls back to Zeevan defaults when empty. */
export function buildShopCategoryRail(products = [], { max = 8 } = {}) {
  const fromProducts = getShopCategoryCounts(products);
  if (fromProducts.length) return fromProducts.slice(0, max);
  return HOME_CATEGORY_DEFAULTS.slice(0, max).map((def) => ({
    label: def.label,
    count: 0,
  }));
}

/** @deprecated Use buildShopCategoryRail */
export function getShopCategoryCounts(products = []) {
  const map = new Map();
  for (const p of products) {
    for (const label of getProductCategoryLabels(p)) {
      const key = String(label || "").trim();
      if (!key) continue;
      map.set(key, (map.get(key) || 0) + 1);
    }
  }
  return [...map.entries()]
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label));
}

export function isProductPremiumFlag(p) {
  return parseCatalogBoolean(p?.isSpecial, false) || isProductPremium(p);
}
