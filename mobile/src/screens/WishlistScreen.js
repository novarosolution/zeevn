import React, { useCallback, useEffect, useMemo, useState } from "react";
import { StoreWishlist } from "../components/store/entry";
import { useWishlist } from "../context/WishlistContext";
import { getProducts } from "../services/productService";
import { getShopCatalogProducts } from "../utils/productAvailability";

/** Native wishlist — saved product ids (on this device) resolved against the live catalog. */
export default function WishlistScreen({ navigation }) {
  const wishlist = useWishlist();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async (pull = false) => {
    if (pull) setRefreshing(true);
    try {
      const list = await getProducts({ preferCache: !pull });
      setProducts(getShopCatalogProducts(Array.isArray(list) ? list : []));
    } catch {
      setProducts([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const items = useMemo(() => {
    const byId = new Map(products.map((p) => [String(p.id), p]));
    return wishlist.ids.map((id) => byId.get(id)).filter(Boolean);
  }, [products, wishlist.ids]);

  return <StoreWishlist navigation={navigation} items={items} loading={loading} refreshing={refreshing} onRefresh={() => load(true)} />;
}
