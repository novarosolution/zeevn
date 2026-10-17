import React from "react";
import { StyleSheet, Text, View, useWindowDimensions } from "react-native";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import Animated, { FadeInUp } from "react-native-reanimated";
import { useStoreTheme, withAlpha } from "../../theme/storefront";
import { formatINRWhole } from "../../utils/currency";
import { getProductPricing, productImageUri } from "../../utils/storefront";
import PressableScale from "./PressableScale";
import StoreIcon from "./StoreIcon";

const GAP = 10;

/** Product photo "mounted" at the bottom of a tile: rounded top corners, bleeding off the bottom edge. */
function TileArt({ item, frameStyle, iconSize, radius = 16 }) {
  const { c } = useStoreTheme();
  const uri = item.product ? productImageUri(item.product, 200) : "";
  if (uri) {
    return (
      <View
        style={[
          frameStyle,
          styles.photoFrame,
          { borderTopLeftRadius: radius, borderTopRightRadius: radius, borderColor: withAlpha("#FFFFFF", 0.75), backgroundColor: c.well },
        ]}
      >
        <Image source={{ uri }} style={StyleSheet.absoluteFill} contentFit="cover" transition={200} cachePolicy="memory-disk" />
      </View>
    );
  }
  return (
    <View style={[frameStyle, styles.fallback]}>
      <StoreIcon icon={item.icon || { mci: "pot-steam-outline" }} size={iconSize} color={withAlpha(c.brand, 0.35)} />
    </View>
  );
}

function SmallTile({ item, colors, height, index, onPress }) {
  const { c, r, type, shadow } = useStoreTheme();
  return (
    <Animated.View entering={FadeInUp.delay(110 + index * 70).duration(420)} style={styles.flex}>
      <PressableScale
        onPress={() => onPress?.(item)}
        scaleTo={0.96}
        accessibilityRole="button"
        accessibilityLabel={item.title}
        style={[styles.tile, shadow.soft, { height, borderRadius: r.xl }]}
      >
        <LinearGradient colors={colors} start={{ x: 0.1, y: 0 }} end={{ x: 0.9, y: 1 }} style={StyleSheet.absoluteFill} />
        <View style={[StyleSheet.absoluteFill, { borderRadius: r.xl, borderWidth: 1, borderColor: withAlpha("#FFFFFF", 0.55) }]} pointerEvents="none" />
        <Text style={[type.display(14.5, { semi: true, ls: -0.2, lh: 17, color: c.ink }), styles.title]} numberOfLines={2}>
          {item.title}
        </Text>
        <View style={styles.artWrap} pointerEvents="none">
          <TileArt item={item} frameStyle={styles.art} iconSize={38} radius={14} />
        </View>
      </PressableScale>
    </Animated.View>
  );
}

