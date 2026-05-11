import React, { memo, useEffect, useMemo } from "react";
import { ActivityIndicator, Platform, Pressable, StyleSheet, Text, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import Animated, {
  cancelAnimation,
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { fonts, icon, radius, typography } from "../../theme/tokens";
import { useTheme } from "../../context/ThemeContext";
import useReducedMotion from "../../hooks/useReducedMotion";

const SIZE_TOKENS = {
  sm: { padV: 8, padH: 14, fs: typography.caption, gap: 6, iconSize: icon.xs, height: 38 },
  md: { padV: 11, padH: 20, fs: typography.bodySmall, gap: 8, iconSize: icon.sm, height: 46 },
  lg: { padV: 13, padH: 24, fs: typography.bodySmall + 1, gap: 9, iconSize: icon.md, height: 52 },
  xl: { padV: 16, padH: 28, fs: typography.body + 1, gap: 10, iconSize: icon.md, height: 56 },
};

/**
 * Premium drop-in button used across customer screens.
 *
 *   variants: primary | secondary | ghost | danger | subtle
 *   sizes:    sm | md | lg | xl
 */
function PremiumButtonBase({
  label,
  title,
  children,
  onPress,
  onPressIn,
  onPressOut,
  variant = "primary",
  size = "md",
  loading = false,
  disabled = false,
  iconLeft,
  iconRight,
  fullWidth = false,
  style,
  textStyle,
  accessibilityLabel,
  accessibilityHint,
  testID,
  pulse = false,
}) {
  const { colors: c, isDark } = useTheme();
  const reducedMotion = useReducedMotion();
  const tokens = SIZE_TOKENS[size] || SIZE_TOKENS.md;
  const isPrimary = variant === "primary";
  const isSecondary = variant === "secondary";
  const isGhost = variant === "ghost";
  const isDanger = variant === "danger";
  const isSubtle = variant === "subtle";

  const scale = useSharedValue(1);
  const lift = useSharedValue(0);
  const pulseValue = useSharedValue(0);
  const motionStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }, { translateY: lift.value }],
  }));
  const pulseStyle = useAnimatedStyle(() => ({
    opacity: pulseValue.value,
    transform: [{ scale: 1 + pulseValue.value * 0.04 }],
  }));

  useEffect(() => {
    if (!pulse || reducedMotion || disabled || loading) {
      cancelAnimation(pulseValue);
      pulseValue.value = withTiming(0, { duration: 220 });
      return undefined;
    }
    pulseValue.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 1100, easing: Easing.bezier(0.22, 1, 0.36, 1) }),
        withTiming(0, { duration: 1100, easing: Easing.bezier(0.65, 0, 0.35, 1) }),
      ),
      -1,
      false,
    );
    return () => {
      cancelAnimation(pulseValue);
    };
  }, [pulse, reducedMotion, disabled, loading, pulseValue]);

  const handlePressIn = (e) => {
    if (!reducedMotion && !disabled && !loading) {
      scale.value = withSpring(0.985, { damping: 18, stiffness: 280 });
    }
    if (onPressIn) onPressIn(e);
  };
  const handlePressOut = (e) => {
    if (!reducedMotion) {
      scale.value = withSpring(1, { damping: 18, stiffness: 280 });
    }
    if (onPressOut) onPressOut(e);
  };
  const handleHoverIn = () => {
    if (Platform.OS !== "web" || reducedMotion || disabled || loading) return;
    lift.value = withSpring(-1.5, { damping: 22, stiffness: 220 });
  };
  const handleHoverOut = () => {
    if (Platform.OS !== "web" || reducedMotion) return;
    lift.value = withSpring(0, { damping: 22, stiffness: 220 });
  };

  const styles = useMemo(
    () => createStyles(c, isDark, tokens, fullWidth),
    [c, isDark, tokens, fullWidth]
  );
  const resolvedLabel = label ?? title;
  const { outerStyle, surfaceStyle } = useMemo(() => splitStyleLayers(style), [style]);

  const onPrimaryColor = c.onPrimary;
  const variantTextColor =
    isGhost
      ? isDark ? c.primaryBright : c.primaryDark
      : isSubtle
        ? c.textPrimary
        : isSecondary
          ? c.textPrimary
          : isDanger
            ? c.danger
            : onPrimaryColor;

  const gradientColors = useMemo(() => {
    if (disabled || loading) return isDark ? ["#71717A", "#52525B", "#3F3F46"] : ["#A1A1AA", "#71717A", "#52525B"];
    return isDark
      ? [c.primaryBright, c.primary, c.primaryDark]
      : ["#D94444", c.primary, c.primaryDark];
  }, [disabled, loading, isDark, c.primary, c.primaryBright, c.primaryDark]);

  const textNode = resolvedLabel != null
    ? <Text style={[styles.text, { color: variantTextColor }, textStyle]} numberOfLines={1}>{resolvedLabel}</Text>
    : children;

  const iconColor = variantTextColor;
  const iconLeftNode = iconLeft
    ? typeof iconLeft === "string"
      ? <Ionicons name={iconLeft} size={tokens.iconSize} color={iconColor} />
      : iconLeft
    : null;
  const iconRightNode = iconRight
    ? typeof iconRight === "string"
      ? <Ionicons name={iconRight} size={tokens.iconSize} color={iconColor} />
      : iconRight
    : null;

  const innerRow = (
    <View style={styles.row}>
      {loading ? (
        <ActivityIndicator size="small" color={variantTextColor} />
      ) : (
        <>
          {iconLeftNode}
          {textNode}
          {iconRightNode}
        </>
      )}
    </View>
  );

  const pulseColor = isDanger
    ? "rgba(220, 38, 38, 0.55)"
    : isSecondary
      ? isDark
        ? "rgba(148, 163, 184, 0.42)"
        : "rgba(100, 116, 139, 0.38)"
      : isDark
        ? "rgba(220, 38, 38, 0.5)"
        : "rgba(220, 38, 38, 0.45)";

  return (
    <Animated.View style={[styles.outer, motionStyle, outerStyle]}>
      {pulse && !reducedMotion && !disabled && !loading ? (
        <Animated.View
          style={[styles.pulseGlow, { backgroundColor: pulseColor }, pulseStyle, styles.peNone]}
        />
      ) : null}
      <Pressable
        onPress={loading || disabled ? undefined : onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onHoverIn={handleHoverIn}
        onHoverOut={handleHoverOut}
        disabled={disabled || loading}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel || (typeof resolvedLabel === "string" ? resolvedLabel : undefined)}
        accessibilityHint={accessibilityHint}
        accessibilityState={{ disabled: disabled || loading, busy: loading }}
        testID={testID}
        style={({ pressed, hovered }) => [
          styles.press,
          disabled || loading ? styles.disabled : null,
          hovered && Platform.OS === "web" && !disabled && !loading ? styles.hover : null,
          pressed ? styles.pressed : null,
        ]}
      >
        {isPrimary ? (
          <LinearGradient
            colors={gradientColors}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[styles.gradient, surfaceStyle]}
          >
            {innerRow}
          </LinearGradient>
        ) : (
          <View
            style={[
              styles.surfaceShell,
              isSecondary ? styles.secondary : null,
              isGhost ? styles.ghost : null,
              isSubtle ? styles.subtle : null,
              isDanger ? styles.danger : null,
              surfaceStyle,
            ]}
          >
            {innerRow}
          </View>
        )}
      </Pressable>
    </Animated.View>
  );
}

