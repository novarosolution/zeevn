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

/**
 * Soft floating orbs behind the hero — navy/forest + neutral depth, no imagery.
 */
export default function HomeAmbientOrbs({ isDark }) {
  const reduced = useReducedMotion();
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
  }, [orb1Op, orb1Y, orb2Op, orb2Y, reduced]);

  useEffect(() => {
    if (Platform.OS !== "web" || reduced) return undefined;
    let cancelled = false;
    let tween1;
    let tween2;

    (async () => {
      const gsapModule = await import("gsap");
      if (cancelled) return;
      const gsapLib = gsapModule?.gsap || gsapModule?.default || gsapModule;
      if (!gsapLib) return;
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
  }, [reduced]);

  const orb1Style = useAnimatedStyle(() => ({
    transform: [{ translateY: orb1Y.value }],
    opacity: orb1Op.value,
  }));

  const orb2Style = useAnimatedStyle(() => ({
    transform: [{ translateY: orb2Y.value }],
    opacity: orb2Op.value,
  }));

  const redGlow = isDark ? "rgba(34, 197, 94, 0.12)" : "rgba(15, 23, 42, 0.18)";
  const neutralGlow = isDark ? "rgba(255, 255, 255, 0.05)" : "rgba(24, 24, 27, 0.12)";

  return (
    <View style={[styles.layer, styles.peNone]} accessibilityElementsHidden>
      <Animated.View
        ref={orb1Ref}
        style={[styles.orbA, { backgroundColor: redGlow }, Platform.OS === "web" ? null : orb1Style]}
      />
      <Animated.View
        ref={orb2Ref}
        style={[styles.orbB, { backgroundColor: neutralGlow }, Platform.OS === "web" ? null : orb2Style]}
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
