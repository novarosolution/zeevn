import React from "react";
import { Platform, StyleSheet, Text, View, useWindowDimensions } from "react-native";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import Svg, { Path, Rect } from "react-native-svg";
import { useStoreTheme } from "../../theme/storefront";
import { getProductPricing, productImageUri } from "../../utils/storefront";
import PressableScale from "./PressableScale";

const RADIUS = 28;

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
  return <Ionicons name="arrow-forward" size={15} color={color} />;
}

function OrnamentRule({ color, width = 78 }) {
  return (
    <Svg width={width} height={10} viewBox={`0 0 ${width} 10`}>
      <Rect x={0} y={4.4} width={width / 2 - 8} height={1.2} rx={0.6} fill={color} opacity={0.7} />
      <Path d={`M${width / 2} 0.5 L${width / 2 + 4.5} 5 L${width / 2} 9.5 L${width / 2 - 4.5} 5 Z`} fill={color} />
      <Rect x={width / 2 + 8} y={4.4} width={width / 2 - 8} height={1.2} rx={0.6} fill={color} opacity={0.7} />
    </Svg>
  );
}

function Spotlight({ uri, size, top, palette, discount }) {
  const { type } = useStoreTheme();
  return (
    <View pointerEvents="none" style={[styles.spot, { width: size, height: size, top, transform: [{ rotate: "-5deg" }] }]}>
      <View style={styles.spotShadow}>
        <View style={styles.spotClip}>
          <Image
            source={{ uri }}
            style={StyleSheet.absoluteFill}
            contentFit="contain"
            contentPosition="center"
            transition={0}
            cachePolicy="memory-disk"
          />
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
    </View>
  );
}

/** Soft static glow — no animated HomeArt (those loops hung Home). */
function SoftGlow({ color, size, style, opacity = 0.35 }) {
  return (
    <View
      pointerEvents="none"
      style={[
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: color,
          opacity,
        },
        style,
      ]}
    />
  );
}

/**
 * Home hero banner — festival/brand announcement. Static ornamentals only.
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
        <SoftGlow
          color={palette.gold}
          size={festive ? 280 : 240}
          opacity={festive ? 0.28 : 0.2}
          style={{ position: "absolute", right: -80, bottom: -100 }}
        />
        {spotUri ? <Spotlight uri={spotUri} size={spotSize} top={spotTop} palette={palette} discount={discount} /> : null}
        <LinearGradient
          colors={["rgba(255,255,255,0.16)", "rgba(255,255,255,0)"]}
          locations={[0, 1]}
          style={styles.gloss}
          pointerEvents="none"
        />

        <View style={styles.copy} pointerEvents="none">
          {banner.eyebrow ? (
            <View style={styles.eyebrowRow}>
              <View style={[styles.eyebrowDot, { backgroundColor: palette.gold }]} />
              <Text style={type.eyebrow(palette.eyebrow, 10.5)} numberOfLines={1} maxFontSizeMultiplier={1.15}>
                {banner.eyebrow}
              </Text>
            </View>
          ) : null}
          <Text
            style={[type.display(titleSize, { color: palette.title, ls: -0.7, lh: titleSize + 3 }), styles.title]}
            numberOfLines={2}
            maxFontSizeMultiplier={1.12}
          >
            {banner.title}
          </Text>
          <OrnamentRule color={palette.gold} />
          {banner.subtitle ? (
            <Text style={[type.ui(13.5, "medium", palette.subtitle), styles.subtitle]} numberOfLines={2} maxFontSizeMultiplier={1.15}>
              {banner.subtitle}
            </Text>
          ) : null}
          <View style={[styles.cta, { backgroundColor: palette.ctaBg, shadowColor: palette.ctaBg }]}>
            <Text style={type.ui(13.5, "extrabold", palette.ctaText, { letterSpacing: 0.2 })} maxFontSizeMultiplier={1.15}>
              {label}
            </Text>
            <CtaArrow color={palette.ctaText} />
          </View>
        </View>
      </View>
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  wrap: { marginHorizontal: 16, borderRadius: RADIUS },
  clip: { flex: 1, borderRadius: RADIUS, borderWidth: 1, overflow: "hidden" },
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
    backgroundColor: "#F7F4EC",
    shadowColor: "#000000",
    shadowOpacity: 0.4,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 10 },
    ...Platform.select({ android: { elevation: 10 }, default: {} }),
  },
  spotClip: { flex: 1, borderRadius: 22, borderWidth: 2, borderColor: "rgba(255, 255, 255, 0.88)", overflow: "hidden" },
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
