/**
 * Launch overlay (iOS / Android). Mounts over the app the moment the critical fonts are in and lifts the system splash
 * on its first frame — that frame *is* the splash (flat field, emblem dead centre), so the two are one picture. It then
 * holds that still frame until the app tree has finished mounting underneath (which can freeze the UI thread for half a
 * second), plays the entrance from frame zero, and fades away once the navigation tree is up — never sooner than the
 * entrance needs, never later than `MAX_MS`.
 */
import React, { useCallback, useEffect, useRef, useState } from "react";
import { Appearance, StyleSheet, View } from "react-native";
import * as SplashScreen from "expo-splash-screen";
import Animated, {
  Easing,
  runOnJS,
  useAnimatedStyle,
  useFrameCallback,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { onAppMounted, useAppReady } from "../bootstrap/appReady";
import { STARTUP_COPY } from "../content/startupContent";
import useReducedMotion from "../hooks/useReducedMotion";
import mark from "../theme/zeevanMark.json";
import AppStartupScreen from "./AppStartupScreen";

/** Long enough for the glint to finish its lap and the wordmark to settle — counted from the start of the entrance. */
const MIN_MS = 1900;
const MIN_REDUCED_MS = 700;
/** Safety net: never hold the customer on the launch screen longer than this — counted from the first frame. */
const MAX_MS = 4500;
const FADE_MS = 460;

/**
 * The entrance starts once the UI thread has drawn without a stall for `SETTLE_QUIET_MS` since the app tree last
 * mounted (a gap between frames longer than `SETTLE_GAP_MS` is a stall). Started any earlier, the first half second
 * of the animation is eaten by the mount — the customer sees it freeze, then jump. The frame that waits is the
 * splash picture itself, so the wait is invisible. `SETTLE_MAX_MS` caps it.
 */
const SETTLE_QUIET_MS = 200;
const SETTLE_GAP_MS = 80;
const SETTLE_MAX_MS = 1500;

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
  const playedAt = useRef(0);
  const [laidOut, setLaidOut] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [gone, setGone] = useState(false);
  const opacity = useSharedValue(1);
  const quietMs = useSharedValue(0);

  const play = useCallback(() => {
    if (playedAt.current) return;
    playedAt.current = Date.now();
    setPlaying(true);
  }, []);

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

  // UI-thread stopwatch: how long the screen has been drawing smoothly since the app tree last mounted.
  const watchFrames = useCallback(
    (frame) => {
      "worklet";
      const dt = frame.timeSincePreviousFrame;
      quietMs.value = dt != null && dt <= SETTLE_GAP_MS ? quietMs.value + dt : 0;
      if (quietMs.value >= SETTLE_QUIET_MS) {
        quietMs.value = -1e9;
        runOnJS(play)();
      }
    },
    [quietMs, play]
  );
  const watcher = useFrameCallback(watchFrames, false);

  useEffect(() => {
    watcher.setActive(laidOut && !playing);
  }, [watcher, laidOut, playing]);

  // Every (re)mount of the navigation tree restarts the stopwatch — the freeze it causes is the one we are waiting out.
  useEffect(
    () =>
      onAppMounted(() => {
        quietMs.value = 0;
      }),
    [quietMs]
  );

  // Reduce Motion has no entrance to protect, and a stuck watcher must not hold the customer on the splash.
  useEffect(() => {
    if (!laidOut) return undefined;
    if (reduced) {
      play();
      return undefined;
    }
    const timer = setTimeout(play, Math.max(0, SETTLE_MAX_MS - (Date.now() - shownAt.current)));
    return () => clearTimeout(timer);
  }, [laidOut, reduced, play]);

  useEffect(() => {
    if (!playing) return undefined;
    const sincePlay = Date.now() - playedAt.current;
    const sinceShown = Date.now() - shownAt.current;
    const wait = ready
      ? Math.max(0, (reduced ? MIN_REDUCED_MS : MIN_MS) - sincePlay)
      : Math.max(0, MAX_MS - sinceShown);
    const timer = setTimeout(lift, wait);
    return () => clearTimeout(timer);
  }, [playing, ready, reduced, lift]);

  // Fading out, the whole picture drifts a touch toward the viewer — the app seems to open out of the emblem.
  const style = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: 1 + 0.05 * (1 - opacity.value) }],
  }));

  if (gone) return null;
  return (
    <Animated.View style={[styles.overlay, style]} onLayout={onLayout} pointerEvents="auto">
      <AppStartupScreen isDark={dark} footnote={STARTUP_COPY.boot} play={playing} />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  overlay: { ...StyleSheet.absoluteFillObject, zIndex: 1000 },
});
