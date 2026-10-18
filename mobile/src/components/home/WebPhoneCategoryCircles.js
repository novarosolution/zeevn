import React, { useMemo } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../context/ThemeContext";
import { useKankregLayout } from "../../theme/kankregBreakpoints";
import { ZEEVAN_GREEN } from "../../theme/kankregWeb";
import { FONT_HEADING } from "../../theme/typographyRoles";
import { fonts, spacing } from "../../theme/tokens";
import { buildNativeCategoryTiles } from "../../utils/homeCategories";
import { HOME_SCREEN_UI } from "../../content/appContent";

/**
 * Compact phone-web category strip: welcome line + circular icons (Shop all + lines).
 */
export default function WebPhoneCategoryCircles({ products = [], onPressCategory, onPressShopAll }) {
  const { isDark } = useTheme();
  const { pageGutterClamp } = useKankregLayout();
  const tiles = useMemo(() => buildNativeCategoryTiles(products, { max: 4 }), [products]);
  const ink = isDark ? "#FAF8F4" : "#1A2618";
  const muted = isDark ? "rgba(250,248,244,0.7)" : "#6A6556";
  const ring = isDark ? "rgba(185,204,122,0.4)" : "rgba(36,68,36,0.16)";
  const fill = isDark ? "rgba(255,255,255,0.07)" : "#FFFFFF";
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
  ];

  return (
    <View style={[styles.wrap, { paddingHorizontal: pageGutterClamp }]}>
      <Text style={[styles.title, { color: ink }]}>{title}</Text>
      <Text style={[styles.subtitle, { color: muted }]}>{subtitle}</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.row}
      >
        {items.map((item) => (
          <Pressable
            key={item.key}
            onPress={() => (item.shopAll ? onPressShopAll?.() : onPressCategory?.(item.lineLabel))}
            style={({ pressed }) => [styles.item, pressed && { opacity: 0.88, transform: [{ scale: 0.97 }] }]}
            accessibilityRole="button"
            accessibilityLabel={item.label}
          >
            <View style={[styles.circle, { borderColor: ring, backgroundColor: fill }]}>
              <Ionicons name={item.icon} size={22} color={isDark ? "#C4D088" : ZEEVAN_GREEN.deep} />
            </View>
            <Text style={[styles.label, { color: ink }]} numberOfLines={2}>
              {item.label}
            </Text>
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    paddingTop: spacing.sm + 2,
    paddingBottom: spacing.xs,
    gap: 4,
  },
  title: {
    fontFamily: FONT_HEADING,
    fontSize: 18,
    lineHeight: 23,
    textAlign: "center",
    letterSpacing: -0.25,
    paddingHorizontal: 6,
  },
  subtitle: {
    fontFamily: fonts.medium,
    fontSize: 12.5,
    lineHeight: 16,
    textAlign: "center",
    marginBottom: 8,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 8,
    paddingHorizontal: 2,
    minWidth: "100%",
  },
  item: {
    width: 68,
    alignItems: "center",
    gap: 6,
  },
  circle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
  },
  label: {
    fontFamily: fonts.semibold,
    fontSize: 10.5,
    lineHeight: 13,
    textAlign: "center",
    minHeight: 26,
  },
});
