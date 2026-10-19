/**
 * Animated artwork for the Home hero and header: flickering diyas, a string of fairy lights, a slowly turning
 * rangoli, rising embers, twinkling sparkles and a periodic golden sheen.
 *
 * Everything that moves is a native layer (opacity / transform of a view that wraps a vector drawing which is
 * rendered once), never an animated SVG prop — animating SVG props makes the whole vector view redraw every
 * frame on the CPU. With "reduce motion" on, or while the screen is covered, the art holds still.
 */
import React, { memo, useEffect, useMemo } from "react";
import { StyleSheet, View } from "react-native";
import { useIsFocused } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";
import Svg, {
  Circle,
  Defs,
  Ellipse,
  G,
  LinearGradient as SvgGradient,
  Path,
  RadialGradient,
  Rect,
  Stop,
} from "react-native-svg";
import Animated, {
  Easing,
  cancelAnimation,
  interpolate,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import { LotusMandala, Sparkle, Sprig } from "./Ornaments";

const EASE = {
  sine: Easing.inOut(Easing.sin),
  quad: Easing.inOut(Easing.quad),
  linear: Easing.linear,
};

/**
 * Whether the ornaments should move: not when the user prefers reduced motion, and not while this screen is
 * covered by another one (the loops would keep waking the UI thread for nothing).
 */
export function useMotionEnabled() {
  const reduced = useReducedMotion();
  const focused = useIsFocused();
  return !reduced && focused;
}

/** A 0 ↔ 1 shared value that eases back and forth forever; parked mid-way when motion is off. */
export function useLoop(duration, { delay = 0, ease = "sine" } = {}) {
  const enabled = useMotionEnabled();
  const value = useSharedValue(0.5);
  useEffect(() => {
    if (!enabled) {
      value.value = 0.5;
      return undefined;
    }
    value.value = 0;
    value.value = withDelay(delay, withRepeat(withTiming(1, { duration, easing: EASE[ease] || EASE.sine }), -1, true));
    return () => cancelAnimation(value);
  }, [enabled, duration, delay, ease, value]);
  return value;
}

function quad(p0, p1, p2, t) {
  const u = 1 - t;
  return { x: u * u * p0.x + 2 * u * t * p1.x + t * t * p2.x, y: u * u * p0.y + 2 * u * t * p1.y + t * t * p2.y };
}

/* ------------------------------------------------------------------ sparkles & glow */

/** Four-point star that fades and breathes. Absolutely positioned by its centre (x, y) inside the parent. */
export function TwinkleStar({ x, y, r = 5, color = "#F6C453", delay = 0, period = 1900, low = 0.15, high = 0.95 }) {
  const t = useLoop(period, { delay });
  const animatedStyle = useAnimatedStyle(() => ({
    opacity: interpolate(t.value, [0, 1], [low, high]),
    transform: [{ scale: interpolate(t.value, [0, 1], [0.8, 1.1]) }],
  }));
  const box = Math.ceil(r * 2 + 2);
  return (
    <Animated.View
      pointerEvents="none"
      style={[{ position: "absolute", left: x - box / 2, top: y - box / 2, width: box, height: box }, animatedStyle]}
    >
      <Svg width={box} height={box} viewBox={`${-box / 2} ${-box / 2} ${box} ${box}`}>
        <Sparkle cx={0} cy={0} r={r} color={color} opacity={1} />
      </Svg>
    </Animated.View>
  );
}

/** Soft round glow. */
export const GlowSpot = memo(function GlowSpot({ size, color, opacity = 0.5, style }) {
  return (
    <Svg width={size} height={size} style={style} pointerEvents="none">
      <Defs>
        <RadialGradient id="spot" cx="50%" cy="50%" r="50%">
          <Stop offset="0" stopColor={color} stopOpacity={opacity} />
          <Stop offset="0.55" stopColor={color} stopOpacity={opacity * 0.32} />
          <Stop offset="1" stopColor={color} stopOpacity={0} />
        </RadialGradient>
      </Defs>
      <Circle cx={size / 2} cy={size / 2} r={size / 2} fill="url(#spot)" />
    </Svg>
  );
});

/* ------------------------------------------------------------------ diyas */

/**
 * One brass diya whose rim centre sits at (x, y) in the parent. Three layers: a glow that pulses, the lamp
 * itself (drawn once), and the flame, which flickers and sways about its base.
 * Local units: lamp 44 × 26, flame 32 × 36, glow 64 × 64 — all multiplied by `scale`.
 */
function Diya({ x, y, scale = 1, phase = 0 }) {
  const flick = useLoop(520 + phase * 140, { delay: phase * 170, ease: "quad" });
  const sway = useLoop(1500 + phase * 230, { delay: phase * 90 });
  const flameStyle = useAnimatedStyle(() => ({
    transform: [
      { rotate: `${interpolate(sway.value, [0, 1], [-3.5, 3.5])}deg` },
      { scaleY: interpolate(flick.value, [0, 1], [0.9, 1.1]) },
      { scaleX: interpolate(flick.value, [0, 1], [1.06, 0.94]) },
    ],
  }));
  const glowStyle = useAnimatedStyle(() => ({ opacity: interpolate(flick.value, [0, 1], [0.55, 1]) }));

  return (
    <>
      <Animated.View
        pointerEvents="none"
        style={[
          { position: "absolute", left: x - 32 * scale, top: y - 17 * scale - 32 * scale, width: 64 * scale, height: 64 * scale },
          glowStyle,
        ]}
      >
        <Svg width={64 * scale} height={64 * scale} viewBox="-32 -32 64 64">
          <Defs>
            <RadialGradient id="flame-glow" cx="50%" cy="50%" r="50%">
              <Stop offset="0" stopColor="#FFE08A" stopOpacity={0.95} />
              <Stop offset="0.45" stopColor="#FFA73A" stopOpacity={0.3} />
              <Stop offset="1" stopColor="#FF9A2E" stopOpacity={0} />
            </RadialGradient>
          </Defs>
          <Circle cx={0} cy={0} r={32} fill="url(#flame-glow)" />
        </Svg>
      </Animated.View>

      <View
        pointerEvents="none"
        style={{ position: "absolute", left: x - 22 * scale, top: y - 9 * scale, width: 44 * scale, height: 26 * scale }}
      >
        <Svg width={44 * scale} height={26 * scale} viewBox="-22 -9 44 26">
          <Defs>
            <SvgGradient id="lamp-body" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0" stopColor="#F4C95F" />
              <Stop offset="0.5" stopColor="#C98A2B" />
              <Stop offset="1" stopColor="#7C4410" />
            </SvgGradient>
          </Defs>
          <Path d="M-19 -2 C-19 9 -10 15 0 15 C10 15 19 9 19 -2 Z" fill="url(#lamp-body)" />
          <Ellipse cx={0} cy={-2} rx={19} ry={4.6} fill="#F6D07A" />
          <Ellipse cx={0} cy={-2.4} rx={14.5} ry={2.9} fill="#5E2A07" />
          <Ellipse cx={0} cy={-3.1} rx={9} ry={1.1} fill="#F6C453" opacity={0.5} />
          <Path d="M-11 6.5 C-5 10.5 5 10.5 11 6.5" stroke="#FFE2A0" strokeOpacity={0.6} strokeWidth={1.2} fill="none" strokeLinecap="round" />
          <Circle cx={0} cy={11} r={1.1} fill="#FFE2A0" opacity={0.55} />
          <Rect x={-0.9} y={-7} width={1.8} height={4.5} rx={0.9} fill="#2E1304" />
        </Svg>
      </View>

      <Animated.View
        pointerEvents="none"
        style={[
          { position: "absolute", left: x - 16 * scale, top: y - 38 * scale, width: 32 * scale, height: 36 * scale, transformOrigin: "50% 92%" },
          flameStyle,
        ]}
      >
        <Svg width={32 * scale} height={36 * scale} viewBox="-16 -38 32 36">
          <Path d="M0 -35 C 8.5 -25 10 -13 0 -5 C -10 -13 -8.5 -25 0 -35 Z" fill="#FFA32B" />
          <Path d="M0 -30 C 5.2 -22.5 6.2 -14 0 -8 C -6.2 -14 -5.2 -22.5 0 -30 Z" fill="#FFD25E" />
          <Path d="M0 -23 C 2.7 -18.5 3.2 -13.5 0 -10 C -3.2 -13.5 -2.7 -18.5 0 -23 Z" fill="#FFF6D2" />
        </Svg>
      </Animated.View>
    </>
  );
}

export const CLUSTER_W = 214;
export const CLUSTER_H = 128;
/** Three diyas on a glowing halo — the hero's centrepiece. */
export const DiyaCluster = memo(function DiyaCluster({ style }) {
  return (
    <View pointerEvents="none" style={[{ width: CLUSTER_W, height: CLUSTER_H }, style]}>
      <Svg width={CLUSTER_W} height={CLUSTER_H} style={StyleSheet.absoluteFill}>
        <Defs>
          <RadialGradient id="cluster-aura" cx="50%" cy="50%" r="50%">
            <Stop offset="0" stopColor="#FFC85C" stopOpacity={0.55} />
            <Stop offset="0.5" stopColor="#FF9A2E" stopOpacity={0.16} />
            <Stop offset="1" stopColor="#FF9A2E" stopOpacity={0} />
          </RadialGradient>
        </Defs>
        <Ellipse cx={112} cy={72} rx={112} ry={70} fill="url(#cluster-aura)" />
        <Ellipse cx={110} cy={118} rx={94} ry={7} fill="#000000" opacity={0.2} />
      </Svg>
      <Diya x={90} y={100} scale={1} phase={1} />
      <Diya x={190} y={104} scale={0.78} phase={2} />
      <Diya x={142} y={90} scale={1.3} phase={0} />
    </View>
  );
});

/** A single small flickering diya — the header badge icon. */
export const DiyaGlyph = memo(function DiyaGlyph({ size = 22 }) {
  const scale = (size - 1) / 55;
  return (
    <View pointerEvents="none" style={{ width: size, height: size }}>
      <Diya x={size / 2} y={38 * scale + 1} scale={scale} />
    </View>
  );
});

/* ------------------------------------------------------------------ fairy lights */

const BULB_COLORS = ["#FFD166", "#FF9F43", "#FFE08A", "#FFB454"];

function LightGroup({ bulbs, width, height, delay }) {
  const t = useLoop(1500, { delay });
  const animatedStyle = useAnimatedStyle(() => ({ opacity: interpolate(t.value, [0, 1], [0.42, 1]) }));
  return (
    <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, animatedStyle]}>
      <Svg width={width} height={height}>
        {bulbs}
      </Svg>
    </Animated.View>
  );
}

