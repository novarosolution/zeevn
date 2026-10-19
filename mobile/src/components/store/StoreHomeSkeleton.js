import React, { useMemo } from "react";
import { ScrollView, StyleSheet, View, useWindowDimensions } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { resolveFestivalTheme } from "../../content/storefrontContent";
import { STORE_NAV_HEIGHT, useStoreTheme, withAlpha } from "../../theme/storefront";
import FloatingNav from "./FloatingNav";
import { Bone, ProductCardSkeleton, ShimmerProvider } from "./StoreSkeleton";

const GRADIENT_OVERSCROLL = 800;
const GRADIENT_HEIGHT = 620;

/** The Home header's chips, search and tabs, drawn as placeholders at the same sizes as the real ones. */
function HeaderBones({ gutter }) {
  const { c, shadow, isDark } = useStoreTheme();
  return (
    <>
      <View style={[styles.topBar, { paddingHorizontal: gutter }]}>
        <Bone width={38} height={38} radius={19} />
        <View style={styles.locationBones}>
          <Bone width={70} height={9} radius={4.5} />
          <Bone width={140} height={14} radius={7} />
        </View>
        <Bone width={88} height={42} radius={21} />
        <Bone width={42} height={42} radius={21} />
      </View>

      <View style={[styles.chips, { paddingHorizontal: gutter }]}>
        <Bone width={150} height={30} radius={15} />
        <Bone width={152} height={28} radius={14} />
        <Bone width={120} height={28} radius={14} />
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

  const inner = width - gutter * 2;
  const heroH = Math.round(Math.min(252, Math.max(214, inner * 0.65)));
  const col = (inner - 20) / 3;
  const tileH = Math.round(col * 1.04);
  const spot = Math.round(Math.min(150, Math.max(104, inner * 0.38)));
  const bottomPad = STORE_NAV_HEIGHT + Math.max(16, insets.bottom + 6) + 28;

  return (
    <View style={[styles.screen, { backgroundColor: c.page }]} accessibilityRole="progressbar" accessibilityLabel="Loading">
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
            {/* hero */}
            <View style={{ paddingHorizontal: gutter }}>
              <View style={[styles.hero, shadow.card, { height: heroH, backgroundColor: isDark ? "rgba(255,255,255,0.05)" : "#E9DFC6" }]}>
                <View style={styles.heroCopy}>
                  <Bone width="78%" height={28} radius={9} />
                  <Bone width="56%" height={28} radius={9} />
                  <Bone width={64} height={6} radius={3} style={styles.heroRule} />
                  <Bone width={128} height={40} radius={20} />
                </View>
                <View style={[styles.heroPhoto, { width: spot, height: spot, top: Math.round(heroH / 2 - spot / 2 + 8) }]}>
                  <Bone width={spot} height={spot} radius={22} />
                </View>
              </View>
            </View>

            {/* promo card */}
            <View style={{ paddingHorizontal: gutter }}>
              <Bone width="100%" height={176} radius={30} />
              <View style={styles.dots}>
                <Bone width={22} height={6} radius={3} />
                <Bone width={6} height={6} radius={3} />
                <Bone width={6} height={6} radius={3} />
              </View>
            </View>

            {/* collection tiles */}
            <View style={{ gap: 14 }}>
              <View style={[styles.sectionHead, { paddingHorizontal: gutter }]}>
                <Bone width={170} height={22} radius={8} />
                <Bone width={74} height={30} radius={15} />
              </View>
              <View style={[styles.bento, { paddingHorizontal: gutter }]}>
                <Bone width={col} height={tileH * 2 + 10} radius={24} />
                <View style={styles.bentoGrid}>
                  <View style={styles.bentoRow}>
                    <Bone width={col} height={tileH} radius={24} />
                    <Bone width={col} height={tileH} radius={24} />
                  </View>
                  <View style={styles.bentoRow}>
                    <Bone width={col} height={tileH} radius={24} />
                    <Bone width={col} height={tileH} radius={24} />
                  </View>
                </View>
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
  topBar: { flexDirection: "row", alignItems: "center", gap: 10, minHeight: 46 },
  locationBones: { flex: 1, gap: 6 },
  chips: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 12 },
  search: { height: 54, borderRadius: 27, borderWidth: StyleSheet.hairlineWidth, flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 10 },
  tabs: { flexDirection: "row", marginTop: 6, paddingHorizontal: 8, borderBottomWidth: StyleSheet.hairlineWidth },
  tab: { flex: 1, alignItems: "center", gap: 6, paddingTop: 10, paddingBottom: 12 },
  tabIcon: { width: 48, height: 32, alignItems: "center", justifyContent: "center" },
  sections: { gap: 24, paddingTop: 24 },
  hero: { borderRadius: 28, overflow: "hidden" },
  heroCopy: { position: "absolute", left: 20, top: 0, bottom: 0, width: "52%", justifyContent: "center", gap: 10, paddingTop: 22 },
  heroRule: { marginVertical: 2 },
  heroPhoto: { position: "absolute", right: 20, transform: [{ rotate: "-5deg" }] },
  dots: { flexDirection: "row", justifyContent: "center", alignItems: "center", gap: 5, marginTop: 12 },
  sectionHead: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  bento: { flexDirection: "row", gap: 10 },
  bentoGrid: { flex: 1, gap: 10 },
  bentoRow: { flexDirection: "row", gap: 10 },
  rail: { flexDirection: "row", gap: 12 },
});
