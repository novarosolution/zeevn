import React from "react";
import { RefreshControl, StyleSheet, Text, View, useWindowDimensions } from "react-native";
import Animated, { useAnimatedScrollHandler, useSharedValue } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { STORE_WISHLIST } from "../../content/storefrontContent";
import { useStoreTheme } from "../../theme/storefront";
import FloatingNav from "./FloatingNav";
import { useStoreNavPad } from "./StoreTracker";
import ProductCard from "./ProductCard";
import ScreenHeader, { SCREEN_HEADER_PAD } from "./ScreenHeader";
import { Card, EmptyState } from "./StoreKit";
import { VariantSheetProvider } from "./VariantSheet";
import SkeletonBlock from "../ui/SkeletonBlock";

const GAP = 12;

/**
 * Saved products (stored on this device) as a two-column grid under the shared large-title header, with the same empty
 * state as the rest of the app.
 */
export default function StoreWishlist({ navigation, items, loading, refreshing, onRefresh }) {
  const { c, type, gutter } = useStoreTheme();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const cardW = Math.floor((width - gutter * 2 - GAP) / 2);
  const navPad = useStoreNavPad(insets, -4);

  const scrollY = useSharedValue(0);
  const onScroll = useAnimatedScrollHandler((event) => {
    scrollY.value = event.contentOffset.y;
  });

  const goBack = () => (navigation.canGoBack?.() ? navigation.goBack() : navigation.navigate("Home"));

  const empty = (
    <Card padded={false} style={{ marginHorizontal: gutter, marginTop: 8 }}>
      <EmptyState
        icon="heart-outline"
        title={STORE_WISHLIST.emptyTitle}
        body={STORE_WISHLIST.emptyBody}
        actionLabel={STORE_WISHLIST.emptyCta}
        onAction={() => navigation.navigate("Shop")}
      />
    </Card>
  );

  return (
    <VariantSheetProvider>
      <View style={[styles.screen, { backgroundColor: c.page }]}>
        <Animated.FlatList
          onScroll={onScroll}
          scrollEventThrottle={16}
          data={loading ? [] : items}
          keyExtractor={(item) => String(item.id)}
          numColumns={2}
          columnWrapperStyle={{ gap: GAP, paddingHorizontal: gutter, marginBottom: GAP + 2 }}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingTop: insets.top + SCREEN_HEADER_PAD, paddingBottom: navPad }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={c.brand} progressViewOffset={insets.top + 60} />}
          ListHeaderComponent={
            <View style={[styles.heading, { paddingHorizontal: gutter }]}>
              <Text style={type.display(36, { ls: -0.9, lh: 42 })} numberOfLines={1} accessibilityRole="header">
                {STORE_WISHLIST.title}
              </Text>
              {items.length ? (
                <Text style={type.ui(14.5, "medium", c.inkSoft)}>
                  {items.length === 1 ? "1 saved product" : `${items.length} saved products`} · {STORE_WISHLIST.hint}
                </Text>
              ) : null}
            </View>
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

        <ScreenHeader title={STORE_WISHLIST.title} onBack={goBack} scrollY={scrollY} />
        <FloatingNav />
      </View>
    </VariantSheetProvider>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  heading: { gap: 4, paddingTop: 4, paddingBottom: 16 },
  skeleton: { gap: GAP + 2, paddingTop: 8 },
  skeletonRow: { flexDirection: "row", gap: GAP },
});
