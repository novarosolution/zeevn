import React, { useMemo } from "react";
import { StyleSheet, Text, View, useWindowDimensions } from "react-native";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import Animated, { FadeIn } from "react-native-reanimated";
import { STORE_LINE_PAGES } from "../../content/storefrontContent";
import { getProductLineByKey } from "../../content/zeevanCatalogContent";
import { useStoreTheme, withAlpha } from "../../theme/storefront";
import { buildCategoryTiles, productImageUri } from "../../utils/storefront";
import CategoryGrid, { SeeAllBar } from "./CategoryGrid";
import PressableScale from "./PressableScale";
import ProductCard from "./ProductCard";
import { SectionHeader } from "./SectionTitle";
import StoreIcon from "./StoreIcon";

const GAP = 12;
const COPY = STORE_LINE_PAGES.landing;

/**
 * Landing for a single range tab (Ghee, Tel, Masala, Honey, Gifting):
 * hero panel (badge, title, call to action), sub-category tiles, and the full product grid.
 */
export default function LineLanding({ tab, products, onProductPress, onCategoryPress, onSeeAll }) {
  const { c, r, type, gutter, shadow, isDark } = useStoreTheme();
  const { width } = useWindowDimensions();
  const page = STORE_LINE_PAGES[tab.key] || STORE_LINE_PAGES.empty;
  const line = getProductLineByKey(tab.lineKey);
  const cardW = Math.floor((width - gutter * 2 - GAP) / 2);
  const tiles = useMemo(() => buildCategoryTiles(products, { max: 8 }), [products]);
  const cover = useMemo(() => products.map((p) => productImageUri(p, 220)).find(Boolean) || "", [products]);
  const colors = isDark ? ["#3A2E14", "#241C0B"] : line?.gradient ? [line.gradient[0], "#F6DE9C"] : ["#FFF3D2", "#F6DE9C"];

  return (
    <Animated.View key={tab.key} entering={FadeIn.duration(280)} style={styles.wrap}>
      <View style={{ paddingHorizontal: gutter }}>
        <View style={[styles.hero, shadow.card, { borderRadius: r.xxl }]}>
          <LinearGradient colors={colors} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill} />
          <View style={[StyleSheet.absoluteFill, { borderRadius: r.xxl, borderWidth: 1, borderColor: withAlpha("#FFFFFF", 0.55) }]} pointerEvents="none" />
          <View style={styles.heroCopy}>
            <View style={styles.heroTop}>
              <View style={[styles.heroIcon, { backgroundColor: withAlpha(c.brand, 0.12) }]}>
                <StoreIcon icon={tab.icon} size={22} color={c.brand} />
              </View>
              {line?.hero?.badge ? (
                <View style={[styles.heroBadge, { backgroundColor: isDark ? withAlpha(c.gold, 0.9) : c.gold }]}>
                  <Text style={type.ui(10.5, "extrabold", "#3A2A0C", { letterSpacing: 0.6 })} numberOfLines={1}>
                    {line.hero.badge}
                  </Text>
                </View>
              ) : null}
            </View>
            <Text style={type.display(25, { ls: -0.5, lh: 29 })} numberOfLines={2}>
              {page.title}
            </Text>
            {products.length && line?.hero?.cta ? (
              <View style={styles.heroFoot}>
                <PressableScale
                  onPress={onSeeAll}
                  accessibilityRole="button"
                  accessibilityLabel={line.hero.cta}
                  style={[styles.heroCta, { backgroundColor: c.brand }]}
                >
                  <Text style={type.ui(13, "extrabold", c.onBrand, { letterSpacing: 0.2 })} numberOfLines={1}>
                    {line.hero.cta}
                  </Text>
                  <Ionicons name="arrow-forward" size={14} color={c.onBrand} />
                </PressableScale>
              </View>
            ) : null}
          </View>
          {cover ? (
            <View style={[styles.heroPhoto, { borderColor: withAlpha("#FFFFFF", isDark ? 0.16 : 0.85), backgroundColor: c.well }]}>
              <Image source={{ uri: cover }} style={StyleSheet.absoluteFill} contentFit="cover" cachePolicy="memory-disk" />
            </View>
          ) : null}
        </View>
      </View>

      {products.length ? (
        <>
          {tiles.length > 1 ? (
            <View style={styles.block}>
              <SectionHeader title={COPY.browseByType} />
              <CategoryGrid tiles={tiles} onPressTile={onCategoryPress} />
            </View>
          ) : null}

          <View style={styles.block}>
            <SectionHeader title={COPY.all(tab.label)} />
            <View style={[styles.grid, { paddingHorizontal: gutter }]}>
              {products.map((product) => (
                <ProductCard key={product.id} product={product} width={cardW} gallery onPress={() => onProductPress?.(product)} />
              ))}
            </View>
          </View>

          <SeeAllBar images={tiles.map((t) => t.image)} label={STORE_LINE_PAGES.seeAll} onPress={onSeeAll} />
        </>
      ) : (
        <View style={[styles.empty, { marginHorizontal: gutter, backgroundColor: c.card, borderColor: c.line, borderRadius: r.xl }]}>
          <StoreIcon icon={{ mci: "package-variant-closed" }} size={34} color={c.inkMute} />
          <Text style={type.display(20, { semi: true })}>{STORE_LINE_PAGES.empty.title}</Text>
          <Text style={[type.ui(13.5, "medium", c.inkMute), styles.emptyText]}>{STORE_LINE_PAGES.empty.subtitle}</Text>
        </View>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 26, paddingTop: 18 },
  hero: { minHeight: 164, overflow: "hidden", flexDirection: "row" },
  heroCopy: { flex: 1, padding: 18, gap: 6, justifyContent: "center", maxWidth: "58%" },
  heroTop: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 2 },
  heroIcon: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center" },
  heroBadge: { paddingHorizontal: 9, height: 22, borderRadius: 11, alignItems: "center", justifyContent: "center", flexShrink: 1 },
  heroFoot: { flexDirection: "row", alignItems: "center", flexWrap: "wrap", gap: 10, marginTop: 6 },
  heroCta: { flexDirection: "row", alignItems: "center", gap: 6, height: 36, paddingHorizontal: 14, borderRadius: 18 },
  heroPhoto: { position: "absolute", right: 14, top: 16, bottom: 16, width: "37%", borderRadius: 22, borderWidth: 3, overflow: "hidden" },
  block: { gap: 14 },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: GAP, rowGap: 14 },
  empty: { alignItems: "center", gap: 8, padding: 28, borderWidth: StyleSheet.hairlineWidth },
  emptyText: { textAlign: "center" },
});
