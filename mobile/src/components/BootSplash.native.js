/**
 * Launch overlay (iOS / Android). Mounts over the app the moment the critical fonts are in, lifts the system splash
 * on its first frame (so the two are the same picture), plays the startup animation, then fades away once the
 * navigation tree is up — never sooner than the animation needs, never later than `MAX_MS`.
 */
import React, { useCallback, useEffect, useRef, useState } from "react";
import { Appearance, StyleSheet, View } from "react-native";
import * as SplashScreen from "expo-splash-screen";
import Animated, { Easing, runOnJS, useAnimatedStyle, useSharedValue, withTiming } from "react-native-reanimated";
import { useAppReady } from "../bootstrap/appReady";
import { STARTUP_COPY } from "../content/startupContent";
import useReducedMotion from "../hooks/useReducedMotion";
import mark from "../theme/zeevanMark.json";
import AppStartupScreen from "./AppStartupScreen";

/** Long enough for the glint to finish its lap and the wordmark to settle. */
const MIN_MS = 1900;
const MIN_REDUCED_MS = 700;
/** Safety net: never hold the customer on the launch screen longer than this. */
const MAX_MS = 4500;
const FADE_MS = 460;

/** A flat field in the system splash's colour — shown while the fonts load, so nothing flashes if the OS splash lifts early. */
export function BootBackdrop() {
  const dark = Appearance.getColorScheme() === "dark";
  return <View style={[StyleSheet.absoluteFill, { backgroundColor: dark ? mark.background.dark : mark.background.light }]} />;
}

export default function BootSplash() {
  const ready = useAppReady();
  const reduced = useReducedMotion();
  // The OS splash follows the system appearance and the saved theme isn't known yet — match the OS.
  const dark = useRef(Appearance.getColorScheme() === "dark").current;
  const shownAt = useRef(0);
  const [laidOut, setLaidOut] = useState(false);
  const [gone, setGone] = useState(false);
  const opacity = useSharedValue(1);

  const onLayout = useCallback(() => {
    if (shownAt.current) return;
    shownAt.current = Date.now();
    setLaidOut(true);
    // The first frame of this overlay matches the system splash, so lifting it now shows no seam.
    SplashScreen.hideAsync().catch(() => {});
  }, []);

  const lift = useCallback(() => {
    opacity.value = withTiming(0, { duration: FADE_MS, easing: Easing.out(Easing.quad) }, (finished) => {
      if (finished) runOnJS(setGone)(true);
    });
  }, [opacity]);

  useEffect(() => {
    if (!laidOut) return undefined;
    const elapsed = Date.now() - shownAt.current;
    const wait = ready ? Math.max(0, (reduced ? MIN_REDUCED_MS : MIN_MS) - elapsed) : Math.max(0, MAX_MS - elapsed);
    const timer = setTimeout(lift, wait);
    return () => clearTimeout(timer);
  }, [laidOut, ready, reduced, lift]);

  // Fading out, the whole picture drifts a touch toward the viewer — the app seems to open out of the emblem.
  const style = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: 1 + 0.05 * (1 - opacity.value) }],
  }));

  if (gone) return null;
  return (
    <Animated.View style={[styles.overlay, style]} onLayout={onLayout} pointerEvents="auto">
      <AppStartupScreen isDark={dark} footnote={STARTUP_COPY.boot} />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  overlay: { ...StyleSheet.absoluteFillObject, zIndex: 1000 },
});
