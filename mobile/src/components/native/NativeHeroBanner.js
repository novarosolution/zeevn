import React, { useMemo } from "react";
import { Platform, Pressable, StyleSheet, Text, View } from "react-native";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { KankregGrainOverlay } from "../kankreg/KankregPageChrome";
import { FIGMA } from "../../theme/figmaApp";
import { useTheme } from "../../context/ThemeContext";
import { FONT_HEADING } from "../../theme/typographyRoles";
import { formatINR } from "../../utils/currency";
import { getImageUriCandidates, PRODUCT_HERO_BLURHASH } from "../../utils/image";
import { fonts, spacing } from "../../theme/tokens";
import { platformShadow } from "../../theme/shadowPlatform";
import { HOME_SCREEN_UI } from "../../content/appContent";

const heroShadow = platformShadow({
  ios: {
    shadowColor: "#3D2A12",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.18,
    shadowRadius: 22,
  },
  android: { elevation: 6 },
});

const heroShadowDark = platformShadow({
  ios: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.35,
    shadowRadius: 24,
  },
  android: { elevation: 8 },
});

/** figmaforkankreg.html Home hero — radial gradient + product showcase */
export default function NativeHeroBanner({
  eyebrow = HOME_SCREEN_UI.hero.eyebrow,
  title,
  subtitle,
  featuredProduct,
  onPress,
  loading = false,
}) {
  const { colors: c, isDark } = useTheme();
  const imageUri = useMemo(() => {
    const src = featuredProduct?.image || featuredProduct?.images?.[0] || "";
    return getImageUriCandidates(src)[0] || "";
  }, [featuredProduct?.image, featuredProduct?.images]);

  if (Platform.OS === "web") return null;

  const displayTitle = title || HOME_SCREEN_UI.hero.titleFallback;
  const showPrice =
    featuredProduct?.price != null && Number(featuredProduct.price) > 0 && !loading;

  const heroGrad = isDark
    ? ["#3a3228", "#2a241e", "#1a1714", "#0c0a09"]
    : ["#f0e3c5", "#d4b87a", "#8a6f45", "#2c2620"];

  const washGrad = isDark
    ? ["rgba(232,200,90,0.12)", "transparent", "rgba(0,0,0,0.45)"]
    : ["rgba(255,255,255,0.12)", "transparent", "rgba(0,0,0,0.28)"];

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.outer, pressed && styles.pressed]}
      accessibilityRole="button"
      disabled={loading}
    >
      <View
        style={[
          styles.wrap,
          isDark ? heroShadowDark : heroShadow,
          { borderColor: isDark ? "rgba(168, 184, 108, 0.22)" : "rgba(255,255,255,0.22)" },
        ]}
      >
        <LinearGradient
          colors={heroGrad}
          locations={[0, 0.42, 0.68, 1]}
          start={{ x: 0.72, y: 0.08 }}
          end={{ x: 0.18, y: 1 }}
          style={StyleSheet.absoluteFillObject}
        />
        <LinearGradient colors={washGrad} locations={[0, 0.45, 1]} style={styles.lightWash} />
        <KankregGrainOverlay />
        <View
          style={[
            styles.goldRing,
            { borderColor: isDark ? "rgba(214,173,91,0.35)" : "rgba(214,173,91,0.25)" },
          ]}
          pointerEvents="none"
        />

        <View style={styles.illo} pointerEvents="none">
          <View
            style={[
              styles.illoGlow,
              { backgroundColor: isDark ? "rgba(232,200,90,0.1)" : "rgba(255,255,255,0.08)" },
            ]}
          />
          {imageUri ? (
            <Image
              source={{ uri: imageUri }}
              style={styles.productImage}
              contentFit="contain"
              placeholder={{ blurhash: PRODUCT_HERO_BLURHASH }}
            />
          ) : (
            <Ionicons name="cafe-outline" size={82} color="rgba(255,255,255,0.35)" />
          )}
          <View style={styles.productFloor} />
        </View>

        {showPrice ? (
          <View
            style={[
              styles.priceChip,
              isDark
                ? {
                    backgroundColor: "rgba(24, 21, 19, 0.92)",
                    borderColor: "rgba(168, 184, 108, 0.35)",
                  }
                : {
                    backgroundColor: "rgba(255,253,248,0.96)",
                    borderColor: FIGMA.line,
                  },
            ]}
            pointerEvents="none"
          >
            <Text style={[styles.priceChipLabel, isDark && { color: "rgba(245,239,228,0.65)" }]}>
              {HOME_SCREEN_UI.hero.fromLabel}
            </Text>
            <Text style={[styles.priceChipValue, isDark && { color: c.primaryBright }]}>
              {formatINR(featuredProduct.price)}
            </Text>
          </View>
        ) : null}

        <View style={styles.copy}>
          <View style={styles.eyebrowRow}>
            <View style={[styles.eyebrowDot, { backgroundColor: isDark ? c.primaryBright : FIGMA.goldBright }]} />
            <Text style={styles.eyebrow}>{eyebrow}</Text>
          </View>
          <Text style={styles.title} numberOfLines={2}>
            {displayTitle}
          </Text>
          {subtitle ? (
            <Text style={[styles.subtitle, isDark && styles.subtitleDark]} numberOfLines={2}>
              {subtitle}
            </Text>
          ) : null}
          <LinearGradient
            colors={
              loading
                ? isDark
                  ? ["rgba(255,255,255,0.12)", "rgba(232,200,90,0.18)"]
                  : ["#ece3d2", "#e0d4bc"]
                : isDark
                  ? ["#788844", "#244424"]
                  : ["#fff", "#fffdf8"]
            }
            style={[styles.cta, !subtitle && styles.ctaSpaced]}
          >
            <Text
              style={[
                styles.ctaText,
                isDark && styles.ctaTextDark,
                loading && (isDark ? styles.ctaTextLoadingDark : styles.ctaTextLoading),
              ]}
            >
              {loading ? HOME_SCREEN_UI.hero.loadingCta : HOME_SCREEN_UI.hero.cta}
            </Text>
            {!loading ? (
              <Ionicons name="arrow-forward" size={12} color={isDark ? "#1a1612" : FIGMA.ink} />
            ) : null}
          </LinearGradient>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  outer: {
    marginHorizontal: FIGMA.gutter,
    marginTop: spacing.sm,
  },
  pressed: {
    opacity: 0.96,
    transform: [{ scale: 0.992 }],
  },
  wrap: {
    height: 178,
    borderRadius: FIGMA.radiusHero,
    overflow: "hidden",
    borderWidth: StyleSheet.hairlineWidth,
  },
  lightWash: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 1,
  },
  goldRing: {
    position: "absolute",
    top: -40,
    right: -30,
    width: 140,
    height: 140,
    borderRadius: 70,
    borderWidth: 1,
    zIndex: 1,
  },
  illo: {
    position: "absolute",
    right: -8,
    top: 8,
    bottom: 8,
    width: "48%",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 3,
  },
  illoGlow: {
    position: "absolute",
    width: 120,
    height: 120,
    borderRadius: 60,
  },
  productImage: {
    width: "90%",
    height: "90%",
    zIndex: 2,
  },
  productFloor: {
    position: "absolute",
    left: "16%",
    right: "16%",
    bottom: "6%",
    height: 11,
    borderRadius: 999,
    backgroundColor: "rgba(25,20,15,0.25)",
    zIndex: 1,
  },
  priceChip: {
    position: "absolute",
    top: 16,
    right: 16,
    borderRadius: 12,
    paddingHorizontal: 11,
    paddingVertical: 8,
    zIndex: 5,
    borderWidth: StyleSheet.hairlineWidth,
    ...platformShadow({
      ios: {
        shadowColor: "#19140f",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.12,
        shadowRadius: 6,
      },
      android: { elevation: 2 },
    }),
  },
  priceChipLabel: {
    fontFamily: fonts.semibold,
    fontSize: 8,
    color: FIGMA.inkFaint,
    letterSpacing: 0.4,
    textTransform: "uppercase",
  },
  priceChipValue: {
    fontFamily: FONT_HEADING,
    fontSize: 16,
    fontWeight: "600",
    color: FIGMA.ink,
    marginTop: 1,
  },
  copy: {
    flex: 1,
    justifyContent: "center",
    paddingLeft: 22,
    paddingRight: "48%",
    zIndex: 4,
  },
  eyebrowRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 2,
  },
  eyebrowDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
  },
  eyebrow: {
    fontFamily: fonts.bold,
    fontSize: 8,
    letterSpacing: 2.8,
    textTransform: "uppercase",
    color: "rgba(255,255,255,0.92)",
  },
  title: {
    fontFamily: FONT_HEADING,
    fontSize: 23,
    fontWeight: "400",
    color: "#fff",
    marginTop: 4,
    lineHeight: 26,
    letterSpacing: -0.3,
  },
  subtitle: {
    fontFamily: fonts.medium,
    fontSize: 11,
    lineHeight: 15,
    color: "rgba(255,255,255,0.78)",
    marginTop: 5,
    marginBottom: 12,
  },
  subtitleDark: {
    color: "rgba(255,255,255,0.9)",
  },
  cta: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 15,
    paddingVertical: 9,
    borderRadius: 999,
  },
  ctaSpaced: {
    marginTop: 12,
  },
  ctaText: {
    fontFamily: fonts.bold,
    fontSize: 10.5,
    color: FIGMA.ink,
    letterSpacing: 0.15,
  },
  ctaTextDark: {
    color: "#1a1612",
  },
  ctaTextLoading: {
    color: FIGMA.inkSoft,
  },
  ctaTextLoadingDark: {
    color: "rgba(245,239,228,0.72)",
  },
});
