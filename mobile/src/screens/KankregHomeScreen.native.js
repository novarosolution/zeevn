import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useFocusEffect } from "@react-navigation/native";
import { StoreHome, StoreHomeSkeleton } from "../components/store/entry";
import { useAuth } from "../context/AuthContext";
import { useDeliveryLocation } from "../hooks/useDeliveryLocation";
import { getProducts, hydrateCatalogFromDisk } from "../services/productService";
import { getShopCatalogProducts } from "../utils/productAvailability";

function useRedirectToFindLocationWhenNeeded(navigation, isAuthenticated) {
  const { bootstrapped, needsFindScreen } = useDeliveryLocation();

  useFocusEffect(
    useCallback(() => {
      if (!bootstrapped || !isAuthenticated || !needsFindScreen) {
        return undefined;
      }
      const task = setTimeout(() => {
        navigation.reset({
          index: 0,
          routes: [{ name: "FindLocation" }],
        });
      }, 0);
      return () => clearTimeout(task);
    }, [bootstrapped, isAuthenticated, needsFindScreen, navigation])
  );
}

export default function KankregHomeScreen({ navigation }) {
  const { isAuthenticated } = useAuth();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [configError, setConfigError] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const hasCachedCatalogRef = useRef(false);
  useRedirectToFindLocationWhenNeeded(navigation, isAuthenticated);

  const load = useCallback(async ({ pull = false, silent = false } = {}) => {
    if (pull) setRefreshing(true);
    else if (!silent) setLoading(true);
    setConfigError("");
    try {
      const list = await getProducts({ preferCache: !pull && hasCachedCatalogRef.current }).catch(() => []);
      const next = Array.isArray(list) ? list : [];
      setProducts(next);
      if (next.length) hasCachedCatalogRef.current = true;
      if (!next.length) {
        setConfigError("Could not load products. Check your connection and try again.");
      }
    } catch {
      setProducts([]);
      setConfigError("Could not load the store. Try again when the server is online.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const cached = await hydrateCatalogFromDisk();
      if (cancelled) return;
      if (cached?.products?.length) {
        hasCachedCatalogRef.current = true;
        setProducts(cached.products);
        setLoading(false);
        load({ silent: true });
        return;
      }
      load();
    })();
    return () => {
      cancelled = true;
    };
  }, [load]);

  const shopCatalog = useMemo(() => getShopCatalogProducts(products), [products]);

  if (loading && products.length === 0) {
    return <StoreHomeSkeleton />;
  }

  return (
    <StoreHome
      navigation={navigation}
      products={shopCatalog}
      refreshing={refreshing}
      onRefresh={() => load({ pull: true })}
      error={configError}
      onRetry={() => load()}
    />
  );
}
