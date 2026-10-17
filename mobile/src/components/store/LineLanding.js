import React, { useMemo } from "react";
import { StyleSheet, Text, View, useWindowDimensions } from "react-native";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import Animated, { FadeIn } from "react-native-reanimated";
import { STORE_LINE_PAGES } from "../../content/storefrontContent";
import { getProductLineByKey } from "../../content/zeevanCatalogContent";
import { useStoreTheme, withAlpha } from "../../theme/storefront";
import { buildCategoryTiles, productImageUri } from "../../utils/storefront";
import CategoryGrid, { SeeAllBar } from "./CategoryGrid";
import ProductCard from "./ProductCard";
import { SectionHeader } from "./SectionTitle";
import StoreIcon from "./StoreIcon";

const GAP = 12;

/**
 * Landing for a single range tab (Ghee, Tel, Masala, Honey, Gifting):
 * hero panel, sub-category tiles, and the full product grid.
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
            <View style={[styles.heroIcon, { backgroundColor: withAlpha(c.brand, 0.12) }]}>
              <StoreIcon icon={tab.icon} size={22} color={c.brand} />
            </View>
            <Text style={type.display(25, { ls: -0.5, lh: 29 })} numberOfLines={2}>
              {page.title}
            </Text>
            <Text style={type.ui(13.5, "medium", c.inkSoft)} numberOfLines={2}>
              {page.subtitle}
            </Text>
            {products.length ? (
              <View style={[styles.count, { backgroundColor: withAlpha(c.card, 0.78) }]}>
                <Text style={type.ui(12, "bold", c.brand)}>{products.length === 1 ? "1 product" : `${products.length} products`}</Text>
              </View>
            ) : null}
          </View>
          {cover ? <Image source={{ uri: cover }} style={styles.heroImage} contentFit="contain" cachePolicy="memory-disk" /> : null}
        </View>
      </View>

      {products.length ? (
        <>
          {tiles.length > 1 ? (
            <View style={styles.block}>
              <SectionHeader title="Browse by type" />
              <CategoryGrid tiles={tiles} onPressTile={onCategoryPress} />
            </View>
          ) : null}

          <View style={styles.block}>
            <SectionHeader title={`All ${tab.label.toLowerCase()}`} />
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
  hero: { minHeight: 176, overflow: "hidden", flexDirection: "row" },
  heroCopy: { flex: 1, padding: 18, gap: 6, justifyContent: "center", maxWidth: "64%" },
  heroIcon: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center", marginBottom: 2 },
  heroImage: { position: "absolute", right: -6, bottom: 6, width: "44%", height: "86%" },
  count: { alignSelf: "flex-start", marginTop: 4, paddingHorizontal: 11, paddingVertical: 4, borderRadius: 11 },
  block: { gap: 14 },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: GAP, rowGap: 14 },
  empty: { alignItems: "center", gap: 8, padding: 28, borderWidth: StyleSheet.hairlineWidth },
  emptyText: { textAlign: "center" },
});
