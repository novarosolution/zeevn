import React, { useEffect } from "react";
import { Platform, StyleSheet, Text, View, useWindowDimensions } from "react-native";
import Svg, { Rect } from "react-native-svg";
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
import { G } from "react-native-svg";
import { useStoreTheme, withAlpha } from "../../theme/storefront";
import { Diya, Garland, LotusMandala, Sparkle, Sprig } from "./Ornaments";
import PressableScale from "./PressableScale";

const AnimatedG = Animated.createAnimatedComponent(G);

const DESIGN_W = 402;
const DESIGN_H = 152;

function mirrorX(p) {
  return { x: DESIGN_W - p.x, y: p.y };
}

/** Soft plate + gold accents — cream in light, deep cocoa in dark (screenshot look). */
function bannerChrome(isDark, ornament) {
  if (isDark) {
    return {
      fill: "#1A140E",
      fillAlt: "#241A12",
      stroke: "rgba(232, 188, 132, 0.18)",
      gold: "#E8BC84",
      mandalaOpacity: 0.22,
      eyebrow: "#D4B896",
      title: "#F6EFE0",
      subtitle: "#B8A98E",
      sparkle: "#E4A93C",
    };
  }
  if (ornament === "diya") {
    return {
      fill: "#FFF8EC",
      fillAlt: "#FFE9C4",
      stroke: "rgba(192, 130, 46, 0.22)",
      gold: "#C0822E",
      mandalaOpacity: 0.16,
      eyebrow: "#9A5F18",
      title: "#6B3708",
      subtitle: "#6A4A1C",
      sparkle: "#D4922A",
    };
  }
  if (ornament === "marigold") {
    return {
      fill: "#FFF7EF",
      fillAlt: "#FFE8D0",
      stroke: "rgba(196, 90, 42, 0.18)",
      gold: "#C0822E",
      mandalaOpacity: 0.14,
      eyebrow: "#A85A22",
      title: "#7A2A0C",
      subtitle: "#6E4520",
      sparkle: "#E07A28",
    };
  }
  return {
    fill: "#F7F4E8",
    fillAlt: "#EAF0D8",
    stroke: "rgba(36, 68, 36, 0.12)",
    gold: "#8A9A4A",
    mandalaOpacity: 0.12,
    eyebrow: "#5C6834",
    title: "#244424",
    subtitle: "#4F5742",
    sparkle: "#A8B86C",
  };
}

