import React from "react";
import { Text, View } from "react-native";
import { useTheme } from "../../context/ThemeContext";
import { fonts } from "../../theme/tokens";

export default function AuthSessionExpiredBanner({ message = "Your session expired. Please sign in again." }) {
  const { semanticPalette, TYPE, SPACING } = useTheme();

  return (
    <View
      accessibilityRole="alert"
      style={{
        marginBottom: SPACING.md,
        padding: SPACING.sm,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: semanticPalette.warning,
        backgroundColor: "rgba(177, 123, 39, 0.08)",
      }}
    >
      <Text
        style={{
          fontFamily: fonts.medium,
          fontSize: TYPE.small.fontSize,
          lineHeight: TYPE.small.lineHeight,
          color: semanticPalette.ink,
        }}
      >
        {message}
      </Text>
    </View>
  );
}
