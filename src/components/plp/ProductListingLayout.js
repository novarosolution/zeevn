import React, { memo, useCallback, useMemo, useState } from "react";
import {
  FlatList,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import ProductCard from "../ProductCard";
import Badge from "../ui/Badge";
import Screen from "../ui/Screen";
import SkeletonBlock from "../ui/SkeletonBlock";
import { PLP_UI } from "../../content/appContent";
import { useTheme } from "../../context/ThemeContext";
import { fonts } from "../../theme/tokens";
import { CUSTOMER_PAGE_MAX_WIDTH } from "../../theme/screenLayout";

const SIDEBAR_W = 280;
const DESKTOP_BREAKPOINT = 1024;

function useHorizontalPagePadding() {
  const { width } = useWindowDimensions();
  const { SPACING } = useTheme();
  if (width >= 1024) return SPACING["4xl"];
  if (width >= 768) return SPACING["2xl"];
  return SPACING.lg;
}

function PlpSkeletonGrid({ numColumns, cardWidth, gridGap }) {
  return (
    <View
      style={{
        flexDirection: "row",
        flexWrap: "wrap",
        gap: gridGap,
      }}
    >
      {Array.from({ length: 8 }).map((_, idx) => (
        <View key={`plp-sk-${idx}`} style={{ width: cardWidth, marginBottom: gridGap }}>
          <SkeletonBlock height={140} rounded="md" />
          <View style={{ marginTop: 10, gap: 8 }}>
            <SkeletonBlock height={12} rounded="sm" width="72%" />
            <SkeletonBlock height={14} rounded="sm" width="92%" />
            <SkeletonBlock height={14} rounded="sm" width="56%" />
          </View>
        </View>
      ))}
    </View>
  );
}

function ProductListingLayoutBase({
  navigation,
  breadcrumbLabel,
  pageTitle,
  phase,
  introSlot,
  errorSlot,
  emptySlot,
  filteredItems,
  numColumns,
  gridGap,
  cardWidth,
  cardStyle,
  getItemQuantity,
  onAddToCart,
  onRemoveFromCart,
  isOutOfStock,
  renderFilterPanel,
  sortOptions,
  sortKey,
  onSortChange,
  sheetActiveFacetCount,
  chipsRow,
  listKeyPrefix = "plp-grid",
}) {
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const gutter = useHorizontalPagePadding();
  const { semanticPalette, RADII, SPACING, TYPE, SHADOWS } = useTheme();

  const isDesktop = width >= DESKTOP_BREAKPOINT;
  const showToolbar = phase === "results" || phase === "empty";
  const showSidebar = isDesktop && showToolbar && phase !== "intro";
  const showFilterSheetUi = !isDesktop && showToolbar && phase !== "intro";
  const showSortUi = showToolbar && phase !== "intro";

  const [filterSheetOpen, setFilterSheetOpen] = useState(false);
  const [sortSheetOpen, setSortSheetOpen] = useState(false);

  const closeFilterSheet = useCallback(() => setFilterSheetOpen(false), []);
  const closeSortSheet = useCallback(() => setSortSheetOpen(false), []);

  const sortCurrentLabel = useMemo(() => {
    const hit = sortOptions.find((o) => o.key === sortKey);
    return hit?.label ?? PLP_UI.sortFeatured;
  }, [sortKey, sortOptions]);

  const styles = useMemo(
    () =>
      StyleSheet.create({
        inner: {
          flex: 1,
          width: "100%",
          paddingHorizontal: gutter,
          maxWidth: typeof CUSTOMER_PAGE_MAX_WIDTH === "number" ? CUSTOMER_PAGE_MAX_WIDTH : "100%",
          alignSelf: "center",
        },
        row: {
          flex: 1,
          flexDirection: "row",
          gap: SPACING.xl,
          alignItems: "stretch",
          minHeight: 0,
        },
        sidebarOuter: {
          width: SIDEBAR_W,
          flexShrink: 0,
          ...Platform.select({
            web: {
              position: "sticky",
              top: 12,
              alignSelf: "flex-start",
              maxHeight: "calc(100vh - 120px)",
            },
            default: {
              maxHeight: 720,
            },
          }),
        },
        sidebarScroll: {
          flexGrow: 0,
        },
        mainCol: {
          flex: 1,
          minWidth: 0,
          flexShrink: 1,
        },
        toolbarRow: {
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          gap: SPACING.md,
          marginBottom: SPACING.md,
        },
        pillBtn: {
          flexDirection: "row",
          alignItems: "center",
          gap: SPACING.xs,
          paddingHorizontal: SPACING.md,
          paddingVertical: SPACING.sm,
          borderRadius: RADII.pill,
          borderWidth: StyleSheet.hairlineWidth,
          borderColor: semanticPalette.line,
          backgroundColor: semanticPalette.surface,
          ...SHADOWS.soft,
        },
        pillLabel: {
          fontFamily: fonts.medium,
          fontSize: TYPE.caption.fontSize,
          lineHeight: TYPE.caption.lineHeight,
          color: semanticPalette.ink,
        },
        chipsWrap: {
          flexDirection: "row",
          flexWrap: "wrap",
          gap: SPACING.sm,
          marginBottom: SPACING.md,
        },
        modalRoot: {
          flex: 1,
          justifyContent: "flex-end",
          backgroundColor: "rgba(14, 23, 41, 0.42)",
        },
        sheet: {
          borderTopLeftRadius: RADII.lg,
          borderTopRightRadius: RADII.lg,
          paddingHorizontal: SPACING.lg,
          paddingTop: SPACING.md,
          maxHeight: "78%",
          backgroundColor: semanticPalette.surface,
          borderTopWidth: StyleSheet.hairlineWidth,
          borderColor: semanticPalette.line,
          ...SHADOWS.soft,
        },
        sheetGrab: {
          alignSelf: "center",
          width: 40,
          height: 4,
          borderRadius: 2,
          backgroundColor: semanticPalette.line,
          marginBottom: SPACING.md,
        },
        sheetHead: {
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: SPACING.md,
        },
        sheetTitle: {
          fontFamily: fonts.semibold,
          fontSize: TYPE.body.fontSize,
          lineHeight: TYPE.body.lineHeight,
          color: semanticPalette.ink,
        },
      }),
    [
      RADII.lg,
      RADII.pill,
      SPACING,
      TYPE.body.fontSize,
      TYPE.body.lineHeight,
      TYPE.caption.fontSize,
      TYPE.caption.lineHeight,
      gutter,
      semanticPalette.ink,
      semanticPalette.line,
      semanticPalette.surface,
      SHADOWS.soft,
    ]
  );

  const flatData = useMemo(() => (phase === "results" ? filteredItems : []), [filteredItems, phase]);

  const renderItem = useCallback(
    ({ item, index }) => (
      <View style={{ width: cardWidth, maxWidth: cardWidth, flexGrow: 1 }}>
        <ProductCard
          index={index}
          isOutOfStock={isOutOfStock(item)}
          product={item}
          onPress={() => navigation.navigate("Product", { productId: item.id })}
          quantity={getItemQuantity(item.id)}
          onAddToCart={(meta) => onAddToCart(item, meta)}
          onRemoveFromCart={() => onRemoveFromCart(item.id)}
          variant="grid"
          compact={cardStyle !== "comfortable"}
          editorial={cardStyle === "comfortable"}
          showEta={cardStyle === "comfortable"}
        />
      </View>
    ),
    [cardStyle, getItemQuantity, isOutOfStock, navigation, onAddToCart, onRemoveFromCart, cardWidth]
  );

  const mainBody = useMemo(() => {
    if (phase === "intro")
      return (
        <View style={{ flex: 1, justifyContent: "center", minHeight: 240 }}>
          {introSlot}
        </View>
      );
    if (phase === "loading") return <PlpSkeletonGrid numColumns={numColumns} cardWidth={cardWidth} gridGap={gridGap} />;
    if (phase === "error")
      return (
        <View style={{ flex: 1, justifyContent: "center", minHeight: 280 }}>
          {errorSlot}
        </View>
      );
    if (phase === "empty")
      return (
        <View style={{ flex: 1, justifyContent: "center", minHeight: 280 }}>
          {emptySlot}
        </View>
      );
    return (
      <FlatList
        data={flatData}
        key={`${listKeyPrefix}-${numColumns}`}
        numColumns={numColumns}
        keyExtractor={(item, idx) => String(item?.id ?? `${listKeyPrefix}-${idx}`)}
        scrollEnabled
        style={{ flex: 1 }}
        columnWrapperStyle={
          numColumns > 1
            ? {
                gap: gridGap,
                marginBottom: gridGap,
              }
            : undefined
        }
        contentContainerStyle={{
          paddingBottom: SPACING["2xl"],
          flexGrow: 1,
        }}
        renderItem={renderItem}
      />
    );
  }, [
    phase,
    introSlot,
    errorSlot,
    emptySlot,
    flatData,
    numColumns,
    gridGap,
    cardWidth,
    listKeyPrefix,
    renderItem,
    SPACING,
  ]);

  return (
    <Screen
      navigation={navigation}
      title={pageTitle}
      breadcrumbLabel={breadcrumbLabel}
      noScroll
      contentContainerStyle={{
        flex: 1,
        paddingHorizontal: 0,
      }}
    >
      <View style={[styles.inner, { flex: 1 }]}>
        <View style={[styles.row, { flex: 1 }]}>
          {showSidebar ? (
            <View style={styles.sidebarOuter}>
              <ScrollView style={styles.sidebarScroll} showsVerticalScrollIndicator={false}>
                {renderFilterPanel()}
              </ScrollView>
            </View>
          ) : null}

          <View style={[styles.mainCol, { flex: 1 }]}>
            {showToolbar && phase !== "intro" ? (
              <>
                <View style={[styles.toolbarRow, !showFilterSheetUi ? { justifyContent: "flex-end" } : null]}>
                  {showFilterSheetUi ? (
                    <Pressable
                      onPress={() => setFilterSheetOpen(true)}
                      style={({ pressed }) => [styles.pillBtn, pressed ? { opacity: 0.88 } : null]}
                      accessibilityRole="button"
                      accessibilityLabel={PLP_UI.filtersCta}
                    >
                      <Ionicons name="options-outline" size={18} color={semanticPalette.ink} />
                      <Text style={styles.pillLabel}>{PLP_UI.filtersCta}</Text>
                      {sheetActiveFacetCount > 0 ? (
                        <Badge variant="neutral" size="sm">
                          {String(sheetActiveFacetCount)}
                        </Badge>
                      ) : null}
                    </Pressable>
                  ) : (
                    <View />
                  )}
                  <Pressable
                    onPress={() => setSortSheetOpen(true)}
                    style={({ pressed }) => [styles.pillBtn, pressed ? { opacity: 0.88 } : null]}
                    accessibilityRole="button"
                    accessibilityLabel={PLP_UI.sortCta}
                  >
                    <Ionicons name="swap-vertical-outline" size={18} color={semanticPalette.ink} />
                    <Text style={[styles.pillLabel, { maxWidth: width * 0.42 }]} numberOfLines={1}>
                      {sortCurrentLabel}
                    </Text>
                    <Ionicons name="chevron-down-outline" size={16} color={semanticPalette.inkMuted} />
                  </Pressable>
                </View>
                {chipsRow ? <View style={styles.chipsWrap}>{chipsRow}</View> : null}
              </>
            ) : null}

            <View style={{ flex: phase === "loading" ? undefined : 1 }}>{mainBody}</View>
          </View>
        </View>
      </View>

      {showFilterSheetUi ? (
        <Modal visible={filterSheetOpen} animationType="slide" transparent onRequestClose={closeFilterSheet}>
          <View style={styles.modalRoot}>
            <Pressable style={StyleSheet.absoluteFill} onPress={closeFilterSheet} accessibilityLabel={PLP_UI.filterSheetCloseA11y} />
            <View style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, SPACING.md) }]}>
              <View style={styles.sheetGrab} />
              <View style={styles.sheetHead}>
                <Text style={styles.sheetTitle}>{PLP_UI.filtersSheetTitle}</Text>
                <Pressable onPress={closeFilterSheet} accessibilityRole="button" accessibilityLabel={PLP_UI.filterSheetCloseA11y}>
                  <Ionicons name="close-outline" size={26} color={semanticPalette.inkMuted} />
                </Pressable>
              </View>
              <ScrollView showsVerticalScrollIndicator={false}>{renderFilterPanel()}</ScrollView>
            </View>
          </View>
        </Modal>
      ) : null}

      {showSortUi ? (
        <Modal visible={sortSheetOpen} animationType="fade" transparent onRequestClose={closeSortSheet}>
          <View style={styles.modalRoot}>
            <Pressable style={StyleSheet.absoluteFill} onPress={closeSortSheet} accessibilityLabel={PLP_UI.sortSheetCloseA11y} />
            <View style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, SPACING.md) }]}>
              <View style={styles.sheetGrab} />
              <View style={styles.sheetHead}>
                <Text style={styles.sheetTitle}>{PLP_UI.sortSheetTitle}</Text>
                <Pressable onPress={closeSortSheet} accessibilityRole="button" accessibilityLabel={PLP_UI.sortSheetCloseA11y}>
                  <Ionicons name="close-outline" size={26} color={semanticPalette.inkMuted} />
                </Pressable>
              </View>
              <ScrollView showsVerticalScrollIndicator={false}>
                {sortOptions.map((opt) => (
                  <Pressable
                    key={opt.key}
                    onPress={() => {
                      onSortChange(opt.key);
                      closeSortSheet();
                    }}
                    style={({ pressed }) => ({
                      paddingVertical: SPACING.md,
                      borderBottomWidth: StyleSheet.hairlineWidth,
                      borderBottomColor: semanticPalette.line,
                      opacity: pressed ? 0.85 : 1,
                    })}
                  >
                    <Text
                      style={{
                        fontFamily: fonts.medium,
                        fontSize: TYPE.body.fontSize,
                        color: sortKey === opt.key ? semanticPalette.accent : semanticPalette.ink,
                      }}
                    >
                      {opt.label}
                    </Text>
                  </Pressable>
                ))}
              </ScrollView>
            </View>
          </View>
        </Modal>
      ) : null}
    </Screen>
  );
}

const ProductListingLayout = memo(ProductListingLayoutBase);

export default ProductListingLayout;
