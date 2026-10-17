import React, { useMemo } from "react";
import { Platform, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import Animated, { FadeIn } from "react-native-reanimated";
import { fonts, spacing } from "../theme/tokens";
import { APP_TAGLINE, BRAND_LOGO_SIZE } from "../constants/brand";
import { LOADING_THEME } from "../theme/loadingTheme";
import { injectWebCssOnce } from "../utils/injectWebCssOnce";
import BrandLogo from "./BrandLogo";
import { GoldRingLoader, IndeterminateProgressBar } from "./loading";

const GRAIN_URI =
  "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='90' height='90'><filter id='n'><feTurbulence baseFrequency='.9'/></filter><rect width='100%25' height='100%25' filter='url(%23n)'/></svg>";

injectWebCssOnce(
  "zeevan-boot-splash-v1",
  `@keyframes zeevanBootOrb {
  0%, 100% { transform: scale(1); opacity: 0.35; }
  50% { transform: scale(1.12); opacity: 0.65; }
}
@keyframes zeevanBootDust {
  0% { transform: translateY(8px); opacity: 0; }
  20% { opacity: 0.85; }
  100% { transform: translateY(-70vh); opacity: 0; }
}
.zeevan-boot-orb {
  position: absolute;
  border-radius: 50%;
  pointer-events: none;
  background: radial-gradient(circle, rgba(245,215,142,0.55) 0%, rgba(212,160,60,0.15) 45%, transparent 70%);
  animation: zeevanBootOrb 7s ease-in-out infinite;
}
.zeevan-boot-dust {
  position: absolute;
  width: 3px;
  height: 3px;
  border-radius: 50%;
  pointer-events: none;
  background: #F5D78E;
  box-shadow: 0 0 6px 1px rgba(245,215,142,0.5);
  animation: zeevanBootDust var(--dur, 8s) linear infinite;
  animation-delay: var(--delay, 0s);
}
@media (prefers-reduced-motion: reduce) {
  .zeevan-boot-orb, .zeevan-boot-dust { animation: none !important; opacity: 0.25; }
}`
);

/**
 * Premium launch loader — full screen until store data is ready.
 * `coverChrome`: web pe header/nav ke upar fixed overlay.
 */
export default function AppStartupScreen({
  useAppFonts = true,
  footnote = "Opening your Zeevan pantry…",
  isDark = false,
  coverChrome = false,
}) {
  const footFont = useAppFonts ? { fontFamily: fonts.medium } : {};
  const gradient = useMemo(
    () => (isDark ? LOADING_THEME.splashRadialDark : LOADING_THEME.splashRadialLight),
    [isDark]
  );
  const textPrimary = isDark ? "rgba(245,239,228,0.9)" : "rgba(255,255,255,0.9)";
  const textMuted = isDark ? "rgba(245,239,228,0.62)" : "rgba(255,255,255,0.72)";

  return (
    <SafeAreaView
      style={[styles.safe, coverChrome && Platform.OS === "web" && styles.coverChrome]}
      edges={coverChrome ? [] : ["top", "bottom"]}
    >
      <LinearGradient
        colors={gradient}
        locations={isDark ? [0, 0.55, 1] : [0, 0.48, 1]}
        start={{ x: 0.5, y: 0.18 }}
        end={{ x: 0.5, y: 1.25 }}
        style={styles.root}
      >
        {Platform.OS === "web" ? (
          <>
            <View
              style={[
                styles.grain,
                { backgroundImage: `url("${GRAIN_URI}")`, opacity: isDark ? 0.18 : 0.28 },
              ]}
            />
            <div className="zeevan-boot-orb" style={{ top: "12%", left: "8%", width: 160, height: 160 }} />
            <div
              className="zeevan-boot-orb"
              style={{ top: "18%", right: "6%", width: 120, height: 120, animationDelay: "1.4s" }}
            />
            <div
              className="zeevan-boot-orb"
              style={{ bottom: "22%", left: "14%", width: 100, height: 100, animationDelay: "2.2s" }}
            />
            {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
              <div
                key={i}
                className="zeevan-boot-dust"
                style={{
                  left: `${10 + i * 11}%`,
                  bottom: "8%",
                  ["--delay"]: `${i * 0.7}s`,
                  ["--dur"]: `${7 + (i % 3)}s`,
                }}
              />
            ))}
          </>
        ) : (
          <View style={[styles.grainNative, isDark && styles.grainNativeDark]} />
        )}

        <Animated.View entering={FadeIn.duration(520)} style={styles.center}>
          <BrandLogo
            height={BRAND_LOGO_SIZE.startup}
            variant="onDark"
            glow
            style={styles.logo}
          />
          <Text style={[styles.tagline, footFont, { color: textMuted }]}>{APP_TAGLINE}</Text>
          <GoldRingLoader size={56} light={!isDark} style={styles.ring} />
        </Animated.View>

        <Animated.View entering={FadeIn.duration(420).delay(140)} style={styles.footer}>
          <Text style={[styles.footnote, footFont, { color: textPrimary }]}>{footnote}</Text>
          <IndeterminateProgressBar light={!isDark} height={3} style={styles.bar} />
          <Text style={[styles.est, footFont, { color: textMuted }]}>
            PURE · SLOW · LOCAL
          </Text>
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
    marginBottom: spacing.md,
  },
  tagline: {
    fontSize: 12,
    letterSpacing: 2.4,
    textTransform: "uppercase",
    textAlign: "center",
    marginTop: 4,
  },
  ring: {
    marginTop: 36,
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
    letterSpacing: 0.4,
    marginBottom: 14,
    textAlign: "center",
  },
  bar: {
    width: "100%",
    maxWidth: 260,
  },
  est: {
    marginTop: spacing.lg,
    fontSize: 10,
    letterSpacing: 2.6,
    textTransform: "uppercase",
    textAlign: "center",
  },
});
