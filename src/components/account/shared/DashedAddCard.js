import React, { memo } from "react";
import { Platform, Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../../context/ThemeContext";
import { fonts, icon } from "../../../theme/tokens";

function DashedAddCardBase({ label, onPress, accessibilityLabel, style }) {
  const { semanticPalette, TYPE, SPACING, RADII } = useTheme();

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel || label}
      style={({ pressed, hovered }) => [
        styles.wrap,
        {
          borderColor: semanticPalette.lineSoft,
          borderRadius: RADII.lg,
          backgroundColor: semanticPalette.surface,
        },
        hovered && Platform.OS === "web" ? { backgroundColor: semanticPalette.surfaceAlt } : null,
        pressed ? { opacity: 0.92 } : null,
        style,
      ]}
    >
      <Ionicons name="add-circle-outline" size={icon.lg} color={semanticPalette.accent} />
      <Text
        style={{
          marginTop: SPACING.sm,
          fontFamily: fonts.semibold,
          fontSize: TYPE.body.fontSize,
          color: semanticPalette.accent,
          letterSpacing: 0.3,
        }}
      >
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: {
    minHeight: 120,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 24,
    paddingHorizontal: 16,
    borderWidth: 1.5,
    borderStyle: "dashed",
    ...Platform.select({
      web: { cursor: "pointer" },
      default: {},
    }),
  },
});

const DashedAddCard = memo(DashedAddCardBase);
export default DashedAddCard;
