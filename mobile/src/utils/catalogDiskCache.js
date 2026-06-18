import AsyncStorage from "@react-native-async-storage/async-storage";

const PRODUCTS_KEY = "@zeevan_catalog_products_v1";
const HOME_VIEW_KEY = "@zeevan_catalog_home_view_v1";
const CATALOG_TS_KEY = "@zeevan_catalog_saved_at_v1";

/** Disk cache TTL — show stale catalog instantly on phone while refreshing. */
export const CATALOG_DISK_TTL_MS = 30 * 60 * 1000;

export async function readCatalogDiskCache() {
  try {
    const [productsRaw, homeRaw, tsRaw] = await AsyncStorage.multiGet([
      PRODUCTS_KEY,
      HOME_VIEW_KEY,
      CATALOG_TS_KEY,
    ]);
    const savedAt = Number(tsRaw?.[1] || 0);
    if (!savedAt || Date.now() - savedAt > CATALOG_DISK_TTL_MS) {
      return null;
    }
    const products = productsRaw?.[1] ? JSON.parse(productsRaw[1]) : [];
    const homeView = homeRaw?.[1] ? JSON.parse(homeRaw[1]) : null;
    if (!Array.isArray(products) || !products.length) return null;
    return {
      products,
      homeView,
      savedAt,
    };
  } catch {
    return null;
  }
}

export async function writeCatalogDiskCache({ products, homeView }) {
  if (!Array.isArray(products) || !products.length) return;
  try {
    await AsyncStorage.multiSet([
      [PRODUCTS_KEY, JSON.stringify(products)],
      [HOME_VIEW_KEY, JSON.stringify(homeView || null)],
      [CATALOG_TS_KEY, String(Date.now())],
    ]);
  } catch {
    // ignore quota / parse errors
  }
}

export async function clearCatalogDiskCache() {
  try {
    await AsyncStorage.multiRemove([PRODUCTS_KEY, HOME_VIEW_KEY, CATALOG_TS_KEY]);
  } catch {
    // ignore
  }
}
