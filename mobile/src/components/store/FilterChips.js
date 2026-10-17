import React from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useStoreTheme } from "../../theme/storefront";
import { hapticTick } from "../../utils/haptics";

function Chip({ label, icon, caret = true, active, badge, onPress }) {
  const { c, type } = useStoreTheme();
  const color = active ? c.brand : c.ink;
  return (
    <Pressable
      onPress={() => {
        hapticTick();
        onPress?.();
      }}
      accessibilityRole="button"
      accessibilityState={{ selected: Boolean(active) }}
      accessibilityLabel={label}
      style={[styles.chip, { backgroundColor: active ? c.brandSoft : c.card, borderColor: active ? c.brandAlt : c.line }]}
    >
      {icon ? <Ionicons name={icon} size={16} color={color} /> : null}
      <Text style={type.ui(13.5, active ? "extrabold" : "semibold", color)} numberOfLines={1}>
        {label}
      </Text>
      {badge ? (
        <View style={[styles.badge, { backgroundColor: c.brand }]}>
          <Text style={type.ui(10.5, "extrabold", c.onBrand)}>{badge}</Text>
        </View>
      ) : null}
      {caret ? <Ionicons name="chevron-down" size={13} color={color} /> : null}
    </Pressable>
  );
}

/** Horizontal chip row — Filters · Sort · Type · Price. Active chips tint to the brand colour. */
export default function FilterChips({ chips, style }) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={[styles.row, style]}>
      {chips.map(({ key, ...chip }) => (
        <Chip key={key} {...chip} />
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: { gap: 8, paddingHorizontal: 12, paddingVertical: 10 },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    height: 38,
    paddingHorizontal: 13,
    borderRadius: 19,
    borderWidth: 1,
  },
  badge: { minWidth: 18, height: 18, borderRadius: 9, paddingHorizontal: 5, alignItems: "center", justifyContent: "center" },
});
