import React from "react";
import { Platform, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import Animated from "react-native-reanimated";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { SHOP_SCREEN_UI } from "../../content/shopPageContent";
import { formatShopProductCount } from "../../utils/shopFormat";
import { useTheme } from "../../context/ThemeContext";
import { KANKREG_PALETTE } from "../../theme/kankregWeb";
import { getShopTheme } from "../../theme/shopTheme";
import { getKankregChromeTop } from "../kankreg/KankregSiteHeader";
import { FIGMA } from "../../theme/figmaApp";
import { fonts, radius, spacing, typography } from "../../theme/tokens";
import ShopActiveFilters from "./ShopActiveFilters";
import ShopSortBar from "./ShopSortBar";
import QCommerceSearchField from "../qcommerce/QCommerceSearchField";

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

/** Readable product count — sans-serif digits (never display font). */
export { formatShopProductCount } from "../../utils/shopFormat";

export function ShopCollectionPills({
  selected,
  onSelect,
  pills = SHOP_SCREEN_UI.collectionPills,
  compact = false,
  scroll = false,
}) {
  const { isDark } = useTheme();
  const t = getShopTheme(isDark);

  const nodes = pills.map((p) => {
    const on = selected === p;
    return (
      <Pressable
        key={p}
        onPress={() => onSelect(p)}
        style={({ pressed }) => [
          styles.pill,
          compact && styles.pillCompact,
          {
            backgroundColor: on ? t.chipOnBg : t.surfaceChip,
            borderColor: on ? t.chipOnBorder : t.border,
          },
          pressed && styles.pillPressed,
        ]}
        accessibilityRole="button"
        accessibilityState={{ selected: on }}
      >
        {on ? (
          <Ionicons name="checkmark" size={10} color={t.chipOnText} style={styles.pillIcon} />
        ) : null}
        <Text style={[styles.pillText, compact && styles.pillTextCompact, { color: on ? t.chipOnText : t.textMuted }]}>
          {p}
        </Text>
      </Pressable>
    );
  });

  if (scroll) {
    return (
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={[styles.pillRow, styles.pillRowScroll, compact && styles.pillRowCompact]}
        keyboardShouldPersistTaps="handled"
      >
        {nodes}
      </ScrollView>
    );
  }

  return <View style={[styles.pillRow, compact && styles.pillRowCompact]}>{nodes}</View>;
}

export function ShopFilterCheck({ label, on, onPress }) {
  const { isDark } = useTheme();
  const t = getShopTheme(isDark);

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.chkRow,
        on && { backgroundColor: t.accentSoft },
        pressed && styles.chkPressed,
      ]}
      accessibilityRole="checkbox"
      accessibilityState={{ checked: on }}
    >
      <View
        style={[
          styles.chkBox,
          { borderColor: on ? t.chipOnBorder : t.checkBorder },
          on && { backgroundColor: t.checkOn, borderColor: t.checkOn },
        ]}
      >
        {on ? <Ionicons name="checkmark" size={11} color="#fff" /> : null}
      </View>
      <Text style={[styles.chkLabel, { color: on ? t.text : t.textMuted }]}>{label}</Text>
    </Pressable>
  );
}

export function ShopNativeMetaLine({ filtered, total }) {
  const { isDark } = useTheme();
  const t = getShopTheme(isDark);

  return (
    <View style={[styles.nativeMetaWrap, { backgroundColor: t.surfaceMuted, borderColor: t.border }]}>
      <Text style={[styles.nativeMeta, { color: t.textFaint }]}>
        {formatShopProductCount(filtered, total)}
      </Text>
    </View>
  );
}

