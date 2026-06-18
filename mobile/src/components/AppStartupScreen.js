import React, { useMemo } from "react";
import { Platform, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import Animated, { FadeIn } from "react-native-reanimated";
import { fonts, spacing } from "../theme/tokens";
import { BRAND_LOGO_SIZE } from "../constants/brand";
import { FONT_HEADING_SEMI } from "../theme/typographyRoles";
import { LOADING_THEME } from "../theme/loadingTheme";
import BrandLogo from "./BrandLogo";
import { GoldRingLoader, IndeterminateProgressBar } from "./loading";

const GRAIN_URI =
  "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='90' height='90'><filter id='n'><feTurbulence baseFrequency='.9'/></filter><rect width='100%25' height='100%25' filter='url(%23n)'/></svg>";

/**
 * Branded launch loader — light gold splash or charcoal + gold in dark mode.
 */
export default function AppStartupScreen({
  useAppFonts = true,
  footnote = "Preparing your boutique…",
  isDark = false,
}) {
  const displayFont = useAppFonts ? { fontFamily: FONT_HEADING_SEMI } : {};
  const footFont = useAppFonts ? { fontFamily: fonts.medium } : {};
  const gradient = useMemo(
    () => (isDark ? LOADING_THEME.splashRadialDark : LOADING_THEME.splashRadialLight),
    [isDark]
  );
  const textPrimary = isDark ? "rgba(245,239,228,0.9)" : "rgba(255,255,255,0.85)";
  const textMuted = isDark ? "rgba(245,239,228,0.62)" : "rgba(255,255,255,0.7)";

  return (
    <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
      <LinearGradient
        colors={gradient}
        locations={isDark ? [0, 0.55, 1] : [0, 0.52, 1]}
        start={{ x: 0.5, y: 0.22 }}
        end={{ x: 0.5, y: 1.3 }}
        style={styles.root}
      >
        {Platform.OS === "web" ? (
          <View
            style={[
              styles.grain,
              { backgroundImage: `url("${GRAIN_URI}")`, opacity: isDark ? 0.18 : 0.3 },
            ]}
          />
        ) : (
          <View style={[styles.grainNative, isDark && styles.grainNativeDark]} />
        )}

        <Animated.View entering={FadeIn.duration(480)} style={styles.center}>
          <BrandLogo
            height={BRAND_LOGO_SIZE.startup}
            variant={isDark ? "onDark" : "onLight"}
            glow
            style={styles.logo}
          />
          <GoldRingLoader size={54} light={!isDark} style={styles.ring} />
        </Animated.View>

        <Animated.View entering={FadeIn.duration(400).delay(120)} style={styles.footer}>
          <Text style={[styles.footnote, footFont, { color: textPrimary }]}>{footnote}</Text>
          <IndeterminateProgressBar light={!isDark} height={4} style={styles.bar} />
          <Text style={[styles.est, footFont, { color: textMuted }]}>EST. 2025 · CRAFTED IN INDIA</Text>
        </Animated.View>
      </LinearGradient>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    width: "100%",
  },
  root: {
    flex: 1,
    width: "100%",
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
    ...Platform.select({
      web: { minHeight: "100vh" },
      default: {},
    }),
  },
  grain: {
    ...StyleSheet.absoluteFillObject,
    mixBlendMode: "overlay",
  },
  grainNative: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(255,255,255,0.04)",
    opacity: 0.25,
  },
  grainNativeDark: {
    backgroundColor: "rgba(232,200,90,0.06)",
    opacity: 0.35,
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.lg,
    zIndex: 2,
  },
  logo: {
    marginBottom: spacing.lg,
  },
  ring: {
    marginTop: 34,
  },
  footer: {
    width: "100%",
    paddingHorizontal: 40,
    paddingBottom: 40,
    zIndex: 2,
    alignItems: "center",
  },
  footnote: {
    fontSize: 11,
    letterSpacing: 0.5,
    marginBottom: 12,
    textAlign: "center",
  },
  bar: {
    width: "100%",
    maxWidth: 280,
  },
  est: {
    marginTop: spacing.lg,
    fontSize: 10,
    letterSpacing: 2,
    textTransform: "uppercase",
    textAlign: "center",
  },
});
