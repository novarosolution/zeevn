import React, { useMemo } from "react";
import { Platform, StyleSheet, Text, View } from "react-native";
import { Image } from "expo-image";
import {
  APP_DISPLAY_NAME,
  APP_TAGLINE,
  APP_WORDMARK_SUBLINE,
  ZEEVAN_BRAND_ASSETS,
} from "../constants/brand";
import { useTheme } from "../context/ThemeContext";
import { FONT_HEADING } from "../theme/typographyRoles";
import { KANKREG_CHROME } from "../theme/kankregWeb";
import { fonts } from "../theme/tokens";

/** Wordmark aspect ratio for layout sizing (width / height). */
export const BRAND_LOGO_ASPECT = 3.2;

/**
 * Zeevan brand logo — PNG wordmark by default; text fallback when `textOnly`.
 * variant: onLight (cream bg), onDark (footer/hero), default (theme-aware).
 */
export default function BrandLogo({
  width,
  height,
  size,
  style,
  glow = false,
  variant,
  showTagline = false,
  textOnly = false,
  mark = false,
}) {
  const { isDark, colors: c } = useTheme();
  const resolvedVariant = variant ?? (isDark ? "default" : "onLight");
  const resolvedHeight = height ?? size ?? 50;
  const resolvedWidth = width ?? resolvedHeight * BRAND_LOGO_ASPECT;
  const scale = resolvedHeight / 44;

  const styles = useMemo(
    () => createStyles(glow, resolvedVariant, scale, c, isDark),
    [glow, resolvedVariant, scale, c, isDark]
  );

  const useImage = !textOnly && ZEEVAN_BRAND_ASSETS.wordmark;
  const onDark = resolvedVariant === "onDark";
  const imageSource = mark
    ? ZEEVAN_BRAND_ASSETS.mark
    : onDark
      ? ZEEVAN_BRAND_ASSETS.wordmarkLight || ZEEVAN_BRAND_ASSETS.wordmark
      : ZEEVAN_BRAND_ASSETS.wordmark;
  const imageAspect = mark ? 1 : BRAND_LOGO_ASPECT;
  const imageWidth = mark ? resolvedHeight : resolvedWidth;
  const imageHeight = resolvedHeight;

  return (
    <View
      style={[styles.wrap, { width: resolvedWidth, minHeight: resolvedHeight }, style]}
      accessibilityRole="image"
      accessibilityLabel={APP_DISPLAY_NAME}
    >
      {useImage ? (
        <Image
          source={imageSource}
          style={{ width: imageWidth, height: imageHeight }}
          contentFit="contain"
          contentPosition="left center"
          transition={120}
          cachePolicy="memory-disk"
          accessibilityLabel={APP_DISPLAY_NAME}
        />
      ) : (
        <Text style={styles.wordmark} numberOfLines={1}>
          {APP_DISPLAY_NAME}
        </Text>
      )}
      {showTagline ? (
        <Text style={styles.tagline} numberOfLines={1}>
          {APP_WORDMARK_SUBLINE || APP_TAGLINE}
        </Text>
      ) : null}
    </View>
  );
}

function createStyles(glow, variant, scale, c, isDark) {
  const onDark = variant === "onDark";
  const onLight = variant === "onLight";
  const ink = onDark
    ? KANKREG_CHROME.footerAccent
    : onLight
      ? "#151210"
      : c.textPrimary;
  const taglineColor = onDark
    ? "rgba(250, 248, 244, 0.62)"
    : onLight
      ? "#7A7168"
      : c.textMuted;

  return StyleSheet.create({
    wrap: {
      alignItems: "flex-start",
      justifyContent: "center",
      overflow: "visible",
      ...(glow
        ? Platform.select({
            web: {
              filter: onDark
                ? "drop-shadow(0 4px 12px rgba(0,0,0,0.35))"
                : "drop-shadow(0 6px 18px rgba(184,134,11,0.18))",
            },
            default: {
              shadowColor: onDark ? "#000" : "#244424",
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: onDark ? 0.24 : 0.16,
              shadowRadius: 10,
              elevation: 6,
            },
          })
        : null),
    },
    wordmark: {
      fontFamily: FONT_HEADING,
      fontSize: Math.round(28 * scale),
      lineHeight: Math.round(32 * scale),
      letterSpacing: -0.5 * scale,
      color: ink,
    },
    tagline: {
      marginTop: 2 * scale,
      fontFamily: fonts.medium,
      fontSize: Math.round(10 * scale),
      lineHeight: Math.round(14 * scale),
      letterSpacing: 1.2,
      textTransform: "uppercase",
      color: taglineColor,
    },
  });
}
