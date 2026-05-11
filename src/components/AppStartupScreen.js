import React, { useEffect } from "react";
import { ActivityIndicator, Platform, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import Animated, { Easing, FadeIn, FadeInDown, useAnimatedStyle, useSharedValue, withRepeat, withTiming } from "react-native-reanimated";
import { fonts, radius, spacing, typography } from "../theme/tokens";
import { APP_TAGLINE, APP_WORDMARK_SUBLINE } from "../constants/brand";
import { ALCHEMY, CUSTOMER_SHELL_GRADIENT_LOCATIONS, FONT_DISPLAY_SEMI, getCustomerShellGradient } from "../theme/customerAlchemy";
import BrandWordmark from "./BrandWordmark";

const SHELL_AXIS = { start: { x: 0.06, y: 0 }, end: { x: 0.94, y: 1 } };

/**
 * Full-screen branded splash while fonts load or session restores.
 * `useAppFonts`: false before Inter is ready (system title); true after.
 */
export default function AppStartupScreen({ colors: c, useAppFonts = true, footnote = "Opening…", isDark = false }) {
  const footFont = useAppFonts ? { fontFamily: fonts.medium } : {};
  const displayFont = useAppFonts ? { fontFamily: FONT_DISPLAY_SEMI } : {};
  const shell = getCustomerShellGradient(isDark, c);

  return (
    <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
      <LinearGradient
        colors={shell}
        locations={CUSTOMER_SHELL_GRADIENT_LOCATIONS}
        start={SHELL_AXIS.start}
        end={SHELL_AXIS.end}
        style={styles.root}
      >
        <View style={[styles.blob, styles.blobA, { backgroundColor: c.primary }]} />
        <View style={[styles.blob, styles.blobB, { backgroundColor: c.secondary }]} />
        <View style={[styles.blob, styles.blobC, { backgroundColor: ALCHEMY.gold }]} />
        <LinearGradient
          colors={["rgba(185, 28, 28, 0.08)", "transparent", isDark ? "rgba(0,0,0,0.22)" : "rgba(185, 28, 28, 0.04)"]}
          locations={[0, 0.45, 1]}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
          style={[StyleSheet.absoluteFill, styles.peNone]}
        />

        <Animated.View entering={FadeIn.duration(480)} style={styles.center}>
          <Animated.View entering={FadeInDown.duration(520).delay(40)} style={styles.cardOuter}>
            <View
              style={[
                styles.logoCardClip,
                {
                  backgroundColor: isDark ? c.surfaceElevated || c.surface : "rgba(255, 252, 248, 0.95)",
                  borderColor: isDark ? c.border : "rgba(63, 63, 70, 0.12)",
                },
              ]}
            >
              <LinearGradient
                colors={[ALCHEMY.gold, "#D4AF37", ALCHEMY.brown]}
                start={{ x: 0, y: 0.5 }}
                end={{ x: 1, y: 0.5 }}
                style={styles.cardGoldEdge}
              />
              <View style={styles.logoCardInner}>
                <View style={styles.kickerPill}>
                  <Text style={styles.kickerText} numberOfLines={1}>
                    {APP_WORDMARK_SUBLINE}
                  </Text>
                </View>
                <BrandWordmark sizeKey="startup" />
                {useAppFonts ? (
                  <Text style={[styles.tagline, { color: c.textSecondary }, displayFont]} numberOfLines={2}>
                    {APP_TAGLINE}
                  </Text>
                ) : null}
              </View>
            </View>
          </Animated.View>

          <StartupLoaderOrnament isDark={isDark} colorPrimary={c.primary} colorTrack={c.primaryBorder} useAppFonts={useAppFonts} />
          <View
            style={[
              styles.spinnerWell,
              {
                backgroundColor: c.primarySoft,
                borderColor: c.primaryBorder,
                shadowColor: isDark ? "#000" : "#18181B",
              },
            ]}
          >
            <ActivityIndicator size="large" color={c.primary} />
          </View>
          <Text style={[styles.footnote, { color: c.textMuted }, footFont]}>{footnote}</Text>
        </Animated.View>
      </LinearGradient>
    </SafeAreaView>
  );
}

function StartupLoaderOrnament({ isDark, colorPrimary, colorTrack, useAppFonts }) {
  const rot = useSharedValue(0);
  useEffect(() => {
    rot.value = withRepeat(
      withTiming(360, { duration: 4200, easing: Easing.linear }),
      -1,
      false
    );
  }, [rot]);

  const ringStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rot.value}deg` }],
  }));

  if (!useAppFonts) return <View style={styles.ornamentSpacer} />;

  return (
    <View style={styles.ornamentRow}>
      <View style={styles.ornamentLineFaint} />
      <Animated.View style={ringStyle}>
        <Ionicons name="leaf-outline" size={20} color={isDark ? colorTrack : colorPrimary} />
      </Animated.View>
      <View style={styles.ornamentLineFaint} />
    </View>
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
    position: "relative",
    ...Platform.select({
      web: { minHeight: "100vh" },
      default: {},
    }),
    justifyContent: "center",
    alignItems: "center",
  },
  blob: {
    position: "absolute",
    opacity: 0.1,
    borderRadius: 999,
  },
  blobA: {
    width: 240,
    height: 240,
    top: "8%",
    right: "-10%",
  },
  blobB: {
    width: 180,
    height: 180,
    bottom: "14%",
    left: "-8%",
  },
  blobC: {
    width: 100,
    height: 100,
    opacity: 0.07,
    top: "42%",
    right: "6%",
  },
  center: {
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.lg,
    maxWidth: 400,
  },
  cardOuter: {
    width: "100%",
    maxWidth: 360,
    marginBottom: spacing.lg,
  },
  logoCardClip: {
    borderRadius: radius.xxl,
    borderWidth: StyleSheet.hairlineWidth,
    width: "100%",
    overflow: "hidden",
    ...Platform.select({
      ios: {
        shadowColor: "#18181B",
        shadowOffset: { width: 0, height: 12 },
        shadowOpacity: 0.12,
        shadowRadius: 24,
      },
      android: { elevation: 6 },
      web: {
        boxShadow: "0 20px 48px rgba(24, 24, 27, 0.1), 0 6px 16px rgba(28, 25, 23, 0.05), inset 0 1px 0 rgba(255, 253, 251, 0.9)",
      },
      default: {},
    }),
  },
  cardGoldEdge: {
    height: 3,
    width: "100%",
    opacity: 0.95,
  },
  logoCardInner: {
    paddingTop: spacing.lg,
    paddingBottom: spacing.xl,
    paddingHorizontal: spacing.xl,
    alignItems: "center",
  },
  kickerPill: {
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: "rgba(255, 236, 191, 0.68)",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(185, 28, 28, 0.18)",
    marginBottom: spacing.md,
  },
  kickerText: {
    color: ALCHEMY.brown,
    fontSize: typography.overline + 1,
    fontFamily: fonts.extrabold,
    letterSpacing: 1.2,
    textTransform: "uppercase",
  },
  tagline: {
    marginTop: spacing.md,
    fontSize: typography.bodySmall,
    letterSpacing: 0.35,
    textAlign: "center",
    lineHeight: 20,
  },
  ornamentSpacer: {
    height: spacing.md,
  },
  ornamentRow: {
    flexDirection: "row",
    alignItems: "center",
    width: "100%",
    maxWidth: 280,
    marginBottom: spacing.md,
    gap: spacing.sm,
  },
  ornamentLineFaint: {
    flex: 1,
    height: StyleSheet.hairlineWidth,
    backgroundColor: "rgba(185, 28, 28, 0.35)",
    borderRadius: 1,
  },
  spinnerWell: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: StyleSheet.hairlineWidth,
    marginTop: 2,
    marginBottom: spacing.lg,
    ...Platform.select({
      ios: {
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
      },
      android: { elevation: 2 },
      web: {
        boxShadow: "0 8px 20px rgba(24, 24, 27, 0.08), inset 0 1px 0 rgba(255, 255, 255, 0.5)",
      },
      default: {},
    }),
  },
  footnote: {
    fontSize: typography.caption,
    letterSpacing: 0.3,
  },
  peNone: {
    pointerEvents: "none",
  },
});
