import React, { useMemo } from "react";
import { StyleSheet, Text, View, useWindowDimensions } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import Animated, { FadeIn } from "react-native-reanimated";
import { STORE_LINE_PAGES } from "../../content/storefrontContent";
import { getProductLineByKey } from "../../content/zeevanCatalogContent";
import { pickRange, useStoreTheme, withAlpha } from "../../theme/storefront";
import { buildCategoryTiles, productImageUri } from "../../utils/storefront";
import CategoryGrid, { SeeAllBar } from "./CategoryGrid";
import PressableScale from "./PressableScale";
import ProductGrid from "./ProductGrid";
import { Jar, Spotlight, canBlend } from "./RangeTiles";
import { SectionHeader } from "./SectionTitle";
import StoreIcon from "./StoreIcon";

const COPY = STORE_LINE_PAGES.landing;

const HERO_H = 196;

/**
 * Landing for a single range tab (Ghee, Tel, Masala, Honey, Gifting):
 * a hero card in the range's colour with the jar in a pool of light (badge, title, call to action),
 * sub-category tiles, and the full product grid.
 */
export default function LineLanding({ tab, products, onProductPress, onCategoryPress, onSeeAll }) {
  const { c, r, type, gutter, shadow, isDark } = useStoreTheme();
  const { width } = useWindowDimensions();
  const page = STORE_LINE_PAGES[tab.key] || STORE_LINE_PAGES.empty;
  const line = getProductLineByKey(tab.lineKey);
  const range = pickRange(c, tab.lineKey);
  const heroW = width - gutter * 2;
  const jar = 224;
  const blend = canBlend(isDark);
  const tiles = useMemo(() => buildCategoryTiles(products, { max: 8 }), [products]);
  const cover = useMemo(() => products.map((p) => productImageUri(p, 320)).find(Boolean) || "", [products]);

  return (
    <Animated.View key={tab.key} entering={FadeIn.duration(280)} style={styles.wrap}>
      <View style={{ paddingHorizontal: gutter }}>
        <View style={[shadow.card, { height: HERO_H, borderRadius: r.xxl, backgroundColor: range.wash[1] }]}>
          <View style={[styles.hero, { borderRadius: r.xxl }]}>
            <LinearGradient colors={range.wash} start={{ x: 0.1, y: 0 }} end={{ x: 0.9, y: 1 }} style={StyleSheet.absoluteFill} />
            {blend ? <Spotlight width={heroW} height={HERO_H} cx={heroW - 96} cy={HERO_H / 2} radius={jar * 0.5} /> : null}
            <Jar uri={cover} size={jar} blend={blend} style={{ position: "absolute", right: 0, top: Math.round((HERO_H - jar) / 2) + 6 }} />
            <View style={styles.heroCopy}>
              <View style={styles.heroTop}>
                <View style={[styles.heroIcon, { backgroundColor: withAlpha(range.ink, 0.1) }]}>
                  <StoreIcon icon={tab.icon} size={22} color={range.ink} />
                </View>
                {line?.hero?.badge ? (
                  <View style={[styles.heroBadge, { backgroundColor: isDark ? withAlpha(c.gold, 0.9) : c.gold }]}>
                    <Text style={type.ui(10.5, "extrabold", "#3A2A0C", { letterSpacing: 0.6 })} numberOfLines={1}>
                      {line.hero.badge}
                    </Text>
                  </View>
                ) : null}
              </View>
              <Text style={type.display(27, { color: range.ink, ls: -0.5, lh: 31 })} numberOfLines={2}>
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
            <View style={[StyleSheet.absoluteFill, { borderRadius: r.xxl, borderWidth: 1, borderColor: withAlpha("#FFFFFF", isDark ? 0.1 : 0.7) }]} pointerEvents="none" />
          </View>
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
            <ProductGrid products={products} onProductPress={onProductPress} />
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
  hero: { flex: 1, overflow: "hidden" },
  heroCopy: { flex: 1, padding: 18, gap: 8, justifyContent: "center", maxWidth: "58%" },
  heroTop: { flexDirection: "row", alignItems: "center", gap: 8 },
  heroIcon: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center" },
  heroBadge: { paddingHorizontal: 9, height: 22, borderRadius: 11, alignItems: "center", justifyContent: "center", flexShrink: 1 },
  heroFoot: { flexDirection: "row", alignItems: "center", flexWrap: "wrap", gap: 10, marginTop: 2 },
  heroCta: { flexDirection: "row", alignItems: "center", gap: 6, height: 38, paddingHorizontal: 16, borderRadius: 19 },
  block: { gap: 14 },
  empty: { alignItems: "center", gap: 8, padding: 28, borderWidth: StyleSheet.hairlineWidth },
  emptyText: { textAlign: "center" },
});
