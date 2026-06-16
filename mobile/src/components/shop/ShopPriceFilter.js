import React from "react";
import { Platform, Pressable, StyleSheet, Text, View } from "react-native";
import { useTheme } from "../../context/ThemeContext";
import { getShopTheme } from "../../theme/shopTheme";
import { fonts } from "../../theme/tokens";
import { formatINR } from "../../utils/currency";
import {
  SHOP_PRICE_PRESETS,
  formatPriceRangeLabel,
  getPriceRangeFill,
  pricePresetFromRange,
} from "../../utils/shopFilters";

function PricePresetRow({ preset, selected, onSelect, variant, theme }) {
  const on = selected;
  return (
    <Pressable
      onPress={() => onSelect(preset.id)}
      style={({ pressed }) => [
        variant === "row" ? styles.chkRow : styles.presetChip,
        variant === "chip" && {
          backgroundColor: on ? theme.chipOnBg : theme.surfaceChip,
          borderColor: on ? theme.chipOnBorder : theme.border,
        },
        variant === "row" && on && { backgroundColor: theme.accentSoft },
        pressed && styles.presetPressed,
      ]}
      accessibilityRole="radio"
      accessibilityState={{ selected: on }}
    >
      {variant === "row" ? (
        <>
          <View
            style={[
              styles.radio,
              { borderColor: on ? theme.chipOnBorder : theme.checkBorder },
              on && { backgroundColor: theme.checkOn, borderColor: theme.checkOn },
            ]}
          >
            {on ? <View style={[styles.radioDot, { backgroundColor: theme.chipOnText }]} /> : null}
          </View>
          <Text style={[styles.presetLabel, { color: on ? theme.text : theme.textMuted }]}>
            {preset.label}
          </Text>
        </>
      ) : (
        <Text style={[styles.chipText, { color: on ? theme.chipOnText : theme.textMuted }]}>
          {preset.label}
        </Text>
      )}
    </Pressable>
  );
}

/** Premium price filter — presets + live range bar (web + native). */
export default function ShopPriceFilter({
  minPrice,
  maxPrice,
  onChange,
  bounds,
  variant = "sidebar",
  title,
}) {
  const { isDark } = useTheme();
  const theme = getShopTheme(isDark);
  const activePreset = pricePresetFromRange(minPrice, maxPrice);
  const fill = getPriceRangeFill(minPrice, maxPrice, bounds);
  const rangeLabel = formatPriceRangeLabel(minPrice, maxPrice);

  const handlePreset = (presetId) => {
    const preset = SHOP_PRICE_PRESETS.find((p) => p.id === presetId);
    if (!preset) return;
    onChange?.({ min: preset.min, max: preset.max });
  };

  if (variant === "chips") {
    return (
      <View style={styles.chipWrap}>
        <View style={styles.chipRow}>
          {SHOP_PRICE_PRESETS.map((preset) => (
            <PricePresetRow
              key={preset.id}
              preset={preset}
              selected={activePreset === preset.id}
              onSelect={handlePreset}
              variant="chip"
              theme={theme}
            />
          ))}
        </View>
      </View>
    );
  }

  return (
    <View style={styles.wrap}>
      <View style={[styles.track, { backgroundColor: theme.track }]}>
        <View
          style={[
            styles.trackFill,
            { left: fill.left, width: fill.width, backgroundColor: theme.trackFill },
            activePreset === "any" && styles.trackFillMuted,
          ]}
        />
        {minPrice != null ? (
          <View
            style={[
              styles.knob,
              {
                left: `${fill.leftPct}%`,
                marginLeft: -7,
                backgroundColor: theme.knob,
                borderColor: theme.knobBorder,
              },
            ]}
          />
        ) : null}
        {maxPrice != null ? (
          <View
            style={[
              styles.knob,
              {
                left: `${fill.rightPct}%`,
                marginLeft: -7,
                backgroundColor: theme.knob,
                borderColor: theme.knobBorder,
              },
            ]}
          />
        ) : null}
      </View>

      <View style={styles.rangeLabels}>
        <Text style={[styles.rangeEdge, { color: theme.textFaint }]}>{formatINR(bounds.min)}</Text>
        <View style={[styles.rangePill, { backgroundColor: theme.accentSoft, borderColor: theme.border }]}>
          <Text style={[styles.rangeActive, { color: theme.accent }]}>{rangeLabel}</Text>
        </View>
        <Text style={[styles.rangeEdge, { color: theme.textFaint }]}>{formatINR(bounds.max)}</Text>
      </View>

      <View style={styles.presetList}>
        {SHOP_PRICE_PRESETS.map((preset) => (
          <PricePresetRow
            key={preset.id}
            preset={preset}
            selected={activePreset === preset.id}
            onSelect={handlePreset}
            variant="row"
            theme={theme}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginBottom: 2 },
  chipWrap: { marginBottom: 2 },
  track: {
    height: 8,
    borderRadius: 999,
    marginBottom: 12,
    overflow: "hidden",
    position: "relative",
  },
  trackFill: {
    position: "absolute",
    top: 0,
    bottom: 0,
    borderRadius: 999,
  },
  trackFillMuted: {
    opacity: 0.3,
    left: "0%",
    width: "100%",
  },
  knob: {
    position: "absolute",
    top: -6,
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2.5,
    ...Platform.select({
      web: { boxShadow: "0 2px 10px rgba(22, 69, 51, 0.2)" },
      ios: {
        shadowColor: "#3D2A12",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.18,
        shadowRadius: 4,
      },
      android: { elevation: 3 },
    }),
  },
  rangeLabels: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 14,
    gap: 8,
  },
  rangeEdge: {
    fontSize: 11,
    fontFamily: fonts.medium,
    minWidth: 52,
  },
  rangePill: {
    flex: 1,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: "center",
  },
  rangeActive: {
    fontFamily: fonts.semibold,
    fontSize: 12,
  },
  presetList: { gap: 0 },
  chkRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 8,
    paddingHorizontal: 8,
    borderRadius: 10,
    marginHorizontal: -8,
  },
  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
  },
  radioDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  presetLabel: {
    fontSize: 14,
    fontFamily: fonts.medium,
    flex: 1,
  },
  chipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  presetChip: {
    paddingVertical: 6,
    paddingHorizontal: 11,
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth,
  },
  presetPressed: { opacity: 0.88 },
  chipText: {
    fontFamily: fonts.semibold,
    fontSize: 12,
  },
});
