import React, { useEffect } from "react";
import { Platform, Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { useTheme } from "../../../context/ThemeContext";
import useReducedMotion from "../../../hooks/useReducedMotion";
import { fonts } from "../../../theme/tokens";

export default function AccountSidebarNavItem({ item, active, hovered, onPress, onHoverIn, onHoverOut }) {
  const { semanticPalette } = useTheme();
  const reducedMotion = useReducedMotion();
  const borderHeight = useSharedValue(active ? 40 : 0);
  const bgProgress = useSharedValue(active ? 1 : 0);

  useEffect(() => {
    const duration = reducedMotion ? 0 : 220;
    borderHeight.value = withTiming(active ? 40 : 0, { duration, easing: Easing.out(Easing.ease) });
    bgProgress.value = withTiming(active ? 1 : 0, { duration, easing: Easing.out(Easing.ease) });
  }, [active, bgProgress, borderHeight, reducedMotion]);

  const borderStyle = useAnimatedStyle(() => ({
    height: borderHeight.value,
    opacity: borderHeight.value > 0 ? 1 : 0,
  }));

  const bgStyle = useAnimatedStyle(() => ({
    opacity: bgProgress.value,
  }));

  const iconColor = active || hovered ? semanticPalette.ink : semanticPalette.inkSoft;

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="link"
      accessibilityState={active ? { selected: true } : undefined}
      aria-current={Platform.OS === "web" && active ? "page" : undefined}
      onHoverIn={onHoverIn}
      onHoverOut={onHoverOut}
      style={({ pressed }) => [
        styles.row,
        hovered && !active ? { backgroundColor: semanticPalette.surfaceAlt } : null,
        pressed ? { opacity: 0.9 } : null,
        Platform.OS === "web" ? { cursor: "pointer" } : null,
      ]}
    >
      <Animated.View
        style={[
          styles.border,
          { backgroundColor: semanticPalette.accent },
          borderStyle,
        ]}
      />
      <Animated.View
        pointerEvents="none"
        style={[StyleSheet.absoluteFillObject, { backgroundColor: semanticPalette.surfaceAlt, borderRadius: 0 }, bgStyle]}
      />
      <Ionicons name={item.icon} size={18} color={iconColor} style={styles.icon} />
      <Text
        style={[
          styles.label,
          { color: active ? semanticPalette.ink : semanticPalette.inkSoft },
          active ? styles.labelActive : null,
        ]}
      >
        {item.label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    height: 40,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 14,
    marginBottom: 4,
    overflow: "hidden",
    position: "relative",
  },
  border: {
    position: "absolute",
    left: 0,
    top: 0,
    width: 3,
  },
  icon: {
    zIndex: 1,
  },
  label: {
    flex: 1,
    fontFamily: fonts.medium,
    fontSize: 14,
    lineHeight: 20,
    zIndex: 1,
  },
  labelActive: {
    fontFamily: fonts.semibold,
    fontWeight: "600",
  },
});
