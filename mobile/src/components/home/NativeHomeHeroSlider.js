import React, { useMemo } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { HOME_SCREEN_UI, HOME_TRUST_STRIP } from "../../content/appContent";
import { resolveNativeHomeHeroSlides } from "../../utils/homeHeroSlides";
import { FIGMA } from "../../theme/figmaApp";
import { KANKREG_PALETTE } from "../../theme/kankregWeb";
import { useTheme } from "../../context/ThemeContext";
import { fonts, icon, spacing, typography } from "../../theme/tokens";
import { platformShadow } from "../../theme/shadowPlatform";
import HeroMediaSlider from "./HeroMediaSlider";

const cardShadow = platformShadow({
  ios: {
    shadowColor: "#3D2A12",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.14,
    shadowRadius: 20,
  },
  android: { elevation: 5 },
});

/** Single premium native home slider + trust strip in one card. */
export default function NativeHomeHeroSlider({ navigation, heroSlides = [], products = [] }) {
  const { isDark } = useTheme();

  const activeSlides = useMemo(
    () => resolveNativeHomeHeroSlides({ heroSlides, products }),
    [heroSlides, products]
  );

  if (!activeSlides.length) return null;

  const showTrust = HOME_SCREEN_UI.web?.showHeroTrustChips !== false;
  const openShop = () => navigation.navigate("Shop");

  return (
    <View style={styles.wrap}>
      <Pressable
        onPress={openShop}
        style={({ pressed }) => [
          styles.card,
          isDark && styles.cardDark,
          cardShadow,
          pressed && styles.cardPressed,
        ]}
        accessibilityRole="button"
        accessibilityLabel="Browse featured products"
      >
        <View style={styles.goldRail} pointerEvents="none" />
        <HeroMediaSlider
          variant="app"
          cardEmbedded
          slides={activeSlides}
          onPress={openShop}
        />
        {showTrust ? (
          <View style={[styles.trustRow, isDark && styles.trustRowDark]}>
            {HOME_TRUST_STRIP.map((item) => (
              <View key={item.key} style={styles.trustChip}>
                <Ionicons
                  name={item.icon}
                  size={icon.xs - 1}
                  color={isDark ? KANKREG_PALETTE.goldBright : KANKREG_PALETTE.goldDeep}
                />
                <Text
                  style={[styles.trustText, isDark && styles.trustTextDark]}
                  numberOfLines={1}
                >
                  {item.label}
                </Text>
              </View>
            ))}
          </View>
        ) : null}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    width: "100%",
    paddingHorizontal: FIGMA.gutter,
    marginBottom: spacing.sm,
  },
  card: {
    borderRadius: FIGMA.radiusHero,
    overflow: "hidden",
    backgroundColor: "#14110e",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(31, 92, 71, 0.32)",
  },
  cardDark: {
    borderColor: "rgba(42, 117, 89, 0.28)",
  },
  cardPressed: {
    opacity: 0.96,
  },
  goldRail: {
    position: "absolute",
    top: 0,
    left: 16,
    right: 16,
    height: StyleSheet.hairlineWidth,
    backgroundColor: "rgba(42, 117, 89, 0.5)",
    zIndex: 2,
  },
  trustRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.xs,
    paddingVertical: spacing.sm + 2,
    paddingHorizontal: spacing.sm + 4,
    backgroundColor: "rgba(255, 253, 248, 0.98)",
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "rgba(31, 92, 71, 0.16)",
  },
  trustRowDark: {
    backgroundColor: "rgba(20, 17, 14, 0.98)",
    borderTopColor: "rgba(42, 117, 89, 0.14)",
  },
  trustChip: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    minWidth: 0,
  },
  trustText: {
    flexShrink: 1,
    fontFamily: fonts.semibold,
    fontSize: typography.caption - 1,
    color: KANKREG_PALETTE.inkSoft,
    letterSpacing: 0.05,
  },
  trustTextDark: {
    color: "rgba(245,239,228,0.82)",
  },
});
