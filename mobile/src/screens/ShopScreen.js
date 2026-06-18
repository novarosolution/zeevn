import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useFocusEffect } from "@react-navigation/native";
import {
  Platform,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from "react-native";
import CustomerScreenShell from "../components/CustomerScreenShell";
import BottomNavBar from "../components/BottomNavBar";
import { HomeCatalogGridCard } from "../components/home/HomeCatalogProductViews";
import { KankregGrainOverlay, KankregPageWrap } from "../components/kankreg/KankregPageChrome";
import KankregCustomerPageHeader from "../components/kankreg/KankregCustomerPageHeader";
import { SHOP_SCREEN_UI, shopRatingChipLabels, shopRatingLabelFromValue } from "../content/shopPageContent";
import KankregScrollPage from "../components/kankreg/KankregScrollPage";
import PremiumEmptyState from "../components/ui/PremiumEmptyState";
import { useCart } from "../context/CartContext";
import { useTheme } from "../context/ThemeContext";
import { getProducts, invalidateProductsCache } from "../services/productService";
import { KANKREG_PALETTE } from "../theme/kankregWeb";
import { KANKREG_PAGE_SECTION_GAP } from "../theme/kankregScreenStyles";
import { useKankregLayout } from "../theme/kankregBreakpoints";
import { getShopTheme } from "../theme/shopTheme";
import { getProductCardFlags } from "../utils/productAvailability";
import KankregFilterChips from "../components/kankreg/KankregFilterChips";
import KankregAnimatedSection from "../components/kankreg/KankregAnimatedSection";
import CatalogGridReveal from "../components/kankreg/CatalogGridReveal";
import { ShopCatalogSkeleton } from "../components/loading";
import SectionReveal from "../components/motion/SectionReveal";
import { customerPanel } from "../theme/screenLayout";
import { fonts, spacing, typography } from "../theme/tokens";
import { productToCartLine } from "../utils/productCart";
import NativeSearchBar from "../components/native/NativeSearchBar";
import NativeProductCard from "../components/native/NativeProductCard";
import { FIGMA } from "../theme/figmaApp";
import {
  applyShopFilters,
  countShopFilterBadge,
  formatPriceRangeLabel,
  getCatalogPriceBounds,
  getProductCategoryLabels,
  hasActiveShopFilters,
} from "../utils/shopFilters";
import ShopPriceFilter from "../components/shop/ShopPriceFilter";
import ShopFilterSection from "../components/shop/ShopFilterSection";
import ShopActiveFilters from "../components/shop/ShopActiveFilters";
import ShopCatalogHero from "../components/shop/ShopCatalogHero";
import ShopCategoryRail from "../components/shop/ShopCategoryRail";
import ShopSortBar from "../components/shop/ShopSortBar";
import ShopFeaturesStrip from "../components/shop/ShopFeaturesStrip";
import ShopDeliveryNote from "../components/shop/ShopDeliveryNote";
import ShopLineQuickPick from "../components/shop/ShopLineQuickPick";
import { buildShopCatalogSummary, buildShopCategoryRail } from "../utils/shopCatalogHelpers";
import {
  ShopCollectionPills,
  ShopCatalogSearch,
  ShopCompactToolbar,
  ShopFilterCheck,
  ShopFilterSidebarHeader,
  ShopMobileFilterCard,
  ShopNativeMetaLine,
  ShopTrustStrip,
  shopFilterSidebarStyle,
} from "../components/shop/ShopPageChrome";

const RATING_OPTIONS = shopRatingChipLabels();
const SHOP_PILLS = SHOP_SCREEN_UI.collectionPills;
const SORT_OPTIONS = SHOP_SCREEN_UI.sortOptions;
const SHOP_LAYOUT = SHOP_SCREEN_UI.layout || {};

function buildActiveFilterChips({ pill, categories, minRating, minPrice, maxPrice, sortKey, searchQuery }) {
  const chips = [];
  const trimmed = String(searchQuery || "").trim();
  if (trimmed) chips.push({ key: "search", label: `"${trimmed}"` });
  if (pill !== "All") chips.push({ key: "pill", label: pill });
  categories.forEach((cat) => chips.push({ key: `cat:${cat}`, label: cat }));
  const ratingLabel = shopRatingLabelFromValue(minRating);
  if (minRating >= 3) chips.push({ key: "rating", label: ratingLabel });
  if (minPrice != null || maxPrice != null) {
    chips.push({ key: "price", label: formatPriceRangeLabel(minPrice, maxPrice) });
  }
  if (sortKey !== "featured") {
    const sortLabel = SORT_OPTIONS.find((o) => o.key === sortKey)?.label || sortKey;
    chips.push({ key: "sort", label: sortLabel });
  }
  return chips;
}

export default function ShopScreen({ navigation, route }) {
  const { colors: c, shadowPremium, isDark } = useTheme();
  const shopTheme = useMemo(() => getShopTheme(isDark), [isDark]);
  const filterPanelStyle = useMemo(
    () => ({
      ...customerPanel(c, shadowPremium, isDark),
      ...(Platform.OS === "web" && shopTheme.panelGradient
        ? { backgroundImage: shopTheme.panelGradient }
        : null),
      ...(Platform.OS === "web" ? { boxShadow: shopTheme.panelShadow } : null),
    }),
    [c, shadowPremium, isDark, shopTheme]
  );
  const { addToCart, removeFromCart, getItemQuantity } = useCart();
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
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState(() => String(route.params?.q || "").trim());
  const searchInputRef = useRef(null);

  const { showShopSidebar, isXs, isMobileWeb, catalogCardCompact } = useKankregLayout();
  const showSidebar = showShopSidebar;
  const compactShop = isXs || isMobileWeb || Platform.OS !== "web";

  const load = useCallback(async (pull = false) => {
    if (pull) setRefreshing(true);
    else setLoading(true);
    try {
      const list = await getProducts();
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

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      invalidateProductsCache();
      getProducts()
        .then((list) => {
          if (!cancelled) setProducts(Array.isArray(list) ? list : []);
        })
        .catch(() => {});
      return () => {
        cancelled = true;
      };
    }, [])
  );

  useEffect(() => {
    if (route.params?.category) {
      setCategories([String(route.params.category)]);
    }
  }, [route.params?.category]);

  useEffect(() => {
    const pillParam = route.params?.pill;
    if (pillParam && SHOP_PILLS.includes(pillParam)) {
      setPill(pillParam);
    }
  }, [route.params?.pill]);

  useEffect(() => {
    if (route.params?.q != null) {
      setSearchQuery(String(route.params.q || "").trim());
    }
  }, [route.params?.q]);

  useEffect(() => {
    if (!route.params?.focusSearch) return undefined;
    const timer = setTimeout(() => {
      searchInputRef.current?.focus?.();
      navigation.setParams({ focusSearch: undefined });
    }, 150);
    return () => clearTimeout(timer);
  }, [route.params?.focusSearch, navigation]);

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

  const handlePriceChange = ({ min, max }) => {
    setMinPrice(min);
    setMaxPrice(max);
  };

  const handlePillSelect = (next) => {
    setPill(next);
    if (next === "All") {
      setCategories([]);
    }
  };

  const handleRatingChip = (label) => {
    const opt = SHOP_SCREEN_UI.ratingOptions.find((o) => o.label === label);
    const value = opt?.min ?? 0;
    setMinRating((prev) => (prev === value && value > 0 ? 0 : value));
  };

  const toggleRating = (value) => {
    setMinRating((prev) => (prev === value ? 0 : value));
  };

  const handleRemoveFilterChip = (key) => {
    if (key === "pill") setPill("All");
    else if (key.startsWith("cat:")) toggleCategory(key.slice(4));
    else if (key === "rating") setMinRating(0);
    else if (key === "price") {
      setMinPrice(null);
      setMaxPrice(null);
    } else if (key === "sort") setSortKey("featured");
    else if (key === "search") setSearchQuery("");
  };

  const categoryOptions = useMemo(() => {
    const labels = products.flatMap((p) => getProductCategoryLabels(p));
    return [...new Set(labels)].sort((a, b) => a.localeCompare(b));
  }, [products]);

  const catalogSummary = useMemo(() => buildShopCatalogSummary(products), [products]);
  const categoryRail = useMemo(() => buildShopCategoryRail(products), [products]);

  const priceBounds = useMemo(() => getCatalogPriceBounds(products), [products]);

  const filterState = useMemo(
    () => ({ pill, categories, minRating, minPrice, maxPrice, sortKey, searchQuery }),
    [pill, categories, minRating, minPrice, maxPrice, sortKey, searchQuery]
  );

  const filtered = useMemo(
    () => applyShopFilters(products, filterState),
    [products, filterState]
  );

  const hasActiveFilters = hasActiveShopFilters(filterState);
  const filterBadgeCount = countShopFilterBadge(filterState);
  const activeFilterChips = useMemo(() => buildActiveFilterChips(filterState), [filterState]);
  const mobileTitle = isXs ? SHOP_SCREEN_UI.pageTitle : SHOP_SCREEN_UI.pageTitleWide;
  const headerSubtitle =
    SHOP_LAYOUT.showPageSubtitle && SHOP_SCREEN_UI.pageSubtitle ? SHOP_SCREEN_UI.pageSubtitle : undefined;
  const showTrustStrip =
    SHOP_LAYOUT.showTrustStrip === true &&
    (Boolean(SHOP_SCREEN_UI.trustLine) || (SHOP_SCREEN_UI.trustBadges?.length || 0) > 0);
  const showCatalogHero = SHOP_LAYOUT.showCatalogHero === true;
  const showCategoryRail = SHOP_LAYOUT.showCategoryRail === true && categoryRail.length > 0;
  const showLineQuickPick = SHOP_LAYOUT.showLineQuickPick === true;
  const hideToolbarPills =
    SHOP_LAYOUT.hideToolbarPillsWhenQuickPick !== false && showLineQuickPick;
  const showPageHeader = SHOP_LAYOUT.showPageHeader !== false;
  const showNativeSortRow = SHOP_LAYOUT.showNativeSortRow === true;
  const showFeaturesStrip = SHOP_LAYOUT.showFeaturesStrip === true && (SHOP_SCREEN_UI.features?.length || 0) > 0;
  const showDeliveryNote = SHOP_LAYOUT.showDeliveryNote === true && Boolean(SHOP_SCREEN_UI.deliveryNote);
  const showNativeMetaLine = SHOP_LAYOUT.showNativeMetaLine === true;
  const premiumLean = SHOP_LAYOUT.premiumLean === true;

  const showToolbarSort = SHOP_LAYOUT.showToolbarSort !== false;

  const renderFilterSections = (variant = "chips", { skipCollection = false } = {}) => (
    <>
      {!skipCollection ? (
        <ShopFilterSection title={SHOP_SCREEN_UI.filterCollection} icon="collection">
          {variant === "chips" ? (
            <KankregFilterChips
              options={SHOP_PILLS}
              selected={pill}
              multi={false}
              onToggle={handlePillSelect}
              compact
            />
          ) : (
            <ShopCollectionPills selected={pill} onSelect={handlePillSelect} compact scroll />
          )}
        </ShopFilterSection>
      ) : null}

      <ShopFilterSection title={SHOP_SCREEN_UI.filterCategory} icon="category">
        {variant === "chips" ? (
          <KankregFilterChips
            options={categoryOptions}
            selected={categories}
            multi
            onToggle={toggleCategory}
            compact
          />
        ) : (
          categoryOptions.map((label) => (
            <ShopFilterCheck
              key={label}
              label={label}
              on={categories.includes(label)}
              onPress={() => toggleCategory(label)}
            />
          ))
        )}
      </ShopFilterSection>

      <ShopFilterSection title={SHOP_SCREEN_UI.filterPrice} icon="price">
        <ShopPriceFilter
          minPrice={minPrice}
          maxPrice={maxPrice}
          onChange={handlePriceChange}
          bounds={priceBounds}
          variant={variant === "chips" ? "chips" : "sidebar"}
        />
      </ShopFilterSection>

      <ShopFilterSection title={SHOP_SCREEN_UI.filterRating} icon="rating">
        {variant === "chips" ? (
          <KankregFilterChips
            options={RATING_OPTIONS}
            selected={shopRatingLabelFromValue(minRating)}
            multi={false}
            onToggle={handleRatingChip}
            compact
          />
        ) : (
          SHOP_SCREEN_UI.ratingOptions.map((opt) => (
            <ShopFilterCheck
              key={opt.label}
              label={opt.label}
              on={minRating === opt.min || (opt.min === 0 && minRating === 0)}
              onPress={() => toggleRating(opt.min)}
            />
          ))
        )}
      </ShopFilterSection>

      <ShopFilterSection title={SHOP_SCREEN_UI.filterSort} icon="sort" last>
        <ShopSortBar value={sortKey} onChange={setSortKey} compact={variant === "chips"} vertical={variant !== "chips"} />
      </ShopFilterSection>
    </>
  );

  const nativeFilterPanel = filtersOpen ? (
    <View
      style={[
        styles.nativeFiltersCard,
        {
          backgroundColor: shopTheme.surface,
          borderColor: shopTheme.border,
          borderTopColor: shopTheme.borderTopAccent,
        },
      ]}
    >
      {renderFilterSections("chips", { skipCollection: true })}
      {hasActiveFilters ? (
        <Pressable onPress={clearAllFilters} style={styles.nativeClearLink}>
          <Text style={[styles.nativeClearText, { color: shopTheme.accent }]}>
            {SHOP_SCREEN_UI.clearFilters}
          </Text>
        </Pressable>
      ) : null}
    </View>
  ) : null;

  if (Platform.OS !== "web") {
    return (
      <CustomerScreenShell style={{ flex: 1 }}>
        <KankregScrollPage
          scrollVariant="page"
          showFooter={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => load(true)} tintColor={c.primary} />
          }
        >
          <KankregCustomerPageHeader
            title={SHOP_SCREEN_UI.pageTitle}
            showBack={false}
            compactNative
          />
          {(showCatalogHero || showFeaturesStrip || showDeliveryNote) ? (
            <View style={styles.nativeHeroWrap}>
              {showCatalogHero ? <ShopCatalogHero summary={catalogSummary} compact /> : null}
              {showFeaturesStrip ? <ShopFeaturesStrip compact /> : null}
              {showDeliveryNote ? <ShopDeliveryNote compact /> : null}
            </View>
          ) : null}
          {showTrustStrip ? (
            <View style={styles.nativeTrustWrap}>
              <ShopTrustStrip compact />
            </View>
          ) : null}
          <View style={styles.nativeToolbar}>
            <NativeSearchBar
              value={searchQuery}
              onChangeText={setSearchQuery}
              inputRef={searchInputRef}
              autoFocus={Boolean(route.params?.focusSearch)}
              onClear={() => setSearchQuery("")}
              onFilterPress={() => setFiltersOpen((open) => !open)}
              placeholder={SHOP_SCREEN_UI.searchPlaceholder}
              filterBadgeCount={filterBadgeCount}
            />
            {showLineQuickPick ? (
              <View style={styles.nativeLinePick}>
                <ShopLineQuickPick selectedPill={pill} onSelectPill={handlePillSelect} compact />
              </View>
            ) : (
              <View style={styles.nativePillsWrap}>
                <ShopCollectionPills selected={pill} onSelect={handlePillSelect} compact scroll />
              </View>
            )}
            {showCategoryRail ? (
              <View style={styles.nativeCategoryRail}>
                <ShopCategoryRail
                  categories={categoryRail}
                  selected={categories}
                  onToggle={toggleCategory}
                  compact
                />
              </View>
            ) : null}
            {activeFilterChips.length ? (
              <View style={styles.nativeActiveFilters}>
                <ShopActiveFilters
                  chips={activeFilterChips}
                  onRemove={handleRemoveFilterChip}
                  onClearAll={clearAllFilters}
                  inline
                />
              </View>
            ) : null}
            {nativeFilterPanel}
            {showNativeSortRow ? (
              <View style={styles.nativeSortWrap}>
                <ShopSortBar value={sortKey} onChange={setSortKey} compact />
              </View>
            ) : null}
            {showNativeMetaLine ? (
              <ShopNativeMetaLine filtered={filtered.length} total={products.length} />
            ) : null}
          </View>
          {loading ? (
            <ShopCatalogSkeleton count={6} />
          ) : filtered.length ? (
            <View style={nativeShopGrid.grid}>
              {filtered.map((item, idx) => {
                const flags = getProductCardFlags(item, SHOP_SCREEN_UI.card.comingSoonNoteFallback);
                return (
                <View key={item.id} style={nativeShopGrid.cell}>
                  <NativeProductCard
                    product={item}
                    index={idx}
                    isOutOfStock={flags.isOutOfStock}
                    isComingSoon={flags.isComingSoon}
                    comingSoonNote={flags.comingSoonNote}
                    onPress={() => navigation.navigate("Product", { productId: item.id })}
                    onAddToCart={() => addToCart(productToCartLine(item))}
                  />
                </View>
              );})}
            </View>
          ) : (
            <PremiumEmptyState
              iconName="search-outline"
              title={hasActiveFilters ? SHOP_SCREEN_UI.emptyMatchesTitle : SHOP_SCREEN_UI.emptyTitle}
              description={
                hasActiveFilters ? SHOP_SCREEN_UI.emptyMatchesDescription : SHOP_SCREEN_UI.emptyDescription
              }
              ctaLabel={hasActiveFilters ? SHOP_SCREEN_UI.viewAllCta : SHOP_SCREEN_UI.emptyCta}
              onCtaPress={hasActiveFilters ? clearAllFilters : () => load(true)}
              compact
            />
          )}
        </KankregScrollPage>
        <BottomNavBar />
      </CustomerScreenShell>
    );
  }

  const mobileWebFilters =
    !showSidebar && filtersOpen ? (
      <ShopMobileFilterCard
        onClear={clearAllFilters}
        hasFilters={hasActiveFilters}
        filterCount={filterBadgeCount}
        compact
      >
        {renderFilterSections("chips", { skipCollection: true })}
      </ShopMobileFilterCard>
    ) : null;

  const sidebarFilters = showSidebar ? (
    <View style={[styles.filtersInner, filterPanelStyle]}>
      <ShopFilterSidebarHeader
        onReset={clearAllFilters}
        hasFilters={hasActiveFilters}
        filterCount={filterBadgeCount}
      />
      {renderFilterSections("sidebar")}
    </View>
  ) : null;

  return (
    <CustomerScreenShell style={{ flex: 1 }}>
      <KankregGrainOverlay />
      <KankregScrollPage
        scrollVariant="page"
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => load(true)} tintColor={c.primary} />
        }
      >
        <KankregPageWrap gap={KANKREG_PAGE_SECTION_GAP}>
          <KankregAnimatedSection index={0} immediate>
            {showPageHeader ? (
              <KankregCustomerPageHeader
                eyebrow={SHOP_SCREEN_UI.pageEyebrow}
                title={mobileTitle}
                subtitle={headerSubtitle}
                navigation={navigation}
                showBack={false}
                figmaOnWeb={compactShop}
              />
            ) : null}
            {showTrustStrip ? <ShopTrustStrip compact /> : null}
            {!compactShop && showCatalogHero ? (
              <>
                <ShopCatalogHero summary={catalogSummary} />
                {showFeaturesStrip ? <ShopFeaturesStrip /> : null}
                {showDeliveryNote ? <ShopDeliveryNote /> : null}
              </>
            ) : null}
          </KankregAnimatedSection>

          <View style={[styles.shopGrid, !showSidebar && styles.shopGridStack]}>
            {showSidebar ? (
              <KankregAnimatedSection index={1} style={shopFilterSidebarStyle()}>
                {sidebarFilters}
              </KankregAnimatedSection>
            ) : null}

            <View style={styles.mainCol}>
              <KankregAnimatedSection index={compactShop ? 1 : 1}>
                <View style={[styles.shopTopBand, premiumLean && styles.shopTopBandLean, { backgroundColor: shopTheme.introBand, borderColor: shopTheme.border }]}>
                  <ShopCatalogSearch
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                    inputRef={searchInputRef}
                    placeholder={SHOP_SCREEN_UI.searchPlaceholder}
                    onClear={() => setSearchQuery("")}
                    premium={premiumLean}
                  />
                  {showLineQuickPick ? (
                    <View style={styles.shopCollectionRow}>
                      <ShopLineQuickPick selectedPill={pill} onSelectPill={handlePillSelect} compact={compactShop} />
                    </View>
                  ) : null}
                </View>
              </KankregAnimatedSection>
              {showCategoryRail ? (
                <KankregAnimatedSection index={compactShop ? 2 : 1}>
                  <ShopCategoryRail
                    categories={categoryRail}
                    selected={categories}
                    onToggle={toggleCategory}
                    compact={compactShop}
                  />
                </KankregAnimatedSection>
              ) : null}
              {!showSidebar ? (
                <KankregAnimatedSection index={3}>
                  <ShopCompactToolbar
                    filtered={filtered.length}
                    total={products.length}
                    pill={pill}
                    onPill={handlePillSelect}
                    sortKey={sortKey}
                    onSortChange={setSortKey}
                    filtersOpen={filtersOpen}
                    onToggleFilters={() => setFiltersOpen((open) => !open)}
                    filterBadgeCount={filterBadgeCount}
                    activeChips={activeFilterChips}
                    onRemoveChip={handleRemoveFilterChip}
                    onClearAll={clearAllFilters}
                    useSortBar={showToolbarSort}
                    hideCollectionPills={hideToolbarPills}
                    compactActions={compactShop}
                    lean={premiumLean}
                  />
                  {mobileWebFilters}
                </KankregAnimatedSection>
              ) : (
                <KankregAnimatedSection index={3} immediate>
                  <ShopCompactToolbar
                    variant="sidebar"
                    filtered={filtered.length}
                    total={products.length}
                    pill={pill}
                    onPill={handlePillSelect}
                    sortKey={sortKey}
                    onSortChange={setSortKey}
                    activeChips={activeFilterChips}
                    onRemoveChip={handleRemoveFilterChip}
                    onClearAll={clearAllFilters}
                    useSortBar={false}
                    hideCollectionPills
                    lean={premiumLean}
                  />
                </KankregAnimatedSection>
              )}

              {loading ? (
                <ShopCatalogSkeleton count={8} />
              ) : filtered.length === 0 ? (
                <SectionReveal index={3} preset="fade-in" immediate>
                  <PremiumEmptyState
                    compact
                    iconName="search-outline"
                    title={SHOP_SCREEN_UI.emptyMatchesTitle}
                    description={SHOP_SCREEN_UI.emptyMatchesDescription}
                    ctaLabel={SHOP_SCREEN_UI.viewAllCta}
                    onCtaPress={clearAllFilters}
                  />
                </SectionReveal>
              ) : (
                <CatalogGridReveal immediateFirst={12}>
                  {filtered.map((item, idx) => {
                    const flags = getProductCardFlags(item, SHOP_SCREEN_UI.card.comingSoonNoteFallback);
                    return (
                    <HomeCatalogGridCard
                      key={item.id}
                      idx={idx}
                      item={item}
                      compact={catalogCardCompact}
                      navigation={navigation}
                      quantity={getItemQuantity(item.id)}
                      styles={gridStyles}
                      isOutOfStock={flags.isOutOfStock}
                      isComingSoon={flags.isComingSoon}
                      comingSoonNote={flags.comingSoonNote}
                      onAddToCart={() => addToCart(productToCartLine(item))}
                      onRemoveFromCart={() => removeFromCart(item.id)}
                    />
                  );})}
                </CatalogGridReveal>
              )}
            </View>
          </View>
        </KankregPageWrap>
      </KankregScrollPage>
      <BottomNavBar />
    </CustomerScreenShell>
  );
}

