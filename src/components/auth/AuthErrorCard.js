import React from "react";
import { Platform, Pressable, Text, View } from "react-native";
import { WebTextLink } from "../ui/inputWebHelpers";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../context/ThemeContext";
import Card from "../ui/Card";
import { fonts } from "../../theme/tokens";

export default function AuthErrorCard({ message, onRetry, retryLabel }) {
  const { semanticPalette, TYPE, SPACING } = useTheme();
  return (
    <View accessibilityLiveRegion="polite" style={{ marginBottom: SPACING.md }}>
      <Card
        padding={12}
        style={{
          borderWidth: 1,
          borderColor: semanticPalette.sale,
          backgroundColor: semanticPalette.surfaceAlt,
        }}
      >
        <View style={{ flexDirection: "row", alignItems: "flex-start", gap: SPACING.sm }}>
          <Ionicons name="alert-circle" size={16} color={semanticPalette.sale} />
          <View style={{ flex: 1, gap: onRetry ? SPACING.sm : 0 }}>
            <Text
              style={{
                fontFamily: fonts.regular,
                fontSize: TYPE.small.fontSize,
                lineHeight: TYPE.small.lineHeight,
                color: semanticPalette.ink,
              }}
            >
              {message}
            </Text>
            {onRetry ? (
              Platform.OS === "web" ? (
                <WebTextLink onPress={onRetry} ariaLabel={retryLabel}>
                  <span
                    style={{
                      fontFamily: fonts.semibold,
                      fontSize: TYPE.small.fontSize,
                      lineHeight: `${TYPE.small.lineHeight}px`,
                      color: semanticPalette.accent,
                      textDecoration: "underline",
                    }}
                  >
                    {retryLabel}
                  </span>
                </WebTextLink>
              ) : (
                <Pressable accessibilityRole="button" onPress={onRetry} hitSlop={8}>
                  <Text
                    style={{
                      fontFamily: fonts.semibold,
                      fontSize: TYPE.small.fontSize,
                      lineHeight: TYPE.small.lineHeight,
                      color: semanticPalette.accent,
                      textDecorationLine: "underline",
                    }}
                  >
                    {retryLabel}
                  </Text>
                </Pressable>
              )
            ) : null}
          </View>
        </View>
      </Card>
    </View>
  );
}
