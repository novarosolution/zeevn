import React, { useEffect } from "react";
import { Platform, StyleSheet, Text, View, useWindowDimensions } from "react-native";
import Svg, { G, Rect } from "react-native-svg";
import Animated, {
  Easing,
  FadeInUp,
  interpolate,
  useAnimatedProps,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import { useStoreTheme, withAlpha } from "../../theme/storefront";
import { Diya, Garland, LotusMandala, Sparkle, Sprig } from "./Ornaments";
import PressableScale from "./PressableScale";

const AnimatedG = Animated.createAnimatedComponent(G);

const DESIGN_W = 402;
const DESIGN_H = 168;

function mirrorX(p) {
  return { x: DESIGN_W - p.x, y: p.y };
}

function bannerChrome(isDark, ornament) {
  if (isDark) {
    return {
      fill: "#16110C",
      fillAlt: "#2A1E14",
      stroke: "rgba(232, 188, 132, 0.22)",
      gold: "#E8BC84",
      mandalaOpacity: 0.2,
      eyebrow: "#D4B896",
      title: "#F8F1E4",
      subtitle: "#B8A98E",
      ctaBg: "#E8BC84",
      ctaText: "#1A140E",
      sparkle: "#E4A93C",
    };
  }
  if (ornament === "diya") {
    return {
      fill: "#FFF6E8",
      fillAlt: "#FFDFA8",
      stroke: "rgba(192, 130, 46, 0.2)",
      gold: "#C0822E",
      mandalaOpacity: 0.14,
      eyebrow: "#9A5F18",
      title: "#5C2E08",
      subtitle: "#6A4A1C",
      ctaBg: "#2A1E08",
      ctaText: "#FFF3D0",
      sparkle: "#D4922A",
    };
  }
  if (ornament === "marigold") {
    return {
      fill: "#FFF5EC",
      fillAlt: "#FFDFC4",
      stroke: "rgba(196, 90, 42, 0.16)",
      gold: "#C0822E",
      mandalaOpacity: 0.13,
      eyebrow: "#A85A22",
      title: "#6E2408",
      subtitle: "#6E4520",
      ctaBg: "#7A2A0C",
      ctaText: "#FFF5EC",
      sparkle: "#E07A28",
    };
  }
  return {
    fill: "#F5F2E6",
    fillAlt: "#E4EBC8",
    stroke: "rgba(36, 68, 36, 0.12)",
    gold: "#788844",
    mandalaOpacity: 0.12,
    eyebrow: "#5C6834",
    title: "#1D2618",
    subtitle: "#4F5742",
    ctaBg: "#244424",
    ctaText: "#FFFFFF",
    sparkle: "#A8B86C",
  };
}

function RotatingMandala({ cx, cy, radius, color, opacity }) {
  const spin = useSharedValue(0);
  useEffect(() => {
    spin.value = withRepeat(withTiming(360, { duration: 52000, easing: Easing.linear }), -1, false);
  }, [spin]);
  const animatedProps = useAnimatedProps(() => ({
    originX: cx,
    originY: cy,
    rotation: spin.value,
  }));
  return (
    <AnimatedG animatedProps={animatedProps}>
      <LotusMandala cx={cx} cy={cy} radius={radius} color={color} opacity={opacity} />
    </AnimatedG>
  );
}

function SwayingGarland(props) {
  const sway = useSharedValue(0);
  useEffect(() => {
    sway.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 2600, easing: Easing.inOut(Easing.sin) }),
        withTiming(-1, { duration: 2600, easing: Easing.inOut(Easing.sin) })
      ),
      -1,
      false
    );
  }, [sway]);
  const originX = (props.from.x + props.to.x) / 2;
  const animatedProps = useAnimatedProps(() => ({
    originX,
    originY: 4,
    rotation: interpolate(sway.value, [-1, 1], [-1.8, 1.8]),
  }));
  return (
    <AnimatedG animatedProps={animatedProps}>
      <Garland {...props} />
    </AnimatedG>
  );
}

function TwinkleSparkle({ cx, cy, r, color, delay = 0, opacity = 0.85 }) {
  const pulse = useSharedValue(opacity);
  useEffect(() => {
    pulse.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(0.22, { duration: 900, easing: Easing.inOut(Easing.quad) }),
          withTiming(opacity, { duration: 1100, easing: Easing.inOut(Easing.quad) })
        ),
        -1,
        false
      )
    );
  }, [delay, opacity, pulse]);
  const animatedProps = useAnimatedProps(() => ({ opacity: pulse.value }));
  return (
    <AnimatedG animatedProps={animatedProps}>
      <Sparkle cx={cx} cy={cy} r={r} color={color} opacity={1} />
    </AnimatedG>
  );
}