/** A rope of glowing bulbs sagging across `width`; three interleaved groups twinkle out of step so the light seems to travel. */
export const LightString = memo(function LightString({ width, sag = 46, count = 18, rope = "#D9A441", style }) {
  const height = Math.round(sag * 0.62) + 14;
  const parts = useMemo(() => {
    const from = { x: -6, y: 2 };
    const ctrl = { x: width / 2, y: sag };
    const to = { x: width + 6, y: 2 };
    const buckets = [[], [], []];
    for (let i = 0; i <= count; i += 1) {
      const p = quad(from, ctrl, to, i / count);
      const color = BULB_COLORS[i % BULB_COLORS.length];
      buckets[i % 3].push(
        <G key={i}>
          <Circle cx={p.x} cy={p.y + 4} r={8.5} fill={color} opacity={0.26} />
          <Circle cx={p.x} cy={p.y + 4} r={5} fill={color} opacity={0.55} />
          <Circle cx={p.x} cy={p.y + 4} r={2.7} fill="#FFF6D0" />
        </G>
      );
    }
    return { buckets, path: `M${from.x} ${from.y} Q${ctrl.x} ${ctrl.y} ${to.x} ${to.y}` };
  }, [width, sag, count]);

  return (
    <View pointerEvents="none" style={[{ width, height }, style]}>
      <Svg width={width} height={height} style={StyleSheet.absoluteFill}>
        <Path d={parts.path} stroke={rope} strokeWidth={1.2} strokeOpacity={0.5} fill="none" strokeLinecap="round" />
      </Svg>
      {parts.buckets.map((bulbs, i) => (
        <LightGroup key={i} bulbs={bulbs} width={width} height={height} delay={i * 500} />
      ))}
    </View>
  );
});

