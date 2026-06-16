import React, { memo, useMemo } from "react";
import { StyleSheet, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { radius, spacing } from "../../theme/tokens";
import { ALCHEMY } from "../../theme/customerAlchemy";
import { useTheme } from "../../context/ThemeContext";
import { platformShadow } from "../../theme/shadowPlatform";

/**
 * Bottom sticky CTA bar with a thin gold hairline at the top, frosted-glass
 * background, safe-area aware padding, and edge-to-edge content slot. Sits
 * above the bottom navigation; sized to feel like a native sheet on web.
 */
function PremiumStickyBarBase({
  children,
  variant = "glass",
  align = "row",
  style,
  contentStyle,
  testID,
  showHairline = true,
  spacingHorizontal,
}) {
  const { colors: c, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const styles = useMemo(
    () => createStyles(c, isDark, insets.bottom, variant, align, spacingHorizontal),
    [c, isDark, insets.bottom, variant, align, spacingHorizontal]
  );

  return (
    <View style={[styles.wrap, style, styles.peBoxNone]} testID={testID}>
      {showHairline ? (
        <LinearGradient
          colors={["rgba(52, 211, 153, 0)", ALCHEMY.gold, "rgba(52, 211, 153, 0)"]}
          start={{ x: 0, y: 0.5 }}
          end={{ x: 1, y: 0.5 }}
          style={[styles.hairline, styles.peNone]}
        />
      ) : null}
      <View style={[styles.inner, contentStyle]}>{children}</View>
    </View>
  );
}

function createStyles(c, isDark, bottomInset, variant, align, spacingHorizontal) {
  const isGlass = variant === "glass";
  const isSolid = variant === "solid";
  const horizontalPad =
    typeof spacingHorizontal === "number" ? spacingHorizontal : spacing.md;

  const wrapShadow = platformShadow({
    ios: {
      shadowColor: isDark ? "#000000" : "#3D2A12",
      shadowOffset: { width: 0, height: -8 },
      shadowOpacity: isDark ? 0.4 : 0.06,
      shadowRadius: 24,
    },
    android: { elevation: 12 },
    web: {
      backdropFilter: isGlass ? "saturate(160%) blur(18px)" : "none",
      WebkitBackdropFilter: isGlass ? "saturate(160%) blur(18px)" : "none",
      boxShadow: isDark
        ? "0 -16px 32px rgba(0,0,0,0.45)"
        : "0 -14px 30px rgba(22, 69, 51, 0.06), 0 -2px 8px rgba(28, 25, 23, 0.04)",
    },
  });

  return StyleSheet.create({
    wrap: {
      position: "relative",
      backgroundColor: isGlass
        ? isDark
          ? "rgba(15,12,10,0.92)"
          : "rgba(255,253,250,0.92)"
        : isSolid
          ? c.surface
          : "transparent",
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: isDark ? "rgba(52, 211, 153, 0.16)" : "rgba(22, 69, 51, 0.12)",
      paddingTop: spacing.sm,
      paddingBottom: spacing.sm + (bottomInset || 0),
      paddingHorizontal: horizontalPad,
      ...wrapShadow,
    },
    hairline: {
      position: "absolute",
      top: -1,
      left: 0,
      right: 0,
      height: 1,
      opacity: isDark ? 0.55 : 0.7,
    },
    peNone: {
      pointerEvents: "none",
    },
    peBoxNone: {
      pointerEvents: "box-none",
    },
    inner: {
      flexDirection: align === "row" ? "row" : "column",
      alignItems: align === "row" ? "center" : "stretch",
      gap: spacing.sm,
      borderRadius: radius.xl,
    },
  });
}

const PremiumStickyBar = memo(PremiumStickyBarBase);

export default PremiumStickyBar;
