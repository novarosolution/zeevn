import React from "react";
import { Platform, StyleSheet, Text, View, useWindowDimensions } from "react-native";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import Svg, { Path, Rect } from "react-native-svg";
import Animated, { FadeInUp, interpolate, useAnimatedStyle, useSharedValue } from "react-native-reanimated";
import { useStoreTheme } from "../../theme/storefront";
import { getProductPricing, productImageUri } from "../../utils/storefront";
import {
  CLUSTER_H,
  CLUSTER_W,
  DiyaCluster,
  Embers,
  GlowSpot,
  LightString,
  Rangoli,
  Sheen,
  SwaySprig,
  TwinkleStar,
  useLoop,
} from "./HomeArt";
import { useHomeScroll } from "./HomeMotion";
import PressableScale from "./PressableScale";

const RADIUS = 28;
/** Compact lamp cluster scale when a product photo shares the card. */
const LAMP_SCALE = 0.62;

/** Used only if a theme forgets its palette, so the hero never renders blank. */
const FALLBACK_PALETTE = {
  gradient: ["#1D3A1E", "#2D5629", "#587534"],
  eyebrow: "#EDC27D",
  title: "#FBF7EA",
  subtitle: "#DDE6C6",
  ctaBg: "#EDC27D",
  ctaText: "#22300F",
  gold: "#E8BC84",
  border: "rgba(237, 194, 125, 0.42)",
};

function CtaArrow({ color }) {
  const t = useLoop(760);
  const animatedStyle = useAnimatedStyle(() => ({ transform: [{ translateX: interpolate(t.value, [0, 1], [0, 3.5]) }] }));
  return (
    <Animated.View style={animatedStyle}>
      <Ionicons name="arrow-forward" size={15} color={color} />
    </Animated.View>
  );
}

/** A short gold rule with a diamond in the middle — the hero's only ornament in the copy block. */
function OrnamentRule({ color, width = 78 }) {
  return (
    <Svg width={width} height={10} viewBox={`0 0 ${width} 10`}>
      <Rect x={0} y={4.4} width={width / 2 - 8} height={1.2} rx={0.6} fill={color} opacity={0.7} />
      <Path d={`M${width / 2} 0.5 L${width / 2 + 4.5} 5 L${width / 2} 9.5 L${width / 2 - 4.5} 5 Z`} fill={color} />
      <Rect x={width / 2 + 8} y={4.4} width={width / 2 - 8} height={1.2} rx={0.6} fill={color} opacity={0.7} />
    </Svg>
  );
}

/**
 * The product photo, tilted like a print on a shelf, floating gently with a soft shadow, and lagging a little
 * behind the page as you scroll (a touch of depth). A round sticker shows the discount when there is one.
 */
function Spotlight({ uri, size, top, palette, discount }) {
  const { type } = useStoreTheme();
  const float = useLoop(3200);
  const scroll = useHomeScroll();
  const idle = useSharedValue(0);
  const scrollY = scroll?.scrollY ?? idle;
  const floatStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: interpolate(float.value, [0, 1], [3, -4]) + Math.max(0, Math.min(scrollY.value * 0.08, 16)) },
      { rotate: "-5deg" },
    ],
  }));
  return (
    <Animated.View pointerEvents="none" style={[styles.spot, { width: size, height: size, top }, floatStyle]}>
      <View style={styles.spotShadow}>
        <View style={styles.spotClip}>
          <Image source={{ uri }} style={StyleSheet.absoluteFill} contentFit="cover" transition={250} cachePolicy="memory-disk" />
          <LinearGradient colors={["rgba(255,255,255,0.22)", "rgba(255,255,255,0)"]} style={styles.spotGloss} />
        </View>
      </View>
      {discount ? (
        <View style={[styles.sticker, { backgroundColor: palette.ctaBg }]}>
          <Text style={type.display(15, { color: palette.ctaText, ls: -0.2, lh: 16 })} allowFontScaling={false}>
            {`${discount}%`}
          </Text>
          <Text style={type.ui(8, "extrabold", palette.ctaText, { letterSpacing: 0.6 })} allowFontScaling={false}>
            OFF
          </Text>
        </View>
      ) : null}
    </Animated.View>
  );
}

/** Diwali backdrop (behind the photo): glow, rangoli and the string of fairy lights. */
function DiwaliBackdrop({ palette, width }) {
  return (
    <>
      <GlowSpot size={330} color={palette.gold} opacity={0.38} style={{ position: "absolute", right: -92, bottom: -118 }} />
      <Rangoli size={252} color={palette.gold} opacity={0.17} style={{ position: "absolute", right: -92, top: -34 }} />
      <LightString width={width} sag={46} count={18} style={styles.lights} />
    </>
  );
}

