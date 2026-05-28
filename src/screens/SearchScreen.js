import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useWindowDimensions } from "react-native";
import PlpFilterPanel from "../components/plp/PlpFilterPanel";
import PlpEmptyStates from "../components/plp/PlpEmptyStates";
import ProductListingLayout from "../components/plp/ProductListingLayout";
import Badge from "../components/ui/Badge";
import EmptyState from "../components/ui/EmptyState";
import useRouteMeta from "../hooks/useRouteMeta";
import usePlpCatalog from "../hooks/usePlpCatalog";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";
import { useTheme } from "../context/ThemeContext";
import { HOME_EMPTY_STATES, HOME_VIEW_DEFAULTS, PLP_UI } from "../content/appContent";
import { getHomeViewConfig, getProducts } from "../services/productService";
import { filterProductsByQuery } from "../utils/filterProductsByQuery";
import { productToCartLine } from "../utils/productCart";
import { HOME_CATALOG_ALL, matchesShelfProduct } from "../utils/shelfMatch";
import { CUSTOMER_PAGE_MAX_WIDTH } from "../theme/screenLayout";

export default function SearchScreen({ navigation, route }) {
  const { SPACING } = useTheme();
  const { width: windowWidth } = useWindowDimensions();
  const { isAuthenticated } = useAuth();
  const { addToCart, removeFromCart, getItemQuantity } = useCart();

  const routeQ = String(route.params?.q ?? "").trim();
  const routeCategory = String(route.params?.category ?? "").trim();
  const routeCategoryLabel = String(route.params?.categoryLabel ?? "").trim();

  useRouteMeta("search", { q: routeQ || undefined, category: routeCategory || undefined });

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [cardStyle, setCardStyle] = useState(HOME_VIEW_DEFAULTS.productCardStyle || "compact");
  const [refreshTick, setRefreshTick] = useState(0);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError("");
      try {
        const [data, viewConfig] = await Promise.all([getProducts(), getHomeViewConfig()]);
        if (cancelled) return;
        setProducts(Array.isArray(data) ? data : []);
        if (viewConfig?.productCardStyle) setCardStyle(viewConfig.productCardStyle);
      } catch (e) {
        if (!cancelled) {
          setError(String(e?.message || "Unable to load products."));
          setProducts([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [refreshTick]);

  const catalogProducts = useMemo(
    () => products.filter((p) => matchesShelfProduct(p, HOME_CATALOG_ALL)),
    [products]
  );

  const baseMatches = useMemo(() => {
    let list = catalogProducts;
    const catTerm = routeCategory.trim().toLowerCase();
    if (catTerm) {
      list = list.filter((p) => {
        const pc = String(p.category || "").toLowerCase();
        const pt = String(p.productType || "").toLowerCase();
        return pc.includes(catTerm) || pt.includes(catTerm);
      });
    }
    return filterProductsByQuery(list, routeQ);
  }, [catalogProducts, routeCategory, routeQ]);

  const routeContext = useMemo(
    () => ({ q: routeQ, category: routeCategory, categoryLabel: routeCategoryLabel }),
    [routeCategory, routeCategoryLabel, routeQ]
  );

  const {
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
  } = usePlpCatalog({
    navigation,
    route,
    baseProducts: baseMatches,
    routeContext,
  });

  useEffect(() => {
    resetForRoute();
  }, [routeQ, routeCategory, resetForRoute]);

  const gutter = useMemo(() => {
    if (windowWidth >= 1024) return SPACING["4xl"];
    if (windowWidth >= 768) return SPACING["2xl"];
    return SPACING.lg;
  }, [SPACING, windowWidth]);

  const numColumns = useMemo(() => {
    if (windowWidth < 640) return 2;
    if (windowWidth < 1024) return 3;
    return 4;
  }, [windowWidth]);

  const gridGap = windowWidth >= 600 ? SPACING.base : SPACING.md;

  const cardWidth = useMemo(() => {
    const innerMax =
      typeof CUSTOMER_PAGE_MAX_WIDTH === "number" ? Math.min(windowWidth, CUSTOMER_PAGE_MAX_WIDTH) : windowWidth;
    const sidebar = windowWidth >= 1024 ? 280 + SPACING.xl : 0;
    const gridOuterWidth = innerMax - gutter * 2 - sidebar;
    const totalGap = gridGap * Math.max(0, numColumns - 1);
    return Math.max(120, Math.floor((gridOuterWidth - totalGap) / numColumns));
  }, [gridGap, gutter, numColumns, windowWidth, SPACING.xl]);

  const handleCatalogAddToCart = useCallback(
    (product) => {
      if (product.inStock === false || Number(product.stockQty || 0) <= 0) return;
      if (!isAuthenticated) {
        navigation.navigate("Login");
        return;
      }
      addToCart(productToCartLine(product));
    },
    [addToCart, isAuthenticated, navigation]
  );

  const handleCatalogRemoveFromCart = useCallback(
    (productId) => {
      if (!isAuthenticated) {
        navigation.navigate("Login");
        return;
      }
      removeFromCart(productId);
    },
    [isAuthenticated, navigation, removeFromCart]
  );

  const outOfStock = useCallback((p) => p.inStock === false || Number(p.stockQty || 0) <= 0, []);

  const breadcrumbLabel = useMemo(() => {
    const j = PLP_UI.breadcrumbJoiner;
    const home = PLP_UI.breadcrumbHome;
    if (routeCategoryLabel || routeCategory) {
      const label = routeCategoryLabel || routeCategory;
      return `${home}${j}${PLP_UI.breadcrumbCategories}${j}${label}`;
    }
    if (routeQ) return `${home}${j}${PLP_UI.breadcrumbSearch}`;
    return `${home}${j}${PLP_UI.breadcrumbSearch}`;
  }, [routeCategory, routeCategoryLabel, routeQ]);

  const pageTitle = useMemo(() => {
    if (routeQ) return PLP_UI.resultsForQuery(routeQ);
    if (routeCategoryLabel) return PLP_UI.browseCategoryTitle(routeCategoryLabel);
    if (routeCategory) return PLP_UI.browseCategoryTitle(routeCategory);
    return PLP_UI.screenTitleDefault;
  }, [routeCategory, routeCategoryLabel, routeQ]);

  const sortOptions = useMemo(
    () => [
      { key: "featured", label: PLP_UI.sortFeatured },
      { key: "newest", label: PLP_UI.sortNewest },
      { key: "priceAsc", label: PLP_UI.sortPriceAsc },
      { key: "priceDesc", label: PLP_UI.sortPriceDesc },
      { key: "rating", label: PLP_UI.sortRating },
      { key: "popular", label: PLP_UI.sortPopular },
    ],
    []
  );

  const renderFilterPanel = useCallback(
    ({ onClearAll, activeFilterCount: panelActiveCount } = {}) => (
      <PlpFilterPanel
        facets={facets}
        filters={filters}
        priceBounds={priceBounds}
        activeFilterCount={panelActiveCount ?? activeFilterCount}
        onClearAll={onClearAll ?? clearFilters}
        onToggleCategory={(cat) => toggleSet("categories", cat)}
        onToggleType={(t) => toggleSet("types", t)}
        onToggleBrand={(b) => toggleSet("brands", b)}
        onToggleSize={(s) => toggleSet("sizes", s)}
        onToggleColor={(c) => toggleSet("colors", c)}
        onPriceMinChange={(n) => updateFilters((prev) => ({ ...prev, priceMin: n }))}
        onPriceMaxChange={(n) => updateFilters((prev) => ({ ...prev, priceMax: n }))}
        onRatingChange={(r) => updateFilters((prev) => ({ ...prev, minRating: r }))}
        onToggleDiscount={(v) => updateFilters((prev) => ({ ...prev, discountOnly: v }))}
        onToggleInStock={(v) => updateFilters((prev) => ({ ...prev, inStockOnly: v }))}
      />
    ),
    [activeFilterCount, clearFilters, facets, filters, priceBounds, toggleSet, updateFilters]
  );

  const chipsRow = useMemo(() => {
    const nodes = [];
    if (routeQ) {
      nodes.push(
        <Badge key="chip-q" variant="neutral" onDismiss={() => navigation.setParams({ q: "" })} dismissAccessibilityLabel={PLP_UI.chipRemoveA11y}>
          {routeQ}
        </Badge>
      );
    }
    if (routeCategory || routeCategoryLabel) {
      nodes.push(
        <Badge
          key="chip-route-cat"
          variant="neutral"
          onDismiss={() => navigation.setParams({ category: "", categoryLabel: "" })}
          dismissAccessibilityLabel={PLP_UI.chipRemoveA11y}
        >
          {routeCategoryLabel || routeCategory}
        </Badge>
      );
    }
    [...filters.categories].forEach((cat) => {
      nodes.push(
        <Badge key={`chip-cat-${cat}`} variant="neutral" onDismiss={() => toggleSet("categories", cat)} dismissAccessibilityLabel={PLP_UI.chipRemoveA11y}>
          {cat}
        </Badge>
      );
    });
    [...filters.brands].forEach((b) => {
      nodes.push(
        <Badge key={`chip-brand-${b}`} variant="neutral" onDismiss={() => toggleSet("brands", b)} dismissAccessibilityLabel={PLP_UI.chipRemoveA11y}>
          {b}
        </Badge>
      );
    });
    [...filters.sizes].forEach((s) => {
      nodes.push(
        <Badge key={`chip-size-${s}`} variant="neutral" onDismiss={() => toggleSet("sizes", s)} dismissAccessibilityLabel={PLP_UI.chipRemoveA11y}>
          {s}
        </Badge>
      );
    });
    [...filters.colors].forEach((c) => {
      const sw = facets.colors.find((x) => x.key === c);
      nodes.push(
        <Badge key={`chip-color-${c}`} variant="neutral" onDismiss={() => toggleSet("colors", c)} dismissAccessibilityLabel={PLP_UI.chipRemoveA11y}>
          {sw?.label || c}
        </Badge>
      );
    });
    if (filters.minRating != null) {
      nodes.push(
        <Badge key="chip-rating" variant="neutral" onDismiss={() => updateFilters((p) => ({ ...p, minRating: null }))} dismissAccessibilityLabel={PLP_UI.chipRemoveA11y}>
          {PLP_UI.ratingChipTemplate(filters.minRating)}
        </Badge>
      );
    }
    if (filters.discountOnly) {
      nodes.push(
        <Badge key="chip-discount" variant="neutral" onDismiss={() => updateFilters((p) => ({ ...p, discountOnly: false }))} dismissAccessibilityLabel={PLP_UI.chipRemoveA11y}>
          {PLP_UI.discountOnly}
        </Badge>
      );
    }
    if (filters.inStockOnly) {
      nodes.push(
        <Badge key="chip-stock" variant="neutral" onDismiss={() => updateFilters((p) => ({ ...p, inStockOnly: false }))} dismissAccessibilityLabel={PLP_UI.chipRemoveA11y}>
          {PLP_UI.inStockOnly}
        </Badge>
      );
    }
    if (nodes.length === 0) return null;
    return <>{nodes}</>;
  }, [facets.colors, filters, navigation, routeCategory, routeCategoryLabel, routeQ, toggleSet, updateFilters]);

  const showIntro = !routeQ && !routeCategory;
  const phase = showIntro
    ? "intro"
    : loading
      ? "loading"
      : error
        ? "error"
        : filtered.length === 0
          ? "empty"
          : "results";

  const introSlot = (
    <EmptyState
      iconName="search-outline"
      title={PLP_UI.introTitle}
      description={PLP_UI.introBody}
      ctaLabel={PLP_UI.introCta}
      onCtaPress={() => navigation.navigate("Home")}
    />
  );

  const errorSlot = (
    <EmptyState
      iconName={HOME_EMPTY_STATES.networkError.icon}
      title={HOME_EMPTY_STATES.networkError.title}
      description={error || HOME_EMPTY_STATES.networkError.body}
      ctaLabel={HOME_EMPTY_STATES.networkError.retryCta}
      onCtaPress={() => setRefreshTick((t) => t + 1)}
    />
  );

  const emptySlot =
    routeQ && !routeCategory ? (
      <PlpEmptyStates
        variant="search"
        query={routeQ}
        catalog={catalogProducts}
        navigation={navigation}
        onClearSearch={() => navigation.setParams({ q: "" })}
      />
    ) : (
      <PlpEmptyStates variant="category" categoryLabel={routeCategoryLabel || routeCategory} navigation={navigation} />
    );

  return (
    <ProductListingLayout
      navigation={navigation}
      breadcrumbLabel={breadcrumbLabel}
      pageTitle={pageTitle}
      phase={phase}
      introSlot={introSlot}
      errorSlot={errorSlot}
      emptySlot={emptySlot}
      filteredItems={visibleItems}
      numColumns={numColumns}
      gridGap={gridGap}
      cardWidth={cardWidth}
      cardStyle={cardStyle}
      getItemQuantity={getItemQuantity}
      onAddToCart={handleCatalogAddToCart}
      onRemoveFromCart={handleCatalogRemoveFromCart}
      isOutOfStock={outOfStock}
      renderFilterPanel={renderFilterPanel}
      sortOptions={sortOptions}
      sortKey={sortKey}
      onSortChange={setSort}
      sheetActiveFacetCount={activeFilterCount}
      chipsRow={chipsRow}
      listKeyPrefix="search-plp"
      onClearAll={clearFilters}
      activeFilterCount={activeFilterCount}
      onLoadMore={loadMore}
      hasMore={hasMore}
      totalCount={filtered.length}
      visibleCount={visibleItems.length}
    />
  );
}
