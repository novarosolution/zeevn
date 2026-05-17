import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useWindowDimensions } from "react-native";
import PlpFilterPanel from "../components/plp/PlpFilterPanel";
import ProductListingLayout from "../components/plp/ProductListingLayout";
import Badge from "../components/ui/Badge";
import EmptyState from "../components/ui/EmptyState";
import useRouteMeta from "../hooks/useRouteMeta";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";
import { useTheme } from "../context/ThemeContext";
import { HOME_EMPTY_STATES, HOME_VIEW_DEFAULTS, PLP_UI } from "../content/appContent";
import { getHomeViewConfig, getProducts } from "../services/productService";
import { filterProductsByQuery } from "../utils/filterProductsByQuery";
import { productToCartLine } from "../utils/productCart";
import { HOME_CATALOG_ALL, matchesShelfProduct } from "../utils/shelfMatch";
import { CUSTOMER_PAGE_MAX_WIDTH } from "../theme/screenLayout";

function sortPlProducts(items, sortKey) {
  const copy = [...items];
  if (sortKey === "priceAsc") copy.sort((a, b) => Number(a.price || 0) - Number(b.price || 0));
  else if (sortKey === "priceDesc") copy.sort((a, b) => Number(b.price || 0) - Number(a.price || 0));
  else if (sortKey === "name") copy.sort((a, b) => String(a.name || "").localeCompare(String(b.name || "")));
  else {
    copy.sort((a, b) => {
      const oa = Number.isFinite(Number(a.homeOrder)) ? Number(a.homeOrder) : 0;
      const ob = Number.isFinite(Number(b.homeOrder)) ? Number(b.homeOrder) : 0;
      if (oa !== ob) return oa - ob;
      return String(a.name || "").localeCompare(String(b.name || ""));
    });
  }
  return copy;
}

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
  const [sortKey, setSortKey] = useState("featured");
  const [selectedCategories, setSelectedCategories] = useState(() => new Set());
  const [selectedTypes, setSelectedTypes] = useState(() => new Set());
  const [inStockOnly, setInStockOnly] = useState(false);

  useEffect(() => {
    setSelectedCategories(new Set());
    setSelectedTypes(new Set());
    setInStockOnly(false);
  }, [routeQ, routeCategory]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError("");
      try {
        const [data, viewConfig] = await Promise.all([getProducts(), getHomeViewConfig()]);
        if (cancelled) return;
        setProducts(Array.isArray(data) ? data : []);
        if (viewConfig?.productCardStyle) {
          setCardStyle(viewConfig.productCardStyle);
        }
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
    list = filterProductsByQuery(list, routeQ);
    return list;
  }, [catalogProducts, routeCategory, routeQ]);

  const facetCategories = useMemo(() => {
    const set = new Set();
    baseMatches.forEach((p) => {
      const c = String(p.category || "").trim();
      if (c) set.add(c);
    });
    return [...set].sort((a, b) => a.localeCompare(b));
  }, [baseMatches]);

  const facetTypes = useMemo(() => {
    const set = new Set();
    baseMatches.forEach((p) => {
      const t = String(p.productType || "").trim();
      if (t) set.add(t);
    });
    return [...set].sort((a, b) => a.localeCompare(b));
  }, [baseMatches]);

  const filtered = useMemo(() => {
    let list = baseMatches;
    if (selectedCategories.size > 0) {
      list = list.filter((p) => selectedCategories.has(String(p.category || "").trim()));
    }
    if (selectedTypes.size > 0) {
      list = list.filter((p) => selectedTypes.has(String(p.productType || "").trim()));
    }
    if (inStockOnly) {
      list = list.filter((p) => p.inStock !== false && Number(p.stockQty || 0) > 0);
    }
    return sortPlProducts(list, sortKey);
  }, [baseMatches, inStockOnly, selectedCategories, selectedTypes, sortKey]);

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
      typeof CUSTOMER_PAGE_MAX_WIDTH === "number"
        ? Math.min(windowWidth, CUSTOMER_PAGE_MAX_WIDTH)
        : windowWidth;
    const sidebar = windowWidth >= 1024 ? 280 + SPACING.xl : 0;
    const gridOuterWidth = innerMax - gutter * 2 - sidebar;
    const totalGap = gridGap * Math.max(0, numColumns - 1);
    return Math.max(120, Math.floor((gridOuterWidth - totalGap) / numColumns));
  }, [gridGap, gutter, numColumns, windowWidth, SPACING.xl]);

  const sheetActiveFacetCount =
    selectedCategories.size + selectedTypes.size + (inStockOnly ? 1 : 0);

  const toggleCategory = useCallback((cat) => {
    setSelectedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(cat)) next.delete(cat);
      else next.add(cat);
      return next;
    });
  }, []);

  const toggleType = useCallback((t) => {
    setSelectedTypes((prev) => {
      const next = new Set(prev);
      if (next.has(t)) next.delete(t);
      else next.add(t);
      return next;
    });
  }, []);

  const clearFilters = useCallback(() => {
    setSelectedCategories(new Set());
    setSelectedTypes(new Set());
    setInStockOnly(false);
    if (baseMatches.length === 0) {
      navigation.setParams({ q: "", category: "", categoryLabel: "" });
    }
  }, [baseMatches.length, navigation]);

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
      { key: "priceAsc", label: PLP_UI.sortPriceAsc },
      { key: "priceDesc", label: PLP_UI.sortPriceDesc },
      { key: "name", label: PLP_UI.sortName },
    ],
    []
  );

  const renderFilterPanel = useCallback(
    () => (
      <PlpFilterPanel
        facetCategories={facetCategories}
        facetTypes={facetTypes}
        selectedCategories={selectedCategories}
        selectedTypes={selectedTypes}
        onToggleCategory={toggleCategory}
        onToggleType={toggleType}
        inStockOnly={inStockOnly}
        onToggleInStock={() => setInStockOnly((v) => !v)}
      />
    ),
    [
      facetCategories,
      facetTypes,
      inStockOnly,
      selectedCategories,
      selectedTypes,
      toggleCategory,
      toggleType,
    ]
  );

  const chipsRow = useMemo(() => {
    const nodes = [];
    if (routeQ) {
      nodes.push(
        <Badge
          key="chip-q"
          variant="neutral"
          onDismiss={() => navigation.setParams({ q: "" })}
          dismissAccessibilityLabel={PLP_UI.chipRemoveA11y}
        >
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
    [...selectedCategories].forEach((cat) => {
      nodes.push(
        <Badge
          key={`chip-cat-${cat}`}
          variant="neutral"
          onDismiss={() => toggleCategory(cat)}
          dismissAccessibilityLabel={PLP_UI.chipRemoveA11y}
        >
          {cat}
        </Badge>
      );
    });
    [...selectedTypes].forEach((t) => {
      nodes.push(
        <Badge
          key={`chip-type-${t}`}
          variant="neutral"
          onDismiss={() => toggleType(t)}
          dismissAccessibilityLabel={PLP_UI.chipRemoveA11y}
        >
          {t}
        </Badge>
      );
    });
    if (inStockOnly) {
      nodes.push(
        <Badge
          key="chip-stock"
          variant="neutral"
          onDismiss={() => setInStockOnly(false)}
          dismissAccessibilityLabel={PLP_UI.chipRemoveA11y}
        >
          {PLP_UI.inStockOnly}
        </Badge>
      );
    }
    if (nodes.length === 0) return null;
    return <>{nodes}</>;
  }, [
    inStockOnly,
    navigation,
    routeCategory,
    routeCategoryLabel,
    routeQ,
    selectedCategories,
    selectedTypes,
    toggleCategory,
    toggleType,
  ]);

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

  const emptySlot = (
    <EmptyState
      iconName="search-outline"
      title={PLP_UI.noMatchesTitle}
      description={PLP_UI.noMatchesBody}
      ctaLabel={PLP_UI.clearFiltersCta}
      onCtaPress={clearFilters}
    />
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
      filteredItems={filtered}
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
      onSortChange={setSortKey}
      sheetActiveFacetCount={sheetActiveFacetCount}
      chipsRow={chipsRow}
      listKeyPrefix="search-plp"
    />
  );
}
