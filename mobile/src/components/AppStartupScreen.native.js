/**
 * Native startup screen — the first thing a customer sees after the system splash.
 *
 * Frame zero is the splash itself (flat cream / espresso field, the gold emblem dead centre), so the OS hands over with no
 * seam. Then: a warm bloom lifts behind the emblem, a gold glint circles the ring, the emblem glides up as the
 * wordmark rises into place, the tagline settles under it and a few gold motes drift past. Only transforms and opacity
 * animate (on the UI thread), so a busy JS thread cannot make it stutter.
 *
 * `intro={false}` skips the entrance and keeps just the gentle idle glint — used where this stands in for a loading
 * page (e.g. while the session is restored). `play={false}` holds frame zero (the splash picture, nothing animating)
 * until it flips to true — the launch overlay uses it so the entrance starts only once the system splash is gone and
 * the app has finished mounting. Metro picks this file over `AppStartupScreen.js` on iOS/Android only.
 */
import React, { useEffect } from "react";
import { Image, Platform, StyleSheet, Text, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import Animated, {
  Easing,
  cancelAnimation,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { APP_WORDMARK_SUBLINE, ZEEVAN_BRAND_ASSETS } from "../constants/brand";
import { STARTUP_COPY } from "../content/startupContent";
import { useTheme } from "../context/ThemeContext";
import useReducedMotion from "../hooks/useReducedMotion";
import { withAlpha } from "../theme/storefront";
import mark from "../theme/zeevanMark.json";
import { fonts } from "../theme/tokens";
import { EmblemBloom } from "./startup/ZeevanEmblem";

/** Same canvas as the native splash image (iOS 240 pt, Android 288 dp), so the emblem lands exactly on the OS splash. */
const CANVAS = Platform.OS === "android" ? 288 : 240;
const U = CANVAS / 160;
const BLOOM = Math.round(CANVAS * 1.9);
const LIFT = 36;
const MARK_BOTTOM = CANVAS * 0.42;
const LOCKUP_GAP = 26;

/** The "Zeevan" band of the brand PNG (the tagline under it is set as centred text instead of the PNG's left-aligned one). */
const WORDMARK = { width: 1024, height: 320, right: 846, top: 84, bottom: 262 };
const WORD_W = 210;
const WORD_K = WORD_W / WORDMARK.right;
const WORD_H = Math.round((WORDMARK.bottom - WORDMARK.top) * WORD_K);

/** Gold motes drifting up around the ring: position from the emblem centre in mark units (all outside the ring), core diameter in px. */
const DUST = [
  { x: -58, y: 24, size: 3, duration: 4600, delay: 500 },
  { x: 54, y: 34, size: 2.5, duration: 5200, delay: 1100 },
  { x: -36, y: 62, size: 3.5, duration: 5800, delay: 200 },
  { x: 60, y: -4, size: 2.5, duration: 4300, delay: 1700 },
  { x: -62, y: -12, size: 2.5, duration: 5000, delay: 900 },
  { x: 30, y: 64, size: 3, duration: 6100, delay: 1500 },
  { x: -14, y: -58, size: 2.5, duration: 5400, delay: 2000 },
];

function paletteFor(dark) {
  return dark
    ? {
        bg: mark.background.dark,
        gold: "#E8C27A",
        muted: "rgba(250, 248, 244, 0.5)",
        wash: ["rgba(0, 0, 0, 0)", "rgba(0, 0, 0, 0.42)"],
        wordmark: ZEEVAN_BRAND_ASSETS.wordmarkLight || ZEEVAN_BRAND_ASSETS.wordmark,
        dust: mark.palette.dark.dust,
      }
    : {
        bg: mark.background.light,
        gold: "#A8772B",
        muted: "rgba(74, 63, 48, 0.55)",
        wash: ["rgba(214, 162, 76, 0)", "rgba(214, 162, 76, 0.14)"],
        wordmark: ZEEVAN_BRAND_ASSETS.wordmark,
        dust: mark.palette.light.dust,
      };
}

function Mote({ x, y, size, duration, delay, color, enabled }) {
  const t = useSharedValue(0);
  useEffect(() => {
    if (!enabled) return undefined;
    t.value = withDelay(delay, withRepeat(withTiming(1, { duration, easing: Easing.linear }), -1, false));
    return () => cancelAnimation(t);
  }, [enabled, delay, duration, t]);
  const style = useAnimatedStyle(() => ({
    opacity: interpolate(t.value, [0, 0.2, 0.7, 1], [0, 0.95, 0.55, 0]),
    transform: [{ translateY: -interpolate(t.value, [0, 1], [0, 26 * U]) }],
  }));
  // A bright core inside a faint halo reads as a spark of light rather than a speck of dirt.
  const halo = size * 4;
  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.mote,
        {
          left: CANVAS / 2 + x * U - halo / 2,
          top: CANVAS / 2 + y * U - halo / 2,
          width: halo,
          height: halo,
          borderRadius: halo / 2,
          backgroundColor: withAlpha(color, 0.16),
        },
        style,
      ]}
    >
      <View style={{ position: "absolute", left: (halo - size) / 2, top: (halo - size) / 2, width: size, height: size, borderRadius: size / 2, backgroundColor: color }} />
    </Animated.View>
  );
}

