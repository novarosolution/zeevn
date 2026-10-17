import React, { useRef } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { SHOP_SCREEN_UI } from "../../content/shopPageContent";
import { STORE_SHOP } from "../../content/storefrontContent";
import { useStoreTheme } from "../../theme/storefront";
import { hapticTick } from "../../utils/haptics";
import { SHOP_PRICE_PRESETS, pricePresetFromRange, rangeFromPricePreset } from "../../utils/shopFilters";
import BottomSheet from "./BottomSheet";
import PressableScale from "./PressableScale";

function Block({ title, children }) {
  const { type, c } = useStoreTheme();
  return (
    <View style={styles.block}>
      {title ? <Text style={type.ui(13, "extrabold", c.inkMute, { letterSpacing: 0.6, textTransform: "uppercase" })}>{title}</Text> : null}
      {children}
    </View>
  );
}

function Row({ label, selected, multi, onPress }) {
  const { c, type } = useStoreTheme();
  return (
    <Pressable
      onPress={() => {
        hapticTick();
        onPress?.();
      }}
      accessibilityRole={multi ? "checkbox" : "radio"}
      accessibilityState={{ checked: selected }}
      style={[styles.row, { borderColor: selected ? c.brandAlt : c.line, backgroundColor: selected ? c.brandSoft : c.cardSoft }]}
    >
      <Text style={type.ui(15, selected ? "extrabold" : "semibold", selected ? c.brand : c.ink)}>{label}</Text>
      <View
        style={[
          styles.mark,
          multi ? styles.markBox : styles.markDot,
          { borderColor: selected ? c.brand : c.lineStrong, backgroundColor: selected && multi ? c.brand : "transparent" },
        ]}
      >
        {selected ? multi ? <Ionicons name="checkmark" size={14} color={c.onBrand} /> : <View style={[styles.dot, { backgroundColor: c.brand }]} /> : null}
      </View>
    </Pressable>
  );
}

function Pill({ label, selected, onPress }) {
  const { c, type } = useStoreTheme();
  return (
    <Pressable
      onPress={() => {
        hapticTick();
        onPress?.();
      }}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      style={[styles.pill, { borderColor: selected ? c.brandAlt : c.line, backgroundColor: selected ? c.brand : c.cardSoft }]}
    >
      <Text style={type.ui(14, selected ? "extrabold" : "semibold", selected ? c.onBrand : c.ink)}>{label}</Text>
    </Pressable>
  );
}

const TITLES = {
  sort: STORE_SHOP.sheets.sort,
  type: STORE_SHOP.sheets.type,
  price: STORE_SHOP.sheets.price,
  filters: STORE_SHOP.sheets.filters,
};

/**
 * Bottom sheet for the shop filter chips. `section`: "sort" | "type" | "price" | "filters" (all of them) | null.
 * Changes apply live; the footer shows the live result count.
 */
export default function FilterSheet({
  section,
  onClose,
  sortKey,
  onSortChange,
  categories,
  categoryOptions,
  onToggleCategory,
  minPrice,
  maxPrice,
  onPriceChange,
  minRating,
  onRatingChange,
  onClearAll,
  hasActiveFilters,
  resultCount,
}) {
  const { c, r, type } = useStoreTheme();
  const last = useRef(section);
  if (section) last.current = section;
  const shown = section || last.current;
  const all = shown === "filters";
  const priceId = pricePresetFromRange(minPrice, maxPrice);
  const ratingOptions = SHOP_SCREEN_UI.ratingOptions;

  return (
    <BottomSheet
      visible={Boolean(section)}
      onClose={onClose}
      title={TITLES[shown] || STORE_SHOP.sheets.filters}
      footer={
        <View style={styles.footer}>
          {hasActiveFilters ? (
            <PressableScale
              onPress={onClearAll}
              accessibilityRole="button"
              accessibilityLabel={STORE_SHOP.sheets.clear}
              style={[styles.clear, { borderColor: c.lineStrong, borderRadius: r.lg }]}
            >
              <Text style={type.ui(14.5, "bold", c.inkSoft)}>{STORE_SHOP.sheets.clear}</Text>
            </PressableScale>
          ) : null}
          <PressableScale
            onPress={onClose}
            accessibilityRole="button"
            style={[styles.apply, { backgroundColor: c.brand, borderRadius: r.lg }]}
          >
            <Text style={type.ui(15, "extrabold", c.onBrand, { letterSpacing: 0.3 })}>
              {resultCount === 1 ? "Show 1 product" : `Show ${resultCount} products`}
            </Text>
          </PressableScale>
        </View>
      }
    >
      {all || shown === "sort" ? (
        <Block title={all ? STORE_SHOP.sheets.sort : null}>
          {STORE_SHOP.sort.map((option) => (
            <Row key={option.key} label={option.label} selected={sortKey === option.key} onPress={() => onSortChange(option.key)} />
          ))}
        </Block>
      ) : null}

      {all || shown === "type" ? (
        <Block title={all ? STORE_SHOP.sheets.type : null}>
          {categoryOptions.length ? (
            categoryOptions.map((label) => (
              <Row key={label} label={label} multi selected={categories.includes(label)} onPress={() => onToggleCategory(label)} />
            ))
          ) : (
            <Text style={type.ui(14, "medium", c.inkMute)}>No types yet</Text>
          )}
        </Block>
      ) : null}

      {all || shown === "price" ? (
        <Block title={all ? STORE_SHOP.sheets.price : null}>
          <View style={styles.pills}>
            {SHOP_PRICE_PRESETS.map((preset) => (
              <Pill
                key={preset.id}
                label={preset.label}
                selected={priceId === preset.id}
                onPress={() => onPriceChange(rangeFromPricePreset(preset.id))}
              />
            ))}
          </View>
        </Block>
      ) : null}

      {all ? (
        <Block title={STORE_SHOP.sheets.rating}>
          <View style={styles.pills}>
            {ratingOptions.map((option) => (
              <Pill key={option.label} label={option.label} selected={minRating === option.min} onPress={() => onRatingChange(option.min)} />
            ))}
          </View>
        </Block>
      ) : null}
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  block: { gap: 10, paddingBottom: 14 },
  row: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, height: 52, borderRadius: 16, borderWidth: 1 },
  mark: { width: 22, height: 22, alignItems: "center", justifyContent: "center", borderWidth: 2 },
  markDot: { borderRadius: 11 },
  markBox: { borderRadius: 7 },
  dot: { width: 10, height: 10, borderRadius: 5 },
  pills: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  pill: { height: 42, paddingHorizontal: 16, borderRadius: 21, borderWidth: 1, alignItems: "center", justifyContent: "center" },
  footer: { flexDirection: "row", gap: 10 },
  clear: { height: 50, paddingHorizontal: 18, borderWidth: 1, alignItems: "center", justifyContent: "center" },
  apply: { flex: 1, height: 50, alignItems: "center", justifyContent: "center" },
});
