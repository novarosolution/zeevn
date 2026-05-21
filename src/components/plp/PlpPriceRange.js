import React, { memo, useMemo } from "react";
import { Platform, Pressable, StyleSheet, Text, View } from "react-native";
import { PLP_UI } from "../../content/appContent";
import { useTheme } from "../../context/ThemeContext";
import { fonts } from "../../theme/tokens";
import { formatINRWhole } from "../../utils/currency";
import Input from "../ui/Input";

function PlpPriceRangeBase({ minBound, maxBound, valueMin, valueMax, onChangeMin, onChangeMax }) {
  const { semanticPalette, SPACING, TYPE } = useTheme();
  const lo = Math.max(minBound, Math.min(valueMin ?? minBound, maxBound));
  const hi = Math.max(lo, Math.min(valueMax ?? maxBound, maxBound));
  const span = Math.max(1, maxBound - minBound);
  const leftPct = ((lo - minBound) / span) * 100;
  const widthPct = ((hi - lo) / span) * 100;

  const styles = useMemo(
    () =>
      StyleSheet.create({
        track: {
          height: 4,
          borderRadius: 2,
          backgroundColor: semanticPalette.lineSoft,
          marginTop: SPACING.sm,
          marginBottom: SPACING.md,
          position: "relative",
        },
        fill: {
          position: "absolute",
          top: 0,
          bottom: 0,
          borderRadius: 2,
          backgroundColor: semanticPalette.accent,
        },
        row: {
          flexDirection: "row",
          gap: SPACING.sm,
        },
        col: {
          flex: 1,
        },
        label: {
          fontFamily: fonts.medium,
          fontSize: TYPE.caption.fontSize,
          color: semanticPalette.inkMuted,
          marginBottom: 4,
        },
        presets: {
          flexDirection: "row",
          flexWrap: "wrap",
          gap: SPACING.xs,
          marginTop: SPACING.sm,
        },
        preset: {
          paddingHorizontal: SPACING.sm,
          paddingVertical: 6,
          borderRadius: 999,
          borderWidth: StyleSheet.hairlineWidth,
          borderColor: semanticPalette.line,
          backgroundColor: semanticPalette.surfaceAlt,
        },
      }),
    [SPACING, TYPE.caption.fontSize, semanticPalette]
  );

  const presets = useMemo(() => {
    if (maxBound <= minBound) return [];
    const mid = Math.round((minBound + maxBound) / 2);
    return [
      { label: PLP_UI.priceUnderTemplate?.(mid) || `Under ${formatINRWhole(mid)}`, min: minBound, max: mid },
      { label: PLP_UI.priceOverTemplate?.(mid) || `Over ${formatINRWhole(mid)}`, min: mid, max: maxBound },
    ];
  }, [maxBound, minBound]);

  return (
    <View>
      <View style={styles.track}>
        <View style={[styles.fill, { left: `${leftPct}%`, width: `${widthPct}%` }]} />
      </View>
      <View style={styles.row}>
        <View style={styles.col}>
          <Text style={styles.label}>{PLP_UI.priceMinLabel}</Text>
          <Input
            value={String(lo)}
            onChangeText={(t) => {
              const n = Number(String(t).replace(/\D/g, ""));
              if (Number.isFinite(n)) onChangeMin(Math.max(minBound, Math.min(n, hi)));
            }}
            keyboardType="numeric"
            accessibilityLabel={PLP_UI.priceMinLabel}
          />
        </View>
        <View style={styles.col}>
          <Text style={styles.label}>{PLP_UI.priceMaxLabel}</Text>
          <Input
            value={String(hi)}
            onChangeText={(t) => {
              const n = Number(String(t).replace(/\D/g, ""));
              if (Number.isFinite(n)) onChangeMax(Math.min(maxBound, Math.max(n, lo)));
            }}
            keyboardType="numeric"
            accessibilityLabel={PLP_UI.priceMaxLabel}
          />
        </View>
      </View>
      {presets.length ? (
        <View style={styles.presets}>
          {presets.map((p) => (
            <Pressable
              key={p.label}
              onPress={() => {
                onChangeMin(p.min);
                onChangeMax(p.max);
              }}
              style={({ pressed }) => [styles.preset, pressed ? { opacity: 0.88 } : null]}
            >
              <Text style={{ fontFamily: fonts.medium, fontSize: 11, color: semanticPalette.ink }}>{p.label}</Text>
            </Pressable>
          ))}
        </View>
      ) : null}
      <Text style={{ marginTop: SPACING.xs, fontFamily: fonts.regular, fontSize: 11, color: semanticPalette.inkMuted }}>
        {formatINRWhole(lo)} – {formatINRWhole(hi)}
      </Text>
    </View>
  );
}

const PlpPriceRange = memo(PlpPriceRangeBase);
export default PlpPriceRange;
