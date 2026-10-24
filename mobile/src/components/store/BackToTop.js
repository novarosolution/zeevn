import React, { useEffect } from "react";
import { StyleSheet, Text } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from "react-native-reanimated";
import { useStoreTheme } from "../../theme/storefront";
import { hapticTick } from "../../utils/haptics";
import Glass from "./Glass";
import PressableScale from "./PressableScale";

/** “↑ Back to top” — a small glass pill that floats under the pinned header. */
export default function BackToTop({ visible, onPress, top, label = "Back to top" }) {
  const { c, type } = useStoreTheme();
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
      >
        <Glass material="thin" radius={PILL_H / 2} lift style={styles.pill} contentStyle={styles.pillBody}>
          <Ionicons name="arrow-up" size={15} color={c.ink} />
          <Text style={type.ui(13.5, "bold", c.ink)}>{label}</Text>
        </Glass>
      </PressableScale>
    </Animated.View>
  );
}

const PILL_H = 38;

const styles = StyleSheet.create({
  wrap: { position: "absolute", left: 0, right: 0, alignItems: "center", zIndex: 40 },
  pill: { height: PILL_H },
  pillBody: { height: PILL_H, flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 15 },
});
