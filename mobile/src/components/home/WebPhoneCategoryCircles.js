import React, { useMemo } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../context/ThemeContext";
import { useKankregLayout } from "../../theme/kankregBreakpoints";
import { KANKREG_PALETTE, ZEEVAN_GREEN } from "../../theme/kankregWeb";
import { FONT_HEADING } from "../../theme/typographyRoles";
import { fonts, spacing } from "../../theme/tokens";
import { buildNativeCategoryTiles } from "../../utils/homeCategories";
import { HOME_SCREEN_UI } from "../../content/appContent";
import useReducedMotion from "../../hooks/useReducedMotion";
import SectionReveal from "../motion/SectionReveal";

/**
 * Phone web shop-by-line rail — welcome + staggered circles.
 */
export default function WebPhoneCategoryCircles({ products = [], onPressCategory, onPressShopAll }) {
  const { isDark } = useTheme();
  const { pageGutterClamp } = useKankregLayout();
  const reduceMotion = useReducedMotion();
  const tiles = useMemo(() => buildNativeCategoryTiles(products, { max: 4 }), [products]);
  const ink = isDark ? "#FAF8F4" : KANKREG_PALETTE.ink;
  const muted = isDark ? "rgba(250,248,244,0.7)" : KANKREG_PALETTE.inkSoft;
  const ring = isDark ? "rgba(185,204,122,0.45)" : ZEEVAN_GREEN.border;
  const fill = isDark ? "rgba(255,255,255,0.06)" : "#FFFFFF";
  const title = HOME_SCREEN_UI.web?.phoneWelcomeTitle || "Shop by line";
  const subtitle =
    HOME_SCREEN_UI.web?.phoneWelcomeSubtitle || "Ghee · tel · masala · honey";

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
    <SectionReveal preset="fade-up" delay={40} style={styles.reveal}>
      <View
        style={[
          styles.wrap,
          { paddingHorizontal: pageGutterClamp },
          isDark && styles.wrapDark,
        ]}
      >
        <Text style={[styles.title, { color: ink }]}>{title}</Text>
        <Text style={[styles.subtitle, { color: muted }]}>{subtitle}</Text>
        <View style={styles.row}>
          {items.map((item, idx) => {
            const body = (
              <Pressable
                onPress={() => (item.shopAll ? onPressShopAll?.() : onPressCategory?.(item.lineLabel))}
                style={({ pressed }) => [
                  styles.item,
                  pressed && styles.itemPressed,
                ]}
                accessibilityRole="button"
                accessibilityLabel={item.label}
              >
                <View style={[styles.circle, { borderColor: ring, backgroundColor: fill }]}>
                  <Ionicons name={item.icon} size={22} color={isDark ? "#FAF8F4" : ZEEVAN_GREEN.deep} />
                </View>
                <Text style={[styles.label, { color: ink }]} numberOfLines={2}>
                  {item.label}
                </Text>
              </Pressable>
            );
            if (reduceMotion) {
              return <React.Fragment key={item.key}>{body}</React.Fragment>;
            }
            return (
              <Animated.View
                key={item.key}
                entering={FadeInDown.springify().delay(80 + idx * 70).damping(16).mass(0.8)}
                style={styles.itemAnim}
              >
                {body}
              </Animated.View>
            );
          })}
        </View>
      </View>
    </SectionReveal>
  );
}

const styles = StyleSheet.create({
  reveal: { width: "100%" },
  wrap: {
    paddingTop: spacing.md + 2,
    paddingBottom: spacing.md + 2,
    gap: 4,
    backgroundColor: KANKREG_PALETTE.paper2,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: KANKREG_PALETTE.lineSoft,
  },
  wrapDark: {
    backgroundColor: "rgba(255,255,255,0.03)",
    borderColor: "rgba(255,255,255,0.08)",
  },
  title: {
    fontFamily: FONT_HEADING,
    fontSize: 20,
    lineHeight: 26,
    textAlign: "center",
    letterSpacing: -0.25,
    paddingHorizontal: 8,
  },
  subtitle: {
    fontFamily: fonts.medium,
    fontSize: 12,
    lineHeight: 16,
    textAlign: "center",
    marginBottom: 14,
    letterSpacing: 0.2,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    width: "100%",
  },
  itemAnim: {
    flex: 1,
    maxWidth: 72,
  },
  item: {
    flex: 1,
    alignItems: "center",
    gap: 7,
    maxWidth: 72,
  },
  itemPressed: {
    opacity: 0.82,
    transform: [{ scale: 0.94 }],
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
    fontSize: 11,
    lineHeight: 13,
    textAlign: "center",
    minHeight: 26,
  },
});
