import React, { useEffect, useRef } from "react";
import { StyleSheet, Text, View, useWindowDimensions } from "react-native";
import { Image } from "expo-image";
import Animated, { useAnimatedStyle, useSharedValue, withSequence, withSpring } from "react-native-reanimated";
import { STORE_SECTIONS } from "../../content/storefrontContent";
import { useStoreTheme, withAlpha } from "../../theme/storefront";
import { hapticTick } from "../../utils/haptics";
import { productImageUri } from "../../utils/storefront";
import PressableScale from "./PressableScale";
import ProductRail from "./ProductRail";
import { OrnamentTitle } from "./SectionTitle";
import StoreIcon from "./StoreIcon";

function PickTab({ pick, active, width, onPress }) {
  const { c, r, type, shadow } = useStoreTheme();
  const uri = pick.product ? productImageUri(pick.product, 70) : "";
  const pop = useSharedValue(1);
  const mounted = useRef(false);
  useEffect(() => {
    if (!mounted.current) {
      mounted.current = true;
      return;
    }
    if (active) pop.value = withSequence(withSpring(1.12, { damping: 7, stiffness: 400 }), withSpring(1, { damping: 10, stiffness: 240 }));
  }, [active, pop]);
  const popStyle = useAnimatedStyle(() => ({ transform: [{ scale: pop.value }] }));

  return (
    <PressableScale
      onPress={onPress}
      scaleTo={0.95}
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
      <Animated.View
        style={[
          styles.circle,
          shadow.soft,
          {
            backgroundColor: c.card,
            borderColor: active ? c.gold : c.line,
            borderWidth: active ? 2.5 : StyleSheet.hairlineWidth,
          },
          popStyle,
        ]}
      >
        {uri ? (
          <Image source={{ uri }} style={styles.circleImg} contentFit="contain" contentPosition="center" cachePolicy="memory-disk" />
        ) : (
          <StoreIcon icon={pick.icon || { mci: "gift-outline" }} size={26} color={withAlpha(c.brand, 0.5)} />
        )}
      </Animated.View>
      <Text
        style={[type.ui(12.5, active ? "extrabold" : "semibold", active ? c.goldText : c.inkSoft), styles.label]}
        numberOfLines={2}
      >
        {pick.title}
      </Text>
    </PressableScale>
  );
}

/**
 * “Festive Picks”: ornamented title, circular pick tabs, and a product rail for the selected pick.
 * Picks arrive resolved: { key, title, product?, products[], icon?, route? }.
 */
export default function FestivePicks({ title, picks, activeKey, onChange, onProductPress, onSeeAll, hideEta }) {
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
      <View key={active.key}>
        <ProductRail
          products={active.products.slice(0, 8)}
          onProductPress={onProductPress}
          onSeeAll={onSeeAll ? () => onSeeAll(active) : undefined}
          seeAllLabel={STORE_SECTIONS.picks.action}
          hideEta={hideEta}
        />
      </View>
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
