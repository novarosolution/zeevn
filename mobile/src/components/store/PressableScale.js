import React from "react";
import { Pressable, StyleSheet } from "react-native";
import Animated, { useAnimatedStyle, useReducedMotion, useSharedValue, withTiming } from "react-native-reanimated";
import { EASE_OUT, PRESS_SCALE, motionTiming } from "../../theme/motion";

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

/** A finger drifting a few points must not cancel a press the shopper meant. */
const RETENTION = { top: 14, left: 14, bottom: 14, right: 14 };
/** Reduce Motion keeps the feedback but drops the movement: a gentle dip in opacity instead of a scale. */
const REDUCED_DIP = 0.28;

/**
 * Pressable that answers the moment a finger lands: it scales down on press-in (ease-out, ~110 ms) and settles back on
 * release a touch slower. The press is one 0→1 progress value, so a quick tap that lifts mid-press reverses from where the
 * element is instead of jumping. `lite` uses shorter timings (Home rails mount dozens of these).
 */
export default function PressableScale({
  children,
  style,
  scaleTo = PRESS_SCALE,
  onPressIn,
  onPressOut,
  disabled,
  lite = false,
  pressRetentionOffset = RETENTION,
  ...rest
}) {
  const reduced = useReducedMotion();
  const pressed = useSharedValue(0);
  // A caller's own opacity (a dimmed, disabled control) must survive the reduced-motion dip.
  const baseOpacity = reduced ? StyleSheet.flatten(style)?.opacity ?? 1 : 1;

  const animatedStyle = useAnimatedStyle(() => {
    if (reduced) return { opacity: baseOpacity * (1 - REDUCED_DIP * pressed.value) };
    return { transform: [{ scale: 1 - (1 - scaleTo) * pressed.value }] };
  });

  return (
    <AnimatedPressable
      {...rest}
      disabled={disabled}
      pressRetentionOffset={pressRetentionOffset}
      onPressIn={(e) => {
        pressed.value = withTiming(1, { duration: lite ? 90 : motionTiming.press, easing: EASE_OUT });
        onPressIn?.(e);
      }}
      onPressOut={(e) => {
        pressed.value = withTiming(0, { duration: lite ? 120 : motionTiming.release, easing: EASE_OUT });
        onPressOut?.(e);
      }}
      style={[style, animatedStyle]}
    >
      {children}
    </AnimatedPressable>
  );
}
