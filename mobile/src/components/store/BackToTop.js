import React, { useEffect } from "react";
import { StyleSheet, Text } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from "react-native-reanimated";
import { useStoreTheme } from "../../theme/storefront";
import { hapticTick } from "../../utils/haptics";
import PressableScale from "./PressableScale";
/** “↑ Back to top” solid pill. */
export default function BackToTop({ visible, onPress, top, label = "Back to top" }) {
  const { c, type, shadow } = useStoreTheme();
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
      <PressableScale scaleTo={0.96} lite
        onPress={() => {
          hapticTick();
          onPress?.();
        }}
        accessibilityRole="button"
        accessibilityLabel={label}
        style={[
          styles.pill,
          shadow.lift,
          { backgroundColor: c.card, borderColor: c.line },
        ]}
      >
        <Ionicons name="arrow-up-circle-outline" size={20} color={c.ink} />
        <Text style={type.ui(14, "bold", c.ink)}>{label}</Text>
      </PressableScale>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: { position: "absolute", left: 0, right: 0, alignItems: "center", zIndex: 40 },
  pill: {
    height: 44,
    borderRadius: 22,
    borderWidth: StyleSheet.hairlineWidth,
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    paddingHorizontal: 16,
  },
});
