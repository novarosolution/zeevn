import React from "react";
import { Linking, Platform, Pressable, Text } from "react-native";
import { fonts } from "../../theme/tokens";
import { useTheme } from "../../context/ThemeContext";

/**
 * Ink body link with brass 1px underline on hover (web). No red/destructive link colors.
 */
export default function EditorialLink({ children, onPress, href, style }) {
  const { semanticPalette } = useTheme();
  const label = children;

  const textStyle = [
    {
      fontFamily: fonts.medium,
      color: semanticPalette.ink,
      fontSize: 16,
      lineHeight: 24 * 1.6,
    },
    style,
  ];

  const handlePress = () => {
    if (onPress) {
      onPress();
      return;
    }
    if (href) void Linking.openURL(href);
  };

  if (!onPress && !href) {
    return <Text style={textStyle}>{label}</Text>;
  }

  return (
    <Pressable
      onPress={handlePress}
      accessibilityRole="link"
      style={({ pressed, hovered }) => [
        Platform.OS === "web" && hovered
          ? {
              borderBottomWidth: 1,
              borderBottomColor: semanticPalette.accent,
              alignSelf: "flex-start",
            }
          : null,
        pressed ? { opacity: 0.78 } : null,
      ]}
    >
      <Text style={textStyle}>{label}</Text>
    </Pressable>
  );
}
