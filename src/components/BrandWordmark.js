import React from "react";
import { Text } from "react-native";
import { useTheme } from "../context/ThemeContext";
import { APP_DISPLAY_NAME, BRAND_WORDMARK_SIZE } from "../constants/brand";
import { FONT_DISPLAY } from "../theme/customerAlchemy";

/**
 * Typographic wordmark — no image logo. `sizeKey` maps to `BRAND_WORDMARK_SIZE` (font size dp).
 */
export default function BrandWordmark({
  sizeKey = "headerDefault",
  style,
  color,
  numberOfLines = 1,
  adjustsFontSizeToFit,
  minimumFontScale,
  maxFontSizeMultiplier = 1.35,
}) {
  const { colors: c } = useTheme();
  const fontSize = BRAND_WORDMARK_SIZE[sizeKey] ?? BRAND_WORDMARK_SIZE.headerDefault;
  const lineHeightPx = Math.round(fontSize * 1.12);
  return (
    <Text
      style={[
        {
          fontFamily: FONT_DISPLAY,
          fontSize,
          lineHeight: lineHeightPx,
          color: color ?? c.textPrimary,
          letterSpacing: -0.62,
          flexShrink: 1,
        },
        style,
      ]}
      numberOfLines={numberOfLines}
      adjustsFontSizeToFit={adjustsFontSizeToFit}
      minimumFontScale={minimumFontScale}
      maxFontSizeMultiplier={maxFontSizeMultiplier}
      accessibilityRole="text"
    >
      {APP_DISPLAY_NAME}
    </Text>
  );
}