/** Diwali foreground (in front of the photo): the lamps, rising embers and a few stars. */
function DiwaliLamps({ palette, width, height, compact }) {
  const embers = compact
    ? [
        { left: width - 84, bottom: 44, size: 2.6, rise: 54, drift: 6, delay: 0, duration: 3100 },
        { left: width - 52, bottom: 54, size: 3, rise: 66, drift: -5, delay: 900, duration: 3500 },
        { left: width - 24, bottom: 40, size: 2.2, rise: 50, drift: 5, delay: 1500, duration: 3000 },
        { left: width - 68, bottom: 50, size: 2, rise: 72, drift: -4, delay: 2200, duration: 3900 },
      ]
    : [
        { left: width - 72, bottom: 90, size: 3.2, rise: 78, drift: 7, delay: 0, duration: 3100 },
        { left: width - 62, bottom: 88, size: 2.4, rise: 92, drift: -6, delay: 1100, duration: 3600 },
        { left: width - 124, bottom: 68, size: 2.8, rise: 70, drift: 6, delay: 500, duration: 3300 },
        { left: width - 116, bottom: 66, size: 2.2, rise: 84, drift: -5, delay: 1700, duration: 3900 },
        { left: width - 24, bottom: 56, size: 2.4, rise: 60, drift: 5, delay: 900, duration: 3000 },
        { left: width - 78, bottom: 94, size: 2, rise: 100, drift: 8, delay: 2300, duration: 4200 },
      ];
  return (
    <>
      <DiyaCluster
        style={
          compact
            ? { position: "absolute", right: 4, bottom: 2, width: CLUSTER_W, height: CLUSTER_H, transform: [{ scale: LAMP_SCALE }], transformOrigin: "100% 100%" }
            : { position: "absolute", right: -4, bottom: 6, width: CLUSTER_W, height: CLUSTER_H }
        }
      />
      <Embers items={embers} color="#FFD66B" />
      <TwinkleStar x={width * 0.5} y={height * 0.3} r={5} color={palette.gold} delay={200} />
      <TwinkleStar x={width * 0.46} y={height * 0.62} r={3.6} color={palette.gold} delay={1500} />
      {compact ? null : <TwinkleStar x={width * 0.8} y={height * 0.4} r={6.5} color={palette.gold} delay={900} />}
    </>
  );
}

/** Everyday backdrop: a faint rangoli and two swaying sprigs (they peek out from behind the photo). */
function EverydayBackdrop({ palette, width, height }) {
  return (
    <>
      <GlowSpot size={300} color={palette.gold} opacity={0.26} style={{ position: "absolute", right: -90, bottom: -110 }} />
      <Rangoli size={252} color={palette.gold} opacity={0.15} duration={90000} style={{ position: "absolute", right: -92, top: -26 }} />
      <SwaySprig
        width={width}
        height={height}
        from={{ x: width - 18, y: height + 8 }}
        ctrl={{ x: width - 98, y: height - 62 }}
        to={{ x: width - 72, y: height - 154 }}
        color={palette.gold}
        leaves={6}
      />
      <SwaySprig
        width={width}
        height={height}
        from={{ x: width + 6, y: height - 8 }}
        ctrl={{ x: width - 42, y: height - 84 }}
        to={{ x: width - 22, y: height - 176 }}
        color={palette.gold}
        leaves={5}
        flip
        delay={600}
      />
      <TwinkleStar x={width * 0.52} y={height * 0.3} r={4.4} color={palette.gold} delay={0} />
      <TwinkleStar x={width * 0.46} y={height * 0.66} r={3.4} color={palette.gold} delay={800} />
    </>
  );
}

/**
 * Home hero — the festival (or brand) announcement: layered gradient, animated artwork, a tilted product photo,
 * the serif headline and a call to action. Copy and colours come from the theme (`banner.*`); `ornament` picks the
 * artwork and `product` the spotlight photo. Optional `banner.eyebrow` / `banner.subtitle` add more copy.
 */
