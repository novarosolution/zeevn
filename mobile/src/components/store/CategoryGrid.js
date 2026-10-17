import React from "react";
import { StyleSheet, Text, View, useWindowDimensions } from "react-native";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import Animated, { FadeInUp } from "react-native-reanimated";
import { pickTileColors, useStoreTheme, withAlpha } from "../../theme/storefront";
import PressableScale from "./PressableScale";
import StoreIcon from "./StoreIcon";

const GAP = 10;

function CategoryTile({ tile, size, index, moreSuffix, onPress }) {
  const { c, r, type, shadow } = useStoreTheme();
  const colors = pickTileColors(c, index);
  return (
    <Animated.View entering={FadeInUp.delay(Math.min(index, 8) * 45).duration(380)} style={{ width: size }}>
      <PressableScale
        onPress={() => onPress?.(tile)}
        scaleTo={0.95}
        accessibilityRole="button"
        accessibilityLabel={`${tile.label}, ${tile.count} products`}
      >
        <View style={[styles.box, shadow.soft, { width: size, height: size, borderRadius: r.xl }]}>
          <LinearGradient colors={colors} start={{ x: 0.1, y: 0 }} end={{ x: 0.9, y: 1 }} style={StyleSheet.absoluteFill} />
          <View style={[StyleSheet.absoluteFill, { borderRadius: r.xl, borderWidth: 1, borderColor: withAlpha("#FFFFFF", 0.5) }]} pointerEvents="none" />
          {tile.image ? (
            <Image source={{ uri: tile.image }} style={styles.img} contentFit="contain" transition={200} cachePolicy="memory-disk" />
          ) : (
            <StoreIcon icon={tile.icon || { mci: "pot-steam-outline" }} size={size * 0.4} color={withAlpha(c.brand, 0.4)} />
          )}
          {tile.count > 1 ? (
            <View style={[styles.more, { backgroundColor: withAlpha(c.card, 0.94) }]}>
              <Text style={type.ui(10, "bold", c.inkSoft, { letterSpacing: 0.2 })} numberOfLines={1}>
                {`+${tile.count - 1} ${moreSuffix}`}
              </Text>
            </View>
          ) : null}
        </View>
        <Text style={[type.ui(12.5, "semibold", c.ink), styles.label]} numberOfLines={2}>
          {tile.label}
        </Text>
      </PressableScale>
    </Animated.View>
  );
}

/** 4-column category tiles (pastel wash + product art + “+N more” chip). */
export default function CategoryGrid({ tiles, onPressTile, columns = 4, moreSuffix = "more" }) {
  const { gutter } = useStoreTheme();
  const { width } = useWindowDimensions();
  const size = Math.floor((width - gutter * 2 - GAP * (columns - 1)) / columns);
  if (!tiles.length) return null;

  return (
    <View style={[styles.grid, { paddingHorizontal: gutter }]}>
      {tiles.map((tile, i) => (
        <CategoryTile key={tile.key} tile={tile} size={size} index={i} moreSuffix={moreSuffix} onPress={onPressTile} />
      ))}
    </View>
  );
}

/** Full-width “See all products ›” bar with overlapping product avatars. */
export function SeeAllBar({ images = [], label, onPress }) {
  const { c, r, type, gutter } = useStoreTheme();
  const avatars = images.filter(Boolean).slice(0, 3);
  return (
    <View style={{ paddingHorizontal: gutter }}>
      <PressableScale
        onPress={onPress}
        scaleTo={0.985}
        accessibilityRole="button"
        accessibilityLabel={label}
        style={[styles.seeAll, { backgroundColor: c.brandSoft, borderRadius: r.xl, borderColor: c.line }]}
      >
        <View style={styles.avatars}>
          {avatars.map((uri, i) => (
            <View
              key={`${i}-${uri}`}
              style={[styles.avatar, { marginLeft: i === 0 ? 0 : -16, backgroundColor: c.card, borderColor: c.brandSoft, zIndex: 3 - i }]}
            >
              <Image source={{ uri }} style={StyleSheet.absoluteFill} contentFit="contain" />
            </View>
          ))}
        </View>
        <Text style={type.ui(16, "extrabold", c.brand)}>{label}</Text>
        <StoreIcon icon={{ ion: "chevron-forward" }} size={16} color={c.brand} />
      </PressableScale>
    </View>
  );
}

const styles = StyleSheet.create({
  grid: { flexDirection: "row", flexWrap: "wrap", gap: GAP, rowGap: 16 },
  box: { overflow: "hidden", alignItems: "center", justifyContent: "center" },
  img: { width: "86%", height: "86%", marginTop: 8 },
  more: { position: "absolute", top: 7, paddingHorizontal: 8, paddingVertical: 2.5, borderRadius: 10 },
  label: { marginTop: 7, textAlign: "center", lineHeight: 16, minHeight: 32, paddingHorizontal: 1 },
  seeAll: {
    height: 56,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 14,
  },
  avatars: { flexDirection: "row", alignItems: "center" },
  avatar: { width: 38, height: 38, borderRadius: 19, borderWidth: 2, overflow: "hidden" },
});
