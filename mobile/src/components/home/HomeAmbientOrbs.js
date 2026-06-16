import React, { useEffect, useRef } from "react";
import { Platform, StyleSheet, View } from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
  cancelAnimation,
} from "react-native-reanimated";
import useReducedMotion from "../../hooks/useReducedMotion";
import { useKankregLayout } from "../../theme/kankregBreakpoints";
import { getGsap } from "../../utils/loadGsap";

/**
 * Soft floating gold/emerald orbs behind the hero. Mirrors the premium hero
 * gradient feel without adding any DOM weight: pure transform/opacity work.
 *
 * - Web: GSAP yoyo (opacity + translate). Falls back to static when GSAP isn't ready.
 * - Native: Reanimated `withRepeat` shared values for translateY/opacity.
 * - Reduced motion: completely static (no timers, no animations).
 */
export default function HomeAmbientOrbs({ isDark }) {
  const reduced = useReducedMotion();
  const { isMobileWeb } = useKankregLayout();
  const orb1Ref = useRef(null);
  const orb2Ref = useRef(null);

  const orb1Y = useSharedValue(0);
  const orb1Op = useSharedValue(0.6);
  const orb2Y = useSharedValue(0);
  const orb2Op = useSharedValue(0.5);

  useEffect(() => {
    if (Platform.OS === "web" || reduced) return undefined;

    orb1Y.value = withRepeat(
      withTiming(-12, { duration: 5400, easing: Easing.inOut(Easing.quad) }),
      -1,
      true
    );
    orb1Op.value = withRepeat(
      withTiming(0.85, { duration: 5400, easing: Easing.inOut(Easing.quad) }),
      -1,
      true
    );
    orb2Y.value = withRepeat(
      withTiming(14, { duration: 6200, easing: Easing.inOut(Easing.quad) }),
      -1,
      true
    );
    orb2Op.value = withRepeat(
      withTiming(0.7, { duration: 6200, easing: Easing.inOut(Easing.quad) }),
      -1,
      true
    );

    return () => {
      cancelAnimation(orb1Y);
      cancelAnimation(orb1Op);
      cancelAnimation(orb2Y);
      cancelAnimation(orb2Op);
    };
  }, [reduced, orb1Y, orb1Op, orb2Y, orb2Op]);

  useEffect(() => {
    if (Platform.OS !== "web" || reduced || isMobileWeb) return undefined;
    let cancelled = false;
    let tween1;
    let tween2;

    (async () => {
      const gsapLib = await getGsap();
      if (cancelled || !gsapLib) return;
      if (orb1Ref.current) {
        tween1 = gsapLib.to(orb1Ref.current, {
          y: -14,
          opacity: 0.85,
          duration: 5.4,
          ease: "sine.inOut",
          yoyo: true,
          repeat: -1,
        });
      }
      if (orb2Ref.current) {
        tween2 = gsapLib.to(orb2Ref.current, {
          y: 18,
          opacity: 0.72,
          duration: 6.2,
          ease: "sine.inOut",
          yoyo: true,
          repeat: -1,
          delay: 0.4,
        });
      }
    })();

    return () => {
      cancelled = true;
      tween1?.kill?.();
      tween2?.kill?.();
    };
  }, [isMobileWeb, reduced]);

  const orb1Style = useAnimatedStyle(() => ({
    transform: [{ translateY: orb1Y.value }],
    opacity: orb1Op.value,
  }));

  const orb2Style = useAnimatedStyle(() => ({
    transform: [{ translateY: orb2Y.value }],
    opacity: orb2Op.value,
  }));

  const goldGlow = isDark ? "rgba(232, 188, 132, 0.16)" : "rgba(220, 172, 116, 0.32)";
  const greenGlow = isDark ? "rgba(168, 184, 108, 0.1)" : "rgba(92, 104, 52, 0.14)";

  return (
    <View style={[styles.layer, styles.peNone]} accessibilityElementsHidden>
      <Animated.View
        ref={orb1Ref}
        style={[
          styles.orbA,
          { backgroundColor: goldGlow },
          Platform.OS === "web" ? null : orb1Style,
        ]}
      />
      <Animated.View
        ref={orb2Ref}
        style={[
          styles.orbB,
          { backgroundColor: greenGlow },
          Platform.OS === "web" ? null : orb2Style,
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  layer: {
    ...StyleSheet.absoluteFillObject,
    overflow: "hidden",
  },
  orbA: {
    position: "absolute",
    width: 280,
    height: 280,
    borderRadius: 140,
    top: -64,
    right: -88,
    opacity: 0.6,
    ...Platform.select({
      web: { filter: "blur(38px)" },
      default: {},
    }),
  },
  orbB: {
    position: "absolute",
    width: 320,
    height: 320,
    borderRadius: 160,
    left: -120,
    bottom: -132,
    opacity: 0.5,
    ...Platform.select({
      web: { filter: "blur(46px)" },
      default: {},
    }),
  },
  peNone: {
    pointerEvents: "none",
  },
});
