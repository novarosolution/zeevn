import React from "react";
import { FlatList, RefreshControl, StyleSheet, Text, View, useWindowDimensions } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { STORE_WISHLIST } from "../../content/storefrontContent";
import { STORE_NAV_HEIGHT, useStoreTheme } from "../../theme/storefront";
import FloatingNav from "./FloatingNav";
import PressableScale from "./PressableScale";
import ProductCard from "./ProductCard";
import { VariantSheetProvider } from "./VariantSheet";
import SkeletonBlock from "../ui/SkeletonBlock";

const GAP = 12;

/** Saved products (stored on this device) as a two-column grid, with a friendly empty state. */
export default function StoreWishlist({ navigation, items, loading, refreshing, onRefresh }) {
  const { c, r, type, isDark, gutter } = useStoreTheme();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const cardW = Math.floor((width - gutter * 2 - GAP) / 2);
  const navPad = STORE_NAV_HEIGHT + Math.max(16, insets.bottom + 6) + 24;

  const goBack = () => (navigation.canGoBack?.() ? navigation.goBack() : navigation.navigate("Home"));

  const empty = (
    <View style={[styles.empty, { marginHorizontal: gutter, backgroundColor: c.card, borderColor: c.line, borderRadius: r.xxl }]}>
      <View style={[styles.emptyIcon, { backgroundColor: c.dangerSoft }]}>
        <Ionicons name="heart-outline" size={34} color={c.danger} />
      </View>
      <Text style={type.display(22, { semi: true })}>{STORE_WISHLIST.emptyTitle}</Text>
      <Text style={[type.ui(14, "medium", c.inkMute), styles.emptyBody]}>{STORE_WISHLIST.emptyBody}</Text>
      <PressableScale
        onPress={() => navigation.navigate("Shop")}
        accessibilityRole="button"
        accessibilityLabel={STORE_WISHLIST.emptyCta}
        style={[styles.emptyBtn, { backgroundColor: c.brand }]}
      >
        <Text style={type.ui(14.5, "extrabold", c.onBrand)}>{STORE_WISHLIST.emptyCta}</Text>
      </PressableScale>
    </View>
  );

  return (
    <VariantSheetProvider>
      <View style={[styles.screen, { backgroundColor: c.page }]}>
        <FlatList
          data={loading ? [] : items}
          keyExtractor={(item) => String(item.id)}
          numColumns={2}
          columnWrapperStyle={{ gap: GAP, paddingHorizontal: gutter, marginBottom: GAP + 2 }}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingTop: insets.top + 64, paddingBottom: navPad }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={c.brand} progressViewOffset={insets.top + 60} />}
          ListHeaderComponent={
            items.length ? (
              <View style={[styles.hintRow, { paddingHorizontal: gutter }]}>
                <Ionicons name="phone-portrait-outline" size={14} color={c.inkMute} />
                <Text style={type.ui(12.5, "semibold", c.inkMute)}>
                  {items.length === 1 ? "1 saved product" : `${items.length} saved products`} · {STORE_WISHLIST.hint}
                </Text>
              </View>
            ) : null
          }
          ListEmptyComponent={
            loading ? (
              <View style={[styles.skeleton, { paddingHorizontal: gutter }]}>
                <View style={styles.skeletonRow}>
                  <SkeletonBlock width={cardW} height={cardW} rounded={20} />
                  <SkeletonBlock width={cardW} height={cardW} rounded={20} />
                </View>
                <View style={styles.skeletonRow}>
                  <SkeletonBlock width={cardW} height={cardW} rounded={20} />
                  <SkeletonBlock width={cardW} height={cardW} rounded={20} />
                </View>
              </View>
            ) : (
              empty
            )
          }
          renderItem={({ item }) => (
            <ProductCard product={item} width={cardW} gallery onPress={() => navigation.navigate("Product", { productId: item.id })} />
          )}
        />

        <View style={[styles.header, { paddingTop: insets.top + 6 }]}>
          <View style={[StyleSheet.absoluteFill, { backgroundColor: c.glassStrong }]} />
          <View style={[styles.headerRow, { paddingHorizontal: gutter }]}>
            <PressableScale
              onPress={goBack}
              scaleTo={0.92}
              accessibilityRole="button"
              accessibilityLabel="Back"
              style={[styles.round, { backgroundColor: c.card, borderColor: c.line }]}
            >
              <Ionicons name="chevron-back" size={21} color={c.ink} />
            </PressableScale>
            <Text style={[type.ui(18, "extrabold", c.ink), styles.headerTitle]} pointerEvents="none" accessibilityRole="header">
              {STORE_WISHLIST.title}
            </Text>
            <View style={styles.roundSpacer} />
          </View>
        </View>

        <FloatingNav />
      </View>
    </VariantSheetProvider>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  header: { position: "absolute", top: 0, left: 0, right: 0, paddingBottom: 10, zIndex: 20, overflow: "hidden" },
  headerRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", height: 46 },
  headerTitle: { position: "absolute", left: 0, right: 0, textAlign: "center" },
  round: { width: 44, height: 44, borderRadius: 22, alignItems: "center", justifyContent: "center", borderWidth: StyleSheet.hairlineWidth },
  roundSpacer: { width: 44, height: 44 },
  hintRow: { flexDirection: "row", alignItems: "center", gap: 6, paddingBottom: 12 },
  empty: { alignItems: "center", gap: 10, padding: 30, marginTop: 24, borderWidth: StyleSheet.hairlineWidth },
  emptyIcon: { width: 72, height: 72, borderRadius: 36, alignItems: "center", justifyContent: "center", marginBottom: 4 },
  emptyBody: { textAlign: "center" },
  emptyBtn: { marginTop: 8, height: 46, paddingHorizontal: 26, borderRadius: 23, alignItems: "center", justifyContent: "center" },
  skeleton: { gap: GAP + 2, paddingTop: 8 },
  skeletonRow: { flexDirection: "row", gap: GAP },
});
