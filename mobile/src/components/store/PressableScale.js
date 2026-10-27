import React, { useState } from "react";
import { Pressable, StyleSheet } from "react-native";
import Animated, { useAnimatedStyle, useReducedMotion, useSharedValue, withTiming } from "react-native-reanimated";
import { EASE_OUT, PRESS_SCALE, motionTiming } from "../../theme/motion";

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

/** A finger drifting a few points must not cancel a press the shopper meant. */
const RETENTION = { top: 14, left: 14, bottom: 14, right: 14 };
/** Reduce Motion keeps the feedback but drops the movement: a gentle dip in opacity instead of a scale. */
const REDUCED_DIP = 0.28;
/** Apple's minimum touch target. A smaller control keeps its look but grows its hit area up to this size. */
const MIN_TARGET = 44;
/** Most a control reaches past its own edge, so a short one never takes a tap meant for its neighbour. */
const MAX_REACH = { x: 5, y: 6 };

function reachFor(size, max) {
  return size > 0 && size < MIN_TARGET ? Math.min(max, Math.ceil((MIN_TARGET - size) / 2)) : 0;
}

/**
 * Pressable that answers the moment a finger lands: it scales down on press-in (ease-out, ~110 ms) and settles back on
 * release a touch slower. The press is one 0→1 progress value, so a quick tap that lifts mid-press reverses from where the
 * element is instead of jumping. `lite` uses shorter timings (Home rails mount dozens of these). A control smaller than
 * 44 pt gets the missing reach as invisible hit area; pass your own `hitSlop` to take over.
 */
export default function PressableScale({
  children,
  style,
  scaleTo = PRESS_SCALE,
  onPressIn,
  onPressOut,
  onLayout,
  hitSlop,
  disabled,
  lite = false,
  pressRetentionOffset = RETENTION,
  ...rest
}) {
  const reduced = useReducedMotion();
  const pressed = useSharedValue(0);
  // Whole points in state: a control that is already 44 pt or more keeps the initial 0, so it never renders twice.
  const [reachX, setReachX] = useState(0);
  const [reachY, setReachY] = useState(0);
  const autoSlop = reachX || reachY ? { top: reachY, bottom: reachY, left: reachX, right: reachX } : undefined;
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
      hitSlop={hitSlop ?? autoSlop}
      onLayout={(e) => {
        const { width, height } = e.nativeEvent.layout;
        setReachX(reachFor(width, MAX_REACH.x));
        setReachY(reachFor(height, MAX_REACH.y));
        onLayout?.(e);
      }}
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
