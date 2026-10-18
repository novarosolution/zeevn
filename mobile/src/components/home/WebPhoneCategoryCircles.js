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
 * Aumshanti-style phone web strip: welcome title + circular category icons (Shop all + lines).
 */
export default function WebPhoneCategoryCircles({ products = [], onPressCategory, onPressShopAll }) {
  const { isDark } = useTheme();
  const { pageGutterClamp } = useKankregLayout();
  const tiles = useMemo(() => buildNativeCategoryTiles(products, { max: 4 }), [products]);
  const ink = isDark ? "#FAF8F4" : "#1A2618";
  const muted = isDark ? "rgba(250,248,244,0.72)" : "#5A5648";
  const ring = isDark ? "rgba(185,204,122,0.35)" : "rgba(36,68,36,0.14)";
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
  ];

  return (
    <View style={[styles.wrap, { paddingHorizontal: pageGutterClamp }]}>
      <Text style={[styles.title, { color: ink }]}>{title}</Text>
      <Text style={[styles.subtitle, { color: muted }]}>{subtitle}</Text>
      <View style={styles.row}>
        {items.map((item) => (
          <Pressable
            key={item.key}
            onPress={() => (item.shopAll ? onPressShopAll?.() : onPressCategory?.(item.lineLabel))}
            style={({ pressed }) => [styles.item, pressed && { opacity: 0.88 }]}
            accessibilityRole="button"
            accessibilityLabel={item.label}
          >
            <View style={[styles.circle, { borderColor: ring, backgroundColor: fill }]}>
              <Ionicons name={item.icon} size={26} color={isDark ? "#C4D088" : ZEEVAN_GREEN.deep} />
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
    gap: 6,
    alignItems: "center",
  },
  title: {
    fontFamily: FONT_HEADING,
    fontSize: 22,
    lineHeight: 28,
    textAlign: "center",
    letterSpacing: -0.3,
    paddingHorizontal: 8,
  },
  subtitle: {
    fontFamily: fonts.medium,
    fontSize: 13.5,
    lineHeight: 18,
    textAlign: "center",
    marginBottom: 10,
  },
  row: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 10,
    width: "100%",
  },
  item: {
    width: "18%",
    minWidth: 64,
    maxWidth: 76,
    alignItems: "center",
    gap: 7,
  },
  circle: {
    width: 64,
    height: 64,
    borderRadius: 32,
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
