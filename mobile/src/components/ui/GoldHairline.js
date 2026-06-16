import React, { memo } from "react";
import { Platform, StyleSheet, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { spacing } from "../../theme/tokens";
import { ALCHEMY } from "../../theme/customerAlchemy";
import { useTheme } from "../../context/ThemeContext";

const GRADIENT = {
  default: {
    dark: ["rgba(232, 188, 132, 0)", "rgba(232, 188, 132, 0.5)", "rgba(232, 188, 132, 0)"],
    light: ["rgba(220, 172, 116, 0)", "rgba(220, 172, 116, 0.55)", "rgba(220, 172, 116, 0)"],
  },
  /** Thin editorial rule — low-opacity gold, no dot. @see theme/homeEditorial.js */
  subtle: {
    dark: ["rgba(232, 188, 132, 0)", "rgba(232, 188, 132, 0.28)", "rgba(232, 188, 132, 0)"],
    light: ["rgba(220, 172, 116, 0)", "rgba(220, 172, 116, 0.32)", "rgba(220, 172, 116, 0)"],
  },
};

/**
 * Gradient hairline divider (gold -> transparent + optional anchor dot). Used
 * between cart sections, profile groups, settings groups, etc.
 *
 * `variant="subtle"` — thin low-opacity rule for editorial section eyebrows.
 */
function GoldHairlineBase({
  marginVertical = spacing.md,
  withDot = true,
  variant = "default",
  style,
}) {
  const { isDark } = useTheme();
  const isSubtle = variant === "subtle";
  const mv =
    Platform.OS !== "web" && marginVertical >= spacing.sm
      ? Math.max(spacing.xs, marginVertical - spacing.sm)
      : marginVertical;
  const palette = GRADIENT[isSubtle ? "subtle" : "default"];
  const showDot = withDot && !isSubtle;

  return (
    <View style={[styles.wrap, { marginVertical: mv }, style, styles.peNone]}>
      <LinearGradient
        colors={isDark ? palette.dark : palette.light}
        start={{ x: 0, y: 0.5 }}
        end={{ x: 1, y: 0.5 }}
        style={[styles.line, isSubtle && styles.lineSubtle]}
      />
      {showDot ? (
        <View
          style={[
            styles.dot,
            { backgroundColor: isDark ? ALCHEMY.goldBright : ALCHEMY.gold },
          ]}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  line: {
    flex: 1,
    height: 1,
    borderRadius: 1,
  },
  lineSubtle: {
    height: StyleSheet.hairlineWidth,
    maxWidth: "100%",
    opacity: 0.9,
  },
  dot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    opacity: 0.85,
  },
  peNone: {
    pointerEvents: "none",
  },
});

const GoldHairline = memo(GoldHairlineBase);

export default GoldHairline;
