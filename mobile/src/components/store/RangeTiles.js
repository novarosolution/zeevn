import React from "react";
import { Platform, StyleSheet, Text, View, useWindowDimensions } from "react-native";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import Svg, { Circle, Defs, RadialGradient, Stop } from "react-native-svg";
import { STORE_SECTIONS } from "../../content/storefrontContent";
import { pickRange, useStoreTheme, withAlpha } from "../../theme/storefront";
import PressableScale from "./PressableScale";
import StoreIcon from "./StoreIcon";

const GAP = 12;
const MAX_TILES = 6;

/**
 * The product photos are shot on white. `mixBlendMode: "multiply"` (React Native 0.77+, New Architecture) lets that
 * white dissolve into a tinted tile so the jar looks printed on it; without it the photo keeps a white frame.
 */
export function canBlend(isDark) {
  return !isDark && Platform.OS !== "web" && Boolean(globalThis.nativeFabricUIManager);
}

/** A soft pool of light behind the jar. */
export function Spotlight({ width, height, cx, cy, radius }) {
  return (
    <Svg width={width} height={height} style={StyleSheet.absoluteFill} pointerEvents="none">
      <Defs>
        <RadialGradient id="rangeSpot" cx="50%" cy="50%" r="50%">
          <Stop offset="0" stopColor="#FFFFFF" stopOpacity={0.85} />
          <Stop offset="0.55" stopColor="#FFFFFF" stopOpacity={0.3} />
          <Stop offset="1" stopColor="#FFFFFF" stopOpacity={0} />
        </RadialGradient>
      </Defs>
      <Circle cx={cx} cy={cy} r={radius} fill="url(#rangeSpot)" />
    </Svg>
  );
}

export function Jar({ uri, size, style, blend }) {
  const { c, shadow } = useStoreTheme();
  if (!uri) return null;
  if (blend) {
    return (
      <View style={[{ width: size, height: size, mixBlendMode: "multiply" }, style]} pointerEvents="none">
        <Image source={{ uri }} style={StyleSheet.absoluteFill} contentFit="contain" transition={0} cachePolicy="memory-disk" />
      </View>
    );
  }
  // White-framed photo, floating a little above the bottom of the box the blended jar would fill.
  const frame = Math.round(size * 0.66);
  return (
    <View style={[{ width: size, height: size, alignItems: "center", justifyContent: "flex-end", paddingBottom: 18 }, style]} pointerEvents="none">
      <View
        style={[
          { width: frame, height: frame, borderRadius: 22, backgroundColor: c.well, borderColor: withAlpha("#FFFFFF", 0.8), borderWidth: 1.5 },
          shadow.soft,
        ]}
      >
        <Image
          source={{ uri }}
          style={{ flex: 1, margin: 3, borderRadius: 18 }}
          contentFit="contain"
          transition={0}
          cachePolicy="memory-disk"
        />
      </View>
    </View>
  );
}

function RangeTile({ tile, width, height, wide, blend, onPress }) {
  const { c, r, type, shadow, isDark } = useStoreTheme();
  const range = pickRange(c, tile.line);
  const size = wide ? Math.round(height * 1.04) : Math.round(width * 1.02);
  // The jar fills roughly 12%–92% of its photo square: centre it in a wide tile, stand it near the bottom in a tall one.
  const jarStyle = wide
    ? { position: "absolute", right: 26, top: Math.round(height / 2 - size * 0.52) }
    : { position: "absolute", left: Math.round((width - size) / 2), top: height - size + 16 };
  const spotX = wide ? width - 22 - size / 2 : width / 2;
  const spotY = wide ? height / 2 : height * 0.64;

  return (
    <PressableScale
      onPress={() => onPress?.(tile)}
      scaleTo={0.97}
      accessibilityRole="button"
      accessibilityLabel={STORE_SECTIONS.categories.tileA11y(tile.label, tile.count)}
      style={[shadow.card, { width, height, borderRadius: r.xl, backgroundColor: range.wash[1] }]}
    >
      <View style={[styles.clip, { borderRadius: r.xl }]}>
        <LinearGradient colors={range.wash} start={{ x: 0.2, y: 0 }} end={{ x: 0.8, y: 1 }} style={StyleSheet.absoluteFill} />
        {blend ? <Spotlight width={width} height={height} cx={spotX} cy={spotY} radius={size * 0.5} /> : null}
        <Jar uri={tile.image} size={size} style={jarStyle} blend={blend} />
        <View style={[styles.head, wide && styles.headWide]} pointerEvents="none">
          <Text style={type.display(wide ? 25 : 22, { color: range.ink, ls: -0.5, lh: wide ? 29 : 25 })} numberOfLines={2}>
            {tile.label}
          </Text>
        </View>
        <View style={[styles.arrow, wide && styles.arrowWide, { backgroundColor: range.ink }]} pointerEvents="none">
          <StoreIcon icon={{ ion: "arrow-forward" }} size={15} color={range.wash[0]} />
        </View>
        <View
          style={[StyleSheet.absoluteFill, { borderRadius: r.xl, borderWidth: 1, borderColor: withAlpha("#FFFFFF", isDark ? 0.1 : 0.7) }]}
          pointerEvents="none"
        />
      </View>
    </PressableScale>
  );
}

/**
 * "Shop by category" as big photo tiles — one per product type, each in its range's colour with the jar standing in
 * a pool of light. Two columns; an odd last tile spans the full width.
 */
export default function RangeTiles({ tiles, onPressTile }) {
  const { gutter, isDark } = useStoreTheme();
  const { width } = useWindowDimensions();
  const list = (Array.isArray(tiles) ? tiles : []).slice(0, MAX_TILES);
  if (!list.length) return null;

  const inner = width - gutter * 2;
  const colW = Math.floor((inner - GAP) / 2);
  const tileH = Math.round(colW * 1.2);
  const wideH = Math.round(tileH * 0.72);
  const oddLast = list.length % 2 === 1;
  const blend = canBlend(isDark);

  return (
    <View style={[styles.grid, { paddingHorizontal: gutter }]}>
      {list.map((tile, i) => {
        const wide = oddLast && i === list.length - 1;
        return (
          <RangeTile
            key={tile.key}
            tile={tile}
            width={wide ? inner : colW}
            height={wide ? wideH : tileH}
            wide={wide}
            blend={blend}
            onPress={onPressTile}
          />
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: { flexDirection: "row", flexWrap: "wrap", gap: GAP },
  clip: { flex: 1, overflow: "hidden" },
  head: { position: "absolute", left: 16, top: 16, right: 56 },
  headWide: { top: 20, right: "52%" },
  arrowWide: { top: undefined, right: undefined, bottom: 18, left: 18 },
  arrow: {
    position: "absolute",
    top: 12,
    right: 12,
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
  },
});
