/**
 * Home motion helpers — sections rise into view once as you scroll to them, children can stagger inside
 * their section, and numbers can count up. Everything honours the system "reduce motion" setting.
 */
import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { StyleSheet, View } from "react-native";
import Animated, {
  Easing,
  Extrapolation,
  interpolate,
  interpolateColor,
  useAnimatedReaction,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withTiming,
} from "react-native-reanimated";
import { useStoreTheme } from "../../theme/storefront";

const ScrollContext = createContext(null);
const RevealContext = createContext(null);

const EASE_OUT = Easing.out(Easing.cubic);
const REVEAL_MS = 900;
/** How far into the viewport a section has to reach before it starts to appear. */
const REVEAL_INSET = 56;

/**
 * Shares the Home scroll position with the sections.
 *  scrollY   scroll offset of the Home ScrollView (shared value)
 *  viewportH visible height (shared value)
 *  originY   y of the sections container inside the scroll content (shared value)
 */
export function HomeScrollProvider({ scrollY, viewportH, originY, children }) {
  const value = useMemo(() => ({ scrollY, viewportH, originY }), [scrollY, viewportH, originY]);
  return <ScrollContext.Provider value={value}>{children}</ScrollContext.Provider>;
}

export function useHomeScroll() {
  return useContext(ScrollContext);
}

/**
 * Wraps one Home section. It stays hidden until it scrolls into view, then rises and fades in once.
 * Sections already on screen at load cascade in by `index`. With `staggered`, the wrapper itself stays still
 * and `<Stagger>` children animate off its timeline instead.
 */
export function Reveal({ children, index = 0, distance = 28, staggered = false, style }) {
  const scroll = useContext(ScrollContext);
  const reduced = useReducedMotion();
  const instant = reduced || !scroll;
  const idle = useSharedValue(0);
  const scrollY = scroll?.scrollY ?? idle;
  const viewportH = scroll?.viewportH ?? idle;
  const originY = scroll?.originY ?? idle;

  const progress = useSharedValue(instant ? 1 : 0);
  const started = useSharedValue(instant ? 1 : 0);
  const top = useSharedValue(-1);

  useAnimatedReaction(
    () => {
      if (started.value === 1 || top.value < 0) return false;
      return scrollY.value + viewportH.value - REVEAL_INSET > originY.value + top.value;
    },
    (visible) => {
      if (!visible || started.value === 1) return;
      started.value = 1;
      const delay = scrollY.value < 12 ? Math.min(index, 4) * 120 : 0;
      progress.value = withDelay(delay, withTiming(1, { duration: REVEAL_MS, easing: Easing.linear }));
    },
    [index]
  );

  // If layout never reports (it should), do not leave the section invisible.
  useEffect(() => {
    if (instant) return undefined;
    const id = setTimeout(() => {
      if (top.value < 0 && started.value === 0) {
        started.value = 1;
        progress.value = withTiming(1, { duration: 500 });
      }
    }, 2400);
    return () => clearTimeout(id);
  }, [instant, top, started, progress]);

  const animatedStyle = useAnimatedStyle(() => {
    if (staggered) return {};
    const p = EASE_OUT(interpolate(progress.value, [0, 0.55], [0, 1], Extrapolation.CLAMP));
    return { opacity: p, transform: [{ translateY: (1 - p) * distance }] };
  });

  return (
    <RevealContext.Provider value={progress}>
      <Animated.View
        style={[style, animatedStyle]}
        onLayout={(e) => {
          top.value = e.nativeEvent.layout.y;
        }}
      >
        {children}
      </Animated.View>
    </RevealContext.Provider>
  );
}

/**
 * A child of a `<Reveal staggered>` section: it fades and rises on its own slice of the section's timeline,
 * so tiles and cards appear one after another instead of all at once.
 */
export function Stagger({ index = 0, step = 0.06, span = 0.46, distance = 18, scaleFrom = 0.96, style, children }) {
  const progress = useContext(RevealContext);
  const reduced = useReducedMotion();
  const settled = useSharedValue(1);
  const timeline = progress && !reduced ? progress : settled;
  const start = Math.min(index * step, 0.5);

  const animatedStyle = useAnimatedStyle(() => {
    const t = EASE_OUT(interpolate(timeline.value, [start, start + span], [0, 1], Extrapolation.CLAMP));
    return {
      opacity: t,
      transform: [{ translateY: (1 - t) * distance }, { scale: scaleFrom + (1 - scaleFrom) * t }],
    };
  });

  return <Animated.View style={[style, animatedStyle]}>{children}</Animated.View>;
}

/** Counts from 0 up to `value` (re-counts from the old value when it changes). Plain re-renders — use for small numbers. */
export function useCountUp(value, duration = 900) {
  const reduced = useReducedMotion();
  const target = Number.isFinite(Number(value)) ? Number(value) : 0;
  const [shown, setShown] = useState(reduced ? target : 0);

  useEffect(() => {
    if (reduced || target === 0) {
      setShown(target);
      return undefined;
    }
    let frame;
    const from = 0;
    const startedAt = Date.now();
    const tick = () => {
      const t = Math.min(1, (Date.now() - startedAt) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      setShown(Math.round(from + (target - from) * eased));
      if (t < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [target, duration, reduced]);

  return shown;
}

/**
 * One card of a snapping carousel: neighbours sit a touch smaller and dimmer so the card in front reads as the
 * focus. `scrollX` is the list's horizontal offset, `step` the distance between card starts.
 */
export function DepthSlide({ index, scrollX, step, children, style }) {
  const depthStyle = useAnimatedStyle(() => {
    const d = Math.min(Math.abs(scrollX.value / step - index), 1);
    return { opacity: 1 - 0.2 * d, transform: [{ scale: 1 - 0.05 * d }] };
  });
  return <Animated.View style={[style, depthStyle]}>{children}</Animated.View>;
}

function PagerDot({ index, scrollX, step }) {
  const { c } = useStoreTheme();
  const animatedStyle = useAnimatedStyle(() => {
    const near = 1 - Math.min(Math.abs(scrollX.value / step - index), 1);
    return {
      width: 6 + 16 * near,
      backgroundColor: interpolateColor(near, [0, 1], [c.lineStrong, c.brand]),
    };
  });
  return <Animated.View style={[styles.pagerDot, animatedStyle]} />;
}

/** Pager dots that follow a carousel's scroll: the one for the card in front stretches into a pill. */
export function PagerDots({ count, scrollX, step, style }) {
  if (count < 2) return null;
  return (
    <View style={[styles.pager, style]}>
      {Array.from({ length: count }, (_, i) => (
        <PagerDot key={i} index={i} scrollX={scrollX} step={step} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  pager: { flexDirection: "row", justifyContent: "center", alignItems: "center", gap: 5 },
  pagerDot: { height: 6, borderRadius: 3 },
});
