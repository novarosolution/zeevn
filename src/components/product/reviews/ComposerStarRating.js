import React, { memo, useEffect, useState } from "react";
import { Platform, Pressable, StyleSheet, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Animated, { Easing, useAnimatedStyle, useSharedValue, withRepeat, withSequence, withSpring, withTiming } from "react-native-reanimated";
import { useTheme } from "../../../context/ThemeContext";
import useReducedMotion from "../../../hooks/useReducedMotion";
import { hapticSelection } from "../../../utils/haptics";

function StarButton({ value, filled, preview, committed, onHover, onPress, accent, muted, reducedMotion }) {
  const scale = useSharedValue(1);
  const pulse = useSharedValue(1);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value * pulse.value }],
  }));

  const showFilled = filled || preview;

  useEffect(() => {
    if (reducedMotion || Platform.OS !== "web" || !preview || filled) {
      pulse.value = 1;
      return;
    }
    pulse.value = withRepeat(
      withSequence(withTiming(1.08, { duration: 400, easing: Easing.inOut(Easing.ease) }), withTiming(1, { duration: 400 })),
      -1,
      true
    );
  }, [filled, preview, pulse, reducedMotion]);

  const handlePress = () => {
    if (!reducedMotion) {
      scale.value = withSequence(withSpring(1.18, { damping: 10, stiffness: 360 }), withSpring(1, { damping: 12, stiffness: 300 }));
    }
    onPress(value);
  };

  return (
    <Pressable
      onPress={handlePress}
      onHoverIn={() => onHover(value)}
      onHoverOut={() => onHover(0)}
      hitSlop={10}
      accessibilityRole="button"
      accessibilityLabel={`${value} stars`}
    >
      <Animated.View style={animStyle}>
        <Ionicons
          name={showFilled ? "star" : "star-outline"}
          size={32}
          color={showFilled ? accent : muted}
          style={
            preview && !committed && Platform.OS === "web" && !reducedMotion
              ? { opacity: 0.92 }
              : undefined
          }
        />
      </Animated.View>
    </Pressable>
  );
}

function ComposerStarRatingBase({ rating, onChange }) {
  const { semanticPalette } = useTheme();
  const reducedMotion = useReducedMotion();
  const [hoverRating, setHoverRating] = useState(0);

  const handlePress = (value) => {
    hapticSelection();
    onChange?.(value);
  };

  return (
    <View style={styles.row}>
      {[1, 2, 3, 4, 5].map((value) => (
        <StarButton
          key={value}
          value={value}
          filled={value <= rating}
          preview={hoverRating > 0 && value <= hoverRating}
          committed={value <= rating}
          onHover={setHoverRating}
          onPress={handlePress}
          accent={semanticPalette.accent}
          muted={semanticPalette.inkMuted}
          reducedMotion={reducedMotion}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 8,
  },
});

const ComposerStarRating = memo(ComposerStarRatingBase);

export default ComposerStarRating;
