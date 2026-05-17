import React, { memo, useEffect } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { useTheme } from "../../../context/ThemeContext";
import useReducedMotion from "../../../hooks/useReducedMotion";
import { hapticImpactLight } from "../../../utils/haptics";

const DOT_OFFSETS = [
  { x: 0, y: -12 },
  { x: 12, y: 0 },
  { x: 0, y: 12 },
  { x: -12, y: 0 },
];

function BurstDot({ offset, burst, color }) {
  const style = useAnimatedStyle(() => ({
    opacity: (1 - burst.value) * 0.85,
    transform: [
      { translateX: offset.x * burst.value },
      { translateY: offset.y * burst.value },
      { scale: 0.4 + (1 - burst.value) * 0.6 },
    ],
  }));

  return <Animated.View pointerEvents="none" style={[styles.dot, { backgroundColor: color }, style]} />;
}

function WishlistHeartButtonBase({ saved, onPress, accessibilityLabel }) {
  const { semanticPalette } = useTheme();
  const reducedMotion = useReducedMotion();
  const heartScale = useSharedValue(1);
  const burst = useSharedValue(0);

  useEffect(() => {
    if (!saved) return;
    heartScale.value = withSequence(
      withSpring(1.35, { damping: 12, stiffness: 320 }),
      withSpring(1, { damping: 14, stiffness: 280 })
    );
    if (!reducedMotion) {
      burst.value = 0;
      burst.value = withTiming(1, { duration: 400, easing: Easing.out(Easing.cubic) });
    }
  }, [burst, heartScale, reducedMotion, saved]);

  const heartStyle = useAnimatedStyle(() => ({
    transform: [{ scale: heartScale.value }],
  }));

  const handlePress = () => {
    hapticImpactLight();
    onPress?.();
  };

  return (
    <View style={styles.wrap}>
      {!reducedMotion
        ? DOT_OFFSETS.map((off, idx) => <BurstDot key={`dot-${idx}`} offset={off} burst={burst} color={semanticPalette.accent} />)
        : null}
      <Pressable onPress={handlePress} accessibilityRole="button" accessibilityLabel={accessibilityLabel} hitSlop={8}>
        <Animated.View style={heartStyle}>
          <Ionicons name={saved ? "heart" : "heart-outline"} size={18} color={saved ? semanticPalette.accent : semanticPalette.ink} />
        </Animated.View>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
  },
  dot: {
    position: "absolute",
    width: 4,
    height: 4,
    borderRadius: 2,
  },
});

const WishlistHeartButton = memo(WishlistHeartButtonBase);

export default WishlistHeartButton;
