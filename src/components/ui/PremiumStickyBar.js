import React, { memo, useMemo } from "react";
import { Platform, StyleSheet, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { radius, spacing } from "../../theme/tokens";
import { HERITAGE } from "../../theme/customerAlchemy";
import { useTheme } from "../../context/ThemeContext";

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
          colors={["rgba(234, 88, 12, 0)", HERITAGE.amberMid, "rgba(234, 88, 12, 0)"]}
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

  return StyleSheet.create({
    wrap: {
      position: "relative",
      backgroundColor: isGlass
        ? isDark
          ? c.surfaceOverlay || "rgba(11,17,32,0.92)"
          : "rgba(255,255,255,0.88)"
        : isSolid
          ? c.surface
          : "transparent",
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: isDark ? "rgba(248, 113, 113, 0.16)" : "rgba(148, 163, 184, 0.18)",
      paddingTop: spacing.sm,
      paddingBottom: spacing.sm + (bottomInset || 0),
      paddingHorizontal: horizontalPad,
      ...Platform.select({
        ios: {
          shadowColor: isDark ? "#000000" : "#18181B",
          shadowOffset: { width: 0, height: -8 },
          shadowOpacity: isDark ? 0.4 : 0.06,
          shadowRadius: 24,
        },
        android: { elevation: 12 },
        web: {
          backdropFilter: isGlass ? "saturate(160%) blur(18px)" : "none",
          WebkitBackdropFilter: isGlass ? "saturate(160%) blur(18px)" : "none",
          boxShadow: isDark
            ? "0 -12px 26px rgba(0,0,0,0.34)"
            : "0 -10px 22px rgba(15, 23, 42, 0.06), 0 -2px 8px rgba(15, 23, 42, 0.03)",
        },
        default: {},
      }),
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