export default function FestiveBanner({ theme, product, onPress, ctaLabel }) {
  const { type, isDark } = useStoreTheme();
  const { width: screenW } = useWindowDimensions();
  const width = screenW - 32;
  const height = Math.round(Math.min(252, Math.max(214, width * 0.65)));
  const titleSize = Math.max(25, Math.min(32, Math.round(width * 0.09)));
  const { banner, ornament } = theme;
  const palette = (isDark ? banner.palette?.dark : banner.palette?.light) || FALLBACK_PALETTE;
  const festive = ornament === "diya";
  const label = ctaLabel || banner.cta || "Shop now";

  const spotSize = Math.round(Math.min(150, Math.max(104, width * 0.38)));
  const spotUri = product ? productImageUri(product, spotSize) : "";
  const discount = product ? getProductPricing(product).discountPct : null;
  const spotTop = Math.round(height / 2 - spotSize / 2 + 8);

  const glow = {
    shadowColor: palette.gradient[2],
    shadowOpacity: isDark ? 0.5 : 0.34,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 12 },
    ...Platform.select({ android: { elevation: 8 }, default: {} }),
  };

  return (
    <PressableScale
      onPress={onPress}
      scaleTo={0.985}
      style={[styles.wrap, glow, { height, backgroundColor: palette.gradient[1] }]}
      accessibilityRole="button"
      accessibilityLabel={[banner.title, banner.subtitle].filter(Boolean).join(". ")}
    >
      <View style={[styles.clip, { borderColor: palette.border }]}>
        <LinearGradient colors={palette.gradient} start={{ x: 0.05, y: 0 }} end={{ x: 0.95, y: 1 }} style={StyleSheet.absoluteFill} />
        {festive ? <DiwaliBackdrop palette={palette} width={width} /> : <EverydayBackdrop palette={palette} width={width} height={height} />}
        {spotUri ? <Spotlight uri={spotUri} size={spotSize} top={spotTop} palette={palette} discount={discount} /> : null}
        {festive ? <DiwaliLamps palette={palette} width={width} height={height} compact={Boolean(spotUri)} /> : null}
        <LinearGradient
          colors={["rgba(255,255,255,0.16)", "rgba(255,255,255,0)"]}
          locations={[0, 1]}
          style={styles.gloss}
          pointerEvents="none"
        />
        <Sheen width={width} />

        <View style={styles.copy} pointerEvents="none">
          {banner.eyebrow ? (
            <Animated.View entering={FadeInUp.duration(420)} style={styles.eyebrowRow}>
              <View style={[styles.eyebrowDot, { backgroundColor: palette.gold }]} />
              <Text style={type.eyebrow(palette.eyebrow, 10.5)} numberOfLines={1} maxFontSizeMultiplier={1.15}>
                {banner.eyebrow}
              </Text>
            </Animated.View>
          ) : null}
          <Animated.Text
            entering={FadeInUp.delay(80).duration(480)}
            style={[type.display(titleSize, { color: palette.title, ls: -0.7, lh: titleSize + 3 }), styles.title]}
            numberOfLines={2}
            maxFontSizeMultiplier={1.12}
          >
            {banner.title}
          </Animated.Text>
          <Animated.View entering={FadeInUp.delay(140).duration(460)}>
            <OrnamentRule color={palette.gold} />
          </Animated.View>
          {banner.subtitle ? (
            <Animated.Text
              entering={FadeInUp.delay(180).duration(480)}
              style={[type.ui(13.5, "medium", palette.subtitle), styles.subtitle]}
              numberOfLines={2}
              maxFontSizeMultiplier={1.15}
            >
              {banner.subtitle}
            </Animated.Text>
          ) : null}
          <Animated.View
            entering={FadeInUp.delay(240).duration(460)}
            style={[styles.cta, { backgroundColor: palette.ctaBg, shadowColor: palette.ctaBg }]}
          >
            <Text style={type.ui(13.5, "extrabold", palette.ctaText, { letterSpacing: 0.2 })} maxFontSizeMultiplier={1.15}>
              {label}
            </Text>
            <CtaArrow color={palette.ctaText} />
          </Animated.View>
        </View>
      </View>
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  wrap: { marginHorizontal: 16, borderRadius: RADIUS },
  clip: { flex: 1, borderRadius: RADIUS, borderWidth: 1, overflow: "hidden" },
  lights: { position: "absolute", top: 0, left: 0 },
  gloss: { position: "absolute", top: 0, left: 0, right: 0, height: "46%" },
  copy: {
    position: "absolute",
    left: 20,
    top: 0,
    bottom: 0,
    width: "52%",
    justifyContent: "center",
    paddingTop: 22,
    gap: 8,
  },
  eyebrowRow: { flexDirection: "row", alignItems: "center", gap: 7 },
  eyebrowDot: { width: 5, height: 5, borderRadius: 2.5, transform: [{ rotate: "45deg" }] },
  title: {
    textShadowColor: "rgba(0, 0, 0, 0.28)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 8,
  },
  subtitle: { marginBottom: 2 },
  cta: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    height: 40,
    paddingHorizontal: 18,
    borderRadius: 20,
    marginTop: 2,
    shadowOpacity: 0.45,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
  },
  spot: { position: "absolute", right: 20 },
  spotShadow: {
    flex: 1,
    borderRadius: 22,
    backgroundColor: "#FFFFFF",
    shadowColor: "#000000",
    shadowOpacity: 0.4,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 10 },
    ...Platform.select({ android: { elevation: 10 }, default: {} }),
  },
  spotClip: { flex: 1, borderRadius: 22, borderWidth: 3, borderColor: "rgba(255, 255, 255, 0.95)", overflow: "hidden" },
  spotGloss: { position: "absolute", top: 0, left: 0, right: 0, height: "42%" },
  sticker: {
    position: "absolute",
    top: -14,
    left: -14,
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: "center",
    justifyContent: "center",
    transform: [{ rotate: "-12deg" }],
    shadowColor: "#000000",
    shadowOpacity: 0.3,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
  },
});
