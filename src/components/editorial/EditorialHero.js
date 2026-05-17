import React from "react";
import { Text, View } from "react-native";
import { useTheme } from "../../context/ThemeContext";
import { fonts } from "../../theme/tokens";

/**
 * Navy hero band: brass overline, serif display headline, body subline.
 */
export default function EditorialHero({ kicker, headline, subline, style }) {
  const { semanticPalette, TYPE, SPACING } = useTheme();

  return (
    <View
      style={[
        {
          backgroundColor: semanticPalette.bgDeep,
          paddingVertical: SPACING["3xl"],
          paddingHorizontal: SPACING.lg,
          marginHorizontal: -SPACING.lg,
          marginBottom: SPACING["2xl"],
        },
        style,
      ]}
    >
      <View style={{ maxWidth: 720, alignSelf: "center", width: "100%" }}>
        <Text
          style={{
            fontFamily: fonts.semibold,
            fontSize: TYPE.overline.fontSize,
            letterSpacing: TYPE.overline.letterSpacing,
            textTransform: "uppercase",
            color: semanticPalette.accent,
            marginBottom: SPACING.md,
          }}
        >
          {kicker}
        </Text>
        <Text
          style={{
            fontFamily: TYPE.serifFamily,
            ...TYPE.display,
            color: semanticPalette.inkInverse,
            marginBottom: SPACING.md,
          }}
        >
          {headline}
        </Text>
        {subline ? (
          <Text
            style={{
              fontFamily: fonts.regular,
              fontSize: TYPE.bodyLg.fontSize,
              lineHeight: TYPE.bodyLg.lineHeight * 1.35,
              color: semanticPalette.inkInverseSoft,
              maxWidth: 560,
            }}
          >
            {subline}
          </Text>
        ) : null}
      </View>
    </View>
  );
}
