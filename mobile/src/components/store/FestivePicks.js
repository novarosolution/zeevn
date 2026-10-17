import React from "react";
import { Pressable, StyleSheet, Text, View, useWindowDimensions } from "react-native";
import { Image } from "expo-image";
import Animated, { FadeIn } from "react-native-reanimated";
import { useStoreTheme, withAlpha } from "../../theme/storefront";
import { hapticTick } from "../../utils/haptics";
import { productImageUri } from "../../utils/storefront";
import ProductRail from "./ProductRail";
import { OrnamentTitle } from "./SectionTitle";
import StoreIcon from "./StoreIcon";

function PickTab({ pick, active, width, onPress }) {
  const { c, r, type, shadow } = useStoreTheme();
  const uri = pick.product ? productImageUri(pick.product, 70) : "";
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="tab"
      accessibilityState={{ selected: active }}
      accessibilityLabel={pick.title}
      style={[
        styles.tab,
        {
          width,
          borderRadius: r.xl,
          backgroundColor: active ? c.goldSoft : "transparent",
          borderColor: active ? withAlpha(c.gold, 0.55) : "transparent",
        },
      ]}
    >
      <View
        style={[
          styles.circle,
          shadow.soft,
          {
            backgroundColor: c.card,
            borderColor: active ? c.gold : c.line,
            borderWidth: active ? 2.5 : StyleSheet.hairlineWidth,
          },
        ]}
      >
        {uri ? (
          <Image source={{ uri }} style={styles.circleImg} contentFit="cover" cachePolicy="memory-disk" />
        ) : (
          <StoreIcon icon={pick.icon || { mci: "gift-outline" }} size={26} color={withAlpha(c.brand, 0.5)} />
        )}
      </View>
      <Text
        style={[type.ui(12.5, active ? "extrabold" : "semibold", active ? c.goldText : c.inkSoft), styles.label]}
        numberOfLines={2}
      >
        {pick.title}
      </Text>
    </Pressable>
  );
}

/**
 * “Festive Picks”: ornamented title, circular pick tabs, and a product rail for the selected pick.
 * Picks arrive resolved: { key, title, product?, products[], icon?, route? }.
 */
export default function FestivePicks({ title, picks, activeKey, onChange, onProductPress, onSeeAll }) {
  const { gutter } = useStoreTheme();
  const { width } = useWindowDimensions();
  const tabW = (width - gutter * 2) / Math.min(4, Math.max(picks.length, 1));
  const active = picks.find((p) => p.key === activeKey) || picks[0];
  if (!active) return null;

  return (
    <View style={styles.wrap}>
      <OrnamentTitle title={title} />
      <View style={[styles.tabs, { paddingHorizontal: gutter }]}>
        {picks.map((pick) => (
          <PickTab
            key={pick.key}
            pick={pick}
            active={pick.key === active.key}
            width={tabW}
            onPress={() => {
              if (pick.key !== active.key) hapticTick();
              onChange?.(pick.key);
            }}
          />
        ))}
      </View>
      <Animated.View key={active.key} entering={FadeIn.duration(260)}>
        <ProductRail
          products={active.products.slice(0, 8)}
          onProductPress={onProductPress}
          onSeeAll={onSeeAll ? () => onSeeAll(active) : undefined}
          seeAllLabel="See all"
        />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 14 },
  tabs: { flexDirection: "row", justifyContent: "space-between" },
  tab: { alignItems: "center", paddingVertical: 8, paddingHorizontal: 2, gap: 7, borderWidth: 1.5 },
  circle: {
    width: 62,
    height: 62,
    borderRadius: 31,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  circleImg: { width: "100%", height: "100%" },
  label: { textAlign: "center", minHeight: 32, paddingHorizontal: 2 },
});
