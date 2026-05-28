import React, { memo, useMemo } from "react";
import { Pressable, StyleSheet, useWindowDimensions, View } from "react-native";
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from "react-native-reanimated";
import { useTheme } from "../../context/ThemeContext";
import useReducedMotion from "../../hooks/useReducedMotion";

/**
 * Design-system card: surface + hairline border + md radius + soft shadow.
 * Pressable variant scales to 0.98 on press. Padding 16 / 20 responsive.
 */
function CardBase({
  children,
  onPress,
  style,
  contentStyle,
  overlay,
  disabled = false,
  padding,
  accessibilityLabel,
  accessibilityRole,
  testID,
}) {
  const { width } = useWindowDimensions();
  const { semanticPalette, RADII, SHADOWS, SPACING } = useTheme();
  const reducedMotion = useReducedMotion();

  const comfortPad = width >= 768 ? SPACING.base : SPACING.md;
  const resolvedPad = typeof padding === "number" ? padding : padding === "none" ? 0 : comfortPad;

  const scale = useSharedValue(1);
  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const isPressable = Boolean(onPress);

  const shellStyle = useMemo(
    () => ({
      borderRadius: RADII.md,
      backgroundColor: semanticPalette.surface,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: semanticPalette.lineSoft,
      ...SHADOWS.soft,
      overflow: "hidden",
      position: "relative",
    }),
    [RADII.md, SHADOWS, semanticPalette.lineSoft, semanticPalette.surface]
  );

  const handleIn = () => {
    if (!isPressable || reducedMotion || disabled) return;
    scale.value = withSpring(0.98, { damping: 18, stiffness: 380 });
  };
  const handleOut = () => {
    if (!isPressable || reducedMotion) return;
    scale.value = withSpring(1, { damping: 18, stiffness: 380 });
  };

  const inner = (
    <>
      {overlay ? (
        <View
          style={[StyleSheet.absoluteFillObject, { borderRadius: RADII.md, pointerEvents: "none" }]}
        >
          {overlay}
        </View>
      ) : null}
      <View style={[{ padding: resolvedPad, width: "100%" }, contentStyle]}>{children}</View>
    </>
  );

  if (isPressable) {
    return (
      <Animated.View style={[animStyle, { width: "100%" }]}>
        <Pressable
          testID={testID}
          onPress={disabled ? undefined : onPress}
          onPressIn={handleIn}
          onPressOut={handleOut}
          disabled={disabled}
          accessibilityRole={accessibilityRole || "button"}
          accessibilityLabel={accessibilityLabel}
          accessibilityState={{ disabled }}
          style={[shellStyle, disabled ? { opacity: 0.55 } : null, style]}
        >
          {inner}
        </Pressable>
      </Animated.View>
    );
  }

  return (
    <View style={[shellStyle, { width: "100%" }, style]} testID={testID} accessibilityLabel={accessibilityLabel}>
      {inner}
    </View>
  );
}

const Card = memo(CardBase);

export default Card;
