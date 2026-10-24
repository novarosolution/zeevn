import React from "react";
import { StyleSheet, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, { Extrapolation, interpolate, useAnimatedStyle } from "react-native-reanimated";
import { useStoreTheme, withAlpha } from "../../theme/storefront";
import PressableScale from "./PressableScale";

/** Height of the bar below the status bar — screens add it (plus the top inset) to their scroll padding. */
export const SCREEN_HEADER_PAD = 64;

/**
 * Top bar for bag, checkout, orders, confirmation and product: a round back button, a small serif title and an optional
 * action, on a solid ivory bar that overlays the top of the screen (the screen's scroll view reserves the room).
 * Pass the scroll view's `scrollY` shared value and two things follow the scroll: a hairline fades in as the page slides
 * under the bar, and the small title appears only once the page's own big heading has scrolled away (no "Cart" above
 * "Your bag"). Without `scrollY` the title is always shown and `divider` pins the hairline on.
 */
export default function ScreenHeader({ title, onBack, backLabel = "Back", right, divider = false, scrollY }) {
  const { c, type, gutter, shadow } = useStoreTheme();
  const insets = useSafeAreaInsets();

  const lineStyle = useAnimatedStyle(() => ({
    opacity: scrollY ? interpolate(scrollY.value, [2, 26], [0, 1], Extrapolation.CLAMP) : divider ? 1 : 0,
  }));
  const titleStyle = useAnimatedStyle(() => {
    if (!scrollY) return { opacity: 1 };
    return {
      opacity: interpolate(scrollY.value, [30, 66], [0, 1], Extrapolation.CLAMP),
      transform: [{ translateY: interpolate(scrollY.value, [30, 66], [6, 0], Extrapolation.CLAMP) }],
    };
  });

  return (
    <View style={[styles.wrap, { paddingTop: insets.top + 6, backgroundColor: c.page }]} pointerEvents="box-none">
      <View style={[styles.row, { paddingHorizontal: gutter }]}>
        {onBack ? (
          <PressableScale
            onPress={onBack}
            scaleTo={0.92}
            accessibilityRole="button"
            accessibilityLabel={backLabel}
            style={[styles.round, shadow.soft, { backgroundColor: c.card, borderColor: c.line }]}
          >
            <Ionicons name="chevron-back" size={21} color={c.ink} />
          </PressableScale>
        ) : (
          <View style={styles.spacer} />
        )}
        <Animated.Text
          style={[type.display(20, { semi: true, ls: -0.3 }), styles.title, titleStyle]}
          numberOfLines={1}
          pointerEvents="none"
          accessibilityRole="header"
        >
          {title}
        </Animated.Text>
        <View style={styles.right}>{right || <View style={styles.spacer} />}</View>
      </View>
      <Animated.View pointerEvents="none" style={[styles.edge, lineStyle]}>
        <LinearGradient colors={[withAlpha(c.shadow, 0.07), withAlpha(c.shadow, 0)]} style={StyleSheet.absoluteFill} />
        <View style={[styles.hairline, { backgroundColor: c.line }]} />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { position: "absolute", top: 0, left: 0, right: 0, zIndex: 20, paddingBottom: 6 },
  row: { height: 52, flexDirection: "row", alignItems: "center", gap: 10 },
  title: { flex: 1, textAlign: "center" },
  right: { minWidth: 42, alignItems: "flex-end" },
  spacer: { width: 42, height: 42 },
  round: {
    width: 42,
    height: 42,
    borderRadius: 21,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: "center",
    justifyContent: "center",
  },
  edge: { position: "absolute", left: 0, right: 0, top: "100%", height: 12 },
  hairline: { position: "absolute", left: 0, right: 0, top: 0, height: StyleSheet.hairlineWidth },
});
