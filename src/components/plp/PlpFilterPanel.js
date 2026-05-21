import React, { memo, useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { PLP_UI } from "../../content/appContent";
import { useTheme } from "../../context/ThemeContext";
import { fonts } from "../../theme/tokens";
import Card from "../ui/Card";
import Switch from "../ui/Switch";
import Button from "../ui/Button";
import PlpPriceRange from "./PlpPriceRange";

function PlpCollapsibleFilterCard({ title, activeCount, defaultOpen = true, children }) {
  const [open, setOpen] = useState(defaultOpen);
  const { semanticPalette, SPACING, TYPE } = useTheme();
  const label = activeCount > 0 ? `${title} (${activeCount})` : title;

  return (
    <Card padding="none" contentStyle={{ padding: 0 }}>
      <Pressable
        onPress={() => setOpen((v) => !v)}
        accessibilityRole="button"
        accessibilityState={{ expanded: open }}
        style={({ pressed }) => ({
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          paddingHorizontal: SPACING.md,
          paddingVertical: SPACING.sm + 2,
          borderBottomWidth: StyleSheet.hairlineWidth,
          borderBottomColor: semanticPalette.line,
          opacity: pressed ? 0.92 : 1,
        })}
      >
        <Text
          style={{
            fontFamily: fonts.semibold,
            fontSize: TYPE.body.fontSize,
            lineHeight: TYPE.body.lineHeight,
            color: semanticPalette.ink,
            flex: 1,
            marginRight: SPACING.sm,
          }}
        >
          {label}
        </Text>
        <Ionicons name={open ? "chevron-up-outline" : "chevron-down-outline"} size={18} color={semanticPalette.inkMuted} />
      </Pressable>
      {open ? (
        <View style={{ paddingHorizontal: SPACING.md, paddingVertical: SPACING.md, gap: SPACING.sm }}>{children}</View>
      ) : null}
    </Card>
  );
}

function FacetChip({ label, selected, onToggle }) {
  const { semanticPalette, RADII, SPACING, TYPE } = useTheme();
  return (
    <Pressable
      onPress={onToggle}
      accessibilityRole="checkbox"
      accessibilityState={{ checked: selected }}
      style={({ pressed }) => ({
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: selected ? semanticPalette.accent : semanticPalette.line,
        backgroundColor: selected ? semanticPalette.accentSoft : semanticPalette.surfaceAlt,
        borderRadius: RADII.sm,
        paddingVertical: SPACING.sm,
        paddingHorizontal: SPACING.md,
        opacity: pressed ? 0.9 : 1,
      })}
    >
      <Text style={{ fontFamily: fonts.medium, fontSize: TYPE.caption.fontSize, color: semanticPalette.ink }}>{label}</Text>
    </Pressable>
  );
}

function ColorSwatch({ swatch, selected, onToggle }) {
  const { semanticPalette } = useTheme();
  return (
    <Pressable
      onPress={onToggle}
      accessibilityRole="checkbox"
      accessibilityState={{ checked: selected }}
      accessibilityLabel={swatch.label}
      style={{
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: swatch.hex,
        borderWidth: selected ? 2 : StyleSheet.hairlineWidth,
        borderColor: selected ? semanticPalette.accent : semanticPalette.line,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {selected ? <Ionicons name="checkmark" size={16} color={swatch.key === "white" ? semanticPalette.ink : "#fff"} /> : null}
    </Pressable>
  );
}

function PlpFilterPanelBase({
  facets,
  filters,
  priceBounds,
  onToggleCategory,
  onToggleType,
  onToggleBrand,
  onToggleSize,
  onToggleColor,
  onPriceMinChange,
  onPriceMaxChange,
  onRatingChange,
  onToggleDiscount,
  onToggleInStock,
  onClearAll,
  activeFilterCount,
}) {
  const { SPACING, semanticPalette, TYPE } = useTheme();

  const priceActive =
    (filters.priceMin != null && filters.priceMin > priceBounds.min ? 1 : 0) +
    (filters.priceMax != null && filters.priceMax < priceBounds.max ? 1 : 0);

  const chipWrap = useMemo(
    () => ({ flexDirection: "row", flexWrap: "wrap", gap: SPACING.sm }),
    [SPACING.sm]
  );

  return (
    <View style={{ gap: SPACING.md }}>
      {onClearAll ? (
        <Button
          variant="ghost"
          size="sm"
          fullWidth
          label={PLP_UI.clearAllFiltersCta}
          onPress={onClearAll}
          disabled={activeFilterCount <= 0}
        />
      ) : null}

      {facets.categories.length ? (
        <PlpCollapsibleFilterCard title={PLP_UI.sectionCategory} activeCount={filters.categories.size}>
          <View style={chipWrap}>
            {facets.categories.map((cat) => (
              <FacetChip
                key={`cat-${cat}`}
                label={cat}
                selected={filters.categories.has(cat)}
                onToggle={() => onToggleCategory(cat)}
              />
            ))}
          </View>
        </PlpCollapsibleFilterCard>
      ) : null}

      <PlpCollapsibleFilterCard title={PLP_UI.sectionPrice} activeCount={priceActive}>
        <PlpPriceRange
          minBound={priceBounds.min}
          maxBound={priceBounds.max}
          valueMin={filters.priceMin}
          valueMax={filters.priceMax}
          onChangeMin={onPriceMinChange}
          onChangeMax={onPriceMaxChange}
        />
      </PlpCollapsibleFilterCard>

      {facets.sizes.length ? (
        <PlpCollapsibleFilterCard title={PLP_UI.sectionSize} activeCount={filters.sizes.size} defaultOpen={false}>
          <View style={chipWrap}>
            {facets.sizes.map((s) => (
              <FacetChip key={`size-${s}`} label={s} selected={filters.sizes.has(s)} onToggle={() => onToggleSize(s)} />
            ))}
          </View>
        </PlpCollapsibleFilterCard>
      ) : null}

      <PlpCollapsibleFilterCard title={PLP_UI.sectionColor} activeCount={filters.colors.size} defaultOpen={false}>
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: SPACING.sm }}>
          {facets.colors.map((sw) => (
            <ColorSwatch
              key={sw.key}
              swatch={sw}
              selected={filters.colors.has(sw.key)}
              onToggle={() => onToggleColor(sw.key)}
            />
          ))}
        </View>
      </PlpCollapsibleFilterCard>

      {facets.brands.length ? (
        <PlpCollapsibleFilterCard title={PLP_UI.sectionBrand} activeCount={filters.brands.size} defaultOpen={false}>
          <View style={chipWrap}>
            {facets.brands.map((b) => (
              <FacetChip key={`brand-${b}`} label={b} selected={filters.brands.has(b)} onToggle={() => onToggleBrand(b)} />
            ))}
          </View>
        </PlpCollapsibleFilterCard>
      ) : null}

      <PlpCollapsibleFilterCard title={PLP_UI.sectionRating} activeCount={filters.minRating != null ? 1 : 0} defaultOpen={false}>
        <View style={chipWrap}>
          {facets.ratingOptions.map((r) => (
            <FacetChip
              key={`rating-${r}`}
              label={PLP_UI.ratingChipTemplate(r)}
              selected={filters.minRating === r}
              onToggle={() => onRatingChange(filters.minRating === r ? null : r)}
            />
          ))}
        </View>
      </PlpCollapsibleFilterCard>

      <PlpCollapsibleFilterCard title={PLP_UI.sectionDiscount} activeCount={filters.discountOnly ? 1 : 0} defaultOpen={false}>
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: SPACING.md }}>
          <Text style={{ flex: 1, fontFamily: fonts.regular, fontSize: TYPE.body.fontSize, color: semanticPalette.inkSoft }}>
            {PLP_UI.discountOnly}
          </Text>
          <Switch value={filters.discountOnly} onValueChange={(v) => onToggleDiscount(v)} />
        </View>
      </PlpCollapsibleFilterCard>

      {facets.types.length ? (
        <PlpCollapsibleFilterCard title={PLP_UI.sectionType} activeCount={filters.types.size} defaultOpen={false}>
          <View style={chipWrap}>
            {facets.types.map((t) => (
              <FacetChip key={`type-${t}`} label={t} selected={filters.types.has(t)} onToggle={() => onToggleType(t)} />
            ))}
          </View>
        </PlpCollapsibleFilterCard>
      ) : null}

      <PlpCollapsibleFilterCard title={PLP_UI.sectionAvailability} activeCount={filters.inStockOnly ? 1 : 0} defaultOpen={false}>
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: SPACING.md }}>
          <Text style={{ flex: 1, fontFamily: fonts.regular, fontSize: TYPE.body.fontSize, color: semanticPalette.inkSoft }}>
            {PLP_UI.inStockOnly}
          </Text>
          <Switch value={filters.inStockOnly} onValueChange={(v) => onToggleInStock(v)} />
        </View>
      </PlpCollapsibleFilterCard>
    </View>
  );
}

const PlpFilterPanel = memo(PlpFilterPanelBase);
export default PlpFilterPanel;
