import React from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { Image } from "expo-image";
import { useStoreTheme, withAlpha } from "../../theme/storefront";
import { hapticTick } from "../../utils/haptics";
import StoreIcon from "./StoreIcon";

export const SHOP_SIDEBAR_WIDTH = 86;

/**
 * Left rail of ranges — circular art, label, and a brand bar on the active item.
 * items: [{ key, label, image?, icon? }]
 */
export default function ShopSidebar({ items, activeKey, onSelect, bottomPad = 0 }) {
  const { c, type } = useStoreTheme();
  return (
    <View style={[styles.rail, { width: SHOP_SIDEBAR_WIDTH, backgroundColor: c.cardSoft, borderRightColor: c.line }]}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingTop: 8, paddingBottom: bottomPad }}>
        {items.map((item) => {
          const active = item.key === activeKey;
          return (
            <Pressable
              key={item.key}
              onPress={() => {
                if (!active) hapticTick();
                onSelect?.(item.key);
              }}
              accessibilityRole="tab"
              accessibilityState={{ selected: active }}
              accessibilityLabel={item.label}
              style={[styles.item, active && { backgroundColor: withAlpha(c.brand, 0.07) }]}
            >
              {active ? <View style={[styles.bar, { backgroundColor: c.brand }]} /> : null}
              <View style={[styles.glow, active && { shadowColor: c.gold, shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.5, shadowRadius: 8 }]}>
                <View
                  style={[
                    styles.circle,
                    { backgroundColor: c.card, borderColor: active ? c.gold : c.line, borderWidth: active ? 2.5 : StyleSheet.hairlineWidth },
                  ]}
                >
                  {item.image ? (
                    <Image source={{ uri: item.image }} style={StyleSheet.absoluteFill} contentFit="cover" cachePolicy="memory-disk" />
                  ) : (
                    <StoreIcon icon={item.icon} active={active} size={26} color={active ? c.brand : c.inkMute} />
                  )}
                </View>
              </View>
              <Text style={[type.ui(12.5, active ? "extrabold" : "medium", active ? c.brand : c.inkSoft), styles.label]} numberOfLines={2}>
                {item.label}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  rail: { borderRightWidth: StyleSheet.hairlineWidth },
  item: { alignItems: "center", paddingVertical: 12, paddingHorizontal: 6, gap: 7 },
  bar: { position: "absolute", left: 0, top: 18, height: 44, width: 4, borderTopRightRadius: 4, borderBottomRightRadius: 4 },
  glow: { width: 60, height: 60, borderRadius: 30 },
  circle: { width: 60, height: 60, borderRadius: 30, overflow: "hidden", alignItems: "center", justifyContent: "center" },
  label: { textAlign: "center", lineHeight: 16 },
});