function RotatingMandala({ cx, cy, radius, color, opacity }) {
  const spin = useSharedValue(0);
  useEffect(() => {
    spin.value = withRepeat(withTiming(360, { duration: 48000, easing: Easing.linear }), -1, false);
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
        withTiming(1, { duration: 2400, easing: Easing.inOut(Easing.sin) }),
        withTiming(-1, { duration: 2400, easing: Easing.inOut(Easing.sin) })
      ),
      -1,
      false
    );
  }, [sway]);
  const originX = (props.from.x + props.to.x) / 2;
  const animatedProps = useAnimatedProps(() => ({
    originX,
    originY: 4,
    rotation: interpolate(sway.value, [-1, 1], [-1.6, 1.6]),
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
          withTiming(0.25, { duration: 900, easing: Easing.inOut(Easing.quad) }),
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
  const mandala = (
    <RotatingMandala cx={201} cy={82} radius={68} color={gold} opacity={chrome.mandalaOpacity} />
  );

  if (ornament === "marigold") {
    const left = { from: { x: -14, y: 4 }, ctrl: { x: 84, y: 64 }, to: { x: 176, y: 8 } };
    const strands = [
      { t: 0.3, length: 18 },
      { t: 0.56, length: 24 },
      { t: 0.82, length: 12 },
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
        <TwinkleSparkle cx={46} cy={116} r={6} color={chrome.sparkle} delay={0} />
        <TwinkleSparkle cx={356} cy={112} r={7} color={chrome.sparkle} delay={350} />
        <TwinkleSparkle cx={84} cy={134} r={3.6} color={chrome.sparkle} delay={700} opacity={0.7} />
        <TwinkleSparkle cx={322} cy={134} r={4} color={chrome.sparkle} delay={200} opacity={0.7} />
      </>
    );
  }

  if (ornament === "diya") {
    return (
      <>
        {mandala}
        <SwayingGarland from={{ x: -10, y: 6 }} ctrl={{ x: 201, y: 52 }} to={{ x: 412, y: 6 }} count={26} kind="lights" />
        <Diya cx={48} cy={124} scale={0.95} id="d1" />
        <Diya cx={106} cy={134} scale={0.62} id="d2" />
        <Diya cx={296} cy={134} scale={0.62} id="d3" />
        <Diya cx={354} cy={124} scale={0.95} id="d4" />
        <TwinkleSparkle cx={82} cy={76} r={5} color={chrome.sparkle} delay={120} />
        <TwinkleSparkle cx={322} cy={74} r={6} color={chrome.sparkle} delay={480} />
      </>
    );
  }

  const leaf = chrome.gold;
  const sprigL = { from: { x: 18, y: 132 }, ctrl: { x: 40, y: 78 }, to: { x: 100, y: 54 } };
  return (
    <>
      {mandala}
      <Sprig {...sprigL} color={leaf} leaves={6} />
      <Sprig from={mirrorX(sprigL.from)} ctrl={mirrorX(sprigL.ctrl)} to={mirrorX(sprigL.to)} color={leaf} leaves={6} flip />
      <TwinkleSparkle cx={70} cy={34} r={4.5} color={chrome.sparkle} delay={0} />
      <TwinkleSparkle cx={334} cy={40} r={5} color={chrome.sparkle} delay={400} />
    </>
  );
}

/**
 * Festival banner under the tabs — ornaments + greeting. Swaps art by `theme.ornament`
 * (marigold garlands for Navratri, fairy lights & diyas for Diwali, olive sprigs every day).
 */
export default function FestiveBanner({ theme, onPress }) {
  const { type, isDark } = useStoreTheme();
  const { width } = useWindowDimensions();
  const height = Math.round(width * (DESIGN_H / DESIGN_W));
  const { banner, ornament } = theme;
  const chrome = bannerChrome(isDark, ornament);

  return (
    <PressableScale
      onPress={onPress}
      scaleTo={0.99}
      style={[
        styles.wrap,
        {
          height,
          backgroundColor: chrome.fill,
          borderColor: chrome.stroke,
          ...Platform.select({
            ios: {
              shadowColor: isDark ? "#000" : "#3D2A12",
              shadowOffset: { width: 0, height: 8 },
              shadowOpacity: isDark ? 0.35 : 0.1,
              shadowRadius: 18,
            },
            android: { elevation: isDark ? 6 : 3 },
            default: {},
          }),
        },
      ]}
      accessibilityRole="button"
      accessibilityLabel={`${banner.title}. ${banner.subtitle}`}
    >
      <View
        pointerEvents="none"
        style={[
          styles.wash,
          {
            backgroundColor: withAlpha(chrome.fillAlt, isDark ? 0.55 : 0.75),
          },
        ]}
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
      <View style={[styles.copy, { top: height * 0.38 }]} pointerEvents="none">
        <Animated.Text entering={FadeInUp.duration(420)} style={type.eyebrow(chrome.eyebrow, 10.5)}>
          {banner.eyebrow}
        </Animated.Text>
        <Animated.Text
          entering={FadeInUp.delay(90).duration(480)}
          style={[
            type.display(32, { color: chrome.title, ls: -0.7, lh: 38 }),
            {
              textShadowColor: isDark ? "rgba(0,0,0,0.35)" : "rgba(255,255,255,0.65)",
              textShadowOffset: { width: 0, height: 1 },
              textShadowRadius: isDark ? 8 : 6,
            },
          ]}
          numberOfLines={1}
        >
          {banner.title}
        </Animated.Text>
        <Animated.Text
          entering={FadeInUp.delay(160).duration(480)}
          style={type.ui(13.5, "semibold", chrome.subtitle)}
          numberOfLines={1}
        >
          {banner.subtitle}
        </Animated.Text>
      </View>
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginHorizontal: 16,
    borderRadius: 22,
    borderWidth: 1,
    overflow: "hidden",
  },
  wash: {
    ...StyleSheet.absoluteFillObject,
    top: "42%",
  },
  copy: { position: "absolute", left: 12, right: 12, alignItems: "center", gap: 2 },
});
