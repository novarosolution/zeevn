import React, { useEffect } from "react";
import { Platform, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import Animated, {
  Easing,
  FadeIn,
  cancelAnimation,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import { fonts, spacing } from "../theme/tokens";
import { APP_WORDMARK_SUBLINE, BRAND_LOGO_SIZE } from "../constants/brand";
import { KANKREG_PALETTE, ZEEVAN_GOLD, ZEEVAN_GREEN } from "../theme/kankregWeb";
import { LOADING_THEME } from "../theme/loadingTheme";
import BrandLogo from "./BrandLogo";
import useReducedMotion from "../hooks/useReducedMotion";

function BreathLogo({ children, reduced }) {
  const scale = useSharedValue(1);

  useEffect(() => {
    if (reduced) {
      scale.value = 1;
      return undefined;
    }
    scale.value = withRepeat(
      withSequence(
        withTiming(1.028, { duration: 1600, easing: Easing.inOut(Easing.sin) }),
        withTiming(1, { duration: 1600, easing: Easing.inOut(Easing.sin) })
      ),
      -1,
      false
    );
    return () => cancelAnimation(scale);
  }, [reduced, scale]);

  const style = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return <Animated.View style={style}>{children}</Animated.View>;
}

function SlimProgress({ track, fill, reduced }) {
  const x = useSharedValue(0);

  useEffect(() => {
    if (reduced) {
      x.value = 0.45;
      return undefined;
    }
    x.value = withRepeat(
      withTiming(1, { duration: LOADING_THEME.progressDurationMs, easing: Easing.inOut(Easing.quad) }),
      -1,
      false
    );
    return () => cancelAnimation(x);
  }, [reduced, x]);

  const barStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: -48 + x.value * 168 }],
  }));

  return (
    <View
      style={[styles.track, { backgroundColor: track }]}
      accessibilityRole="progressbar"
      accessibilityLabel="Loading"
    >
      <Animated.View style={[styles.fill, { backgroundColor: fill }, !reduced && barStyle]} />
    </View>
  );
}

/**
 * Premium atelier boot screen — cream field, brand, soft progress.
 */
export default function AppStartupScreen({
  useAppFonts = true,
  footnote = "Opening your Zeevan pantry…",
  isDark = false,
  coverChrome = false,
}) {
  const reduceMotion = useReducedMotion();
  const labelFont = useAppFonts ? { fontFamily: fonts.medium } : {};
  const muted = isDark ? "rgba(250,248,244,0.58)" : KANKREG_PALETTE.inkFaint;
  const ink = isDark ? KANKREG_PALETTE.paper : KANKREG_PALETTE.inkSoft;
  const gold = isDark ? ZEEVAN_GOLD.bright : ZEEVAN_GOLD.deep;
  const fill = isDark ? ZEEVAN_GOLD.base : ZEEVAN_GREEN.base;
  const track = isDark ? "rgba(250,248,244,0.12)" : "rgba(85,107,50,0.12)";
  const gradient = isDark ? LOADING_THEME.splashRadialDark : LOADING_THEME.splashRadialLight;

  return (
    <SafeAreaView
      style={[styles.safe, coverChrome && Platform.OS === "web" && styles.coverChrome]}
      edges={coverChrome ? [] : ["top", "bottom"]}
    >
      <LinearGradient colors={gradient} locations={[0, 0.55, 1]} style={styles.root}>
        <View
          style={[styles.glow, styles.glowPrimary, isDark ? styles.glowPrimaryDark : styles.glowPrimaryLight]}
          pointerEvents="none"
        />
        <View
          style={[styles.glow, styles.glowSecondary, isDark ? styles.glowSecondaryDark : styles.glowSecondaryLight]}
          pointerEvents="none"
        />

        <Animated.View entering={FadeIn.duration(560)} style={styles.center}>
          <BreathLogo reduced={reduceMotion}>
            <BrandLogo
              height={BRAND_LOGO_SIZE.startup}
              variant={isDark ? "onDark" : "onLight"}
              glow={false}
            />
          </BreathLogo>

          <View style={[styles.rule, { backgroundColor: gold }]} />

          <Text style={[styles.subline, labelFont, { color: ink }]}>{APP_WORDMARK_SUBLINE}</Text>

          <Animated.View entering={FadeIn.duration(420).delay(180)} style={styles.progressWrap}>
            <SlimProgress track={track} fill={fill} reduced={reduceMotion} />
          </Animated.View>
        </Animated.View>

        <Animated.View entering={FadeIn.duration(400).delay(220)} style={styles.footer}>
          <Text style={[styles.footnote, labelFont, { color: muted }]}>{footnote}</Text>
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
  coverChrome: {
    ...Platform.select({
      web: {
        position: "fixed",
        inset: 0,
        zIndex: 100000,
        width: "100vw",
        height: "100vh",
      },
      default: {},
    }),
  },
  root: {
    flex: 1,
    width: "100%",
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
    overflow: "hidden",
    ...Platform.select({
      web: { minHeight: "100%" },
      default: {},
    }),
  },
  glow: {
    position: "absolute",
    borderRadius: 999,
    ...Platform.select({
      web: { filter: "blur(56px)" },
      default: {},
    }),
  },
  glowPrimary: {
    width: 340,
    height: 340,
    top: "22%",
    alignSelf: "center",
  },
  glowPrimaryLight: {
    backgroundColor: "rgba(85, 107, 50, 0.16)",
  },
  glowPrimaryDark: {
    backgroundColor: "rgba(212, 165, 116, 0.14)",
  },
  glowSecondary: {
    width: 220,
    height: 220,
    bottom: "18%",
    right: "-6%",
  },
  glowSecondaryLight: {
    backgroundColor: "rgba(212, 165, 116, 0.14)",
  },
  glowSecondaryDark: {
    backgroundColor: "rgba(122, 143, 68, 0.12)",
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.lg,
    zIndex: 2,
  },
  rule: {
    width: 36,
    height: StyleSheet.hairlineWidth * 2,
    marginTop: 22,
    marginBottom: 14,
    opacity: 0.85,
  },
  subline: {
    fontSize: 12,
    letterSpacing: 2.4,
    textTransform: "uppercase",
    textAlign: "center",
    maxWidth: 300,
    lineHeight: 18,
  },
  progressWrap: {
    marginTop: 36,
    width: 120,
  },
  track: {
    height: 2,
    width: "100%",
    borderRadius: 2,
    overflow: "hidden",
  },
  fill: {
    position: "absolute",
    top: 0,
    bottom: 0,
    width: "42%",
    borderRadius: 2,
  },
  footer: {
    width: "100%",
    paddingHorizontal: 40,
    paddingBottom: 40,
    zIndex: 2,
    alignItems: "center",
  },
  footnote: {
    fontSize: 12,
    letterSpacing: 0.3,
    textAlign: "center",
  },
});
