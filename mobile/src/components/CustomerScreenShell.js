import React, { useEffect } from "react";
import { Platform, StyleSheet, View } from "react-native";
import { KANKREG_PALETTE } from "../theme/kankregWeb";
import { LinearGradient } from "expo-linear-gradient";
import Animated, {
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  Extrapolation,
} from "react-native-reanimated";
import { useTheme } from "../context/ThemeContext";
import {
  CUSTOMER_SHELL_GRADIENT_LOCATIONS,
  getAlchemyPalette,
  getCustomerShellGradient,
} from "../theme/customerAlchemy";
import { getSemanticColors } from "../theme/tokens";
import { useScrollOffsetValue } from "../hooks/useScrollOffset";
import useReducedMotion from "../hooks/useReducedMotion";
import { useKankregLayout } from "../theme/kankregBreakpoints";

const AnimatedView = Animated.createAnimatedComponent(View);

/**
 * Full-screen gradient + ambient backdrop used by every customer screen.
 *
 * Light: warm cream editorial (aligned with Home / Cart). Dark: theme gradient.
 * Layered atmosphere makes inner pages feel premium without owning their own art.
 *
 * Now reads `scrollY` from `ScrollOffsetContext` to dim/move backdrop orbs as the
 * user scrolls, and (web-only) tracks the cursor for a subtle spotlight glow
 * behind the content layer. All effects respect `useReducedMotion`.
 *
 * Props:
 *  - `topAccent` (default true): show the soft top sheen. Disable on screens
 *    that already render a hero image at the very top (avoids double-bleed).
 *  - `style`: extra style applied to the inner content View.
 */
