import React, { useCallback, useEffect, useMemo, useState } from "react";
import { FlatList, RefreshControl, Share, StyleSheet, Text, View, useWindowDimensions } from "react-native";
import { Image } from "expo-image";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useDeliveryLocation } from "../../hooks/useDeliveryLocation";
import { etaFromQuote } from "../../services/deliveryService";
import { formatDeliveryLocationParts } from "../../utils/deliveryLocationLabel";
import { useAuth } from "../../context/AuthContext";
import { STORE_LINE_PAGES, STORE_SHOP, STORE_TABS, resolveFestivalTheme } from "../../content/storefrontContent";
import { useStoreTheme, withAlpha } from "../../theme/storefront";
import { SHOP_PRICE_PRESETS, pricePresetFromRange } from "../../utils/shopFilters";
import { productImageUri, productsForLine, visibleTabs } from "../../utils/storefront";
import FilterChips from "./FilterChips";
import FilterSheet from "./FilterSheet";
import FloatingNav from "./FloatingNav";
import { useStoreNavPad } from "./StoreTracker";
import ProductCard from "./ProductCard";
import ShopHeader from "./ShopHeader";
import ShopSidebar, { SHOP_SIDEBAR_WIDTH } from "./ShopSidebar";
import { EmptyState } from "./StoreKit";
import { VariantSheetProvider } from "./VariantSheet";
import RecentSearches from "./premium/RecentSearches";
import { rememberSearch } from "../../utils/recentSearches";
import SkeletonBlock from "../ui/SkeletonBlock";

const GRID_GAP = 10;
const GRID_PAD = 12;
const LINE_PILLS = { ghee: "Ghee", tel: "Oil", masala: "Masala", honey: "Honey" };
const GIFT_RE = /gift|hamper/i;

/** Which sidebar item the current pill/category filters correspond to. */
function deriveLine(pill, categories) {
  const pillKey = Object.keys(LINE_PILLS).find((k) => LINE_PILLS[k] === pill);
  if (pillKey) return pillKey;
  if (categories.length === 1 && GIFT_RE.test(categories[0])) return "gifts";
  return "all";
}

/** Sidebar item → the pill/category filter pair ShopScreen understands. */
function lineToFilters(key) {
  if (LINE_PILLS[key]) return { pill: LINE_PILLS[key], categories: [] };
  if (key === "gifts") return { pill: "All", categories: [STORE_LINE_PAGES.gifts.category] };
  return { pill: "All", categories: [] };
}

/**
 * The strip above the grid: the festival's (or the farm's) photograph with its title floating in the clear
 * space above the lamps. In dark mode a scrim keeps the ivory photo from glaring.
 */
function ShopBanner({ theme }) {
  const { c, isDark, type, gutter } = useStoreTheme();
  const { shopBanner } = theme;
  const ink = isDark ? c.ink : "#4A2A0C";
  return (
    <View style={{ paddingHorizontal: gutter - 4, paddingBottom: 6 }}>
      <View style={[styles.banner, { borderColor: withAlpha(c.gold, isDark ? 0.3 : 0.5), backgroundColor: isDark ? c.card : c.goldSoft }]}>
        {shopBanner.image ? (
          <Image source={shopBanner.image} style={StyleSheet.absoluteFill} contentFit="cover" contentPosition={{ left: "50%", top: "100%" }} transition={0} cachePolicy="memory-disk" />
        ) : null}
        {isDark ? <View style={[StyleSheet.absoluteFill, { backgroundColor: withAlpha("#0F0D0A", 0.74) }]} /> : null}
        <View style={styles.bannerCopy}>
          <Text style={type.display(22, { color: ink, ls: -0.3, lh: 26 })} numberOfLines={1} maxFontSizeMultiplier={1.05}>
            {shopBanner.title}
          </Text>
        </View>
      </View>
    </View>
  );
}

function GridSkeleton({ cardW }) {
  return (
    <View style={styles.skeletonWrap}>
      {[0, 1, 2, 3].map((i) => (
        <View key={i} style={{ width: cardW, gap: 8 }}>
          <SkeletonBlock width={cardW} height={cardW} rounded={20} />
          <SkeletonBlock width={cardW * 0.7} height={14} rounded={7} />
          <SkeletonBlock width={cardW * 0.9} height={14} rounded={7} />
        </View>
      ))}
    </View>
  );
}

