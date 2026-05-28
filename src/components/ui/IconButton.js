import React, { memo } from "react";
import { Platform, Pressable, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../context/ThemeContext";
import { icon as iconTokens } from "../../theme/tokens";
import { WebNativeButton } from "./inputWebHelpers";

const SIZE_MAP = { sm: 40, md: 40, lg: 40 };

/**
 * Icon-only control (ghost hit target). Uses native `<button>` on web for reliable clicks.
 */
function IconButtonBase({
  name,
  onPress,
  accessibilityLabel,
  color,
  size = "md",
  iconSize,
  disabled = false,
  testID,
  style,
}) {
  const { semanticPalette } = useTheme();
  const hit = SIZE_MAP[size] || SIZE_MAP.md;
  const glyph = iconSize || (size === "lg" ? iconTokens.md : iconTokens.sm);
  const glyphColor = color || semanticPalette.inkSoft;
  const a11yLabel = accessibilityLabel || "Icon button";

  if (Platform.OS === "web") {
    return (
      <WebNativeButton
        onPress={onPress}
        disabled={disabled}
        testID={testID}
        ariaLabel={a11yLabel}
        style={{
          width: hit,
          height: hit,
          minHeight: hit,
          maxHeight: hit,
          padding: 0,
          border: "none",
          borderRadius: hit / 2,
          background: "transparent",
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          cursor: disabled ? "default" : "pointer",
          opacity: disabled ? 0.5 : 1,
          ...style,
        }}
      >
        <Ionicons name={name} size={glyph} color={glyphColor} />
      </WebNativeButton>
    );
  }

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      hitSlop={8}
      testID={testID}
      accessibilityRole="button"
      accessibilityLabel={a11yLabel}
      style={({ pressed, hovered }) => [
        styles.hit,
        { width: hit, height: hit, borderRadius: hit / 2 },
        hovered && Platform.OS === "web" ? { backgroundColor: semanticPalette.surfaceAlt } : null,
        pressed ? { opacity: 0.82 } : null,
        style,
      ]}
    >
      <Ionicons name={name} size={glyph} color={glyphColor} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  hit: {
    alignItems: "center",
    justifyContent: "center",
  },
});

const IconButton = memo(IconButtonBase);

export default IconButton;
