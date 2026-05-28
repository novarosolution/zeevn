import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  PLP_PAGE_SIZE,
  applyPlpFilters,
  countActiveFilters,
  createEmptyFilters,
  extractFacets,
  parsePlpParams,
  serializePlpParams,
  sortPlpProducts,
} from "../utils/plpCatalog";

/**
 * PLP filter/sort state with optional URL sync via navigation params.
 */
export default function usePlpCatalog({ navigation, route, baseProducts, routeContext = {} }) {
  const facets = useMemo(() => extractFacets(baseProducts), [baseProducts]);
  const priceBounds = facets.priceBounds;

  const [filters, setFilters] = useState(() => createEmptyFilters(priceBounds));
  const [sortKey, setSortKey] = useState("featured");
  const [visibleCount, setVisibleCount] = useState(PLP_PAGE_SIZE);
  const syncingRef = useRef(false);

  useEffect(() => {
    setFilters((prev) => ({
      ...prev,
      priceMin: prev.priceMin == null ? priceBounds.min : prev.priceMin,
      priceMax: prev.priceMax == null ? priceBounds.max : prev.priceMax,
    }));
  }, [priceBounds.max, priceBounds.min]);

  useEffect(() => {
    if (syncingRef.current) return;
    const parsed = parsePlpParams(route.params, priceBounds);
    syncingRef.current = true;
    setFilters(parsed.filters);
    setSortKey(parsed.sort);
    setVisibleCount(PLP_PAGE_SIZE);
    syncingRef.current = false;
  }, [route.params, priceBounds]);

  const syncParams = useCallback(
    (nextFilters, nextSort) => {
      if (!navigation?.setParams) return;
      syncingRef.current = true;
      const merged = serializePlpParams(nextFilters, nextSort, {
        q: routeContext.q,
        category: routeContext.category,
        categoryLabel: routeContext.categoryLabel,
      });
      navigation.setParams(merged);
      syncingRef.current = false;
    },
    [navigation, routeContext.category, routeContext.categoryLabel, routeContext.q]
  );

  const updateFilters = useCallback(
    (updater) => {
      setFilters((prev) => {
        const next = typeof updater === "function" ? updater(prev) : updater;
        syncParams(next, sortKey);
        return next;
      });
      setVisibleCount(PLP_PAGE_SIZE);
    },
    [sortKey, syncParams]
  );

  const setSort = useCallback(
    (key) => {
      setSortKey(key);
      syncParams(filters, key);
      setVisibleCount(PLP_PAGE_SIZE);
    },
    [filters, syncParams]
  );

  const clearFilters = useCallback(() => {
    const empty = createEmptyFilters(priceBounds);
    setFilters(empty);
    setSortKey("featured");
    setVisibleCount(PLP_PAGE_SIZE);
    syncParams(empty, "featured");
  }, [priceBounds, syncParams]);

  const resetForRoute = useCallback(() => {
    const empty = createEmptyFilters(priceBounds);
    setFilters(empty);
    setSortKey("featured");
    setVisibleCount(PLP_PAGE_SIZE);
    syncParams(empty, "featured");
  }, [priceBounds, syncParams]);

  const filtered = useMemo(
    () => sortPlpProducts(applyPlpFilters(baseProducts, filters, priceBounds), sortKey),
    [baseProducts, filters, priceBounds, sortKey]
  );

  const visibleItems = useMemo(() => filtered.slice(0, visibleCount), [filtered, visibleCount]);
  const hasMore = visibleCount < filtered.length;

  const loadMore = useCallback(() => {
    setVisibleCount((c) => Math.min(filtered.length, c + PLP_PAGE_SIZE));
  }, [filtered.length]);

  const activeFilterCount = useMemo(() => countActiveFilters(filters, priceBounds), [filters, priceBounds]);

  const toggleSet = useCallback(
    (field, value) => {
      updateFilters((prev) => {
        const next = new Set(prev[field]);
        if (next.has(value)) next.delete(value);
        else next.add(value);
        return { ...prev, [field]: next };
      });
    },
    [updateFilters]
  );

  return {
    facets,
    filters,
    sortKey,
    filtered,
    visibleItems,
    hasMore,
    loadMore,
    activeFilterCount,
    updateFilters,
    setSort,
    clearFilters,
    resetForRoute,
    toggleSet,
    priceBounds,
  };
}
