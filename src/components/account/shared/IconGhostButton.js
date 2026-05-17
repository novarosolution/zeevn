import React, { memo } from "react";
import { Platform, Pressable, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../../context/ThemeContext";

const SIZE = 32;

function IconGhostButtonBase({ name, onPress, accessibilityLabel, color }) {
  const { semanticPalette } = useTheme();

  return (
    <Pressable
      onPress={onPress}
      hitSlop={8}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      style={({ pressed, hovered }) => [
        styles.hit,
        hovered && Platform.OS === "web" ? { backgroundColor: semanticPalette.surfaceAlt } : null,
        pressed ? { opacity: 0.82 } : null,
      ]}
    >
      <Ionicons name={name} size={18} color={color || semanticPalette.inkSoft} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  hit: {
    width: SIZE,
    height: SIZE,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: SIZE / 2,
    ...Platform.select({
      web: { cursor: "pointer" },
      default: {},
    }),
  },
});

const IconGhostButton = memo(IconGhostButtonBase);
export default IconGhostButton;