/* ------------------------------------------------------------------ rangoli */

const RANGOLI_DOTS = (() => {
  const dots = [];
  [
    { n: 36, r: 114 },
    { n: 24, r: 62 },
  ].forEach(({ n, r }) => {
    for (let i = 0; i < n; i += 1) {
      const a = (i / n) * Math.PI * 2;
      dots.push({ x: 120 + Math.cos(a) * r, y: 120 + Math.sin(a) * r, r: i % 3 === 0 ? 1.9 : 1.2 });
    }
  });
  return dots;
})();

/** Lotus mandala ringed with dots, turning once every `duration` ms. */
export const Rangoli = memo(function Rangoli({ size = 240, color = "#F6C453", opacity = 0.2, duration = 72000, style }) {
  const enabled = useMotionEnabled();
  const spin = useSharedValue(0);
  useEffect(() => {
    if (!enabled) return undefined;
    const from = spin.value % 360;
    spin.value = from;
    spin.value = withRepeat(withTiming(from + 360, { duration, easing: Easing.linear }), -1, false);
    return () => cancelAnimation(spin);
  }, [enabled, duration, spin]);
  const turn = useAnimatedStyle(() => ({ transform: [{ rotate: `${spin.value}deg` }] }));

  return (
    <Animated.View pointerEvents="none" style={[{ width: size, height: size }, style, turn]}>
      <Svg width={size} height={size} viewBox="0 0 240 240">
        <LotusMandala cx={120} cy={120} radius={104} color={color} opacity={opacity} />
        {RANGOLI_DOTS.map((d, i) => (
          <Circle key={i} cx={d.x} cy={d.y} r={d.r} fill={color} opacity={opacity * 2.4} />
        ))}
      </Svg>
    </Animated.View>
  );
});

