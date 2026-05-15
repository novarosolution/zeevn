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
import { fonts, getSemanticColors, icon, radius, semanticRadius, typography } from "../../theme/tokens";
import { useTheme } from "../../context/ThemeContext";
import useReducedMotion from "../../hooks/useReducedMotion";

const SIZE_TOKENS = {
  sm: { padV: 7, padH: 13, fs: typography.caption, gap: 6, iconSize: icon.xs, height: 34 },
  md: { padV: 9, padH: 16, fs: typography.bodySmall, gap: 8, iconSize: icon.sm, height: 42 },
  lg: { padV: 11, padH: 20, fs: typography.bodySmall + 1, gap: 8, iconSize: icon.md, height: 46 },
  xl: { padV: 13, padH: 24, fs: typography.body + 1, gap: 9, iconSize: icon.md, height: 50 },
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
  const isWeb = Platform.OS === "web";
  const tokens = SIZE_TOKENS[size] || SIZE_TOKENS.md;
  const isPrimary = variant === "primary";
  const isSecondary = variant === "secondary";
  const isGhost = variant === "ghost";
  const isDanger = variant === "danger";
  const isSubtle = variant === "subtle";
  const semantic = getSemanticColors(c);

  const scale = useSharedValue(1);
  const lift = useSharedValue(0);
  const pulseValue = useSharedValue(0);
  const shineTranslate = useSharedValue(-140);
  const motionStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }, { translateY: lift.value }],
  }));
  const pulseStyle = useAnimatedStyle(() => ({
    opacity: pulseValue.value,
    transform: [{ scale: 1 + pulseValue.value * 0.04 }],
  }));
  const shineStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: shineTranslate.value }, { skewX: "-18deg" }],
    opacity: shineTranslate.value > -120 ? 0.9 : 0,
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
    if (isPrimary) {
      shineTranslate.value = -140;
      shineTranslate.value = withTiming(180, { duration: 600, easing: Easing.bezier(0.2, 0.8, 0.2, 1) });
    }
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
    return [semantic.commerce.cta.start, c.primary, semantic.commerce.cta.end];
  }, [disabled, loading, semantic.commerce.cta.start, semantic.commerce.cta.end, c.primary, isDark]);

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
      {pulse && isWeb && !reducedMotion && !disabled && !loading ? (
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
        style={({ pressed, hovered, focused }) => [
          styles.press,
          disabled || loading ? styles.disabled : null,
          hovered && Platform.OS === "web" && !disabled && !loading ? styles.hover : null,
          pressed ? styles.pressed : null,
          focused && Platform.OS === "web" ? styles.focused : null,
        ]}
      >
        {isPrimary && isWeb ? (
          <LinearGradient
            colors={gradientColors}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[styles.gradient, surfaceStyle]}
          >
            {Platform.OS === "web" && !reducedMotion ? (
              <Animated.View style={[styles.shineSweep, shineStyle]}>
                <LinearGradient
                  colors={["rgba(255,255,255,0)", "rgba(255,255,255,0.5)", "rgba(255,255,255,0)"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={StyleSheet.absoluteFillObject}
                />
              </Animated.View>
            ) : null}
            {innerRow}
          </LinearGradient>
        ) : (
          <View
            style={[
              styles.surfaceShell,
              isPrimary ? styles.primarySolid : null,
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
      maxWidth: "100%",
      position: "relative",
    },
    pulseGlow: {
      position: "absolute",
      top: -5,
      left: -5,
      right: -5,
      bottom: -5,
      borderRadius: Platform.OS === "web" ? radius.pill : semanticRadius.control,
      ...Platform.select({
        web: { filter: "blur(8px)" },
        default: {},
      }),
      zIndex: -1,
    },
    peNone: {
      pointerEvents: "none",
    },
    press: {
      borderRadius: Platform.OS === "web" ? radius.pill : semanticRadius.control,
      overflow: "hidden",
      minHeight: t.height,
      minWidth: 0,
      ...Platform.select({
        web: {
          transition: "transform 0.2s ease, opacity 0.2s ease",
          cursor: "pointer",
        },
        default: {},
      }),
    },
    focused: {
      ...Platform.select({
        web: {
          boxShadow: `0 0 0 2px ${c.accent || c.primary}`,
          outlineWidth: 2,
          outlineColor: c.accent || c.primary,
          outlineStyle: "solid",
          outlineOffset: 2,
          borderRadius: 12,
        },
        default: {},
      }),
    },
    gradient: {
      borderRadius: Platform.OS === "web" ? radius.pill : semanticRadius.control,
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
          shadowOffset: { width: 0, height: 5 },
          shadowOpacity: isDark ? 0.2 : 0.12,
          shadowRadius: 8,
        },
        android: { elevation: 2 },
        web: {
          boxShadow: isDark
            ? "0 7px 14px rgba(0,0,0,0.24), inset 0 1px 0 rgba(255,255,255,0.12)"
            : "0 8px 16px rgba(15, 23, 42, 0.08), inset 0 1px 0 rgba(255,255,255,0.24)",
        },
        default: {},
      }),
    },
    surfaceShell: {
      borderRadius: Platform.OS === "web" ? radius.pill : semanticRadius.control,
      paddingVertical: t.padV,
      paddingHorizontal: t.padH,
      borderWidth: 1,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      ...Platform.select({
        web: {
          boxShadow: isDark
            ? "0 5px 12px rgba(0,0,0,0.14)"
            : "0 3px 8px rgba(15, 23, 42, 0.04)",
        },
        default: {},
      }),
    },
    primarySolid: {
      backgroundColor: isDark ? c.primary : c.primary,
      borderColor: isDark ? c.primaryDark : c.primaryDark,
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
            ? "0 5px 10px rgba(0,0,0,0.14), inset 0 1px 0 rgba(255, 255, 255, 0.04)"
            : "0 3px 8px rgba(15, 23, 42, 0.04), inset 0 1px 0 rgba(255,255,255,0.92)",
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
          boxShadow: "0 2px 6px rgba(15, 23, 42, 0.04)",
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
          transform: [{ translateY: -0.5 }],
        },
        default: {},
      }),
    },
    pressed: {
      opacity: 0.92,
      ...Platform.select({
        web: {
          filter: "brightness(0.92)",
          transform: [{ scale: 0.97 }],
        },
        default: { transform: [{ scale: 0.97 }] },
      }),
    },
    disabled: {
      opacity: 0.5,
      ...Platform.select({
        web: { cursor: "default" },
        default: {},
      }),
    },
    shineSweep: {
      position: "absolute",
      top: -10,
      bottom: -10,
      width: 80,
      zIndex: 2,
      pointerEvents: "none",
    },
  });
}

const PremiumButton = memo(PremiumButtonBase);

export default PremiumButton;
