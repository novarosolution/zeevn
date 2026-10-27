import React, { useMemo } from "react";
import { ScrollView, StyleSheet, View, useWindowDimensions } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { resolveFestivalTheme } from "../../content/storefrontContent";
import { useStoreTheme, withAlpha } from "../../theme/storefront";
import FloatingNav from "./FloatingNav";
import { storeNavBase, useStoreNavPad } from "./StoreTracker";
import { heroSize } from "./HeroCarousel";
import { Bone, ProductCardSkeleton, ShimmerProvider } from "./StoreSkeleton";

const GRADIENT_OVERSCROLL = 800;
const GRADIENT_HEIGHT = 620;

/** The Home header's chips, search and tabs, drawn as placeholders at the same sizes as the real ones. */
function HeaderBones({ gutter }) {
  const { c, shadow, isDark } = useStoreTheme();
  return (
    <>
      <View style={{ paddingHorizontal: gutter, gap: 8 }}>
        <View style={styles.topBar}>
          <View style={{ gap: 6, flex: 1 }}>
            <Bone width={88} height={11} radius={5} />
            <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
              <Bone width={118} height={28} radius={8} />
              <Bone width={78} height={30} radius={15} />
            </View>
          </View>
          <View style={styles.actions}>
            <Bone width={64} height={32} radius={16} />
            <Bone width={36} height={36} radius={18} />
          </View>
        </View>
        <Bone width={220} height={14} radius={7} />
      </View>

      <View style={{ paddingHorizontal: gutter, marginTop: 12 }}>
        <View style={[styles.search, shadow.card, { backgroundColor: c.card, borderColor: c.line }]}>
          <Bone width={34} height={34} radius={17} />
          <Bone width={170} height={12} radius={6} />
        </View>
      </View>

      <View style={[styles.tabs, { borderBottomColor: c.line }]}>
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <View key={i} style={styles.tab}>
            <View
              style={[
                styles.tabIcon,
                i === 0 && { backgroundColor: isDark ? withAlpha(c.brand, 0.16) : c.brandSoft, borderRadius: 16 },
              ]}
            >
              <Bone width={24} height={24} radius={7} />
            </View>
            <Bone width={i === 0 ? 24 : 32} height={8} radius={4} />
          </View>
        ))}
      </View>
    </>
  );
}

/**
 * Native Home while the catalog loads: the real header gradient, then placeholders in the exact shape of the
 * hero, promo card, collection tiles and product rail — all glinting in step — with the bottom nav already in
 * place. Shown only when there is nothing cached to display.
 */
export default function StoreHomeSkeleton() {
  const { c, isDark, gutter, shadow } = useStoreTheme();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const festival = useMemo(() => resolveFestivalTheme({}), []);
  const gradient = isDark ? festival.header.gradientDark : festival.header.gradient;
  const gradTotal = GRADIENT_OVERSCROLL + GRADIENT_HEIGHT;
  const gradLocations = [0, GRADIENT_OVERSCROLL / gradTotal, ...c.headerLocations.slice(1).map((l) => (GRADIENT_OVERSCROLL + l * GRADIENT_HEIGHT) / gradTotal)];

  const { height } = useWindowDimensions();
  const inner = width - gutter * 2;
  const bottomPad = useStoreNavPad(insets);
  const hero = heroSize({ width, height, topInset: insets.top, bottomInset: insets.bottom, reserve: bottomPad > storeNavBase(insets) ? bottomPad - storeNavBase(insets) + 12 : 0 });
  const colW = Math.floor((inner - 12) / 2);
  const tileH = Math.round(colW * 1.2);

  return (
    <View style={[styles.screen, { backgroundColor: c.canvas }]} accessibilityRole="progressbar" accessibilityLabel="Loading">
      <ShimmerProvider>
        <ScrollView scrollEnabled={false} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: bottomPad }}>
          <LinearGradient
            colors={[gradient[0], ...gradient]}
            locations={gradLocations}
            style={[styles.backdrop, { top: -GRADIENT_OVERSCROLL, height: gradTotal }]}
            pointerEvents="none"
          />

          <View style={{ paddingTop: insets.top + 8 }}>
            <HeaderBones gutter={gutter} />
          </View>

          <View style={styles.sections}>
            {/* hero — a card with the next one peeking in */}
            <View style={[styles.heroRow, { paddingHorizontal: gutter }]}>
              <Bone width={hero.cardW} height={hero.cardH} radius={30} />
              <Bone width={hero.cardW} height={hero.cardH} radius={30} />
            </View>

            {/* brand pillars */}
            <View style={{ paddingHorizontal: gutter }}>
              <View style={[styles.trust, shadow.soft, { backgroundColor: c.card, borderColor: c.goldLine }]}>
                {[0, 1, 2, 3].map((i) => (
                  <View key={i} style={styles.trustItem}>
                    <Bone width={50} height={50} radius={25} />
                    <Bone width={56} height={8} radius={4} />
                    <Bone width={40} height={8} radius={4} />
                  </View>
                ))}
              </View>
            </View>

            {/* range tiles */}
            <View style={{ gap: 14 }}>
              <View style={[styles.sectionHead, { paddingHorizontal: gutter }]}>
                <Bone width={170} height={22} radius={8} />
                <Bone width={74} height={30} radius={15} />
              </View>
              <View style={[styles.tiles, { paddingHorizontal: gutter }]}>
                {[0, 1, 2, 3].map((i) => (
                  <Bone key={i} width={colW} height={tileH} radius={24} />
                ))}
              </View>
            </View>

            {/* product rail */}
            <View style={{ gap: 14 }}>
              <View style={[styles.sectionHead, { paddingHorizontal: gutter }]}>
                <Bone width={140} height={22} radius={8} />
                <Bone width={74} height={30} radius={15} />
              </View>
              <View style={[styles.rail, { paddingHorizontal: gutter }]}>
                <ProductCardSkeleton width={168} />
                <ProductCardSkeleton width={168} />
              </View>
            </View>
          </View>
        </ScrollView>
      </ShimmerProvider>
      <FloatingNav />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, overflow: "hidden" },
  backdrop: { position: "absolute", left: 0, right: 0 },
  topBar: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", minHeight: 34 },
  actions: { flexDirection: "row", alignItems: "center", gap: 8 },
  search: { height: 54, borderRadius: 27, borderWidth: StyleSheet.hairlineWidth, flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 10 },
  tabs: { flexDirection: "row", marginTop: 6, paddingHorizontal: 8, borderBottomWidth: StyleSheet.hairlineWidth },
  tab: { flex: 1, alignItems: "center", gap: 6, paddingTop: 10, paddingBottom: 12 },
  tabIcon: { width: 48, height: 32, alignItems: "center", justifyContent: "center" },
  sections: { gap: 28, paddingTop: 16 },
  heroRow: { flexDirection: "row", gap: 10 },
  trust: { flexDirection: "row", borderWidth: 1, borderRadius: 24, paddingVertical: 16, paddingHorizontal: 6 },
  trustItem: { flex: 1, alignItems: "center", gap: 8 },
  sectionHead: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  tiles: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  rail: { flexDirection: "row", gap: 12 },
});
