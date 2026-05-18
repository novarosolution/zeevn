import React, { useEffect } from "react";
import { Platform, Pressable, StyleSheet, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { useTheme } from "../../context/ThemeContext";
import useReducedMotion from "../../hooks/useReducedMotion";
import { hapticToggle } from "../../utils/accountHaptics";
import { platformShadow } from "../../theme/shadowPlatform";

const TRACK_W = 44;
const TRACK_H = 24;
const THUMB = 20;
const TRAVEL = TRACK_W - THUMB - 4;

/**
 * Custom account toggle — brass track when on; locked state for required prefs.
 */
export default function Switch({ value, onValueChange, disabled = false, locked = false }) {
  const { semanticPalette } = useTheme();
  const reducedMotion = useReducedMotion();
  const thumbX = useSharedValue(value ? TRAVEL : 0);
  const trackColor = useSharedValue(0);

  useEffect(() => {
    thumbX.value = reducedMotion
      ? value
        ? TRAVEL
        : 0
      : withSpring(value ? TRAVEL : 0, { damping: 18, stiffness: 220 });
    trackColor.value = reducedMotion
      ? value
        ? 1
        : 0
      : withTiming(value ? 1 : 0, { duration: 220, easing: Easing.inOut(Easing.ease) });
  }, [reducedMotion, thumbX, trackColor, value]);

  const thumbStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: thumbX.value }],
  }));

  const trackStyle = useAnimatedStyle(() => ({
    backgroundColor: trackColor.value > 0.5 ? semanticPalette.accent : semanticPalette.lineSoft,
  }));

  const handlePress = () => {
    if (disabled || locked) return;
    hapticToggle();
    onValueChange?.(!value);
  };

  return (
    <Pressable
      onPress={handlePress}
      disabled={disabled || locked}
      accessibilityRole="switch"
      accessibilityState={{ checked: value, disabled: disabled || locked }}
      hitSlop={8}
      style={({ pressed }) => [
        styles.hit,
        { opacity: locked ? 0.7 : pressed ? 0.88 : 1 },
        Platform.OS === "web" && !locked ? { cursor: disabled ? "not-allowed" : "pointer" } : null,
      ]}
    >
      <Animated.View style={[styles.track, trackStyle]}>
        {locked ? (
          <View style={styles.lockOverlay} pointerEvents="none">
            <Ionicons name="lock-closed" size={10} color={semanticPalette.inkMuted} />
          </View>
        ) : null}
        <Animated.View
          style={[
            styles.thumb,
            { backgroundColor: semanticPalette.surface, ...platformShadow({ elevation: 2, opacity: 0.12 }) },
            thumbStyle,
          ]}
        />
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  hit: {
    padding: 2,
  },
  track: {
    width: TRACK_W,
    height: TRACK_H,
    borderRadius: TRACK_H / 2,
    justifyContent: "center",
    paddingHorizontal: 2,
  },
  thumb: {
    width: THUMB,
    height: THUMB,
    borderRadius: THUMB / 2,
  },
  lockOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: TRACK_H / 2,
  },
});
