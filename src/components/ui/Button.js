import React, { memo, useEffect, useMemo, useState } from "react";
import { Platform, Pressable, StyleSheet, Text, View } from "react-native";
import * as Haptics from "expo-haptics";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { fonts } from "../../theme/tokens";
import { useTheme } from "../../context/ThemeContext";
import useReducedMotion from "../../hooks/useReducedMotion";
import ProgressRing from "./ProgressRing";
import { flattenStyleForDom, WebNativeButton } from "./inputWebHelpers";
import { splitWebButtonLayoutStyle, WEB_BUTTON_SIZES } from "./webButtonLayout";

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

/**
 * Design-system button: pill, ink primary, sale destructive, light haptic on iOS.
 * @param {'default' | 'authSocial'} interactionProfile — auth OAuth press/hover feedback
 */
function ButtonBase({
  label,
  title,
  children,
  onPress,
  variant = "primary",
  size = "md",
  loading = false,
  disabled = false,
  loadingLabel = "Please wait",
  iconLeft,
  iconRight,
  fullWidth = false,
  style,
  textStyle,
  accessibilityLabel,
  accessibilityHint,
  testID,
  interactionProfile = "default",
}) {
  const { semanticPalette, RADII, TYPE } = useTheme();
  const reducedMotion = useReducedMotion();
  const [hovered, setHovered] = useState(false);
  const scale = useSharedValue(1);
  const contentOpacity = useSharedValue(1);

  const tokens = SIZE_TOKENS[size] || SIZE_TOKENS.md;
  const resolvedLabel = label ?? title;
  const isAuthSocial = interactionProfile === "authSocial" && variant === "secondary";
  const displayText = loading ? loadingLabel : resolvedLabel;

  const palette = useMemo(() => {
    const ink = semanticPalette.ink;
    const surface = semanticPalette.surface;
    const line = semanticPalette.line;
    const sale = semanticPalette.sale;
    const inverse = semanticPalette.inkInverse;
    if (variant === "destructive") {
      return { bg: sale, border: sale, color: inverse };
    }
    if (variant === "secondary") {
      return { bg: surface, border: line, color: ink };
    }
    if (variant === "ghost") {
      return { bg: semanticPalette.surfaceAlt, border: line, color: ink };
    }
    if (variant === "accent") {
      return { bg: semanticPalette.accent, border: semanticPalette.accent, color: ink };
    }
    return { bg: ink, border: ink, color: inverse };
  }, [semanticPalette, variant]);

  useEffect(() => {
    if (reducedMotion) {
      contentOpacity.value = 1;
      return;
    }
    contentOpacity.value = withTiming(loading ? 0.92 : 1, { duration: 120 });
  }, [contentOpacity, loading, reducedMotion]);

  const styles = useMemo(
    () =>
      StyleSheet.create({
        outer: {
          ...(fullWidth ? { width: "100%", alignSelf: "stretch" } : { alignSelf: "flex-start" }),
          maxWidth: "100%",
          borderRadius: RADII.pill,
          overflow: "hidden",
        },
        press: {
          borderRadius: RADII.pill,
          borderWidth: 1,
          borderColor: isAuthSocial && hovered ? `rgba(14, 23, 41, 0.3)` : palette.border,
          backgroundColor: isAuthSocial && hovered ? semanticPalette.surfaceAlt : palette.bg,
          paddingVertical: tokens.padV,
          paddingHorizontal: tokens.padH,
          minHeight: tokens.minHeight,
          alignItems: "center",
          justifyContent: "center",
          flexDirection: "row",
          alignSelf: fullWidth && Platform.OS !== "web" ? "stretch" : "flex-start",
          opacity: disabled ? 0.5 : 1,
          ...Platform.select({
            web: {
              cursor: disabled || loading ? "default" : "pointer",
              transition:
                "opacity 0.18s ease, background-color 0.12s ease, border-color 0.12s ease, transform 0.12s ease",
            },
            default: {},
          }),
        },
        row: {
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
          gap: tokens.gap,
          flexShrink: 1,
        },
        label: {
          fontFamily: fonts.semibold,
          fontSize: TYPE.body.fontSize,
          lineHeight: TYPE.body.lineHeight,
          letterSpacing: 0.8,
          color: palette.color,
          textAlign: "center",
          flexShrink: 1,
        },
      }),
    [
      RADII.pill,
      TYPE.body.fontSize,
      TYPE.body.lineHeight,
      disabled,
      fullWidth,
      hovered,
      isAuthSocial,
      palette,
      semanticPalette.surfaceAlt,
      tokens,
    ]
  );

  const motionStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const contentStyle = useAnimatedStyle(() => ({
    opacity: contentOpacity.value,
  }));

  const triggerHaptic = () => {
    if (Platform.OS !== "ios" || disabled || loading) return;
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {
      /* noop */
    }
  };

  const handlePressIn = () => {
    if (!isAuthSocial) triggerHaptic();
    if (disabled || loading) return;
    if (reducedMotion) return;
    if (isAuthSocial) {
      scale.value = withTiming(0.97, { duration: 120 });
      return;
    }
    scale.value = withSpring(0.97, { damping: 16, stiffness: 420 });
  };

  const handlePressOut = () => {
    if (reducedMotion) {
      scale.value = 1;
      return;
    }
    scale.value = isAuthSocial
      ? withTiming(1, { duration: 120 })
      : withSpring(1, { damping: 16, stiffness: 420 });
  };

  const a11yLabel =
    accessibilityLabel ||
    (typeof displayText === "string" ? displayText : undefined) ||
    (typeof resolvedLabel === "string" ? resolvedLabel : undefined);

  if (Platform.OS === "web") {
    const isDisabled = disabled || loading;
    const { outer: layoutStyle, press: pressStyle } = splitWebButtonLayoutStyle(style);
    return (
      <WebNativeButton
        onPress={onPress}
        disabled={isDisabled}
        loading={loading}
        testID={testID}
        ariaLabel={a11yLabel}
        fullWidth={fullWidth}
        minHeight={tokens.minHeight}
        borderRadius={RADII.pill}
        style={[layoutStyle, styles.press, pressStyle]}
        contentStyle={flattenStyleForDom([styles.row, { gap: tokens.gap }])}
      >
        {loading ? <ProgressRing size="sm" spinning reducedMotion={reducedMotion} accessible={false} /> : iconLeft}
        {resolvedLabel != null || loading ? (
          <span
            style={flattenStyleForDom([
              styles.label,
              textStyle,
              { whiteSpace: "nowrap", textOverflow: "ellipsis", overflow: "hidden" },
            ])}
          >
            {displayText}
          </span>
        ) : (
          children
        )}
        {!loading ? iconRight : null}
      </WebNativeButton>
    );
  }

  return (
    <Animated.View style={[styles.outer, motionStyle, style]}>
      <AnimatedPressable
        onPress={disabled || loading ? undefined : onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onHoverIn={() => Platform.OS === "web" && isAuthSocial && setHovered(true)}
        onHoverOut={() => Platform.OS === "web" && isAuthSocial && setHovered(false)}
        disabled={disabled || loading}
        accessibilityRole="button"
        accessibilityLabel={a11yLabel}
        accessibilityHint={accessibilityHint}
        accessibilityState={{ disabled: disabled || loading, busy: loading }}
        testID={testID}
        style={styles.press}
      >
        <Animated.View style={[styles.row, contentStyle]}>
          {loading ? <ProgressRing size="sm" spinning reducedMotion={reducedMotion} accessible={false} /> : iconLeft}
          {resolvedLabel != null || loading ? (
            <Text style={[styles.label, textStyle]} numberOfLines={2}>
              {displayText}
            </Text>
          ) : (
            children
          )}
          {!loading ? iconRight : null}
        </Animated.View>
      </AnimatedPressable>
    </Animated.View>
  );
}

const SIZE_TOKENS = WEB_BUTTON_SIZES;

const Button = memo(ButtonBase);

export default Button;
