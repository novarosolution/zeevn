import React, { useEffect } from "react";
import { View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Animated, { useAnimatedStyle, useSharedValue, withSequence, withSpring } from "react-native-reanimated";
import { useTheme } from "../../context/ThemeContext";
import useReducedMotion from "../../hooks/useReducedMotion";

/**
 * Brass circle + icon with success entrance spring (register / forgot).
 */
export default function AuthBrassIconEntrance({ name = "mail", size = 48, trigger = 1 }) {
  const { semanticPalette } = useTheme();
  const reducedMotion = useReducedMotion();
  const scale = useSharedValue(reducedMotion ? 1 : 0);

  useEffect(() => {
    if (reducedMotion) {
      scale.value = 1;
      return;
    }
    scale.value = 0;
    scale.value = withSequence(
      withSpring(1.15, { damping: 12, stiffness: 280, mass: 0.85 }),
      withSpring(1, { damping: 14, stiffness: 320, mass: 0.9 })
    );
  }, [reducedMotion, scale, trigger]);

  const iconStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View style={iconStyle}>
      <View
        style={{
          width: 88,
          height: 88,
          borderRadius: 44,
          backgroundColor: semanticPalette.accentSoft,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Ionicons name={name} size={size} color={semanticPalette.accent} />
      </View>
    </Animated.View>
  );
}
