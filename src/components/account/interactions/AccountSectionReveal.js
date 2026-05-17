import React, { useEffect } from "react";
import { View } from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import useReducedMotion from "../../../hooks/useReducedMotion";

/**
 * Desktop account section transitions — fade + lift between sidebar nav changes.
 */
export default function AccountSectionReveal({ sectionKey, enabled, children }) {
  const reducedMotion = useReducedMotion();
  const opacity = useSharedValue(1);
  const translateY = useSharedValue(0);

  useEffect(() => {
    if (!enabled || reducedMotion) {
      opacity.value = 1;
      translateY.value = 0;
      return;
    }
    opacity.value = 0;
    translateY.value = 8;
    opacity.value = withTiming(1, { duration: 220, easing: Easing.out(Easing.cubic) });
    translateY.value = withTiming(0, { duration: 220, easing: Easing.out(Easing.cubic) });
  }, [enabled, opacity, reducedMotion, sectionKey, translateY]);

  const animStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  if (!enabled || reducedMotion) {
    return <View style={{ flex: 1, minWidth: 0, width: "100%" }}>{children}</View>;
  }

  return (
    <Animated.View key={sectionKey} style={[{ flex: 1, minWidth: 0, width: "100%" }, animStyle]}>
      {children}
    </Animated.View>
  );
}