function TallTile({ item, colors, height, onPress }) {
  const { c, r, type, shadow } = useStoreTheme();
  const pricing = item.product ? getProductPricing(item.product) : null;
  return (
    <Animated.View entering={FadeInUp.duration(420)} style={{ flex: 1 }}>
      <PressableScale
        onPress={() => onPress?.(item)}
        scaleTo={0.97}
        accessibilityRole="button"
        accessibilityLabel={item.title}
        style={[styles.tile, shadow.card, { height, borderRadius: r.xl }]}
      >
        <LinearGradient colors={colors} start={{ x: 0.1, y: 0 }} end={{ x: 0.9, y: 1 }} style={StyleSheet.absoluteFill} />
        <View style={[StyleSheet.absoluteFill, { borderRadius: r.xl, borderWidth: 1, borderColor: withAlpha("#FFFFFF", 0.6) }]} pointerEvents="none" />
        <Text style={[type.display(20, { ls: -0.4, lh: 23, color: c.ink }), styles.title, styles.tallTitle]} numberOfLines={2}>
          {item.title}
        </Text>
        {item.showPrice && pricing ? (
          <View style={styles.priceBlock}>
            {pricing.mrp ? (
              <View style={[styles.mrpPill, { backgroundColor: withAlpha("#1C1608", 0.72) }]}>
                <Text style={[type.ui(13, "bold", "#FFFFFF"), styles.strike]}>{formatINRWhole(pricing.mrp)}</Text>
              </View>
            ) : null}
            <View style={[styles.pricePill, { backgroundColor: c.brand }, pricing.mrp ? styles.pricePillOverlap : null]}>
              <Text style={type.display(21, { color: c.onBrand, ls: -0.3, lh: 24 })}>{formatINRWhole(pricing.price)}</Text>
            </View>
          </View>
        ) : null}
        {item.caption ? (
          <Text style={[type.ui(14.5, "extrabold", c.ink, { letterSpacing: 0.1 }), styles.caption]} numberOfLines={1}>
            {item.caption}
          </Text>
        ) : null}
        <View style={styles.tallArtWrap} pointerEvents="none">
          <TileArt item={item} frameStyle={styles.tallArt} iconSize={54} radius={18} />
        </View>
      </PressableScale>
    </Animated.View>
  );
}

/**
 * Festival “bento”: one tall corner tile plus a 2×2 block of collections.
 * Items arrive resolved: { key, title, caption?, product?, icon?, showPrice? }.
 */
export default function BentoGrid({ tall, tiles = [], onPressItem }) {
  const { c, gutter } = useStoreTheme();
  const { width } = useWindowDimensions();
  const inner = width - gutter * 2;
  const col = (inner - GAP * 2) / 3;
  const tileH = Math.round(col * 1.04);
  const tallH = tileH * 2 + GAP;
  const small = tiles.slice(0, 4);

  return (
    <View style={[styles.wrap, { paddingHorizontal: gutter }]}>
      <View style={[styles.tallCol, { width: col }]}>
        {tall ? <TallTile item={tall} colors={c.bentoTall} height={tallH} onPress={onPressItem} /> : null}
      </View>
      <View style={styles.grid}>
        <View style={styles.row}>
          {small.slice(0, 2).map((item, i) => (
            <SmallTile key={item.key} item={item} colors={c.bentoTiles[i % c.bentoTiles.length]} height={tileH} index={i} onPress={onPressItem} />
          ))}
        </View>
        <View style={styles.row}>
          {small.slice(2, 4).map((item, i) => (
            <SmallTile key={item.key} item={item} colors={c.bentoTiles[(i + 2) % c.bentoTiles.length]} height={tileH} index={i + 2} onPress={onPressItem} />
          ))}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flexDirection: "row", gap: GAP },
  tallCol: { flexShrink: 0 },
  grid: { flex: 1, gap: GAP },
  row: { flexDirection: "row", gap: GAP },
  flex: { flex: 1 },
  tile: { overflow: "hidden", alignItems: "center" },
  title: { textAlign: "center", paddingHorizontal: 8, paddingTop: 11, width: "100%" },
  tallTitle: { paddingTop: 14 },
  artWrap: { position: "absolute", left: 10, right: 10, bottom: 0, height: "54%" },
  art: { width: "100%", height: "100%" },
  tallArtWrap: { position: "absolute", left: 10, right: 10, bottom: 0, height: "35%" },
  tallArt: { width: "100%", height: "100%" },
  photoFrame: { overflow: "hidden", borderWidth: 1.5, borderBottomWidth: 0 },
  fallback: { alignItems: "center", justifyContent: "center" },
  priceBlock: { alignItems: "center", marginTop: 8 },
  mrpPill: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: 9, zIndex: 1 },
  strike: { textDecorationLine: "line-through" },
  pricePill: { paddingHorizontal: 14, paddingVertical: 4, borderRadius: 11 },
  pricePillOverlap: { marginTop: -7 },
  caption: { marginTop: 6, textAlign: "center", paddingHorizontal: 8 },
});
