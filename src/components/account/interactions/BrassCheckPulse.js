import React, { useEffect } from "react";
import { StyleSheet, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import { useTheme } from "../../../context/ThemeContext";
import useReducedMotion from "../../../hooks/useReducedMotion";

/** Brief brass checkmark pulse after successful avatar upload. */
export default function BrassCheckPulse({ active, size = 96 }) {
  const { semanticPalette } = useTheme();
  const reducedMotion = useReducedMotion();
  const scale = useSharedValue(0.6);
  const opacity = useSharedValue(0);

  useEffect(() => {
    if (!active) {
      scale.value = 0.6;
      opacity.value = 0;
      return;
    }
    if (reducedMotion) {
      scale.value = 1;
      opacity.value = 1;
      return;
    }
    opacity.value = withSequence(
      withTiming(1, { duration: 120, easing: Easing.out(Easing.cubic) }),
      withTiming(1, { duration: 700 }),
      withTiming(0, { duration: 280 })
    );
    scale.value = withSequence(
      withTiming(1.12, { duration: 220, easing: Easing.out(Easing.back(1.4)) }),
      withTiming(1, { duration: 180 }),
      withTiming(0.92, { duration: 400 })
    );
  }, [active, opacity, reducedMotion, scale]);

  const animStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }],
  }));

  if (!active && reducedMotion) return null;

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        StyleSheet.absoluteFillObject,
        {
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "rgba(255,255,255,0.55)",
          borderRadius: size / 2,
        },
        animStyle,
      ]}
    >
      <View
        style={{
          width: 40,
          height: 40,
          borderRadius: 20,
          backgroundColor: semanticPalette.accentSoft,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Ionicons name="checkmark" size={26} color={semanticPalette.accent} />
      </View>
    </Animated.View>
  );
}
