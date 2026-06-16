import React, { useMemo } from "react";
import { Platform, Pressable, StyleSheet, Text, View } from "react-native";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import {
  FIGMA,
  figmaCardShell,
  figmaDisplayTitle,
  figmaPrice,
  figmaTextMuted,
  getProductTileGradient,
} from "../../theme/figmaApp";
import { useTheme } from "../../context/ThemeContext";
import { formatINR } from "../../utils/currency";
import { getImageUriCandidates, prefetchProductHeroImage } from "../../utils/image";
import { SHOP_SCREEN_UI } from "../../content/appContent";
import { fonts } from "../../theme/tokens";
import { platformShadow } from "../../theme/shadowPlatform";
import ComingSoonProductOverlay from "../product/ComingSoonProductOverlay";
import { getComingSoonImageBlurStyle } from "../../utils/comingSoonImageStyle";
import { COMING_SOON_RED } from "../../theme/comingSoonTheme";

const cardShadow = platformShadow({
  ios: {
    shadowColor: "#3D2A12",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.09,
    shadowRadius: 10,
  },
  android: { elevation: 3 },
});

/** figmaforkankreg.html .pcard — 2-up grid product tile */
export default function NativeProductCard({
  product,
  index = 0,
  onPress,
  onAddToCart,
  category,
  isOutOfStock = false,
  isComingSoon = false,
  comingSoonNote = "",
  isFeatured = false,
}) {
  const { colors: c, isDark } = useTheme();
  const grad = getProductTileGradient(index, isDark);
  const imageUri = useMemo(() => {
    const src = product?.image || product?.images?.[0] || "";
    return getImageUriCandidates(src, { width: 480, quality: "auto:good" })[0] || "";
  }, [product?.image, product?.images]);

  const listMrp = useMemo(() => {
    const n = product?.mrp != null ? Number(product.mrp) : NaN;
    const price = Number(product?.price) || 0;
    return Number.isFinite(n) && n > price ? n : null;
  }, [product?.mrp, product?.price]);

  const discountPct = useMemo(() => {
    if (!listMrp || listMrp <= 0) return null;
    const price = Number(product?.price) || 0;
    const pct = Math.round((1 - price / listMrp) * 100);
    return pct > 0 ? pct : null;
  }, [listMrp, product?.price]);

  const catLabel = category || product?.category || product?.homeSection || "Essentials";

  if (Platform.OS === "web") return null;

  return (
    <Pressable
      style={({ pressed }) => [
        figmaCardShell(isDark),
        styles.card,
        isComingSoon && styles.cardComingSoon,
        isFeatured && (isDark ? styles.cardFeaturedDark : styles.cardFeatured),
        cardShadow,
        pressed && styles.cardPressed,
      ]}
      onPressIn={() => prefetchProductHeroImage(product?.image || product?.images?.[0])}
      onPress={onPress}
      disabled={isOutOfStock && !isComingSoon}
    >
      <View style={styles.tile}>
        <LinearGradient
          colors={grad}
          start={{ x: 0.32, y: 0.18 }}
          end={{ x: 0.72, y: 0.88 }}
          style={StyleSheet.absoluteFillObject}
        />
        {imageUri ? (
          <Image
            source={{ uri: imageUri }}
            style={[styles.image, isComingSoon && getComingSoonImageBlurStyle()]}
            contentFit="contain"
          />
        ) : null}
        <View style={styles.floor} />
        {isComingSoon ? (
          <ComingSoonProductOverlay note={comingSoonNote} compact isDark={isDark} />
        ) : null}
        {isFeatured ? (
          <View style={styles.featuredBadge}>
            <Text style={styles.featuredBadgeText}>Top pick</Text>
          </View>
        ) : null}
        {discountPct ? (
          <View style={styles.offBadge}>
            <Text style={styles.offBadgeText}>{discountPct}% off</Text>
          </View>
        ) : null}
      </View>
      <View style={[styles.meta, { backgroundColor: isDark ? c.surface : FIGMA.card }]}>
        <Text style={[styles.cat, { color: isDark ? FIGMA.goldBright : FIGMA.gold }]} numberOfLines={1}>
          {String(catLabel).toUpperCase()}
        </Text>
        <Text style={[figmaDisplayTitle(13, isDark), styles.name]} numberOfLines={2}>
          {product?.name || "Product"}
        </Text>
        <View style={styles.priceRow}>
          <View style={styles.priceCol}>
            <Text style={[figmaPrice(isDark), styles.price]}>{formatINR(product?.price || 0)}</Text>
            {listMrp ? <Text style={[styles.was, figmaTextMuted(isDark)]}>{formatINR(listMrp)}</Text> : null}
          </View>
          <Pressable
            style={[styles.addBtn, (isOutOfStock || isComingSoon) && styles.addBtnDisabled]}
            onPress={(e) => {
              e?.stopPropagation?.();
              if (!isComingSoon) onAddToCart?.();
            }}
            disabled={isOutOfStock || isComingSoon}
            accessibilityLabel={isComingSoon ? "Coming soon" : "Add to cart"}
          >
            <LinearGradient
              colors={
                isComingSoon
                  ? [COMING_SOON_RED.mid, COMING_SOON_RED.deep]
                  : isOutOfStock
                    ? ["#9a9a9a", "#7a7a7a"]
                    : isDark
                      ? ["#788844", "#244424"]
                      : ["#2a241e", "#19140f"]
              }
              style={styles.addBtnGrad}
            >
              <Text style={[styles.addGlyph, isDark && !isOutOfStock && styles.addGlyphDark]}>+</Text>
            </LinearGradient>
          </Pressable>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    minWidth: 0,
    borderRadius: FIGMA.radiusCard,
    overflow: "hidden",
  },
  cardComingSoon: {
    borderColor: COMING_SOON_RED.cardBorder,
    borderWidth: 1,
  },
  cardFeatured: {
    borderColor: "rgba(169,119,46,0.35)",
    borderWidth: 1,
  },
  cardFeaturedDark: {
    borderColor: "rgba(168, 184, 108, 0.42)",
    borderWidth: 1.5,
  },
  cardPressed: {
    opacity: 0.94,
    transform: [{ scale: 0.985 }],
  },
  tile: {
    aspectRatio: 1,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    position: "relative",
  },
  image: {
    width: "68%",
    height: "68%",
    zIndex: 1,
  },
  floor: {
    position: "absolute",
    left: "22%",
    right: "22%",
    bottom: "14%",
    height: 9,
    borderRadius: 999,
    backgroundColor: "rgba(25,20,15,0.18)",
    zIndex: 0,
  },
  featuredBadge: {
    position: "absolute",
    top: 8,
    left: 8,
    backgroundColor: FIGMA.ink,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
    zIndex: 2,
  },
  featuredBadgeText: {
    fontFamily: fonts.bold,
    fontSize: 7.5,
    letterSpacing: 0.8,
    textTransform: "uppercase",
    color: FIGMA.goldBright,
  },
  offBadge: {
    position: "absolute",
    top: 8,
    right: 8,
    backgroundColor: "rgba(60,98,72,0.92)",
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 999,
    zIndex: 2,
  },
  offBadgeText: {
    fontFamily: fonts.bold,
    fontSize: 7,
    color: "#fff",
    letterSpacing: 0.3,
  },
  meta: {
    paddingHorizontal: 11,
    paddingTop: 10,
    paddingBottom: 12,
  },
  cat: {
    fontFamily: fonts.bold,
    fontSize: 8,
    letterSpacing: 1.5,
  },
  name: {
    marginTop: 3,
    marginBottom: 6,
    lineHeight: 16,
    fontWeight: "500",
    minHeight: 32,
  },
  priceRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  priceCol: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 5,
    flex: 1,
    minWidth: 0,
    flexWrap: "wrap",
  },
  price: {
    fontSize: 14,
  },
  was: {
    fontFamily: fonts.regular,
    fontSize: 10,
    textDecorationLine: "line-through",
  },
  addBtn: {
    borderRadius: 14,
    overflow: "hidden",
  },
  addBtnGrad: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  addBtnDisabled: {
    opacity: 0.4,
  },
  addGlyph: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
    marginTop: -1,
  },
  addGlyphDark: {
    color: "#1a1612",
  },
});
