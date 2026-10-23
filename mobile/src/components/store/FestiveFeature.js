import React from "react";
import { StyleSheet, Text, View, useWindowDimensions } from "react-native";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useStoreTheme } from "../../theme/storefront";
import { TwinkleStar } from "./HomeArt";
import PressableScale from "./PressableScale";

const RATIO = 9 / 16;
const RADIUS = 30;

/** Fixed spots (fractions of the card) on the lamps and fairy lights in the Diwali photograph. */
const SPARKS = [
  { x: 0.5, y: 0.34, r: 6, delay: 0, period: 2300 },
  { x: 0.63, y: 0.2, r: 5, delay: 700, period: 2700 },
  { x: 0.8, y: 0.12, r: 4.5, delay: 300, period: 2100 },
  { x: 0.4, y: 0.62, r: 4, delay: 1200, period: 2500 },
];

/**
 * The festival's wide photo card — a cinematic still, the festival's greeting and one gold button. Only themes with
 * a `banner.image` show it. A few sparks twinkle over the lamps; they hold still with "reduce motion".
 */
export default function FestiveFeature({ banner, onPress }) {
  const { c, type, gutter, shadow } = useStoreTheme();
  const { width } = useWindowDimensions();
  if (!banner?.image) return null;
  const w = width - gutter * 2;
  const h = Math.round(w * RATIO * 1.06);

  return (
    <View style={{ paddingHorizontal: gutter }}>
      <PressableScale
        onPress={onPress}
        scaleTo={0.985}
        accessibilityRole="button"
        accessibilityLabel={banner.title}
        style={[shadow.card, { height: h, borderRadius: RADIUS, backgroundColor: "#16210F" }]}
      >
        <View style={[styles.clip, { borderRadius: RADIUS }]}>
          <Image
            source={banner.image}
            style={StyleSheet.absoluteFill}
            contentFit="cover"
            contentPosition={{ left: "70%", top: "50%" }}
            transition={0}
            cachePolicy="memory-disk"
          />
          <LinearGradient
            colors={["rgba(12, 22, 10, 0.78)", "rgba(12, 22, 10, 0.32)", "rgba(12, 22, 10, 0)"]}
            locations={[0, 0.5, 0.82]}
            start={{ x: 0, y: 0.5 }}
            end={{ x: 1, y: 0.5 }}
            style={StyleSheet.absoluteFill}
            pointerEvents="none"
          />
          {SPARKS.map((spark, i) => (
            <TwinkleStar key={i} x={w * spark.x} y={h * spark.y} r={spark.r} color="#FFE7A6" delay={spark.delay} period={spark.period} low={0.1} high={0.95} />
          ))}
          <View style={styles.copy} pointerEvents="none">
            <Text style={type.display(28, { color: "#FFF6E2", ls: -0.6, lh: 31 })} numberOfLines={2}>
              {banner.title}
            </Text>
            <View style={[styles.cta, { backgroundColor: c.goldBright }]}>
              <Text style={type.ui(13.5, "extrabold", "#2E2208", { letterSpacing: 0.3 })}>{banner.cta}</Text>
              <Ionicons name="arrow-forward" size={14} color="#2E2208" />
            </View>
          </View>
          <View style={[styles.rim, { borderRadius: RADIUS }]} pointerEvents="none" />
        </View>
      </PressableScale>
    </View>
  );
}

const styles = StyleSheet.create({
  clip: { flex: 1, overflow: "hidden" },
  copy: { position: "absolute", left: 18, top: 0, bottom: 0, width: "42%", justifyContent: "center", gap: 14 },
  cta: { alignSelf: "flex-start", height: 38, borderRadius: 19, paddingHorizontal: 16, flexDirection: "row", alignItems: "center", gap: 7 },
  rim: { ...StyleSheet.absoluteFillObject, borderWidth: 1, borderColor: "rgba(255, 244, 214, 0.22)" },
});