export function ShopTrustStrip({ compact = false }) {
  const { isDark } = useTheme();
  const t = getShopTheme(isDark);
  const badges = SHOP_SCREEN_UI.trustBadges || [];
  const line = SHOP_SCREEN_UI.trustLine;

  if (badges.length) {
    return (
      <View style={[styles.trustBadgeRow, compact && styles.trustBadgeRowCompact]}>
        {badges.map((badge) => (
          <View
            key={badge.label}
            style={[
              styles.trustBadge,
              compact && styles.trustBadgeCompact,
              { backgroundColor: t.surfaceMuted, borderColor: t.border },
            ]}
          >
            <Ionicons name={badge.icon || "checkmark-circle-outline"} size={compact ? 12 : 13} color={t.accent} />
            <Text style={[styles.trustBadgeText, compact && styles.trustBadgeTextCompact, { color: t.textMuted }]}>
              {badge.label}
            </Text>
          </View>
        ))}
      </View>
    );
  }

  if (!line) return null;

  return (
    <View
      style={[
        styles.trustStrip,
        compact && styles.trustStripCompact,
        { backgroundColor: t.surfaceMuted, borderColor: t.border },
      ]}
    >
      <Ionicons name="shield-checkmark-outline" size={compact ? 12 : 14} color={t.accent} />
      <Text style={[styles.trustText, compact && styles.trustTextCompact, { color: t.textMuted }]}>
        {line}
      </Text>
    </View>
  );
}

/** Web / mobile-web catalog search — sits above filters and product grid. */
export function ShopCatalogSearch({ value, onChangeText, inputRef, placeholder, onClear, premium = false }) {
  if (Platform.OS !== "web") return null;

  return (
    <View style={styles.catalogSearchWrap}>
      <QCommerceSearchField
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        onClear={onClear}
        ref={inputRef}
        premium={premium}
      />
    </View>
  );
}

/** Compact shop controls — pills, count, filter toggle, sort bar. */
export function ShopCompactToolbar({
  filtered,
  total,
  pill,
  onPill,
  sortKey,
  onSortChange,
  sortLabel,
  onSort,
  sortAnimStyle,
  filtersOpen,
  onToggleFilters,
  filterBadgeCount = 0,
  activeChips,
  onRemoveChip,
  onClearAll,
  variant = "stack",
  useSortBar = true,
  hideCollectionPills = false,
  compactActions = false,
  lean = false,
}) {
  const { isDark } = useTheme();
  const t = getShopTheme(isDark);
  const showPills = variant === "stack" && !hideCollectionPills;
  const showFilterToggle = variant === "stack" && typeof onToggleFilters === "function";
  const showLegacySort = !useSortBar && typeof onSort === "function";
  const countLabel = formatShopProductCount(filtered, total);
  const showInlineSort = lean && useSortBar && typeof onSortChange === "function";

  return (
    <View style={[styles.compactToolbar, lean && styles.compactToolbarLean]}>
      {showPills ? <ShopCollectionPills selected={pill} onSelect={onPill} compact scroll /> : null}

      <View
        style={[
          styles.compactBar,
          lean && styles.compactBarLean,
          { backgroundColor: t.surface, borderColor: t.border, borderTopColor: lean ? t.border : t.borderTopAccent },
          !lean && t.cardShadow,
        ]}
      >
        <View style={[styles.compactBarTop, lean && styles.compactBarTopLean]}>
          <Text style={[styles.compactCount, lean && styles.compactCountLean, { color: t.textMuted }]} numberOfLines={1}>
            {countLabel}
          </Text>

          <View style={styles.compactActions}>
            {showFilterToggle ? (
              <Pressable
                onPress={onToggleFilters}
                style={({ pressed }) => [
                  compactActions || lean ? styles.filterToggleIcon : styles.filterToggle,
                  {
                    backgroundColor: filtersOpen ? t.chipOnBg : t.surfaceChip,
                    borderColor: filtersOpen ? t.chipOnBorder : t.border,
                  },
                  pressed && styles.pillPressed,
                ]}
                accessibilityRole="button"
                accessibilityLabel={filtersOpen ? SHOP_SCREEN_UI.filtersClose : SHOP_SCREEN_UI.filtersOpen}
              >
                <Ionicons
                  name="options-outline"
                  size={compactActions || lean ? 16 : 14}
                  color={filtersOpen ? t.chipOnText : t.accent}
                />
                {!compactActions && !lean ? (
                  <Text
                    style={[
                      styles.filterToggleText,
                      { color: filtersOpen ? t.chipOnText : t.text },
                    ]}
                  >
                    {filtersOpen ? SHOP_SCREEN_UI.filtersClose : SHOP_SCREEN_UI.filtersOpen}
                  </Text>
                ) : null}
                {filterBadgeCount > 0 && !filtersOpen ? (
                  <View style={[styles.filterCountBadge, styles.filterCountBadgeSm, { backgroundColor: t.chipOnBg }]}>
                    <Text style={styles.filterCountText}>{filterBadgeCount > 9 ? "9+" : filterBadgeCount}</Text>
                  </View>
                ) : null}
              </Pressable>
            ) : null}

            {showLegacySort ? (
              <AnimatedPressable
                onPress={onSort}
                style={[
                  styles.sortBtnCompact,
                  { backgroundColor: t.surfaceChip, borderColor: t.border },
                  sortAnimStyle,
                ]}
                accessibilityRole="button"
                accessibilityLabel={`${SHOP_SCREEN_UI.sortA11y}: ${sortLabel}`}
              >
                <Ionicons name="swap-vertical" size={13} color={t.accent} />
                <Text style={[styles.sortLabelCompact, { color: t.text }]} numberOfLines={1}>
                  {sortLabel}
                </Text>
              </AnimatedPressable>
            ) : null}
          </View>
        </View>

        {showInlineSort ? (
          <View style={styles.compactSortSlot}>
            <ShopSortBar value={sortKey} onChange={onSortChange} compact />
          </View>
        ) : null}
      </View>

      {useSortBar && !lean && typeof onSortChange === "function" ? (
        <ShopSortBar value={sortKey} onChange={onSortChange} compact />
      ) : null}

      {activeChips?.length ? (
        <ShopActiveFilters chips={activeChips} onRemove={onRemoveChip} onClearAll={onClearAll} inline />
      ) : null}
    </View>
  );
}

