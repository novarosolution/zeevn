import React, { memo, useMemo } from "react";
import { Platform, Pressable, StyleSheet, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from "react-native-reanimated";
import { radius, spacing } from "../../theme/tokens";
import { ALCHEMY, heritageBrandTrimGradientShort } from "../../theme/customerAlchemy";
import { useTheme } from "../../context/ThemeContext";
import useReducedMotion from "../../hooks/useReducedMotion";

const PADDING_TOKENS = {
  none: 0,
  sm: spacing.sm,
  md: spacing.md,
  lg: spacing.lg,
  xl: spacing.lg + 6,
};

/**
 * Generic theme-aware container used as the standard "card" surface across
 * customer screens. Supports an optional gold top accent, interactive press +
 * hover states, and renders as a Pressable when `onPress` is provided.
 */
function PremiumCardBase({
  children,
  onPress,
  style,
  contentStyle,
  goldAccent = false,
  gradient = false,
  padding = "lg",
  variant = "default",
  borderless = false,
  interactive,
  disabled = false,
  accessibilityLabel,
  accessibilityRole,
  testID,
}) {
  const { colors: c, isDark } = useTheme();
  const reducedMotion = useReducedMotion();
  const isWeb = Platform.OS === "web";
  const isInteractive = interactive ?? Boolean(onPress);

  const padTokens =
    typeof padding === "number" ? padding : PADDING_TOKENS[padding] ?? PADDING_TOKENS.lg;

  const styles = useMemo(
    () => createStyles(c, isDark, padTokens, variant, borderless),
    [c, isDark, padTokens, variant, borderless]
  );

  const lift = useSharedValue(0);
  const scale = useSharedValue(1);
  const animStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: lift.value }, { scale: scale.value }],
  }));

  const handlePressIn = () => {
    if (!isInteractive || reducedMotion || disabled) return;
    scale.value = withSpring(0.99, { damping: 18, stiffness: 280 });
  };
  const handlePressOut = () => {
    if (!isInteractive || reducedMotion) return;
    scale.value = withSpring(1, { damping: 18, stiffness: 280 });
  };
  const handleHoverIn = () => {
    if (!isInteractive || Platform.OS !== "web" || reducedMotion || disabled) return;
    lift.value = withSpring(-2, { damping: 22, stiffness: 220 });
  };
  const handleHoverOut = () => {
    if (Platform.OS !== "web" || reducedMotion) return;
    lift.value = withSpring(0, { damping: 22, stiffness: 220 });
  };

  const inner = (
    <>
      {gradient && isWeb ? (
        <LinearGradient
          colors={
            isDark
              ? ["rgba(220, 38, 38, 0.08)", "rgba(28, 25, 23, 0)", "rgba(28, 25, 23, 0)"]
              : ["rgba(255, 255, 255, 0.85)", "rgba(255, 252, 246, 0.55)", "rgba(255, 248, 234, 0.85)"]
          }
          locations={[0, 0.5, 1]}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={[StyleSheet.absoluteFillObject, styles.peNone]}
        />
      ) : null}
      {goldAccent && isWeb ? (
        <LinearGradient
          colors={heritageBrandTrimGradientShort()}
          start={{ x: 0, y: 0.5 }}
          end={{ x: 1, y: 0.5 }}
          style={[styles.topAccent, styles.peNone]}
        />
      ) : null}
      <View style={[styles.content, contentStyle]}>{children}</View>
    </>
  );

  if (isInteractive) {
    return (
      <Animated.View style={[styles.outer, animStyle, style]}>
        <Pressable
          onPress={disabled ? undefined : onPress}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          onHoverIn={handleHoverIn}
          onHoverOut={handleHoverOut}
          disabled={disabled}
          accessibilityRole={accessibilityRole || "button"}
          accessibilityLabel={accessibilityLabel}
          accessibilityState={{ disabled }}
          testID={testID}
          style={({ pressed, hovered }) => [
            styles.card,
            disabled ? styles.disabled : null,
            hovered && Platform.OS === "web" && !disabled ? styles.hover : null,
            pressed ? styles.pressed : null,
          ]}
        >
          {inner}
        </Pressable>
      </Animated.View>
    );
  }

  return (
    <View style={[styles.outer, styles.card, style]} testID={testID}>
      {inner}
    </View>
  );
}