function Artwork({ ornament, chrome }) {
  const gold = chrome.gold;
  const mandala = <RotatingMandala cx={290} cy={90} radius={78} color={gold} opacity={chrome.mandalaOpacity} />;

  if (ornament === "marigold") {
    const left = { from: { x: -10, y: 2 }, ctrl: { x: 90, y: 58 }, to: { x: 188, y: 6 } };
    const strands = [
      { t: 0.32, length: 16 },
      { t: 0.58, length: 22 },
      { t: 0.84, length: 12 },
    ];
    return (
      <>
        {mandala}
        <SwayingGarland {...left} count={11} strands={strands} />
        <SwayingGarland
          from={mirrorX(left.from)}
          ctrl={mirrorX(left.ctrl)}
          to={mirrorX(left.to)}
          count={11}
          strands={strands}
        />
        <TwinkleSparkle cx={48} cy={130} r={5.5} color={chrome.sparkle} delay={0} />
        <TwinkleSparkle cx={358} cy={124} r={6.5} color={chrome.sparkle} delay={320} />
        <TwinkleSparkle cx={210} cy={148} r={3.5} color={chrome.sparkle} delay={640} opacity={0.65} />
      </>
    );
  }

  if (ornament === "diya") {
    return (
      <>
        {mandala}
        <SwayingGarland from={{ x: -8, y: 4 }} ctrl={{ x: 201, y: 48 }} to={{ x: 410, y: 4 }} count={26} kind="lights" />
        <Diya cx={340} cy={132} scale={0.9} id="d1" />
        <Diya cx={372} cy={120} scale={0.7} id="d2" />
        <TwinkleSparkle cx={86} cy={78} r={5} color={chrome.sparkle} delay={120} />
        <TwinkleSparkle cx={300} cy={70} r={6} color={chrome.sparkle} delay={480} />
      </>
    );
  }

  const leaf = chrome.gold;
  const sprigL = { from: { x: 300, y: 140 }, ctrl: { x: 340, y: 90 }, to: { x: 380, y: 48 } };
  return (
    <>
      {mandala}
      <Sprig {...sprigL} color={leaf} leaves={5} />
      <TwinkleSparkle cx={70} cy={36} r={4.5} color={chrome.sparkle} delay={0} />
      <TwinkleSparkle cx={340} cy={42} r={5} color={chrome.sparkle} delay={400} />
    </>
  );
}

/**
 * Festival announce band — left-aligned promo copy + CTA over animated ornaments.
 */
export default function FestiveBanner({ theme, onPress, ctaLabel = "Shop festive" }) {
  const { type, isDark, shadow } = useStoreTheme();
  const { width } = useWindowDimensions();
  const height = Math.round(Math.min(188, Math.max(152, width * (DESIGN_H / DESIGN_W))));
  const { banner, ornament } = theme;
  const chrome = bannerChrome(isDark, ornament);

  return (
    <PressableScale
      onPress={onPress}
      scaleTo={0.985}
      style={[
        styles.wrap,
        shadow.card,
        {
          height,
          backgroundColor: chrome.fill,
          borderColor: chrome.stroke,
        },
      ]}
      accessibilityRole="button"
      accessibilityLabel={`${banner.title}. ${banner.subtitle}`}
    >
      <View
        pointerEvents="none"
        style={[styles.wash, { backgroundColor: withAlpha(chrome.fillAlt, isDark ? 0.5 : 0.7) }]}
      />
      <Svg
        width="100%"
        height="100%"
        viewBox={`0 0 ${DESIGN_W} ${DESIGN_H}`}
        preserveAspectRatio="xMidYMid slice"
        style={StyleSheet.absoluteFill}
      >
        <Rect x={0} y={0} width={DESIGN_W} height={DESIGN_H} fill={chrome.fill} />
        <Artwork ornament={ornament} chrome={chrome} />
      </Svg>

      <View style={styles.copy} pointerEvents="none">
        <Animated.Text entering={FadeInUp.duration(380)} style={type.eyebrow(chrome.eyebrow, 10)}>
          {banner.eyebrow}
        </Animated.Text>
        <Animated.Text
          entering={FadeInUp.delay(70).duration(440)}
          style={[
            type.display(28, { color: chrome.title, ls: -0.7, lh: 32 }),
            {
              textShadowColor: isDark ? "rgba(0,0,0,0.4)" : "rgba(255,255,255,0.7)",
              textShadowOffset: { width: 0, height: 1 },
              textShadowRadius: 6,
            },
          ]}
          numberOfLines={2}
        >
          {banner.title}
        </Animated.Text>
        <Animated.Text
          entering={FadeInUp.delay(130).duration(440)}
          style={[type.ui(13.5, "semibold", chrome.subtitle), styles.sub]}
          numberOfLines={2}
        >
          {banner.subtitle}
        </Animated.Text>
        <Animated.View entering={FadeInUp.delay(190).duration(420)} style={[styles.cta, { backgroundColor: chrome.ctaBg }]}>
          <Text style={type.ui(13, "extrabold", chrome.ctaText, { letterSpacing: 0.2 })}>{ctaLabel}</Text>
        </Animated.View>
      </View>
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginHorizontal: 16,
    borderRadius: 24,
    borderWidth: 1,
    overflow: "hidden",
    ...Platform.select({
      android: { elevation: 4 },
      default: {},
    }),
  },
  wash: {
    ...StyleSheet.absoluteFillObject,
    left: "48%",
  },
  copy: {
    position: "absolute",
    left: 18,
    right: "38%",
    top: 0,
    bottom: 0,
    justifyContent: "center",
    gap: 4,
    paddingVertical: 14,
  },
  sub: { marginTop: 1, marginBottom: 2 },
  cta: {
    alignSelf: "flex-start",
    marginTop: 8,
    height: 34,
    paddingHorizontal: 14,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
  },
});