const gridStyles = StyleSheet.create({
  productGridWrap: {},
  productGridCell: {},
  productListRow: {},
});

const nativeShopGrid = StyleSheet.create({
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: FIGMA.gutter,
    gap: 11,
    paddingBottom: spacing.md,
  },
  cell: {
    width: "47.5%",
    minWidth: 0,
  },
});

const styles = StyleSheet.create({
  shopGrid: {
    flexDirection: "row",
    gap: 32,
    alignItems: "flex-start",
  },
  shopGridStack: { flexDirection: "column", gap: 0 },
  nativeToolbar: {
    gap: spacing.xs,
  },
  nativeHeroWrap: {
    paddingHorizontal: FIGMA.gutter,
    marginBottom: spacing.xs,
  },
  nativePillsWrap: {
    paddingHorizontal: FIGMA.gutter,
  },
  nativeLinePick: {
    paddingHorizontal: FIGMA.gutter,
  },
  nativeTrustWrap: {
    paddingHorizontal: FIGMA.gutter,
    marginBottom: spacing.xs,
  },
  nativeCategoryRail: {
    paddingHorizontal: FIGMA.gutter,
  },
  nativeSortWrap: {
    paddingHorizontal: FIGMA.gutter,
  },
  nativeFiltersCard: {
    marginHorizontal: FIGMA.gutter,
    marginBottom: spacing.xs,
    padding: spacing.sm + 4,
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    borderTopWidth: 2,
  },
  nativeActiveFilters: {
    marginHorizontal: FIGMA.gutter,
    marginBottom: 0,
  },
  nativeClearLink: {
    alignSelf: "flex-start",
    marginTop: spacing.sm,
    paddingVertical: spacing.xs,
  },
  nativeClearText: {
    fontFamily: fonts.semibold,
    fontSize: typography.caption,
  },
  filtersInner: {
    width: "100%",
    padding: spacing.md,
    gap: spacing.xs,
  },
  mainCol: { flex: 1, minWidth: 0, width: "100%", overflow: "hidden" },
  shopTopBand: {
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    padding: spacing.sm + 4,
    marginBottom: spacing.sm,
    gap: spacing.xs,
    ...Platform.select({
      web: {
        boxShadow: "0 16px 40px -28px rgba(36, 68, 36, 0.22)",
      },
      default: {},
    }),
  },
  shopTopBandLean: {
    borderRadius: 18,
    padding: spacing.md,
    gap: spacing.sm,
    marginBottom: spacing.xs,
    ...Platform.select({
      web: {
        boxShadow: "0 18px 48px -30px rgba(36, 68, 36, 0.2), inset 0 1px 0 rgba(255,255,255,0.65)",
      },
      default: {},
    }),
  },
  shopCollectionRow: {
    paddingTop: 2,
  },
});
