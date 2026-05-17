import React, { memo, useEffect } from "react";
import { Platform, Pressable, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Animated, { Easing, useAnimatedStyle, useSharedValue, withTiming } from "react-native-reanimated";
import { useTheme } from "../../context/ThemeContext";
import { PRODUCT_SCREEN } from "../../content/appContent";
import useReducedMotion from "../../hooks/useReducedMotion";

function GalleryScrollFabBase({ visible, bottomOffset = 96, onPress }) {
  const { semanticPalette } = useTheme();
  const reducedMotion = useReducedMotion();
  const shown = useSharedValue(visible ? 1 : 0);

  useEffect(() => {
    shown.value = withTiming(visible ? 1 : 0, {
      duration: reducedMotion ? 1 : 220,
      easing: Easing.out(Easing.cubic),
    });
  }, [reducedMotion, shown, visible]);

  const animStyle = useAnimatedStyle(() => ({
    opacity: shown.value,
    transform: [{ scale: 0.88 + shown.value * 0.12 }, { translateY: (1 - shown.value) * 12 }],
  }));

  return (
    <Animated.View
      pointerEvents={visible ? "auto" : "none"}
      style={[
        styles.wrap,
        {
          bottom: bottomOffset,
          backgroundColor: semanticPalette.accent,
          ...Platform.select({
            web: { boxShadow: "0 8px 24px rgba(14,23,41,0.2)" },
            ios: {
              shadowColor: "#0E1729",
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.22,
              shadowRadius: 10,
            },
            android: { elevation: 8 },
          }),
        },
        animStyle,
      ]}
    >
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [styles.hit, pressed ? { opacity: 0.9 } : null]}
        accessibilityRole="button"
        accessibilityLabel={PRODUCT_SCREEN.galleryFabA11y}
      >
        <Ionicons name="arrow-up" size={22} color={semanticPalette.ink} />
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: "absolute",
    right: 16,
    zIndex: 41,
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  hit: {
    width: "100%",
    height: "100%",
    alignItems: "center",
    justifyContent: "center",
  },
});

const GalleryScrollFab = memo(GalleryScrollFabBase);

export default GalleryScrollFab;