export default function CustomerScreenShell({ children, style, topAccent = true }) {
  const shellLayout = Platform.OS === "web" ? styles.webShell : null;
  const { colors: c, isDark } = useTheme();
  const reducedMotion = useReducedMotion();
  const { isMobileWeb } = useKankregLayout();
  const liteWebChrome = Platform.OS === "web";
  const shellColors = getCustomerShellGradient(isDark, c);
  const semantic = getSemanticColors(c);
  const alchemy = getAlchemyPalette(c, isDark);
  const scrollY = useScrollOffsetValue();

  const cursorX = useSharedValue(-1000);
  const cursorY = useSharedValue(-1000);
  const cursorOpacity = useSharedValue(0);

  useEffect(() => {
    if (Platform.OS !== "web" || liteWebChrome) return undefined;
    if (typeof globalThis === "undefined" || typeof globalThis.window === "undefined") {
      return undefined;
    }
    const win = globalThis.window;
    let frame = null;
    let nextX = -1000;
    let nextY = -1000;
    const apply = () => {
      cursorX.value = nextX;
      cursorY.value = nextY;
      frame = null;
    };
    const onMove = (event) => {
      nextX = event.clientX;
      nextY = event.clientY;
      if (frame == null) {
        frame = win.requestAnimationFrame(apply);
      }
      cursorOpacity.value = withTiming(1, { duration: 240 });
    };
    const onLeave = () => {
      cursorOpacity.value = withTiming(0, { duration: 320 });
    };
    win.addEventListener("mousemove", onMove, { passive: true });
    win.addEventListener("mouseleave", onLeave);
    return () => {
      win.removeEventListener("mousemove", onMove);
      win.removeEventListener("mouseleave", onLeave);
      if (frame != null) {
        win.cancelAnimationFrame(frame);
      }
    };
  }, [cursorX, cursorY, cursorOpacity, liteWebChrome]);

  const orbTopStyle = useAnimatedStyle(() => {
    if (liteWebChrome) return {};
    const ty = interpolate(
      scrollY.value,
      [0, 400],
      [0, -60],
      Extrapolation.CLAMP
    );
    const op = interpolate(
      scrollY.value,
      [0, 400],
      [1, 0.45],
      Extrapolation.CLAMP
    );
    return {
      transform: [{ translateY: ty }],
      opacity: op,
    };
  }, [liteWebChrome]);

  const orbBottomStyle = useAnimatedStyle(() => {
    if (liteWebChrome) return {};
    const ty = interpolate(
      scrollY.value,
      [0, 400],
      [0, 30],
      Extrapolation.CLAMP
    );
    const op = interpolate(
      scrollY.value,
      [0, 400],
      [1, 0.55],
      Extrapolation.CLAMP
    );
    return {
      transform: [{ translateY: ty }],
      opacity: op,
    };
  }, [liteWebChrome]);

  const cursorStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: cursorX.value - 240 },
      { translateY: cursorY.value - 240 },
    ],
    opacity: cursorOpacity.value,
  }));

  if (Platform.OS !== "web") {
    return (
      <View
        style={[
          styles.base,
          { backgroundColor: isDark ? c.background : KANKREG_PALETTE.paper },
          style,
        ]}
      >
        {children}
      </View>
    );
  }

  return (
    <View style={[styles.base, { backgroundColor: c.background }]}>
      <LinearGradient
        colors={shellColors}
        locations={CUSTOMER_SHELL_GRADIENT_LOCATIONS}
        start={{ x: 0.06, y: 0 }}
        end={{ x: 0.94, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <LinearGradient
        colors={
          isDark
            ? [alchemy.goldSoft, "transparent", semantic.bg.overlay, "rgba(0, 0, 0, 0.32)"]
            : [alchemy.goldSoft, "transparent", semantic.bg.overlay, "rgba(22, 69, 51, 0.04)"]
        }
        locations={[0, 0.24, 0.52, 1]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.ambientWash, styles.peNone]}
      />
      <LinearGradient
        colors={
          isDark
            ? ["rgba(0,0,0,0.15)", "transparent", "transparent", "rgba(0,0,0,0.4)"]
            : ["rgba(22, 69, 51, 0.025)", "transparent", "transparent", "rgba(90, 62, 22, 0.045)"]
        }
        locations={[0, 0.2, 0.62, 1]}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={[styles.edgeVignette, styles.peNone]}
      />
      <AnimatedView
        style={[
          styles.orbTop,
          { backgroundColor: alchemy.glowPrimary },
          styles.peNone,
          orbTopStyle,
        ]}
      />
      <AnimatedView
        style={[
          styles.orbBottom,
          { backgroundColor: alchemy.glowSecondary },
          styles.peNone,
          orbBottomStyle,
        ]}
      />
      {Platform.OS === "web" && !liteWebChrome ? (
        <AnimatedView
          style={[
            styles.cursorSpotlight,
            {
              backgroundColor: isDark
                ? "rgba(255, 234, 170, 0.05)"
                : "rgba(255, 234, 170, 0.14)",
            },
            styles.peNone,
            cursorStyle,
          ]}
        />
      ) : null}
      {Platform.OS === "web" ? (
        <LinearGradient
          colors={
            isDark
              ? ["rgba(255,255,255,0.04)", "transparent", "rgba(0,0,0,0.12)"]
              : ["rgba(255,255,255,0.62)", "transparent", "rgba(22, 69, 51, 0.05)"]
          }
          locations={[0, 0.5, 1]}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
          style={[styles.webSheet, styles.peNone]}
        />
      ) : null}
      {topAccent ? (
        <LinearGradient
          colors={
            isDark
              ? ["rgba(52, 211, 153, 0.11)", "transparent", "rgba(0,0,0,0.1)"]
              : ["rgba(255,255,255,0.5)", "transparent", "rgba(22, 69, 51, 0.04)"]
          }
          locations={[0, 0.36, 1]}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
          style={[styles.topSheen, styles.peNone]}
        />
      ) : null}
      <View style={[styles.content, shellLayout, style]}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    flex: 1,
    width: "100%",
    position: "relative",
    ...Platform.select({
      web: { overflowX: "clip", overflowY: "visible" },
      default: { overflow: "hidden" },
    }),
  },
  webShell: {
    width: "100%",
    maxWidth: "100%",
    minWidth: 0,
    overflowX: "clip",
  },
  ambientWash: {
    ...StyleSheet.absoluteFillObject,
  },
  edgeVignette: {
    ...StyleSheet.absoluteFillObject,
  },
  orbTop: {
    position: "absolute",
    width: 300,
    height: 300,
    borderRadius: 150,
    top: -108,
    right: -94,
    opacity: 0.86,
    ...Platform.select({
      web: { filter: "blur(38px)" },
      default: {},
    }),
  },
  orbBottom: {
    position: "absolute",
    width: 360,
    height: 360,
    borderRadius: 180,
    left: -162,
    bottom: -162,
    opacity: 0.84,
    ...Platform.select({
      web: { filter: "blur(46px)" },
      default: {},
    }),
  },
  cursorSpotlight: {
    position: "absolute",
    top: 0,
    left: 0,
    width: 480,
    height: 480,
    borderRadius: 240,
    ...Platform.select({
      web: { filter: "blur(80px)" },
      default: {},
    }),
  },
  content: {
    flex: 1,
    width: "100%",
    minHeight: Platform.OS === "web" ? "100dvh" : undefined,
    ...Platform.select({
      web: { overflow: "visible" },
      default: {},
    }),
  },
  webSheet: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.92,
    ...Platform.select({
      web: {
        backdropFilter: "blur(1px)",
      },
      default: {},
    }),
  },
  topSheen: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 170,
    opacity: 0.9,
  },
  peNone: {
    pointerEvents: "none",
  },
});
