import React from "react";
import { StyleSheet, Text, View, useWindowDimensions } from "react-native";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { STORE_SECTIONS } from "../../content/storefrontContent";
import { pickTileColors, useStoreTheme, withAlpha } from "../../theme/storefront";
import { Stagger } from "./HomeMotion";
import PressableScale from "./PressableScale";
import StoreIcon from "./StoreIcon";

const GAP = 12;

function CategoryTile({ tile, size, index, moreSuffix, onPress }) {
  const { c, r, type, shadow, isDark } = useStoreTheme();
  const colors = pickTileColors(c, index);
  return (
    <Stagger index={index} distance={20} style={{ width: size }}>
      <PressableScale
        onPress={() => onPress?.(tile)}
        scaleTo={0.95}
        accessibilityRole="button"
        accessibilityLabel={STORE_SECTIONS.categories.tileA11y(tile.label, tile.count)}
      >
        <View style={[styles.box, shadow.card, { width: size, height: size, borderRadius: r.xl }]}>
          <LinearGradient colors={colors} start={{ x: 0.05, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill} />
          <LinearGradient
            colors={[withAlpha("#FFFFFF", isDark ? 0.05 : 0.3), withAlpha("#FFFFFF", 0)]}
            style={styles.gloss}
            pointerEvents="none"
          />
          <View
            style={[
              StyleSheet.absoluteFill,
              { borderRadius: r.xl, borderWidth: 1, borderColor: withAlpha("#FFFFFF", isDark ? 0.12 : 0.55) },
            ]}
            pointerEvents="none"
          />
          {tile.image ? (
            <Image source={{ uri: tile.image }} style={styles.img} contentFit="cover" transition={200} cachePolicy="memory-disk" />
          ) : (
            <StoreIcon icon={tile.icon || { mci: "pot-steam-outline" }} size={size * 0.38} color={withAlpha(c.brand, 0.45)} />
          )}
          {tile.count > 1 ? (
            <View style={[styles.more, { backgroundColor: withAlpha(c.card, 0.95), borderColor: withAlpha(c.gold, 0.35) }]}>
              <Text style={type.ui(9.5, "extrabold", c.inkSoft, { letterSpacing: 0.2 })} numberOfLines={1}>
                {`+${tile.count - 1} ${moreSuffix}`}
              </Text>
            </View>
          ) : null}
        </View>
        <Text style={[type.ui(12.5, "bold", c.ink), styles.label]} numberOfLines={2}>
          {tile.label}
        </Text>
      </PressableScale>
    </Stagger>
  );
}

/** Fills the last row's empty slot with a "See all" tile. */
function AllTile({ size, index, label, onPress }) {
  const { c, r, type, isDark } = useStoreTheme();
  return (
    <Stagger index={index} distance={20} style={{ width: size }}>
      <PressableScale onPress={onPress} scaleTo={0.95} accessibilityRole="button" accessibilityLabel={label}>
        <View
          style={[
            styles.box,
            styles.allBox,
            {
              width: size,
              height: size,
              borderRadius: r.xl,
              backgroundColor: isDark ? withAlpha(c.brand, 0.12) : c.brandSoft,
              borderColor: withAlpha(isDark ? c.gold : c.brand, isDark ? 0.3 : 0.2),
            },
          ]}
        >
          <View style={[styles.allDisc, { backgroundColor: c.brand }]}>
            <StoreIcon icon={{ ion: "arrow-forward" }} size={20} color={c.onBrand} />
          </View>
        </View>
        <Text style={[type.ui(12.5, "extrabold", c.brand), styles.label]} numberOfLines={1}>
          {label}
        </Text>
      </PressableScale>
    </Stagger>
  );
}

/**
 * 4-column category tiles (pastel wash + product art + “+N more” chip). Pass `allLabel` + `onPressAll` to fill
 * the last row's empty slot with a "See all" tile.
 */
export default function CategoryGrid({ tiles, onPressTile, columns = 4, moreSuffix = "more", allLabel, onPressAll }) {
  const { gutter } = useStoreTheme();
  const { width } = useWindowDimensions();
  const size = Math.floor((width - gutter * 2 - GAP * (columns - 1)) / columns);
  if (!tiles.length) return null;
  const showAll = Boolean(allLabel && onPressAll) && tiles.length % columns !== 0;

  return (
    <View style={[styles.grid, { paddingHorizontal: gutter }]}>
      {tiles.map((tile, i) => (
        <CategoryTile key={tile.key} tile={tile} size={size} index={i} moreSuffix={moreSuffix} onPress={onPressTile} />
      ))}
      {showAll ? <AllTile size={size} index={tiles.length} label={allLabel} onPress={onPressAll} /> : null}
    </View>
  );
}

/** Full-width “See all products ›” bar with overlapping product avatars. */
export function SeeAllBar({ images = [], label, onPress }) {
  const { c, r, type, gutter, shadow } = useStoreTheme();
  const avatars = images.filter(Boolean).slice(0, 3);
  return (
    <View style={{ paddingHorizontal: gutter }}>
      <PressableScale
        onPress={onPress}
        scaleTo={0.985}
        accessibilityRole="button"
        accessibilityLabel={label}
        style={[
          styles.seeAll,
          shadow.soft,
          { backgroundColor: c.brandSoft, borderRadius: r.xl, borderColor: withAlpha(c.brand, 0.14) },
        ]}
      >
        <View style={styles.avatars}>
          {avatars.map((uri, i) => (
            <View
              key={`${i}-${uri}`}
              style={[
                styles.avatar,
                {
                  marginLeft: i === 0 ? 0 : -14,
                  backgroundColor: c.card,
                  borderColor: c.brandSoft,
                  zIndex: 3 - i,
                },
              ]}
            >
              <Image source={{ uri }} style={StyleSheet.absoluteFill} contentFit="cover" />
            </View>
          ))}
        </View>
        <Text style={[type.ui(15.5, "extrabold", c.brand), { flex: 1 }]}>{label}</Text>
        <View style={[styles.seeChevron, { backgroundColor: c.brand }]}>
          <StoreIcon icon={{ ion: "arrow-forward" }} size={14} color={c.onBrand} />
        </View>
      </PressableScale>
    </View>
  );
}

const styles = StyleSheet.create({
  grid: { flexDirection: "row", flexWrap: "wrap", gap: GAP, rowGap: 14 },
  box: { overflow: "hidden", alignItems: "center", justifyContent: "flex-end" },
  gloss: { position: "absolute", top: 0, left: 0, right: 0, height: "45%" },
  img: { width: "92%", height: "78%", marginBottom: 0 },
  allBox: { justifyContent: "center", borderWidth: 1 },
  allDisc: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center" },
  more: {
    position: "absolute",
    top: 7,
    left: 7,
    paddingHorizontal: 7,
    paddingVertical: 2.5,
    borderRadius: 9,
    borderWidth: StyleSheet.hairlineWidth,
  },
  label: { marginTop: 8, textAlign: "center", lineHeight: 15, minHeight: 30, paddingHorizontal: 1 },
  seeAll: {
    height: 58,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 14,
  },
  avatars: { flexDirection: "row", alignItems: "center" },
  avatar: { width: 36, height: 36, borderRadius: 18, borderWidth: 2, overflow: "hidden" },
  seeChevron: { width: 30, height: 30, borderRadius: 15, alignItems: "center", justifyContent: "center" },
});