/**
 * Native Shop / category listing — back · title · share · search header, a ranges sidebar on the left,
 * Filters / Sort / Type / Price chips with sheets, a festival banner and a two-column product grid.
 * All filter state lives in `ShopScreen`; this component only renders and reports changes.
 */
export default function StoreShop({
  navigation,
  route,
  products,
  filtered,
  loading,
  refreshing,
  onRefresh,
  filters,
  categoryOptions,
  hasActiveFilters,
  filterBadgeCount,
  onLineFiltersChange,
  onSortChange,
  onToggleCategory,
  onPriceChange,
  onRatingChange,
  onSearchChange,
  onClearAll,
}) {
  const { c, type } = useStoreTheme();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const { user } = useAuth();
  const { displayLabel, snippet, quote } = useDeliveryLocation();
  const festival = useMemo(() => resolveFestivalTheme({}), []);

  const [sheet, setSheet] = useState(null);
  const [searching, setSearching] = useState(Boolean(route?.params?.focusSearch) || Boolean(filters.searchQuery));

  useEffect(() => {
    if (!route?.params?.focusSearch) return;
    setSearching(true);
    navigation.setParams?.({ focusSearch: undefined });
  }, [navigation, route?.params?.focusSearch]);

  const lineKey = deriveLine(filters.pill, filters.categories);
  const tabs = useMemo(() => visibleTabs(STORE_TABS, products), [products]);
  const sidebarItems = useMemo(
    () =>
      tabs.map((tab) => ({
        key: tab.key,
        label: tab.key === "all" ? STORE_SHOP.allLabel : tab.label,
        icon: tab.icon,
        image:
          tab.key === "all"
            ? ""
            : productsForLine(products, tab.lineKey)
                .map((p) => productImageUri(p, 80))
                .find(Boolean) || "",
      })),
    [tabs, products]
  );
  const activeTitle = lineKey === "all" ? STORE_SHOP.title : tabs.find((t) => t.key === lineKey)?.label || STORE_SHOP.title;

  const locationParts = formatDeliveryLocationParts(
    snippet?.line1 || snippet?.city ? snippet : user?.defaultAddress,
    displayLabel || "Set delivery location"
  );
  const kind = user?.defaultAddress?.addressType || "";
  const liveEta = etaFromQuote(quote);
  const deliveringLabel = `${kind || STORE_SHOP.deliveringTo}: ${locationParts.street}${liveEta ? ` · ${liveEta}` : ""}`;

  const cardW = Math.floor((width - SHOP_SIDEBAR_WIDTH - GRID_PAD * 2 - GRID_GAP) / 2);
  const navPad = useStoreNavPad(insets, -4);

  const goBack = useCallback(() => {
    if (navigation.canGoBack?.()) navigation.goBack();
    else navigation.navigate("Home");
  }, [navigation]);

  const share = useCallback(() => {
    Share.share({ message: STORE_SHOP.shareMessage(activeTitle === STORE_SHOP.title ? "Zeevan" : activeTitle) }).catch(() => {});
  }, [activeTitle]);

  // A query only counts as a search once the shopper pauses on it, so half-typed words never reach the history.
  const typedQuery = String(filters.searchQuery || "").trim();
  useEffect(() => {
    if (typedQuery.length < 2) return undefined;
    const id = setTimeout(() => rememberSearch(typedQuery), 1400);
    return () => clearTimeout(id);
  }, [typedQuery]);

  const toggleSearch = useCallback(() => {
    setSearching((open) => {
      if (open) onSearchChange("");
      return !open;
    });
  }, [onSearchChange]);

  const priceActive = filters.minPrice != null || filters.maxPrice != null;
  const priceLabel = priceActive
    ? SHOP_PRICE_PRESETS.find((p) => p.id === pricePresetFromRange(filters.minPrice, filters.maxPrice))?.label || "Custom"
    : STORE_SHOP.chips.price;
  const sortActive = filters.sortKey !== "featured";
  const sortLabel = sortActive ? STORE_SHOP.sort.find((s) => s.key === filters.sortKey)?.label || STORE_SHOP.chips.sort : STORE_SHOP.chips.sort;
  const typeLabel =
    filters.categories.length === 1 ? filters.categories[0] : filters.categories.length > 1 ? `${STORE_SHOP.chips.type} · ${filters.categories.length}` : STORE_SHOP.chips.type;

  /** The sidebar range counts as navigation, not as an applied filter. */
  const extraFilters = Math.max(0, filterBadgeCount - (lineKey !== "all" ? 1 : 0));

  const chips = [
    { key: "filters", label: STORE_SHOP.chips.filters, icon: "options-outline", caret: true, badge: extraFilters || null, active: extraFilters > 0, onPress: () => setSheet("filters") },
    { key: "sort", label: sortLabel, icon: "swap-vertical", active: sortActive, onPress: () => setSheet("sort") },
    { key: "type", label: typeLabel, active: filters.categories.length > 0, onPress: () => setSheet("type") },
    { key: "price", label: priceLabel, active: priceActive, onPress: () => setSheet("price") },
  ];

  const header = (
    <View>
      {searching && !typedQuery ? <RecentSearches onPick={onSearchChange} style={styles.recent} /> : null}
      <FilterChips chips={chips} />
      <ShopBanner theme={festival} />
      <View style={styles.countRow}>
        <Text style={type.ui(12.5, "semibold", c.inkMute)}>{STORE_SHOP.results(filtered.length)}</Text>
      </View>
    </View>
  );

  return (
    <VariantSheetProvider>
      <View style={[styles.screen, { backgroundColor: c.page }]}>
        <ShopHeader
          title={activeTitle}
          deliveringLabel={deliveringLabel}
          searching={searching}
          searchValue={filters.searchQuery}
          searchPlaceholder={STORE_SHOP.searchPlaceholder}
          onBack={goBack}
          onShare={share}
          onToggleSearch={toggleSearch}
          onSearchChange={onSearchChange}
          onLocationPress={() => navigation.navigate(user ? "ManageAddress" : "Login")}
        />

        <View style={styles.body}>
          <ShopSidebar
            items={sidebarItems}
            activeKey={lineKey}
            onSelect={(key) => onLineFiltersChange(lineToFilters(key))}
            bottomPad={navPad}
          />

          <View style={styles.main}>
            <FlatList
              data={loading ? [] : filtered}
              keyExtractor={(item) => String(item.id)}
              numColumns={2}
              columnWrapperStyle={styles.column}
              ListHeaderComponent={header}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              keyboardDismissMode="on-drag"
              contentContainerStyle={{ paddingBottom: navPad }}
              refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={c.brand} />}
              renderItem={({ item }) => (
                <ProductCard product={item} width={cardW} gallery hideEta onPress={() => navigation.navigate("Product", { productId: item.id })} />
              )}
              ListEmptyComponent={
                loading ? (
                  <GridSkeleton cardW={cardW} />
                ) : (
                  <EmptyState
                    icon="search-outline"
                    title={STORE_SHOP.empty.title}
                    body={STORE_SHOP.empty.body}
                    actionLabel={hasActiveFilters ? STORE_SHOP.empty.cta : undefined}
                    onAction={onClearAll}
                  />
                )
              }
            />
          </View>
        </View>

        <FloatingNav />
        <FilterSheet
          section={sheet}
          onClose={() => setSheet(null)}
          sortKey={filters.sortKey}
          onSortChange={onSortChange}
          categories={filters.categories}
          categoryOptions={categoryOptions}
          onToggleCategory={onToggleCategory}
          minPrice={filters.minPrice}
          maxPrice={filters.maxPrice}
          onPriceChange={onPriceChange}
          minRating={filters.minRating}
          onRatingChange={onRatingChange}
          onClearAll={onClearAll}
          hasActiveFilters={hasActiveFilters}
          resultCount={filtered.length}
        />
      </View>
    </VariantSheetProvider>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  body: { flex: 1, flexDirection: "row" },
  main: { flex: 1, minWidth: 0 },
  column: { gap: GRID_GAP, paddingHorizontal: GRID_PAD, marginBottom: GRID_GAP + 2 },
  recent: { paddingTop: 10, paddingBottom: 4, gap: 8 },
  countRow: { paddingHorizontal: GRID_PAD + 2, paddingBottom: 10 },
  banner: { height: 108, borderRadius: 22, overflow: "hidden", borderWidth: 1, alignItems: "center" },
  bannerCopy: { alignItems: "center", paddingTop: 12 },
  skeletonWrap: { flexDirection: "row", flexWrap: "wrap", gap: GRID_GAP, paddingHorizontal: GRID_PAD, rowGap: 16 },
});
