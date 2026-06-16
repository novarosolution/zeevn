import React from "react";
import { Platform, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { SHOP_SCREEN_UI } from "../../content/shopPageContent";
import { useTheme } from "../../context/ThemeContext";
import { getShopTheme } from "../../theme/shopTheme";
import { fonts, radius, spacing, typography } from "../../theme/tokens";

/** Horizontal category quick-pick with product counts. */
export default function ShopCategoryRail({ categories = [], selected = [], onToggle, compact = false }) {
  const { isDark } = useTheme();
  const t = getShopTheme(isDark);

  if (!categories.length) return null;

  const railTitle = SHOP_SCREEN_UI.categoryRailTitle;
  const showTitle =
    Boolean(railTitle) && SHOP_SCREEN_UI.layout?.showCategoryRailTitle !== false;

  return (
    <View style={[styles.wrap, compact && styles.wrapCompact]}>
      {showTitle ? (
        <Text style={[styles.title, { color: t.accent }]}>{railTitle}</Text>
      ) : null}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.row}
        keyboardShouldPersistTaps="handled"
      >
        {categories.map(({ label, count }) => {
          const on = selected.includes(label);
          return (
            <Pressable
              key={label}
              onPress={() => onToggle?.(label)}
              style={({ pressed }) => [
                styles.chip,
                compact && styles.chipCompact,
                {
                  backgroundColor: on ? t.chipOnBg : t.surfaceChip,
                  borderColor: on ? t.chipOnBorder : t.border,
                },
                pressed && styles.pressed,
              ]}
              accessibilityRole="button"
              accessibilityState={{ selected: on }}
            >
              {on ? <Ionicons name="checkmark" size={10} color={t.chipOnText} /> : null}
              <Text style={[styles.chipText, { color: on ? t.chipOnText : t.text }]} numberOfLines={1}>
                {label}
              </Text>
              <View style={[styles.count, { backgroundColor: on ? "rgba(255,255,255,0.18)" : t.accentSoft }]}>
                <Text style={[styles.countText, { color: on ? t.chipOnText : t.accent }]}>
                {count > 0 ? count : "·"}
              </Text>
              </View>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginBottom: spacing.md,
    gap: spacing.sm,
  },
  wrapCompact: {
    marginBottom: spacing.sm,
    paddingHorizontal: Platform.OS === "web" ? 0 : undefined,
    gap: 0,
  },
  title: {
    fontFamily: fonts.semibold,
    fontSize: typography.caption,
    letterSpacing: 0.9,
    textTransform: "uppercase",
  },
  row: {
    flexDirection: "row",
    gap: spacing.sm,
    paddingRight: spacing.sm,
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: radius.pill,
    borderWidth: StyleSheet.hairlineWidth,
    maxWidth: 200,
  },
  chipCompact: {
    paddingVertical: 6,
    paddingHorizontal: 10,
  },
  chipText: {
    fontFamily: fonts.semibold,
    fontSize: typography.caption,
    flexShrink: 1,
  },
  count: {
    minWidth: 22,
    height: 20,
    borderRadius: radius.pill,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 6,
  },
  countText: {
    fontFamily: fonts.bold,
    fontSize: 10,
  },
  pressed: {
    opacity: 0.9,
  },
});
