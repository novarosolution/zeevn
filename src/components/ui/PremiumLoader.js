import React, { memo, useMemo } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { fonts, spacing, typography } from "../../theme/tokens";
import { ALCHEMY, FONT_DISPLAY_ITALIC } from "../../theme/customerAlchemy";
import { useTheme } from "../../context/ThemeContext";

const SIZE_TOKENS = {
  sm: { spinner: "small", titleSize: typography.bodySmall, captionSize: typography.caption },
  md: { spinner: "large", titleSize: typography.h3, captionSize: typography.bodySmall },
  lg: { spinner: "large", titleSize: typography.h2, captionSize: typography.body },
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
    <View style={[styles.wrap, style]} accessibilityRole="progressbar" accessibilityLabel={caption || "Loading"}>
      <ActivityIndicator size={tokens.spinner} color={spinnerColor} />
      {caption ? (
        <Text style={[styles.caption, { color: c.textPrimary, fontSize: tokens.titleSize }]} numberOfLines={2}>
          {caption}
        </Text>
      ) : null}
      {hint ? (
        <Text style={[styles.hint, { color: c.textMuted, fontSize: tokens.captionSize }]} numberOfLines={3}>
          {hint}
        </Text>
      ) : null}
    </View>
  );
}

function createStyles(c, isDark, inline) {
  return StyleSheet.create({
    wrap: {
      flexDirection: inline ? "row" : "column",
      alignItems: "center",
      justifyContent: "center",
      gap: inline ? spacing.sm : spacing.xs + 2,
      paddingVertical: inline ? 0 : spacing.lg,
    },
    caption: {
      fontFamily: FONT_DISPLAY_ITALIC,
      letterSpacing: -0.2,
      textAlign: "center",
      marginTop: inline ? 0 : 4,
    },
    hint: {
      fontFamily: fonts.medium,
      textAlign: "center",
      maxWidth: 320,
    },
  });
}

const PremiumLoader = memo(PremiumLoaderBase);

export default PremiumLoader;
