import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { useTheme } from "../../context/ThemeContext";
import { fonts } from "../../theme/tokens";

/** Inline validation / API error for auth forms (sale token only — no legacy red chrome). */
export default function AuthFormMessage({ message }) {
  const { semanticPalette, TYPE } = useTheme();
  if (!message) return null;
  return (
    <View
      style={{
        marginBottom: 12,
        padding: 12,
        borderRadius: 12,
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: semanticPalette.sale,
        backgroundColor: semanticPalette.surfaceAlt,
      }}
      accessibilityLiveRegion="polite"
    >
      <Text style={{ fontFamily: fonts.medium, fontSize: TYPE.caption.fontSize, color: semanticPalette.sale }}>
        {message}
      </Text>
    </View>
  );
}
