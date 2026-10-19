import React, { memo } from "react";
import { StyleSheet, Text, View, useWindowDimensions } from "react-native";
import { Image } from "expo-image";
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

  return (
    <PressableScale
      onPress={onPress}
      scaleTo={0.96}
      lite
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
          <Image
            source={{ uri }}
            style={styles.circleImg}
            contentFit="contain"
            contentPosition="center"
            cachePolicy="memory-disk"
            transition={0}
            recyclingKey={uri}
          />
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
    </PressableScale>
  );
}

/** Festive picks — static tabs + windowed product rail (no tab pop springs). */
function FestivePicks({ title, picks, activeKey, onChange, onProductPress, onSeeAll, hideEta }) {
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
          products={active.products.slice(0, 6)}
          onProductPress={onProductPress}
          onSeeAll={onSeeAll ? () => onSeeAll(active) : undefined}
          seeAllLabel={STORE_SECTIONS.picks.action}
          hideEta={hideEta}
        />
      </View>
    </View>
  );
}

export default memo(FestivePicks);

const styles = StyleSheet.create({
  wrap: { gap: 14 },
  tabs: { flexDirection: "row", justifyContent: "space-between" },
  tab: { alignItems: "center", paddingVertical: 8, paddingHorizontal: 2, gap: 7, borderWidth: 1.5 },
  circle: {
    width: 62,
    height: 62,
    borderRadius: 31,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  circleImg: { width: 48, height: 48 },
  label: { textAlign: "center", minHeight: 32 },
});