export function ShopResultToolbar({
  filtered,
  total,
  categoryLabel,
  priceLabel,
  sortLabel,
  onSort,
  sortAnimStyle,
  showPills,
  pill,
  onPill,
  compact,
  activeChips,
  onRemoveChip,
  onClearAll,
}) {
  const { isDark } = useTheme();
  const t = getShopTheme(isDark);

  return (
    <View style={[styles.resultCard, { backgroundColor: t.surface, borderColor: t.border }, t.cardShadow]}>
      <LinearGradient
        colors={
          isDark
            ? ["rgba(52, 211, 153, 0.5)", "rgba(31, 92, 71, 0.15)", "transparent"]
            : ["rgba(31, 92, 71, 0.65)", "rgba(22, 69, 51, 0.1)", "transparent"]
        }
        start={{ x: 0, y: 0.5 }}
        end={{ x: 1, y: 0.5 }}
        style={styles.resultAccent}
      />

      <View style={styles.resultTop}>
        <View style={styles.resultCopy}>
          <Text style={[styles.resultEyebrow, { color: t.accent }]}>{SHOP_SCREEN_UI.pageEyebrow}</Text>
          <Text style={[styles.resultCount, { color: t.textMuted }]} numberOfLines={2}>
            {formatShopProductCount(filtered, total)}
          </Text>
        </View>
        <View style={styles.resultMeta}>
          <Text style={[styles.resultCategory, { color: t.accent }]} numberOfLines={1}>
            {categoryLabel}
          </Text>
          {priceLabel ? (
            <Text style={[styles.resultPrice, { color: t.textFaint }]} numberOfLines={1}>
              {priceLabel}
            </Text>
          ) : null}
        </View>
      </View>

      {activeChips?.length ? (
        <ShopActiveFilters chips={activeChips} onRemove={onRemoveChip} onClearAll={onClearAll} />
      ) : null}

      <View style={[styles.toolbar, compact && styles.toolbarStack]}>
        {showPills ? <ShopCollectionPills selected={pill} onSelect={onPill} compact /> : null}
        <AnimatedPressable
          onPress={onSort}
          style={[
            styles.sortBtn,
            {
              backgroundColor: t.surfaceChip,
              borderColor: t.border,
            },
            compact && styles.sortBtnFull,
            sortAnimStyle,
          ]}
          accessibilityRole="button"
          accessibilityLabel={`${SHOP_SCREEN_UI.sortA11y}: ${sortLabel}`}
        >
          <View style={[styles.sortIconWrap, { backgroundColor: t.accentSoft }]}>
            <Ionicons name="swap-vertical" size={14} color={t.accent} />
          </View>
          <Text style={[styles.sortLabel, { color: t.text }]}>{sortLabel}</Text>
          <Ionicons name="chevron-down" size={14} color={t.textFaint} />
        </AnimatedPressable>
      </View>
    </View>
  );
}

