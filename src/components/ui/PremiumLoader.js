import React, { memo, useMemo } from "react";
import { ActivityIndicator, Platform, StyleSheet, Text, View } from "react-native";
import { fonts, radius, spacing, typography } from "../../theme/tokens";
import { ALCHEMY, FONT_DISPLAY_ITALIC } from "../../theme/customerAlchemy";
import { useTheme } from "../../context/ThemeContext";

const SIZE_TOKENS = {
  sm: { spinner: "small", titleSize: typography.bodySmall, captionSize: typography.caption, well: 42, halo: 56 },
  md: { spinner: "large", titleSize: typography.h3, captionSize: typography.bodySmall, well: 56, halo: 72 },
  lg: { spinner: "large", titleSize: typography.h2, captionSize: typography.body, well: 68, halo: 86 },
};

/**
 * Themed activity indicator with optional caption. Used to replace bare
 * `<ActivityIndicator>` calls so the loading state matches the rest of the
 * customer UI (display-font caption, gold-tinted spinner color).
 */
function PremiumLoaderBase({
  size = "md",
  caption,
  hint,
  inline = false,
  color,
  style,
}) {
  const { colors: c, isDark } = useTheme();
  const tokens = SIZE_TOKENS[size] || SIZE_TOKENS.md;
  const spinnerColor = color || (isDark ? ALCHEMY.goldBright : ALCHEMY.gold);
  const styles = useMemo(() => createStyles(c, isDark, inline), [c, isDark, inline]);

  return (
    <View
      style={[styles.wrap, inline ? styles.wrapInline : styles.wrapBlock, style]}
      accessibilityRole="progressbar"
      accessibilityLabel={caption || hint || "Loading"}
    >
      <View
        style={[
          styles.visualShell,
          inline ? styles.visualShellInline : null,
          { width: tokens.halo, height: tokens.halo, borderRadius: tokens.halo / 2 },
        ]}
      >
        {!inline ? (
          <View
            style={[
              styles.visualGlow,
              {
                backgroundColor: isDark ? "rgba(239, 68, 68, 0.12)" : "rgba(220, 38, 38, 0.08)",
              },
            ]}
          />
        ) : null}
        <View
          style={[
            styles.visualRing,
            {
              width: tokens.halo,
              height: tokens.halo,
              borderRadius: tokens.halo / 2,
              borderColor: isDark ? "rgba(248, 113, 113, 0.22)" : "rgba(220, 38, 38, 0.14)",
            },
          ]}
        />
        <View
          style={[
            styles.indicatorWell,
            {
              width: tokens.well,
              height: tokens.well,
              borderRadius: tokens.well / 2,
              backgroundColor: isDark ? "rgba(17, 26, 42, 0.94)" : "rgba(255, 255, 255, 0.94)",
              borderColor: isDark ? c.primaryBorder : "rgba(220, 38, 38, 0.14)",
              shadowColor: isDark ? "#000" : "#18181B",
            },
          ]}
        >
          <ActivityIndicator size={tokens.spinner} color={spinnerColor} />
        </View>
      </View>

      {caption || hint ? (
        <View style={[styles.copy, inline ? styles.copyInline : null]}>
          {caption ? (
            <Text style={[styles.caption, { color: c.textPrimary, fontSize: tokens.titleSize }]}>
              {caption}
            </Text>
          ) : null}
          {hint ? (
            <Text style={[styles.hint, { color: c.textMuted, fontSize: tokens.captionSize }]}>
              {hint}
            </Text>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}

function createStyles(c, isDark, inline) {
  return StyleSheet.create({
    wrap: {
      justifyContent: "center",
      gap: inline ? spacing.sm : spacing.sm + 2,
    },
    wrapInline: {
      flexDirection: "row",
      alignItems: "center",
      minWidth: 0,
    },
    wrapBlock: {
      alignItems: "center",
      alignSelf: "center",
      width: "100%",
      maxWidth: 380,
      paddingVertical: spacing.lg,
    },
    visualShell: {
      alignItems: "center",
      justifyContent: "center",
      position: "relative",
      flexShrink: 0,
    },
    visualShellInline: {
      width: 40,
      height: 40,
      borderRadius: 20,
    },
    visualGlow: {
      position: "absolute",
      top: 6,
      right: 6,
      bottom: 6,
      left: 6,
      borderRadius: radius.pill,
      opacity: 0.95,
    },
    visualRing: {
      position: "absolute",
      borderWidth: StyleSheet.hairlineWidth,
      opacity: 0.95,
    },
    indicatorWell: {
      alignItems: "center",
      justifyContent: "center",
      borderWidth: StyleSheet.hairlineWidth,
      ...Platform.select({
        web: {
          boxShadow: isDark
            ? "0 12px 30px rgba(0,0,0,0.34), inset 0 1px 0 rgba(255,255,255,0.05)"
            : "0 10px 24px rgba(15, 23, 42, 0.08), inset 0 1px 0 rgba(255,255,255,0.95)",
        },
        ios: {
          shadowOffset: { width: 0, height: 6 },
          shadowOpacity: isDark ? 0.26 : 0.08,
          shadowRadius: 14,
        },
        android: { elevation: inline ? 1 : 2 },
        default: {},
      }),
    },
    copy: {
      width: "100%",
      minWidth: 0,
      alignItems: "center",
      gap: spacing.xxs,
    },
    copyInline: {
      flex: 1,
      alignItems: "flex-start",
    },
    caption: {
      fontFamily: FONT_DISPLAY_ITALIC,
      letterSpacing: -0.2,
      textAlign: inline ? "left" : "center",
    },
    hint: {
      fontFamily: fonts.medium,
      textAlign: inline ? "left" : "center",
      maxWidth: inline ? undefined : 340,
    },
  });
}

const PremiumLoader = memo(PremiumLoaderBase);

export default PremiumLoader;
