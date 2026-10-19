import React from "react";
import { Platform, StyleSheet, Text, View, useWindowDimensions } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import Animated, { FadeInUp, interpolate, useAnimatedStyle } from "react-native-reanimated";
import { useStoreTheme } from "../../theme/storefront";
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
import PressableScale from "./PressableScale";

const RADIUS = 28;

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

/** Diwali: a string of fairy lights, a rangoli, three flickering diyas, rising embers and stars. */
function DiwaliArt({ palette, width, height }) {
  const embers = [
    { left: width - 72, bottom: 90, size: 3.2, rise: 78, drift: 7, delay: 0, duration: 3100 },
    { left: width - 62, bottom: 88, size: 2.4, rise: 92, drift: -6, delay: 1100, duration: 3600 },
    { left: width - 124, bottom: 68, size: 2.8, rise: 70, drift: 6, delay: 500, duration: 3300 },
    { left: width - 116, bottom: 66, size: 2.2, rise: 84, drift: -5, delay: 1700, duration: 3900 },
    { left: width - 24, bottom: 56, size: 2.4, rise: 60, drift: 5, delay: 900, duration: 3000 },
    { left: width - 78, bottom: 94, size: 2, rise: 100, drift: 8, delay: 2300, duration: 4200 },
  ];
  return (
    <>
      <GlowSpot size={330} color={palette.gold} opacity={0.38} style={{ position: "absolute", right: -92, bottom: -118 }} />
      <Rangoli size={252} color={palette.gold} opacity={0.17} style={{ position: "absolute", right: -92, top: -34 }} />
      <LightString width={width} sag={46} count={18} style={styles.lights} />
      <DiyaCluster style={{ position: "absolute", right: -4, bottom: 6, width: CLUSTER_W, height: CLUSTER_H }} />
      <Embers items={embers} color="#FFD66B" />
      <TwinkleStar x={width * 0.5} y={height * 0.3} r={5} color={palette.gold} delay={200} />
      <TwinkleStar x={width * 0.8} y={height * 0.4} r={6.5} color={palette.gold} delay={900} />
      <TwinkleStar x={width * 0.62} y={height * 0.58} r={3.6} color={palette.gold} delay={1500} />
    </>
  );
}

/** Everyday: a calm olive hero — a faint rangoli, two swaying sprigs and a few stars. */
function EverydayArt({ palette, width, height }) {
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
      <TwinkleStar x={width * 0.74} y={height * 0.5} r={3.4} color={palette.gold} delay={800} />
    </>
  );
}

/**
 * Home hero — the festival (or brand) announcement: layered gradient, animated artwork, serif headline and a
 * call to action. Copy and colours come from the theme (`banner.*`); `ornament` picks the artwork.
 */
export default function FestiveBanner({ theme, onPress, ctaLabel }) {
  const { type, isDark } = useStoreTheme();
  const { width: screenW } = useWindowDimensions();
  const width = screenW - 32;
  const height = Math.round(Math.min(252, Math.max(214, width * 0.65)));
  const titleSize = Math.max(25, Math.min(31, Math.round(width * 0.087)));
  const { banner, ornament } = theme;
  const palette = (isDark ? banner.palette?.dark : banner.palette?.light) || FALLBACK_PALETTE;
  const festive = ornament === "diya";
  const label = ctaLabel || banner.cta || "Shop now";
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
      accessibilityLabel={`${banner.title}. ${banner.subtitle}`}
    >
      <View style={[styles.clip, { borderColor: palette.border }]}>
        <LinearGradient colors={palette.gradient} start={{ x: 0.05, y: 0 }} end={{ x: 0.95, y: 1 }} style={StyleSheet.absoluteFill} />
        {festive ? <DiwaliArt palette={palette} width={width} height={height} /> : <EverydayArt palette={palette} width={width} height={height} />}
        <LinearGradient
          colors={["rgba(255,255,255,0.16)", "rgba(255,255,255,0)"]}
          locations={[0, 1]}
          style={styles.gloss}
          pointerEvents="none"
        />
        <Sheen width={width} />

        <View style={styles.copy} pointerEvents="none">
          <Animated.View entering={FadeInUp.duration(420)} style={styles.eyebrowRow}>
            <View style={[styles.eyebrowDot, { backgroundColor: palette.gold }]} />
            <Text style={type.eyebrow(palette.eyebrow, 10.5)} numberOfLines={1} maxFontSizeMultiplier={1.15}>
              {banner.eyebrow}
            </Text>
          </Animated.View>
          <Animated.Text
            entering={FadeInUp.delay(80).duration(480)}
            style={[type.display(titleSize, { color: palette.title, ls: -0.7, lh: titleSize + 3 }), styles.title]}
            numberOfLines={2}
            maxFontSizeMultiplier={1.12}
          >
            {banner.title}
          </Animated.Text>
          <Animated.Text
            entering={FadeInUp.delay(160).duration(480)}
            style={[type.ui(13.5, "medium", palette.subtitle), styles.subtitle]}
            numberOfLines={2}
            maxFontSizeMultiplier={1.15}
          >
            {banner.subtitle}
          </Animated.Text>
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
    width: "56%",
    justifyContent: "center",
    paddingTop: 22,
    gap: 6,
  },
  eyebrowRow: { flexDirection: "row", alignItems: "center", gap: 7 },
  eyebrowDot: { width: 5, height: 5, borderRadius: 2.5, transform: [{ rotate: "45deg" }] },
  title: {
    textShadowColor: "rgba(0, 0, 0, 0.28)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 8,
  },
  subtitle: { marginBottom: 4 },
  cta: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    height: 40,
    paddingHorizontal: 18,
    borderRadius: 20,
    shadowOpacity: 0.45,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
  },
});
