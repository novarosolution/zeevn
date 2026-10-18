import React, { useMemo } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../context/ThemeContext";
import { useKankregLayout } from "../../theme/kankregBreakpoints";
import { ZEEVAN_GREEN } from "../../theme/kankregWeb";
import { FONT_HEADING } from "../../theme/typographyRoles";
import { fonts, spacing } from "../../theme/tokens";
import { buildNativeCategoryTiles } from "../../utils/homeCategories";
import { HOME_SCREEN_UI } from "../../content/appContent";

/**
 * Anveshan-style phone web: welcome + 5 fixed circular category icons in one row.
 */
export default function WebPhoneCategoryCircles({ products = [], onPressCategory, onPressShopAll }) {
  const { isDark } = useTheme();
  const { pageGutterClamp } = useKankregLayout();
  const tiles = useMemo(() => buildNativeCategoryTiles(products, { max: 4 }), [products]);
  const ink = isDark ? "#FAF8F4" : ZEEVAN_GREEN.deep;
  const muted = isDark ? "rgba(250,248,244,0.7)" : "#5A5648";
  const ring = isDark ? "rgba(185,204,122,0.45)" : "rgba(36,68,36,0.22)";
  const fill = isDark ? "rgba(255,255,255,0.06)" : "#FFFFFF";
  const title = HOME_SCREEN_UI.web?.phoneWelcomeTitle || "Welcome to Zeevan";
  const subtitle =
    HOME_SCREEN_UI.web?.phoneWelcomeSubtitle || "Your one-stop store for purity";

  const items = [
    { key: "all", label: "Shop All", icon: "grid-outline", shopAll: true },
    ...tiles.map((t) => ({
      key: t.key,
      label: t.label,
      icon: t.icon || "leaf-outline",
      shopAll: false,
      lineLabel: t.label,
    })),
  ].slice(0, 5);

  return (
    <View style={[styles.wrap, { paddingHorizontal: pageGutterClamp }]}>
      <Text style={[styles.title, { color: ink }]}>{title}</Text>
      <Text style={[styles.subtitle, { color: muted }]}>{subtitle}</Text>
      <View style={styles.row}>
        {items.map((item) => (
          <Pressable
            key={item.key}
            onPress={() => (item.shopAll ? onPressShopAll?.() : onPressCategory?.(item.lineLabel))}
            style={({ pressed }) => [styles.item, pressed && { opacity: 0.85 }]}
            accessibilityRole="button"
            accessibilityLabel={item.label}
          >
            <View style={[styles.circle, { borderColor: ring, backgroundColor: fill }]}>
              <Ionicons name={item.icon} size={24} color={ink} />
            </View>
            <Text style={[styles.label, { color: ink }]} numberOfLines={2}>
              {item.label}
            </Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
    gap: 4,
    backgroundColor: "transparent",
  },
  title: {
    fontFamily: FONT_HEADING,
    fontSize: 20,
    lineHeight: 26,
    textAlign: "center",
    letterSpacing: -0.2,
    paddingHorizontal: 8,
  },
  subtitle: {
    fontFamily: fonts.medium,
    fontSize: 13,
    lineHeight: 17,
    textAlign: "center",
    marginBottom: 12,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    width: "100%",
  },
  item: {
    flex: 1,
    alignItems: "center",
    gap: 6,
    maxWidth: 76,
  },
  circle: {
    width: 58,
    height: 58,
    borderRadius: 29,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
  },
  label: {
    fontFamily: fonts.semibold,
    fontSize: 11,
    lineHeight: 13,
    textAlign: "center",
    minHeight: 26,
  },
});
