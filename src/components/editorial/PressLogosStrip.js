import React from "react";
import { Platform, Text, View } from "react-native";
import { useTheme } from "../../context/ThemeContext";
import { fonts } from "../../theme/tokens";

export default function PressLogosStrip({ logos = [] }) {
  const { semanticPalette, TYPE, SPACING } = useTheme();

  if (!logos.length) return null;

  return (
    <View
      style={{
        backgroundColor: semanticPalette.lineSoft,
        marginHorizontal: -SPACING.lg,
        paddingVertical: SPACING.xl,
        paddingHorizontal: SPACING.lg,
        marginBottom: SPACING["2xl"],
      }}
    >
      <Text
        style={{
          fontFamily: fonts.semibold,
          fontSize: TYPE.micro.fontSize,
          letterSpacing: 1.4,
          textTransform: "uppercase",
          color: semanticPalette.inkMuted,
          textAlign: "center",
          marginBottom: SPACING.lg,
        }}
      >
        As featured in
      </Text>
      <View
        style={{
          flexDirection: "row",
          flexWrap: "wrap",
          justifyContent: "center",
          alignItems: "center",
          gap: SPACING.xl,
        }}
      >
        {logos.map((name) => (
          <Text
            key={name}
            style={{
              fontFamily: TYPE.serifFamily,
              fontSize: TYPE.h4.fontSize,
              color: semanticPalette.inkSoft,
              opacity: 0.85,
              ...Platform.select({ web: { userSelect: "none" }, default: {} }),
            }}
          >
            {name}
          </Text>
        ))}
      </View>
    </View>
  );
}
