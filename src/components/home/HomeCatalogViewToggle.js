import React, { useEffect } from "react";
import { Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Animated, {
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";

function CatalogViewToggleButton({
  isActive,
  onPress,
  onHoverIn,
  onHoverOut,
  accessibilityLabel,
  iconName,
  styles,
  iconSize,
  c,
}) {
  const progress = useSharedValue(isActive ? 1 : 0);

  useEffect(() => {
    progress.value = withTiming(isActive ? 1 : 0, { duration: 180 });
  }, [isActive, progress]);

  const animatedButtonStyle = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(progress.value, [0, 1], [c.surface, c.textPrimary]),
    borderColor: interpolateColor(progress.value, [0, 1], [c.border, c.textPrimary]),
  }));

  const activeIconStyle = useAnimatedStyle(() => ({
    opacity: progress.value,
  }));

  const inactiveIconStyle = useAnimatedStyle(() => ({
    opacity: 1 - progress.value,
  }));

  return (
    <Pressable
      onPress={onPress}
      onHoverIn={onHoverIn}
      onHoverOut={onHoverOut}
      style={({ pressed }) => [styles.catalogViewToggleBtnTouch, pressed ? styles.catalogViewToggleBtnPressed : null]}
      accessibilityRole="button"
      accessibilityState={{ selected: isActive }}
      accessibilityLabel={accessibilityLabel}
    >
      <Animated.View style={[styles.catalogViewToggleBtn, animatedButtonStyle]}>
        <Animated.View style={[styles.catalogViewToggleIconLayer, inactiveIconStyle]}>
          <Ionicons name={iconName} size={iconSize} color={c.textSecondary} />
        </Animated.View>
        <Animated.View style={[styles.catalogViewToggleIconLayer, activeIconStyle]}>
          <Ionicons name={iconName} size={iconSize} color={c.onPrimary} />
        </Animated.View>
      </Animated.View>
    </Pressable>
  );
}

export default CatalogViewToggleButton;