const SURFACE_STYLE_KEYS = new Set([
  "backgroundColor",
  "borderColor",
  "borderWidth",
  "borderTopWidth",
  "borderTopColor",
  "borderBottomWidth",
  "borderBottomColor",
  "borderLeftWidth",
  "borderLeftColor",
  "borderRightWidth",
  "borderRightColor",
  "borderStyle",
]);

function splitStyleLayers(style) {
  const flattened = StyleSheet.flatten(style);
  if (!flattened || typeof flattened !== "object") {
    return { outerStyle: style, surfaceStyle: null };
  }

  const outerStyle = {};
  const surfaceStyle = {};

  Object.entries(flattened).forEach(([key, value]) => {
    if (SURFACE_STYLE_KEYS.has(key)) {
      surfaceStyle[key] = value;
    } else {
      outerStyle[key] = value;
    }
  });

  return {
    outerStyle: Object.keys(outerStyle).length ? outerStyle : null,
    surfaceStyle: Object.keys(surfaceStyle).length ? surfaceStyle : null,
  };
}

function createStyles(c, isDark, t, fullWidth) {
  return StyleSheet.create({
    outer: {
      ...(fullWidth ? { width: "100%" } : { alignSelf: "flex-start" }),
      position: "relative",
    },
    pulseGlow: {
      position: "absolute",
      top: -6,
      left: -6,
      right: -6,
      bottom: -6,
      borderRadius: radius.pill,
      ...Platform.select({
        web: { filter: "blur(14px)" },
        default: {},
      }),
      zIndex: -1,
    },
    peNone: {
      pointerEvents: "none",
    },
    press: {
      borderRadius: radius.pill,
      overflow: "visible",
      minHeight: t.height,
      ...Platform.select({
        web: {
          transition: "transform 0.2s ease, opacity 0.2s ease",
          cursor: "pointer",
        },
        default: {},
      }),
    },
    gradient: {
      borderRadius: radius.pill,
      paddingVertical: t.padV,
      paddingHorizontal: t.padH,
      borderWidth: 1,
      borderColor: isDark ? "rgba(255, 244, 224, 0.18)" : "rgba(255, 250, 244, 0.58)",
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      ...Platform.select({
        ios: {
          shadowColor: "#1a1208",
          shadowOffset: { width: 0, height: 7 },
          shadowOpacity: isDark ? 0.2 : 0.12,
          shadowRadius: 10,
        },
        android: { elevation: 2 },
        web: {
          boxShadow: isDark
            ? "0 12px 24px rgba(0,0,0,0.34), inset 0 1px 0 rgba(255,255,255,0.12)"
            : "0 14px 28px rgba(15, 23, 42, 0.14), inset 0 1px 0 rgba(255,255,255,0.24)",
        },
        default: {},
      }),
    },
    surfaceShell: {
      borderRadius: radius.pill,
      paddingVertical: t.padV,
      paddingHorizontal: t.padH,
      borderWidth: 1,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      ...Platform.select({
        web: {
          boxShadow: isDark
            ? "0 10px 18px rgba(0,0,0,0.18)"
            : "0 8px 16px rgba(15, 23, 42, 0.06)",
        },
        default: {},
      }),
    },
    secondary: {
      backgroundColor: isDark ? c.surfaceElevated || c.surface : "#FFFDFC",
      borderColor: isDark ? "rgba(255,255,255,0.08)" : "rgba(100, 116, 139, 0.18)",
    },
    ghost: {
      borderColor: isDark ? "rgba(248, 113, 113, 0.3)" : "rgba(220, 38, 38, 0.18)",
      backgroundColor: isDark ? "rgba(239, 68, 68, 0.06)" : "rgba(255, 255, 255, 0.72)",
      ...Platform.select({
        web: {
          boxShadow: isDark
            ? "0 8px 14px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255, 255, 255, 0.04)"
            : "0 6px 12px rgba(15, 23, 42, 0.05), inset 0 1px 0 rgba(255,255,255,0.92)",
        },
        default: {},
      }),
    },
    subtle: {
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: c.border,
      backgroundColor: isDark ? c.surfaceMuted : "#F8F6F3",
      ...Platform.select({
        web: {
          boxShadow: "0 6px 12px rgba(15, 23, 42, 0.04)",
        },
        default: {},
      }),
    },
    danger: {
      borderColor: isDark ? "rgba(248, 113, 113, 0.28)" : "rgba(239, 68, 68, 0.22)",
      backgroundColor: isDark ? "rgba(127, 29, 29, 0.22)" : "#FEF2F2",
      ...Platform.select({
        web: {
          boxShadow: isDark
            ? "0 8px 14px rgba(0,0,0,0.2)"
            : "0 6px 12px rgba(127, 29, 29, 0.08)",
        },
        default: {},
      }),
    },
    row: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: t.gap,
      width: "100%",
    },
    text: {
      fontFamily: fonts.bold,
      fontSize: t.fs,
      letterSpacing: 0.24,
    },
    hover: {
      ...Platform.select({
        web: {
          transform: [{ translateY: -1 }],
        },
        default: {},
      }),
    },
    pressed: {
      opacity: 0.96,
    },
    disabled: {
      opacity: 0.56,
    },
  });
}

const PremiumButton = memo(PremiumButtonBase);

export default PremiumButton;
