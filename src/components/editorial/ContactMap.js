import React from "react";
import { Linking, Pressable, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../context/ThemeContext";
import { fonts, icon } from "../../theme/tokens";

/**
 * Map placeholder on native — opens maps app on tap.
 */
export default function ContactMap({ mapsUrl, label, style }) {
  const { semanticPalette, TYPE, SPACING, RADII } = useTheme();

  if (!mapsUrl) return null;

  return (
    <Pressable
      onPress={() => void Linking.openURL(mapsUrl)}
      accessibilityRole="button"
      accessibilityLabel={label || "Open location in maps"}
      style={({ pressed }) => [
        {
          borderRadius: RADII.lg,
          overflow: "hidden",
          height: 220,
          backgroundColor: semanticPalette.surfaceAlt,
          alignItems: "center",
          justifyContent: "center",
          gap: SPACING.sm,
        },
        pressed ? { opacity: 0.88 } : null,
        style,
      ]}
    >
      <Ionicons name="map-outline" size={icon.lg} color={semanticPalette.accent} />
      <Text style={{ fontFamily: fonts.medium, fontSize: TYPE.small.fontSize, color: semanticPalette.inkSoft }}>
        {label || "Open in Maps"}
      </Text>
    </Pressable>
  );
}
