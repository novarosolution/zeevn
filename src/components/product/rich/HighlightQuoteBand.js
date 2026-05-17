import React, { memo, useMemo } from "react";
import { StyleSheet, Text, View, useWindowDimensions } from "react-native";
import { useTheme } from "../../../context/ThemeContext";
import { PRODUCT_SCREEN } from "../../../content/appContent";
import { fonts } from "../../../theme/tokens";

const COPY = PRODUCT_SCREEN.rich;

function HighlightQuoteBandBase({ quote, attribution, gutter = 0 }) {
  const { width } = useWindowDimensions();
  const { semanticPalette, TYPE, SPACING } = useTheme();
  const isTablet = width >= 768;
  const text = String(quote || "").trim();
  const attr = String(attribution || "").trim() || COPY.quoteAttributionFallback;

  const styles = useMemo(
    () =>
      StyleSheet.create({
        bleed: {
          marginHorizontal: gutter ? -gutter : 0,
          backgroundColor: semanticPalette.bgDeep,
          borderTopWidth: 1,
          borderTopColor: semanticPalette.accent,
          paddingVertical: 56,
          paddingHorizontal: 32,
        },
        inner: {
          width: "100%",
          maxWidth: 720,
          alignSelf: "center",
          position: "relative",
        },
        glyph: {
          fontFamily: TYPE.serifFamily,
          fontSize: 48,
          lineHeight: 48,
          color: semanticPalette.accent,
          opacity: 0.6,
          marginBottom: 8,
        },
        quote: {
          fontFamily: TYPE.serifFamily,
          fontSize: isTablet ? 32 : 24,
          lineHeight: (isTablet ? 32 : 24) * 1.3,
          fontWeight: "500",
          fontStyle: "italic",
          color: semanticPalette.inkInverse,
        },
        divider: {
          width: 24,
          height: 1,
          backgroundColor: semanticPalette.accent,
          marginTop: SPACING.lg,
          marginBottom: SPACING.md,
        },
        attr: {
          fontFamily: fonts.medium,
          fontSize: 12,
          letterSpacing: 0.14 * 12,
          color: semanticPalette.inkInverseSoft,
        },
      }),
    [TYPE.serifFamily, gutter, isTablet, semanticPalette, SPACING]
  );

  if (!text) return null;

  return (
    <View style={styles.bleed} accessibilityRole="text">
      <View style={styles.inner}>
        <Text style={styles.glyph} accessibilityElementsHidden>
          {"\u201C"}
        </Text>
        <Text style={styles.quote}>{text}</Text>
        <View style={styles.divider} />
        <Text style={styles.attr}>{attr.startsWith("—") ? attr : `— ${attr}`}</Text>
      </View>
    </View>
  );
}

const HighlightQuoteBand = memo(HighlightQuoteBandBase);

export default HighlightQuoteBand;
