import { useCallback, useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { getHomeViewConfig, getProducts } from "../../../services/productService";
import { HOME_SEARCH_UI, HOME_VIEW_DEFAULTS } from "../../../content/appContent";

const HOME_CACHE_KEY = "@zeevan/home/cache-v1";

export default function useHomeData() {
  const [products, setProducts] = useState([]);
  const [homeViewConfig, setHomeViewConfig] = useState({ ...HOME_VIEW_DEFAULTS });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const [showingCachedItems, setShowingCachedItems] = useState(false);

  const load = useCallback(async (isPullRefresh = false, { background = false } = {}) => {
    if (isPullRefresh) setRefreshing(true);
    else if (!background) setLoading(true);
    if (!background) {
      setError("");
      setShowingCachedItems(false);
    }
    try {
      const [data, viewConfig] = await Promise.all([getProducts(), getHomeViewConfig()]);
      setProducts(Array.isArray(data) ? data : []);
      setHomeViewConfig(viewConfig && typeof viewConfig === "object" ? viewConfig : { ...HOME_VIEW_DEFAULTS });
      setShowingCachedItems(false);
      try {
        await AsyncStorage.setItem(
          HOME_CACHE_KEY,
          JSON.stringify({
            products: Array.isArray(data) ? data : [],
            viewConfig: viewConfig && typeof viewConfig === "object" ? viewConfig : {},
            updatedAt: Date.now(),
          })
        );
      } catch {
        // cache write is best effort
      }
    } catch (err) {
      setError(err?.message || HOME_SEARCH_UI.loadErrorFallback);
      try {
        const raw = await AsyncStorage.getItem(HOME_CACHE_KEY);
        const parsed = raw ? JSON.parse(raw) : null;
        const cachedProducts = Array.isArray(parsed?.products) ? parsed.products : [];
        if (cachedProducts.length > 0) {
          setProducts(cachedProducts);
          if (parsed?.viewConfig && typeof parsed.viewConfig === "object") {
            setHomeViewConfig((prev) => ({ ...prev, ...parsed.viewConfig }));
          }
          setShowingCachedItems(true);
        }
      } catch {
        // no cache available
      }
    } finally {
      if (isPullRefresh) setRefreshing(false);
      else setLoading(false);
    }
  }, []);

  const refresh = useCallback(async () => {
    await load(true);
  }, [load]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      let cachedProducts = [];
      try {
        const raw = await AsyncStorage.getItem(HOME_CACHE_KEY);
        const parsed = raw ? JSON.parse(raw) : null;
        cachedProducts = Array.isArray(parsed?.products) ? parsed.products : [];
        if (!cancelled && cachedProducts.length > 0) {
          setProducts(cachedProducts);
          if (parsed?.viewConfig && typeof parsed.viewConfig === "object") {
            setHomeViewConfig((prev) => ({ ...prev, ...parsed.viewConfig }));
          }
          setShowingCachedItems(true);
          setLoading(false);
        }
      } catch {
        // cache read is best effort
      }
      if (!cancelled) {
        await load(false, { background: cachedProducts.length > 0 });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [load]);

  return {
    products,
    homeViewConfig,
    loading,
    error,
    refreshing,
    showingCachedItems,
    refresh,
    setHomeViewConfig,
  };
}
