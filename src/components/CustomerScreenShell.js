import React, { useEffect } from "react";
import { Platform, StyleSheet, View } from "react-native";
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
 *  - `variant` (`customer` | `admin` | `auth`): shell mood preset.
 *  - `topAccent` (default true): show the soft top sheen. Disable on screens
 *    that already render a hero image at the very top (avoids double-bleed).
 *  - `style`: extra style applied to the inner content View.
 */
export default function CustomerScreenShell({
  children,
  style,
  topAccent = true,
  variant = "customer",
}) {
  const { colors: c, isDark } = useTheme();
  const reducedMotion = useReducedMotion();
  const shellColors = getCustomerShellGradient(isDark, c);
  const semantic = getSemanticColors(c);
  const alchemy = getAlchemyPalette(c, isDark);
  const scrollY = useScrollOffsetValue();
  const isWeb = Platform.OS === "web";
  const isAdminVariant = variant === "admin";
  const isAuthVariant = variant === "auth";
  const showCursorSpotlight = isWeb && !reducedMotion && !isAuthVariant;

  const cursorX = useSharedValue(-1000);
  const cursorY = useSharedValue(-1000);
  const cursorOpacity = useSharedValue(0);

  useEffect(() => {
    if (!showCursorSpotlight) return undefined;
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
  }, [cursorX, cursorY, cursorOpacity, reducedMotion, showCursorSpotlight]);

  const orbTopStyle = useAnimatedStyle(() => {
    if (reducedMotion) return {};
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
  }, [reducedMotion]);

  const orbBottomStyle = useAnimatedStyle(() => {
    if (reducedMotion) return {};
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
  }, [reducedMotion]);

  const cursorStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: cursorX.value - 240 },
      { translateY: cursorY.value - 240 },
    ],
    opacity: cursorOpacity.value,
  }));

  const ambientWashColors = isDark
    ? isAdminVariant
      ? ["rgba(248,113,113,0.04)", "rgba(59,130,246,0.02)", semantic.bg.overlay, "rgba(0, 0, 0, 0.18)"]
      : ["rgba(220,38,38,0.05)", "rgba(248,113,113,0.015)", semantic.bg.overlay, "rgba(0, 0, 0, 0.16)"]
    : isAdminVariant
      ? ["rgba(255,255,255,0.72)", "rgba(59,130,246,0.025)", semantic.bg.overlay, "rgba(15, 23, 42, 0.03)"]
      : ["rgba(220,38,38,0.05)", "rgba(255,255,255,0.05)", semantic.bg.overlay, "rgba(63, 63, 70, 0.02)"];

  const edgeVignetteColors = isDark
    ? isAdminVariant
      ? ["rgba(15,23,42,0.12)", "transparent", "transparent", "rgba(0,0,0,0.26)"]
      : ["rgba(0,0,0,0.08)", "transparent", "transparent", "rgba(0,0,0,0.22)"]
    : isAdminVariant
      ? ["rgba(37,99,235,0.03)", "transparent", "transparent", "rgba(15,23,42,0.04)"]
      : ["rgba(63, 63, 70, 0.015)", "transparent", "transparent", "rgba(90, 62, 22, 0.025)"];

  const topSheenColors = isDark
    ? isAdminVariant
      ? ["rgba(96, 165, 250, 0.06)", "transparent", "rgba(0,0,0,0.08)"]
      : ["rgba(220, 38, 38, 0.05)", "transparent", "rgba(0,0,0,0.04)"]
    : isAuthVariant
      ? ["rgba(255,255,255,0.68)", "transparent", "rgba(37,99,235,0.035)"]
      : isAdminVariant
        ? ["rgba(255,255,255,0.58)", "transparent", "rgba(15,23,42,0.03)"]
        : ["rgba(255,255,255,0.26)", "transparent", "rgba(63, 63, 70, 0.02)"];

  return (
    <View style={[styles.base, { backgroundColor: c.background }]}>
      <LinearGradient
        colors={shellColors}
        locations={CUSTOMER_SHELL_GRADIENT_LOCATIONS}
        start={{ x: 0.06, y: 0 }}
        end={{ x: 0.94, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      {isWeb ? (
        <>
          <LinearGradient
            colors={ambientWashColors}
            locations={[0, 0.24, 0.52, 1]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[styles.ambientWash, styles.peNone]}
          />
          <LinearGradient
            colors={edgeVignetteColors}
            locations={[0, 0.2, 0.62, 1]}
            start={{ x: 0.5, y: 0 }}
            end={{ x: 0.5, y: 1 }}
            style={[styles.edgeVignette, styles.peNone]}
          />
          <AnimatedView
            style={[
              styles.orbTop,
              {
                backgroundColor: isAdminVariant
                  ? semantic.accent.info
                    ? `${semantic.accent.info}14`
                    : alchemy.glowPrimary
                  : alchemy.glowPrimary,
              },
              styles.peNone,
              isAdminVariant ? styles.orbTopAdmin : null,
              isAuthVariant ? styles.orbTopAuth : null,
              orbTopStyle,
            ]}
          />
          <AnimatedView
            style={[
              styles.orbBottom,
              {
                backgroundColor: isAdminVariant
                  ? "rgba(148, 163, 184, 0.12)"
                  : alchemy.glowSecondary,
              },
              styles.peNone,
              isAdminVariant ? styles.orbBottomAdmin : null,
              isAuthVariant ? styles.orbBottomAuth : null,
              orbBottomStyle,
            ]}
          />
        </>
      ) : null}
      {isWeb && isAuthVariant ? (
        <LinearGradient
          colors={
            isDark
              ? ["rgba(220, 38, 38, 0.18)", "rgba(255, 224, 163, 0.08)", "transparent"]
              : ["rgba(255, 255, 255, 0.54)", "rgba(255, 224, 163, 0.18)", "transparent"]
          }
          locations={[0, 0.5, 1]}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
          style={[styles.authHalo, styles.peNone]}
        />
      ) : null}
      {showCursorSpotlight ? (
        <AnimatedView
          style={[
            styles.cursorSpotlight,
            {
              backgroundColor: isDark
                ? "rgba(248, 113, 113, 0.08)"
                : "rgba(220, 38, 38, 0.12)",
            },
            styles.peNone,
            cursorStyle,
          ]}
        />
      ) : null}
      {isWeb && topAccent ? (
        <LinearGradient
          colors={topSheenColors}
          locations={[0, 0.36, 1]}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
          style={[styles.topSheen, styles.peNone]}
        />
      ) : null}
      <View style={[styles.content, style]}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    flex: 1,
    width: "100%",
    position: "relative",
    overflow: Platform.OS === "web" ? "visible" : "hidden",
  },
  ambientWash: {
    ...StyleSheet.absoluteFillObject,
  },
  edgeVignette: {
    ...StyleSheet.absoluteFillObject,
  },
  orbTop: {
    position: "absolute",
    width: 200,
    height: 200,
    borderRadius: 100,
    top: -64,
    right: -52,
    opacity: 0.32,
    ...Platform.select({
      web: { filter: "blur(30px)" },
      default: {},
    }),
  },
  orbBottom: {
    position: "absolute",
    width: 236,
    height: 236,
    borderRadius: 118,
    left: -96,
    bottom: -96,
    opacity: 0.26,
    ...Platform.select({
      web: { filter: "blur(34px)" },
      default: {},
    }),
  },
  orbTopAdmin: {
    width: 240,
    height: 240,
    borderRadius: 120,
    top: -82,
    right: -60,
    opacity: 0.46,
  },
  orbBottomAdmin: {
    width: 300,
    height: 300,
    borderRadius: 150,
    left: -120,
    bottom: -120,
    opacity: 0.34,
  },
  orbTopAuth: {
    top: -72,
    opacity: 0.62,
  },
  orbBottomAuth: {
    opacity: 0.48,
  },
  authHalo: {
    position: "absolute",
    top: "10%",
    left: "12%",
    right: "12%",
    height: 220,
    borderRadius: 999,
    opacity: 0.72,
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
  },
  topSheen: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 104,
    opacity: 0.34,
  },
  peNone: {
    pointerEvents: "none",
  },
});