export function ShopFilterSidebarHeader({ onReset, hasFilters, filterCount = 0 }) {
  const { isDark } = useTheme();
  const t = getShopTheme(isDark);

  return (
    <View style={[styles.sidebarHead, { borderBottomColor: t.border }]}>
      <View style={styles.sidebarTitleRow}>
        <Text style={[styles.sidebarTitle, { color: t.text }]}>{SHOP_SCREEN_UI.refineTitle}</Text>
        {filterCount > 0 ? (
          <View style={[styles.filterCountBadge, { backgroundColor: t.chipOnBg }]}>
            <Text style={styles.filterCountText}>{filterCount > 9 ? "9+" : filterCount}</Text>
          </View>
        ) : null}
      </View>
      {hasFilters ? (
        <Pressable onPress={onReset} hitSlop={8} accessibilityRole="button" style={styles.resetBtn}>
          <Ionicons name="refresh-outline" size={13} color={t.accent} />
          <Text style={[styles.sidebarReset, { color: t.accent }]}>{SHOP_SCREEN_UI.resetFilters}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

export function ShopMobileFilterCard({ children, onClear, hasFilters, filterCount = 0, compact = true }) {
  const { isDark } = useTheme();
  const t = getShopTheme(isDark);

  return (
    <View
      style={[
        styles.mobileFilterCard,
        compact && styles.mobileFilterCardCompact,
        {
          backgroundColor: t.surface,
          borderColor: t.border,
          borderTopColor: t.borderTopAccent,
        },
        t.cardShadow,
        Platform.OS === "web" && t.panelGradient ? { backgroundImage: t.panelGradient } : null,
      ]}
    >
      <View style={styles.mobileFilterHead}>
        <View style={styles.sidebarTitleRow}>
          <Text style={[styles.mobileFilterTitle, compact && styles.mobileFilterTitleCompact, { color: t.text }]}>
            {SHOP_SCREEN_UI.refineTitle}
          </Text>
          {filterCount > 0 ? (
            <View style={[styles.filterCountBadge, { backgroundColor: t.chipOnBg }]}>
              <Text style={styles.filterCountText}>{filterCount}</Text>
            </View>
          ) : null}
        </View>
        {hasFilters ? (
          <Pressable onPress={onClear} hitSlop={8} style={styles.resetBtn}>
            <Text style={[styles.sidebarReset, { color: t.accent }]}>{SHOP_SCREEN_UI.resetFilters}</Text>
          </Pressable>
        ) : null}
      </View>
      {children}
    </View>
  );
}

export function shopFilterSidebarStyle() {
  return {
    width: 272,
    flexShrink: 0,
    ...Platform.select({
      web: { position: "sticky", top: getKankregChromeTop() + 14, alignSelf: "flex-start" },
      default: {},
    }),
  };
}

const styles = StyleSheet.create({
  pillRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 7,
    flex: 1,
  },
  pillRowScroll: {
    flexWrap: "nowrap",
    paddingRight: spacing.sm,
  },
  pillRowCompact: { gap: 6 },
  pill: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 13,
    borderRadius: radius.pill,
    borderWidth: StyleSheet.hairlineWidth,
  },
  pillCompact: {
    paddingVertical: 6,
    paddingHorizontal: 11,
  },
  pillIcon: { marginRight: 2 },
  pillPressed: { opacity: 0.88 },
  pillText: {
    fontSize: typography.caption,
    fontFamily: fonts.semibold,
  },
  pillTextCompact: {
    fontSize: typography.caption - 1,
  },
  catalogSearchWrap: {
    marginBottom: 0,
  },
  shopCollectionRow: {
    marginBottom: spacing.sm,
  },
  compactToolbar: {
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  compactToolbarLean: {
    gap: spacing.xs,
    marginBottom: spacing.xs,
  },
  compactBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.sm,
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderTopWidth: 2,
    paddingVertical: 8,
    paddingHorizontal: spacing.sm + 2,
  },
  compactBarLean: {
    flexDirection: "column",
    alignItems: "stretch",
    borderTopWidth: StyleSheet.hairlineWidth,
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: spacing.sm + 4,
    gap: 10,
    ...Platform.select({
      web: {
        boxShadow: "0 12px 32px -24px rgba(36, 68, 36, 0.18)",
      },
      default: {},
    }),
  },
  compactBarTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.sm,
  },
  compactBarTopLean: {
    minHeight: 36,
  },
  compactSortSlot: {
    width: "100%",
  },
  compactCount: {
    fontFamily: fonts.medium,
    fontSize: typography.caption,
    letterSpacing: 0.1,
    lineHeight: 18,
    flexShrink: 0,
  },
  compactCountLean: {
    fontFamily: fonts.semibold,
    fontSize: typography.caption - 1,
    letterSpacing: 0.2,
    textTransform: "uppercase",
  },
  compactCountMuted: {
    fontFamily: fonts.medium,
  },
  compactActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    flexShrink: 0,
  },
  filterToggle: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingVertical: 7,
    paddingHorizontal: 10,
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    position: "relative",
  },
  filterToggleText: {
    fontFamily: fonts.semibold,
    fontSize: typography.caption - 1,
  },
  filterToggleIcon: {
    width: 36,
    height: 36,
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  sortBtnCompact: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingVertical: 7,
    paddingHorizontal: 10,
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    maxWidth: 120,
  },
  sortLabelCompact: {
    fontFamily: fonts.semibold,
    fontSize: typography.caption - 1,
    flexShrink: 1,
  },
  filterCountBadgeSm: {
    position: "absolute",
    top: -4,
    right: -4,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
  },
  chkRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 4,
    paddingVertical: 8,
    paddingHorizontal: 8,
    borderRadius: 10,
    marginHorizontal: -8,
  },
  chkPressed: { opacity: 0.9 },
  chkBox: {
    width: 20,
    height: 20,
    borderRadius: 6,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
  },
  chkLabel: {
    fontSize: 14,
    fontFamily: fonts.medium,
    flex: 1,
  },
  nativeMetaWrap: {
    marginHorizontal: FIGMA.gutter,
    marginTop: 0,
    marginBottom: spacing.xs,
    paddingVertical: spacing.xs + 2,
    paddingHorizontal: spacing.sm + 2,
    borderRadius: 10,
    borderWidth: StyleSheet.hairlineWidth,
  },
  nativeMeta: {
    fontSize: typography.caption,
    fontFamily: fonts.regular,
    textAlign: "center",
  },
  nativeMetaBold: { fontFamily: fonts.semibold },
  trustStrip: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingVertical: spacing.sm + 2,
    paddingHorizontal: spacing.md,
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    marginBottom: spacing.md,
  },
  trustStripCompact: {
    paddingVertical: spacing.xs + 2,
    paddingHorizontal: spacing.sm + 2,
    borderRadius: radius.md,
    marginBottom: spacing.sm,
    gap: 6,
  },
  trustText: {
    flex: 1,
    fontFamily: fonts.medium,
    fontSize: typography.caption,
    lineHeight: 18,
  },
  trustTextCompact: {
    fontSize: 11,
    lineHeight: 15,
  },
  trustBadgeRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  trustBadgeRowCompact: {
    gap: spacing.xs,
    marginBottom: spacing.sm,
    paddingHorizontal: FIGMA.gutter,
  },
  trustBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: spacing.xs + 2,
    paddingHorizontal: spacing.sm + 2,
    borderRadius: radius.pill,
    borderWidth: StyleSheet.hairlineWidth,
  },
  trustBadgeCompact: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    gap: 4,
  },
  trustBadgeText: {
    fontFamily: fonts.semibold,
    fontSize: typography.caption - 1,
    letterSpacing: 0.2,
  },
  trustBadgeTextCompact: {
    fontSize: 10,
  },
  resultCard: {
    borderRadius: radius.lg + 4,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: spacing.md + 4,
    paddingTop: spacing.md + 6,
    paddingBottom: spacing.md + 2,
    marginBottom: spacing.md,
    overflow: "hidden",
  },
  resultAccent: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 3,
  },
  resultTop: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    marginBottom: spacing.sm,
    gap: spacing.sm,
    flexWrap: "wrap",
  },
  resultCopy: { minWidth: 0 },
  resultEyebrow: {
    fontFamily: fonts.semibold,
    fontSize: 10,
    letterSpacing: 1.2,
    textTransform: "uppercase",
    marginBottom: 4,
  },
  resultCount: {
    fontFamily: fonts.medium,
    fontSize: typography.bodySmall,
    lineHeight: 20,
    letterSpacing: 0.1,
  },
  resultMeta: {
    alignItems: "flex-end",
    maxWidth: "46%",
    gap: 2,
  },
  resultCategory: {
    fontFamily: fonts.semibold,
    fontSize: typography.caption,
    letterSpacing: 0.6,
    textTransform: "uppercase",
    textAlign: "right",
  },
  resultPrice: {
    fontFamily: fonts.medium,
    fontSize: 11,
    textAlign: "right",
  },
  toolbar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    flexWrap: "wrap",
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  toolbarStack: {
    flexDirection: "column",
    alignItems: "stretch",
  },
  sortBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: radius.md + 2,
    borderWidth: StyleSheet.hairlineWidth,
  },
  sortBtnFull: { alignSelf: "stretch" },
  sortIconWrap: {
    width: 26,
    height: 26,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  sortLabel: {
    flex: 1,
    fontSize: typography.bodySmall,
    fontFamily: fonts.semibold,
    textAlign: "left",
  },
  sidebarHead: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.md,
    paddingBottom: spacing.sm + 2,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  sidebarTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  sidebarTitle: {
    fontFamily: fonts.semibold,
    fontSize: typography.body + 1,
    letterSpacing: 0.2,
    textTransform: "uppercase",
  },
  filterCountBadge: {
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 5,
  },
  filterCountText: {
    fontSize: 10,
    fontFamily: fonts.semibold,
    color: KANKREG_PALETTE.paper,
  },
  resetBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  sidebarReset: {
    fontFamily: fonts.semibold,
    fontSize: typography.caption,
  },
  mobileFilterCard: {
    borderRadius: radius.lg + 4,
    borderWidth: StyleSheet.hairlineWidth,
    borderTopWidth: 3,
    padding: spacing.md + 2,
    marginBottom: spacing.md,
  },
  mobileFilterCardCompact: {
    borderRadius: radius.lg,
    borderTopWidth: 2,
    padding: spacing.sm + 4,
    marginBottom: spacing.sm,
    gap: 2,
  },
  mobileFilterHead: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  mobileFilterTitle: {
    fontFamily: fonts.semibold,
    fontSize: typography.bodySmall,
    letterSpacing: 0.35,
    textTransform: "uppercase",
  },
  mobileFilterTitleCompact: {
    fontSize: typography.bodySmall,
    fontFamily: fonts.semibold,
    letterSpacing: 0.4,
    textTransform: "uppercase",
  },
});