function createStyles(c, isDark, pad, variant, borderless) {
  const muted = variant === "muted";
  const elevated = variant === "elevated";
  const flat = variant === "flat";
  const danger = variant === "danger";
  const hero = variant === "hero";
  const panel = variant === "panel";
  const accent = variant === "accent";
  const premiumSurface = isDark ? c.surfaceElevated || c.surface : c.surfaceElevated || ALCHEMY.cardBg;

  return StyleSheet.create({
    outer: {
      width: "100%",
    },
    card: {
      borderRadius: Platform.OS === "web" ? radius.xl : radius.lg,
      backgroundColor: danger
        ? isDark
          ? "rgba(127, 29, 29, 0.12)"
          : "rgba(220, 38, 38, 0.05)"
        : accent
          ? isDark
            ? "rgba(220, 38, 38, 0.1)"
            : "rgba(255, 251, 245, 0.96)"
        : muted
          ? isDark
            ? "rgba(255,255,255,0.035)"
            : "rgba(255, 252, 247, 0.96)"
          : isDark
            ? premiumSurface
            : premiumSurface,
      borderWidth: borderless ? 0 : StyleSheet.hairlineWidth,
      borderColor: danger
        ? isDark
          ? "rgba(248, 113, 113, 0.35)"
          : "rgba(220, 38, 38, 0.2)"
        : isDark
          ? c.border
          : c.border,
      overflow: Platform.OS === "web" ? "visible" : "hidden",
      position: "relative",
      borderTopWidth: borderless ? 0 : Platform.OS === "web" ? (hero ? 2 : 1) : 1,
      borderTopColor: danger
        ? isDark
          ? "rgba(248, 113, 113, 0.42)"
          : "rgba(220, 38, 38, 0.24)"
        : accent
          ? isDark
            ? "rgba(248, 113, 113, 0.5)"
            : "rgba(185, 28, 28, 0.42)"
        : isDark
          ? "rgba(220, 38, 38, 0.18)"
          : "rgba(185, 28, 28, 0.14)",
      ...Platform.select({
        ios: flat
          ? {}
          : {
              shadowColor: isDark ? "#000000" : "#18181B",
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.04,
              shadowRadius: 8,
            },
        android: flat ? { elevation: 0 } : { elevation: 1 },
        web: flat
          ? {}
          : {
              boxShadow: isDark
                ? hero || elevated
                  ? "0 14px 28px rgba(0,0,0,0.26), 0 5px 14px rgba(0,0,0,0.16), inset 0 1px 0 rgba(255,255,255,0.05)"
                  : "0 10px 20px rgba(0,0,0,0.22), 0 3px 10px rgba(0,0,0,0.14), inset 0 1px 0 rgba(255,255,255,0.05)"
                : hero || elevated
                  ? "0 12px 22px rgba(15, 23, 42, 0.06), 0 3px 10px rgba(15, 23, 42, 0.04), inset 0 1px 0 rgba(255,255,255,0.96)"
                  : "0 8px 16px rgba(15, 23, 42, 0.05), 0 2px 6px rgba(15, 23, 42, 0.03), inset 0 1px 0 rgba(255,255,255,0.96)",
              transition: "transform 0.22s ease, box-shadow 0.22s ease, border-color 0.22s ease",
            },
        default: {},
      }),
    },
    topAccent: {
      position: "absolute",
      top: 0,
      left: 0,
      right: 0,
      height: 3,
      opacity: 0.95,
    },
    content: {
      width: "100%",
      padding: hero ? pad + 2 : panel ? pad + 1 : pad,
      ...(variant === "muted" ? { backgroundColor: "transparent" } : {}),
      borderRadius: Platform.OS === "web" ? radius.xl : radius.lg,
      overflow: "hidden",
      ...Platform.select({
        web: {
          boxSizing: "border-box",
        },
        default: {},
      }),
    },
    hover: {
      ...Platform.select({
        web: {
          boxShadow: isDark
            ? "0 14px 24px rgba(0,0,0,0.26), 0 4px 12px rgba(0,0,0,0.16), inset 0 1px 0 rgba(255,255,255,0.05)"
            : "0 10px 18px rgba(15, 23, 42, 0.06), 0 3px 10px rgba(15, 23, 42, 0.04), inset 0 1px 0 rgba(255,255,255,0.95)",
        },
        default: {},
      }),
    },
    pressed: {
      opacity: 0.96,
    },
    disabled: {
      opacity: 0.6,
    },
    peNone: {
      pointerEvents: "none",
    },
  });
}

const PremiumCard = memo(PremiumCardBase);

export default PremiumCard;
