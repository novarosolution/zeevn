import { useCallback } from "react";
import {
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSequence,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import useReducedMotion from "./useReducedMotion";

/** Bounce + check flash for add-to-cart controls. */
export default function useAddToCartAnim() {
  const reducedMotion = useReducedMotion();
  const scale = useSharedValue(1);
  const flash = useSharedValue(0);

  const trigger = useCallback(() => {
    if (reducedMotion) return;
    scale.value = withSequence(
      withSpring(0.86, { damping: 14, stiffness: 420 }),
      withSpring(1.14, { damping: 9, stiffness: 340 }),
      withSpring(1, { damping: 13, stiffness: 260 })
    );
    flash.value = withSequence(
      withTiming(1, { duration: 90 }),
      withDelay(320, withTiming(0, { duration: 160 }))
    );
  }, [flash, reducedMotion, scale]);

  const scaleStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const flashStyle = useAnimatedStyle(() => ({
    opacity: flash.value,
    transform: [{ scale: 0.72 + flash.value * 0.28 }],
  }));

  return { trigger, scaleStyle, flashStyle, reducedMotion };
}
