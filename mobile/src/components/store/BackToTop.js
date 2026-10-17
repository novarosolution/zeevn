import React, { useEffect } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { BlurView } from "expo-blur";
import { Ionicons } from "@expo/vector-icons";
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from "react-native-reanimated";
import { useStoreTheme } from "../../theme/storefront";
import { hapticTick } from "../../utils/haptics";

/** “↑ Back to top” pill that springs in below the pinned header once you've scrolled a while. */
export default function BackToTop({ visible, onPress, top, label = "Back to top" }) {
  const { c, type, shadow, isDark } = useStoreTheme();
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withSpring(visible ? 1 : 0, { damping: 16, stiffness: 200 });
  }, [visible, progress]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: progress.value,
    transform: [{ translateY: (1 - progress.value) * -14 }, { scale: 0.92 + progress.value * 0.08 }],
  }));

  return (
    <Animated.View style={[styles.wrap, { top }, animatedStyle]} pointerEvents={visible ? "box-none" : "none"}>
      <Pressable
        onPress={() => {
          hapticTick();
          onPress?.();
        }}
        accessibilityRole="button"
        accessibilityLabel={label}
        style={[styles.shadow, shadow.lift]}
      >
        <View style={[styles.pill, { borderColor: c.line }]}>
          <BlurView intensity={isDark ? 40 : 70} tint={isDark ? "dark" : "light"} style={StyleSheet.absoluteFill} />
          <View style={[StyleSheet.absoluteFill, { backgroundColor: c.glass }]} />
          <Ionicons name="arrow-up-circle-outline" size={20} color={c.ink} />
          <Text style={type.ui(14, "bold", c.ink)}>{label}</Text>
        </View>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: { position: "absolute", left: 0, right: 0, alignItems: "center", zIndex: 40 },
  shadow: { borderRadius: 22 },
  pill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    height: 44,
    paddingHorizontal: 16,
    borderRadius: 22,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: "hidden",
  },
});
