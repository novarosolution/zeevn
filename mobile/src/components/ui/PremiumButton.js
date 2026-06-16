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
import { ALCHEMY } from "../../theme/customerAlchemy";
import { KANKREG_PALETTE } from "../../theme/kankregWeb";
import { useTheme } from "../../context/ThemeContext";
import useReducedMotion from "../../hooks/useReducedMotion";
import { platformShadow } from "../../theme/shadowPlatform";

const SIZE_TOKENS = {
  sm: { padV: 8, padH: 14, fs: typography.caption, gap: 6, iconSize: icon.xs, height: 36 },
  md: { padV: 11, padH: 18, fs: typography.bodySmall, gap: 8, iconSize: icon.sm, height: 44 },
  lg: { padV: 13, padH: 22, fs: typography.body, gap: 9, iconSize: icon.md, height: 50 },
  xl: { padV: 16, padH: 28, fs: typography.body + 1, gap: 10, iconSize: icon.md, height: 58 },
};

/**
 * Premium drop-in button used across customer screens.
 *
 *   variants: primary | gold | secondary | ghost | outline | danger | subtle
 *   sizes:    sm | md | lg | xl
 */
function PremiumButtonBase({
  label,
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
  const isGold = variant === "gold";
  const isSecondary = variant === "secondary";
  const isGhost = variant === "ghost";
  const isOutline = variant === "outline";
  const isDanger = variant === "danger";
  const isSubtle = variant === "subtle";
  const isFilled = isPrimary || isGold || isSecondary || isDanger;

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

  const onPrimaryColor = "#FFFCF8";
  const variantTextColor =
    isGhost || isOutline
      ? isDark ? ALCHEMY.goldBright : ALCHEMY.brownInk
      : isSubtle
        ? c.textPrimary
        : isSecondary
          ? c.onSecondary
          : onPrimaryColor;

  const gradientColors = useMemo(() => {
    if (disabled || loading) return ["#9CA3AF", "#6B7280", "#4B5563"];
    if (isDanger) return ["#c45a45", KANKREG_PALETTE.danger, "#7a3325"];
    if (isSecondary)
      return isDark
        ? [c.secondaryBright, c.secondary, c.secondaryDark]
        : [c.secondary, c.secondary, c.secondaryDark];
    if (isGold || isPrimary)
      return isDark
        ? [c.primaryBright, c.primary, c.primaryDark]
        : [c.primaryBright, c.primary, c.primaryDark];
    return [ALCHEMY.goldBright, ALCHEMY.gold, ALCHEMY.greenDeep];
  }, [disabled, loading, isDanger, isSecondary, isGold, isPrimary, isDark, c.secondary, c.secondaryDark, c.secondaryBright]);

  const textNode = label != null
    ? <Text style={[styles.text, { color: variantTextColor }, textStyle]} numberOfLines={1}>{label}</Text>
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
        ? "rgba(110, 231, 183, 0.45)"
        : "rgba(34, 197, 94, 0.4)"
      : isDark
        ? "rgba(52, 211, 153, 0.5)"
        : "rgba(31, 92, 71, 0.45)";

  return (
    <Animated.View style={[styles.outer, motionStyle, style]}>
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
        accessibilityLabel={accessibilityLabel || (typeof label === "string" ? label : undefined)}
        accessibilityHint={accessibilityHint}
        accessibilityState={{ disabled: disabled || loading, busy: loading }}
        testID={testID}
        style={({ pressed, hovered }) => [
          styles.press,
          isGhost ? styles.ghost : null,
          isOutline ? styles.outline : null,
          isSubtle ? styles.subtle : null,
          isSecondary && Platform.OS !== "web" ? styles.secondaryNative : null,
          disabled || loading ? styles.disabled : null,
          hovered && Platform.OS === "web" && !disabled && !loading ? styles.hover : null,
          pressed ? styles.pressed : null,
        ]}
      >
        {isFilled ? (
          <LinearGradient
            colors={gradientColors}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.gradient}
          >
            {innerRow}
          </LinearGradient>
        ) : (
          innerRow
        )}
      </Pressable>
    </Animated.View>
  );
}

function createStyles(c, isDark, t, fullWidth) {
  const gradientShadow = platformShadow({
    ios: {
      shadowColor: "#1a1208",
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.24,
      shadowRadius: 14,
    },
    android: { elevation: 4 },
    web: {
      boxShadow: "0 14px 28px rgba(22, 69, 51, 0.28), inset 0 1px 0 rgba(255,255,255,0.18)",
    },
  });

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
      overflow: "hidden",
      minHeight: t.height,
      ...Platform.select({
        web: {
          transition: "transform 0.18s ease, box-shadow 0.18s ease, background-color 0.18s ease, border-color 0.18s ease",
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
      borderColor: "rgba(255, 252, 248, 0.32)",
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      ...gradientShadow,
    },
    secondaryNative: {
      backgroundColor: c.secondary,
    },
    ghost: {
      borderRadius: radius.pill,
      paddingVertical: t.padV,
      paddingHorizontal: t.padH,
      borderWidth: 1,
      borderColor: isDark ? "rgba(52, 211, 153, 0.4)" : "rgba(31, 92, 71, 0.35)",
      backgroundColor: isDark ? "rgba(31, 92, 71, 0.14)" : "rgba(31, 92, 71, 0.08)",
      ...Platform.select({
        web: {
          boxShadow: isDark
            ? "0 6px 14px rgba(0,0,0,0.32), inset 0 1px 0 rgba(52, 211, 153, 0.14)"
            : "0 6px 14px rgba(22, 69, 51, 0.08), inset 0 1px 0 rgba(255,255,255,0.92)",
        },
        default: {},
      }),
    },
    outline: {
      borderRadius: radius.pill,
      paddingVertical: t.padV,
      paddingHorizontal: t.padH,
      borderWidth: 1.5,
      borderColor: isDark ? "rgba(52, 211, 153, 0.55)" : ALCHEMY.lineStrong,
      backgroundColor: isDark ? "rgba(255,255,255,0.04)" : "#fffdf9",
      ...Platform.select({
        web: {
          boxShadow: "0 4px 12px rgba(22, 69, 51, 0.06), inset 0 1px 0 rgba(255,255,255,0.95)",
        },
        default: {},
      }),
    },
    subtle: {
      borderRadius: radius.pill,
      paddingVertical: t.padV,
      paddingHorizontal: t.padH,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: c.border,
      backgroundColor: c.surfaceMuted,
      ...Platform.select({
        web: {
          boxShadow: "0 6px 14px rgba(28, 25, 23, 0.07)",
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
      fontFamily: fonts.extrabold,
      fontSize: t.fs,
      letterSpacing: 0.4,
    },
    hover: {
      ...Platform.select({
        web: {
          boxShadow: "0 20px 36px rgba(22, 69, 51, 0.34), inset 0 1px 0 rgba(255,255,255,0.22)",
        },
        default: {},
      }),
    },
    pressed: {
      opacity: 0.94,
    },
    disabled: {
      opacity: 0.6,
    },
  });
}

const PremiumButton = memo(PremiumButtonBase);

export default PremiumButton;
