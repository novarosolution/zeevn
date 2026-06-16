import React, { memo } from "react";
import { Platform, StyleSheet, Text } from "react-native";
import {
  HOME_EYEBROW_LETTER_SPACING,
  HOME_TYPE,
  homeEditorialMuted,
} from "../../../theme/homeEditorial";
import { fonts } from "../../../theme/tokens";
import { useTheme } from "../../../context/ThemeContext";

/**
 * Uppercase, letter-spaced micro-label above editorial sections.
 * Muted taupe — accent green is reserved for hairlines & primary CTAs.
 */
function EyebrowBase({ children, align = "left", style, accessibilityLabel }) {
  const { isDark } = useTheme();
  const label = String(children ?? "").trim();
  if (!label) return null;

  return (
    <Text
      accessibilityRole="text"
      accessibilityLabel={accessibilityLabel || label}
      style={[
        styles.base,
        { color: homeEditorialMuted(isDark), letterSpacing: HOME_EYEBROW_LETTER_SPACING },
        align === "center" && styles.center,
        style,
      ]}
      numberOfLines={1}
    >
      {label.toUpperCase()}
    </Text>
  );
}

const styles = StyleSheet.create({
  base: {
    fontFamily: fonts.semibold,
    fontSize: HOME_TYPE.eyebrow,
    lineHeight: HOME_TYPE.eyebrow + 4,
    textTransform: "uppercase",
    ...Platform.select({
      web: { userSelect: "none" },
      default: {},
    }),
  },
  center: {
    textAlign: "center",
    alignSelf: "center",
  },
});

const Eyebrow = memo(EyebrowBase);

export default Eyebrow;
