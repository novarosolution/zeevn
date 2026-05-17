import React from "react";
import { Text } from "react-native";
import Card from "../ui/Card";
import { useTheme } from "../../context/ThemeContext";
import { fonts } from "../../theme/tokens";

/**
 * Dashboard metric tile: label, serif value, muted caption.
 */
export default function OpsStatCard({ label, value, caption, style }) {
  const { semanticPalette, TYPE, SPACING } = useTheme();

  return (
    <Card padding="md" style={[{ flex: 1, minWidth: 140 }, style]}>
      <Text
        style={{
          fontFamily: fonts.semibold,
          fontSize: TYPE.micro.fontSize,
          letterSpacing: 1.1,
          textTransform: "uppercase",
          color: semanticPalette.inkMuted,
        }}
      >
        {label}
      </Text>
      <Text
        style={{
          fontFamily: TYPE.serifFamily,
          fontSize: TYPE.h2.fontSize,
          lineHeight: TYPE.h2.lineHeight,
          color: semanticPalette.ink,
          marginTop: SPACING.sm,
        }}
      >
        {value}
      </Text>
      {caption ? (
        <Text
          style={{
            fontFamily: fonts.regular,
            fontSize: TYPE.caption.fontSize,
            color: semanticPalette.inkSoft,
            marginTop: SPACING.xs,
          }}
        >
          {caption}
        </Text>
      ) : null}
    </Card>
  );
}
