import React from "react";
import { StyleSheet, Text, useWindowDimensions } from "react-native";
import Svg from "react-native-svg";
import Animated, { FadeIn } from "react-native-reanimated";
import { useStoreTheme } from "../../theme/storefront";
import { Diya, Garland, LotusMandala, Sparkle, Sprig } from "./Ornaments";
import PressableScale from "./PressableScale";

const DESIGN_W = 402;
const DESIGN_H = 140;

function mirrorX(p) {
  return { x: DESIGN_W - p.x, y: p.y };
}

function Artwork({ ornament, isDark }) {
  const gold = isDark ? "#E8BC84" : "#C0822E";
  const mandala = (
    <LotusMandala cx={201} cy={76} radius={62} color={gold} opacity={ornament === "none" ? 0.14 : 0.2} />
  );

  if (ornament === "marigold") {
    const left = { from: { x: -14, y: 2 }, ctrl: { x: 84, y: 62 }, to: { x: 176, y: 6 } };
    const strands = [
      { t: 0.3, length: 18 },
      { t: 0.56, length: 24 },
      { t: 0.82, length: 12 },
    ];
    return (
      <>
        {mandala}
        <Garland {...left} count={11} strands={strands} />
        <Garland from={mirrorX(left.from)} ctrl={mirrorX(left.ctrl)} to={mirrorX(left.to)} count={11} strands={strands} />
        <Sparkle cx={46} cy={108} r={6} />
        <Sparkle cx={356} cy={104} r={7} />
        <Sparkle cx={84} cy={126} r={3.6} opacity={0.7} />
        <Sparkle cx={322} cy={126} r={4} opacity={0.7} />
      </>
    );
  }

  if (ornament === "diya") {
    return (
      <>
        {mandala}
        <Garland from={{ x: -10, y: 4 }} ctrl={{ x: 201, y: 50 }} to={{ x: 412, y: 4 }} count={26} kind="lights" />
        <Diya cx={48} cy={118} scale={0.95} id="d1" />
        <Diya cx={106} cy={128} scale={0.62} id="d2" />
        <Diya cx={296} cy={128} scale={0.62} id="d3" />
        <Diya cx={354} cy={118} scale={0.95} id="d4" />
        <Sparkle cx={82} cy={72} r={5} />
        <Sparkle cx={322} cy={70} r={6} />
      </>
    );
  }

  const leaf = isDark ? "#A8B86C" : "#788844";
  const sprigL = { from: { x: 18, y: 126 }, ctrl: { x: 40, y: 74 }, to: { x: 100, y: 50 } };
  return (
    <>
      {mandala}
      <Sprig {...sprigL} color={leaf} leaves={6} />
      <Sprig from={mirrorX(sprigL.from)} ctrl={mirrorX(sprigL.ctrl)} to={mirrorX(sprigL.to)} color={leaf} leaves={6} flip />
      <Sparkle cx={70} cy={30} r={4.5} />
      <Sparkle cx={334} cy={36} r={5} />
    </>
  );
}

/**
 * Festival banner under the tabs — ornaments + greeting. Swaps art by `theme.ornament`
 * (marigold garlands for Navratri, fairy lights & diyas for Diwali, olive sprigs every day).
 */
export default function FestiveBanner({ theme, onPress }) {
  const { c, type, isDark } = useStoreTheme();
  const { width } = useWindowDimensions();
  const height = Math.round(width * (DESIGN_H / DESIGN_W));
  const { banner, ornament } = theme;
  const titleColor = isDark ? "#F6E3B4" : ornament === "none" ? c.brand : ornament === "diya" ? "#6B3708" : "#7A2A0C";

  return (
    <PressableScale
      onPress={onPress}
      scaleTo={0.99}
      style={{ height }}
      accessibilityRole="button"
      accessibilityLabel={`${banner.title}. ${banner.subtitle}`}
    >
      <Svg width="100%" height="100%" viewBox={`0 0 ${DESIGN_W} ${DESIGN_H}`} preserveAspectRatio="xMidYMid slice" style={StyleSheet.absoluteFill}>
        <Artwork ornament={ornament} isDark={isDark} />
      </Svg>
      <Animated.View entering={FadeIn.duration(500)} style={[styles.copy, { top: height * 0.4 }]} pointerEvents="none">
        <Text style={type.eyebrow(isDark ? c.goldText : "#9A5F18", 10.5)}>{banner.eyebrow}</Text>
        <Text
          style={[
            type.display(31, { color: titleColor, ls: -0.6, lh: 36 }),
            { textShadowColor: isDark ? "transparent" : "rgba(255,255,255,0.55)", textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 6 },
          ]}
          numberOfLines={1}
        >
          {banner.title}
        </Text>
        <Text style={type.ui(13.5, "semibold", isDark ? c.inkSoft : "#6A4A1C")} numberOfLines={1}>
          {banner.subtitle}
        </Text>
      </Animated.View>
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  copy: { position: "absolute", left: 0, right: 0, alignItems: "center", gap: 1 },
});
