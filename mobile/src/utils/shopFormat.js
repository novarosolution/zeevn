import { formatShopResultCount } from "../content/shopPageContent";

/** Compact product count for shop toolbar. */
export function formatShopProductCount(filtered, total) {
  return formatShopResultCount(filtered, total);
}

export { formatShopResultCount };