/* ------------------------------------------------------------------ embers & sheen */

function Ember({ left, bottom, size, rise, drift, delay, duration, color }) {
  const enabled = useMotionEnabled();
  const t = useSharedValue(0);
  useEffect(() => {
    if (!enabled) return undefined;
    t.value = 0;
    t.value = withDelay(delay, withRepeat(withTiming(1, { duration, easing: Easing.out(Easing.quad) }), -1, false));
    return () => cancelAnimation(t);
  }, [enabled, delay, duration, t]);
  const animatedStyle = useAnimatedStyle(() => ({
    opacity: enabled ? interpolate(t.value, [0, 0.12, 0.62, 1], [0, 0.95, 0.4, 0]) : 0,
    transform: [
      { translateY: -rise * t.value },
      { translateX: drift * Math.sin(t.value * Math.PI * 2) },
      { scale: interpolate(t.value, [0, 1], [1, 0.35]) },
    ],
  }));
  return (
    <Animated.View
      pointerEvents="none"
      style={[{ position: "absolute", left, bottom, width: size, height: size }, animatedStyle]}
    >
      <View
        style={{
          position: "absolute",
          left: -size * 1.2,
          top: -size * 1.2,
          width: size * 3.4,
          height: size * 3.4,
          borderRadius: size * 1.7,
          backgroundColor: color,
          opacity: 0.22,
        }}
      />
      <View style={{ ...StyleSheet.absoluteFillObject, borderRadius: size / 2, backgroundColor: color }} />
    </Animated.View>
  );
}

/** Tiny sparks drifting up from the flames. `items`: [{ left, bottom, size, rise, drift, delay, duration }] */
export function Embers({ items, color = "#FFD66B" }) {
  return (
    <>
      {items.map((item, i) => (
        <Ember key={i} color={color} {...item} />
      ))}
    </>
  );
}

/** A soft diagonal band of light that sweeps across its (overflow-hidden) parent now and then. */
export function Sheen({ width, delay = 1800, pause = 6400, color = "rgba(255, 240, 205, 0.3)" }) {
  const enabled = useMotionEnabled();
  const t = useSharedValue(0);
  useEffect(() => {
    if (!enabled) return undefined;
    t.value = withDelay(
      delay,
      withRepeat(
        withSequence(withTiming(1, { duration: 1600, easing: EASE.quad }), withDelay(pause, withTiming(0, { duration: 0 }))),
        -1,
        false
      )
    );
    return () => cancelAnimation(t);
  }, [enabled, delay, pause, t]);
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: interpolate(t.value, [0, 1], [-150, width + 70]) }, { skewX: "-20deg" }],
  }));
  return (
    <Animated.View pointerEvents="none" style={[styles.sheen, animatedStyle]}>
      <LinearGradient
        colors={["rgba(255,240,205,0)", color, "rgba(255,240,205,0)"]}
        start={{ x: 0, y: 0.5 }}
        end={{ x: 1, y: 0.5 }}
        style={StyleSheet.absoluteFill}
      />
    </Animated.View>
  );
}

