import React, { memo } from "react";
import { Platform, StyleSheet, Text, View, useWindowDimensions } from "react-native";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
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

/** Cheap diamond rule — Views only (no SVG). */
function OrnamentRule({ color }) {
  return (
    <View style={styles.ruleRow}>
      <View style={[styles.ruleLine, { backgroundColor: color }]} />
      <View style={[styles.ruleDiamond, { backgroundColor: color }]} />
      <View style={[styles.ruleLine, { backgroundColor: color }]} />
    </View>
  );
}

function SoftGlow({ color, size, style, opacity = 0.28 }) {
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
            recyclingKey={uri}
          />
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

/**
 * Festival banner — tilted product card + soft glows.
 * No HomeArt SVG/diya clusters (those hitch scroll on low-end phones).
 */
function FestiveBanner({ theme, product, onPress, ctaLabel }) {
  const { type, isDark } = useStoreTheme();
  const { width: screenW } = useWindowDimensions();
  const width = screenW - 32;
  const height = Math.round(Math.min(236, Math.max(200, width * 0.58)));
  const titleSize = Math.max(24, Math.min(30, Math.round(width * 0.085)));
  const { banner, ornament } = theme;
  const palette = (isDark ? banner.palette?.dark : banner.palette?.light) || FALLBACK_PALETTE;
  const festive = ornament === "diya";
  const label = ctaLabel || banner.cta || "Shop now";

  const spotSize = Math.round(Math.min(148, Math.max(108, width * 0.38)));
  const spotUri = product ? productImageUri(product, Math.round(spotSize * 1.2)) : "";
  const discount = product ? getProductPricing(product).discountPct : null;
  const spotTop = Math.round(height / 2 - spotSize / 2 + 4);

  return (
    <PressableScale
      onPress={onPress}
      scaleTo={0.99}
      lite
      style={[
        styles.wrap,
        {
          height,
          backgroundColor: palette.gradient[1],
          shadowColor: palette.gradient[2],
          shadowOpacity: isDark ? 0.4 : 0.28,
          shadowRadius: 16,
          shadowOffset: { width: 0, height: 8 },
          ...Platform.select({ android: { elevation: 6 }, default: {} }),
        },
      ]}
      accessibilityRole="button"
      accessibilityLabel={[banner.title, banner.subtitle].filter(Boolean).join(". ")}
    >
      <View style={[styles.clip, { borderColor: palette.border }]}>
        <LinearGradient colors={palette.gradient} start={{ x: 0.05, y: 0 }} end={{ x: 0.95, y: 1 }} style={StyleSheet.absoluteFill} />
        <SoftGlow
          color={palette.gold}
          size={festive ? 260 : 220}
          opacity={festive ? 0.26 : 0.18}
          style={{ position: "absolute", right: -72, bottom: -90 }}
        />
        <SoftGlow
          color="#F6C877"
          size={160}
          opacity={0.16}
          style={{ position: "absolute", right: 40, top: -48 }}
        />
        {spotUri ? <Spotlight uri={spotUri} size={spotSize} top={spotTop} palette={palette} discount={discount} /> : null}

        <View style={styles.copy} pointerEvents="none">
          {banner.eyebrow ? (
            <Text style={type.eyebrow(palette.eyebrow, 10.5)} numberOfLines={1} maxFontSizeMultiplier={1.15}>
              {banner.eyebrow}
            </Text>
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
            <Text style={[type.ui(13, "medium", palette.subtitle), styles.subtitle]} numberOfLines={2} maxFontSizeMultiplier={1.15}>
              {banner.subtitle}
            </Text>
          ) : null}
          <View style={[styles.cta, { backgroundColor: palette.ctaBg }]}>
            <Text style={type.ui(13.5, "extrabold", palette.ctaText, { letterSpacing: 0.2 })} maxFontSizeMultiplier={1.15}>
              {label}
            </Text>
            <Ionicons name="arrow-forward" size={15} color={palette.ctaText} />
          </View>
        </View>
      </View>
    </PressableScale>
  );
}

export default memo(FestiveBanner);

const styles = StyleSheet.create({
  wrap: { marginHorizontal: 16, borderRadius: RADIUS },
  clip: { flex: 1, borderRadius: RADIUS, borderWidth: 1, overflow: "hidden" },
  copy: {
    position: "absolute",
    left: 20,
    top: 0,
    bottom: 0,
    width: "52%",
    justifyContent: "center",
    gap: 8,
  },
  title: {
    textShadowColor: "rgba(0, 0, 0, 0.22)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  subtitle: { marginBottom: 2 },
  ruleRow: { flexDirection: "row", alignItems: "center", gap: 8, width: 78 },
  ruleLine: { flex: 1, height: 1.2, borderRadius: 1, opacity: 0.75 },
  ruleDiamond: { width: 7, height: 7, transform: [{ rotate: "45deg" }] },
  cta: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    height: 40,
    paddingHorizontal: 18,
    borderRadius: 20,
    marginTop: 2,
  },
  spot: { position: "absolute", right: 18 },
  spotShadow: {
    flex: 1,
    borderRadius: 22,
    backgroundColor: "#F7F4EC",
    shadowColor: "#000000",
    shadowOpacity: 0.28,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    ...Platform.select({ android: { elevation: 6 }, default: {} }),
  },
  spotClip: { flex: 1, borderRadius: 22, borderWidth: 2, borderColor: "rgba(255, 255, 255, 0.88)", overflow: "hidden" },
  sticker: {
    position: "absolute",
    top: -12,
    left: -12,
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    transform: [{ rotate: "-12deg" }],
  },
});
