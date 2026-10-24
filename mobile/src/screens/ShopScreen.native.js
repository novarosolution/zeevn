import React, { useCallback, useEffect, useMemo, useState } from "react";
import { StoreShop } from "../components/store/entry";
import { getProducts } from "../services/productService";
import { applyShopFilters, countShopFilterBadge, getProductCategoryLabels, hasActiveShopFilters } from "../utils/shopFilters";

export default function ShopScreen({ navigation, route }) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [categories, setCategories] = useState(() => {
    const seed = route.params?.category;
    return seed ? [String(seed)] : [];
  });
  const [minRating, setMinRating] = useState(0);
  const [minPrice, setMinPrice] = useState(null);
  const [maxPrice, setMaxPrice] = useState(null);
  const [pill, setPill] = useState("All");
  const [sortKey, setSortKey] = useState("featured");
  const [searchQuery, setSearchQuery] = useState(() => String(route.params?.q || "").trim());

  const load = useCallback(async (pull = false) => {
    if (pull) setRefreshing(true);
    else setLoading(true);
    try {
      const list = await getProducts({ preferCache: !pull });
      setProducts(Array.isArray(list) ? list : []);
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

  useEffect(() => {
    if (route.params?.category) {
      setCategories([String(route.params.category)]);
    }
  }, [route.params?.category]);

  useEffect(() => {
    if (route.params?.q != null) {
      setSearchQuery(String(route.params.q || "").trim());
    }
  }, [route.params?.q]);

  useEffect(() => {
    if (route.params?.pill) {
      setPill(String(route.params.pill));
    }
  }, [route.params?.pill]);

  const toggleCategory = (label) => {
    setCategories((prev) =>
      prev.includes(label) ? prev.filter((cat) => cat !== label) : [...prev, label]
    );
  };

  const clearAllFilters = () => {
    setPill("All");
    setCategories([]);
    setMinRating(0);
    setMinPrice(null);
    setMaxPrice(null);
    setSortKey("featured");
    setSearchQuery("");
  };

  const categoryOptions = useMemo(() => {
    const labels = products.flatMap((p) => getProductCategoryLabels(p));
    return [...new Set(labels)].sort((a, b) => a.localeCompare(b));
  }, [products]);

  const filterState = useMemo(
    () => ({ pill, categories, minRating, minPrice, maxPrice, sortKey, searchQuery }),
    [pill, categories, minRating, minPrice, maxPrice, sortKey, searchQuery]
  );

  const filtered = useMemo(() => applyShopFilters(products, filterState), [products, filterState]);

  return (
    <StoreShop
      navigation={navigation}
      route={route}
      products={products}
      filtered={filtered}
      loading={loading}
      refreshing={refreshing}
      onRefresh={() => load(true)}
      filters={filterState}
      categoryOptions={categoryOptions}
      hasActiveFilters={hasActiveShopFilters(filterState)}
      filterBadgeCount={countShopFilterBadge(filterState)}
      onLineFiltersChange={({ pill: nextPill, categories: nextCategories }) => {
        setPill(nextPill);
        setCategories(nextCategories);
      }}
      onSortChange={setSortKey}
      onToggleCategory={toggleCategory}
      onPriceChange={({ min, max }) => {
        setMinPrice(min);
        setMaxPrice(max);
      }}
      onRatingChange={setMinRating}
      onSearchChange={setSearchQuery}
      onClearAll={clearAllFilters}
    />
  );
}