/* ------------------------------------------------------------------ live indicator */

/** A small dot with a soft ring that swells and fades — a "live" indicator. */
export function PulseDot({ size = 10, color = "#EDC27D", style }) {
  const enabled = useMotionEnabled();
  const t = useSharedValue(0);
  useEffect(() => {
    if (!enabled) return undefined;
    t.value = 0;
    t.value = withRepeat(withTiming(1, { duration: 1700, easing: Easing.out(Easing.quad) }), -1, false);
    return () => cancelAnimation(t);
  }, [enabled, t]);
  const ring = useAnimatedStyle(() => ({
    opacity: enabled ? interpolate(t.value, [0, 1], [0.55, 0]) : 0,
    transform: [{ scale: interpolate(t.value, [0, 1], [1, 2.6]) }],
  }));
  const dot = { width: size, height: size, borderRadius: size / 2, backgroundColor: color };
  return (
    <View style={[{ width: size, height: size }, style]}>
      <Animated.View style={[StyleSheet.absoluteFill, dot, ring]} />
      <View style={dot} />
    </View>
  );
}

/* ------------------------------------------------------------------ everyday sprigs */

/** An olive sprig that sways about its base. Draws on a `width` × `height` canvas that fills its parent. */
export function SwaySprig({ width, height, from, ctrl, to, color, leaves = 6, flip = false, delay = 0 }) {
  const t = useLoop(3600, { delay });
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${interpolate(t.value, [0, 1], [-2.5, 2.5])}deg` }],
  }));
  return (
    <Animated.View
      pointerEvents="none"
      style={[StyleSheet.absoluteFill, { transformOrigin: [from.x, from.y, 0] }, animatedStyle]}
    >
      <Svg width={width} height={height}>
        <Sprig from={from} ctrl={ctrl} to={to} leaves={leaves} color={color} flip={flip} />
      </Svg>
    </Animated.View>
  );
}

/* ------------------------------------------------------------------ header ambience */

/**
 * Warm, quiet ambience behind the header greeting: a glow, a rangoli bleeding off the right edge and a few
 * twinkling stars. `ornament` follows the festival theme ("diya" or "none").
 */
export function HeaderArt({ ornament, isDark, width, height }) {
  const festive = ornament === "diya";
  const gold = isDark ? "#E8BC84" : festive ? "#C0781C" : "#7C8A3E";
  const glow = isDark ? "#E8BC84" : festive ? "#FFC14D" : "#F6D77A";
  const glowSize = Math.round(width * 0.95);
  const stars = festive
    ? [
        { x: width * 0.58, y: height * 0.2, r: 5.5, delay: 0 },
        { x: width * 0.86, y: height * 0.42, r: 4.2, delay: 700 },
        { x: width * 0.7, y: height * 0.64, r: 3.4, delay: 1300 },
      ]
    : [
        { x: width * 0.66, y: height * 0.28, r: 4, delay: 0 },
        { x: width * 0.88, y: height * 0.56, r: 3.2, delay: 900 },
      ];

  return (
    <View pointerEvents="none" style={[StyleSheet.absoluteFill, { height }]}>
      <GlowSpot
        size={glowSize}
        color={glow}
        opacity={isDark ? 0.2 : festive ? 0.42 : 0.3}
        style={{ position: "absolute", right: -glowSize * 0.32, top: -glowSize * 0.22 }}
      />
      <Rangoli
        size={Math.round(height * 0.95)}
        color={gold}
        opacity={isDark ? 0.1 : festive ? 0.11 : 0.09}
        style={{ position: "absolute", right: -Math.round(height * 0.42), top: Math.round(height * 0.06) }}
      />
      {stars.map((s, i) => (
        <TwinkleStar key={i} x={s.x} y={s.y} r={s.r} color={isDark ? "#F2CE9B" : "#D4922A"} delay={s.delay} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  sheen: { position: "absolute", top: -12, bottom: -12, left: 0, width: 90 },
});