export default function AppStartupScreen({
  footnote = STARTUP_COPY.loading,
  isDark,
  intro = true,
  play = true,
}) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const reduced = useReducedMotion();
  const dark = isDark ?? theme.isDark;
  const p = paletteFor(dark);
  const still = reduced || !intro;

  const bloom = useSharedValue(still ? 1 : 0);
  const lift = useSharedValue(still ? 1 : 0);
  const word = useSharedValue(still ? 1 : 0);
  const tag = useSharedValue(still ? 1 : 0);
  const foot = useSharedValue(still ? 1 : 0);
  const orbit = useSharedValue(0);
  const glint = useSharedValue(0);

  useEffect(() => {
    const all = [bloom, lift, word, tag, foot, orbit, glint];
    if (reduced) {
      [bloom, lift, word, tag, foot].forEach((v) => {
        v.value = 1;
      });
      glint.value = 0;
      return undefined;
    }
    if (intro) {
      // Frame zero: everything at rest, exactly the system splash. Nothing runs until `play`.
      if (!play) return undefined;
      const out = Easing.out(Easing.cubic);
      bloom.value = withTiming(1, { duration: 900, easing: out });
      lift.value = withDelay(420, withTiming(1, { duration: 760, easing: Easing.inOut(Easing.cubic) }));
      word.value = withDelay(520, withTiming(1, { duration: 720, easing: out }));
      tag.value = withDelay(820, withTiming(1, { duration: 620, easing: out }));
      foot.value = withDelay(1000, withTiming(1, { duration: 520, easing: out }));
      // One full lap with a fast start, then a slow idle lap that keeps going while the app finishes loading.
      orbit.value = withDelay(
        140,
        withSequence(
          withTiming(360, { duration: 1300, easing: Easing.inOut(Easing.cubic) }),
          withRepeat(withTiming(720, { duration: 3200, easing: Easing.linear }), -1, false)
        )
      );
      glint.value = withDelay(140, withSequence(withTiming(1, { duration: 220 }), withDelay(900, withTiming(0.55, { duration: 450 }))));
    } else {
      orbit.value = withRepeat(withTiming(360, { duration: 3200, easing: Easing.linear }), -1, false);
      glint.value = withTiming(0.55, { duration: 400 });
    }
    return () => all.forEach(cancelAnimation);
  }, [intro, play, reduced, bloom, lift, word, tag, foot, orbit, glint]);

  const washStyle = useAnimatedStyle(() => ({ opacity: bloom.value }));
  const groupStyle = useAnimatedStyle(() => ({ transform: [{ translateY: -LIFT * lift.value }] }));
  const bloomStyle = useAnimatedStyle(() => ({
    opacity: bloom.value,
    transform: [{ scale: 0.8 + 0.2 * bloom.value }],
  }));
  const markStyle = useAnimatedStyle(() => ({
    opacity: 0.88 + 0.12 * Math.max(glint.value, bloom.value),
    transform: [{ scale: 0.96 + 0.04 * bloom.value }],
  }));
  const wordStyle = useAnimatedStyle(() => ({
    opacity: word.value,
    transform: [{ translateY: (1 - word.value) * 14 }],
  }));
  const tagStyle = useAnimatedStyle(() => ({
    opacity: tag.value,
    transform: [{ translateY: (1 - tag.value) * 8 }],
  }));
  const footStyle = useAnimatedStyle(() => ({ opacity: foot.value }));

  const k = WORD_K;
  const bottomInset = intro ? insets.bottom : 0;

  return (
    <View
      style={[styles.root, { backgroundColor: p.bg }]}
      accessibilityRole="progressbar"
      accessibilityLabel={STARTUP_COPY.a11y}
    >
      <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, washStyle]}>
        <LinearGradient colors={p.wash} locations={[0.4, 1]} style={StyleSheet.absoluteFill} />
      </Animated.View>

      <Animated.View pointerEvents="none" style={[styles.group, groupStyle]}>
        <Animated.View style={[styles.bloom, bloomStyle]}>
          <EmblemBloom size={BLOOM} dark={dark} />
        </Animated.View>
        <Animated.View style={[styles.zMark, markStyle]}>
          <Image
            source={ZEEVAN_BRAND_ASSETS.zMark}
            style={{ width: CANVAS, height: CANVAS }}
            resizeMode="contain"
            fadeDuration={0}
          />
        </Animated.View>
        {DUST.map((d, i) => (
          <Mote key={i} {...d} color={p.dust} enabled={!reduced && play} />
        ))}
      </Animated.View>

      <View pointerEvents="none" style={[styles.lockup, { marginTop: MARK_BOTTOM - LIFT + LOCKUP_GAP }]}>
        <Animated.View style={wordStyle}>
          <View style={{ width: WORD_W, height: WORD_H, overflow: "hidden" }}>
            <Image
              source={p.wordmark}
              resizeMode="stretch"
              fadeDuration={0}
              style={{ position: "absolute", left: 0, top: -WORDMARK.top * k, width: WORDMARK.width * k, height: WORDMARK.height * k }}
            />
          </View>
        </Animated.View>
        <Animated.Text style={[styles.tagline, { color: p.gold }, tagStyle]}>{APP_WORDMARK_SUBLINE}</Animated.Text>
      </View>

      {footnote ? (
        <Animated.View pointerEvents="none" style={[styles.footer, { paddingBottom: bottomInset + 30 }, footStyle]}>
          <Text style={[styles.footnote, { color: p.muted }]}>{footnote}</Text>
        </Animated.View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, width: "100%", overflow: "hidden" },
  group: {
    position: "absolute",
    left: "50%",
    top: "50%",
    width: CANVAS,
    height: CANVAS,
    marginLeft: -CANVAS / 2,
    marginTop: -CANVAS / 2,
  },
  bloom: {
    position: "absolute",
    left: (CANVAS - BLOOM) / 2,
    top: (CANVAS - BLOOM) / 2,
    width: BLOOM,
    height: BLOOM,
  },
  zMark: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
  },
  mote: { position: "absolute" },
  lockup: { position: "absolute", left: 0, right: 0, top: "50%", alignItems: "center" },
  tagline: {
    marginTop: 16,
    fontFamily: fonts.bold,
    fontSize: 10.5,
    letterSpacing: 3.4,
    textTransform: "uppercase",
    textAlign: "center",
    // Letter-spacing trails the last glyph; pull it back so the line stays optically centred.
    paddingLeft: 3.4,
  },
  footer: { position: "absolute", left: 0, right: 0, bottom: 0, alignItems: "center", paddingHorizontal: 40 },
  footnote: { fontFamily: fonts.regular, fontSize: 12, letterSpacing: 0.4, textAlign: "center" },
});
