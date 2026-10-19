import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { STORE_HOME } from "../../content/storefrontContent";
import { useStoreTheme, withAlpha } from "../../theme/storefront";
import { Stagger } from "./HomeMotion";
import { SectionHeader } from "./SectionTitle";

/** One row: a small label, then "ours" (green tick, strong) beside "ordinary" (muted cross). */
function CompareRow({ row, index, last }) {
  const { c, type, isDark } = useStoreTheme();
  return (
    <Stagger index={index} distance={14} scaleFrom={1} style={[styles.row, !last && { borderBottomColor: c.line, borderBottomWidth: StyleSheet.hairlineWidth }]}>
      <Text style={[type.eyebrow(c.goldText, 9.5), styles.rowLabel]} numberOfLines={1}>
        {row.label}
      </Text>
      <View style={styles.cells}>
        <View style={[styles.cell, { backgroundColor: isDark ? withAlpha(c.brand, 0.14) : c.brandSoft }]}>
          <Ionicons name="checkmark-circle" size={18} color={c.brand} style={styles.mark} />
          <Text style={[type.ui(13.5, "bold", c.ink), styles.cellText]}>{row.ours}</Text>
        </View>
        <View style={[styles.cell, { backgroundColor: c.soft }]}>
          <Ionicons name="close-circle" size={18} color={withAlpha(c.danger, 0.7)} style={styles.mark} />
          <Text style={[type.ui(13.5, "medium", c.inkMute), styles.cellText]}>{row.ordinary}</Text>
        </View>
      </View>
    </Stagger>
  );
}

/**
 * “Ours vs ordinary” — a two-column comparison card. Copy and rows come from Admin → Home view → Compare section
 * (`resolveCompareDisplay`).
 */
export default function StoreCompare({ data }) {
  const { c, r, type, shadow, gutter } = useStoreTheme();
  const copy = STORE_HOME.compare;
  if (!data?.rows?.length) return null;

  return (
    <View style={styles.wrap}>
      <SectionHeader eyebrow={data.eyebrow} title={data.title} caption={data.subtitle} />
      <View style={{ paddingHorizontal: gutter }}>
        <View style={[styles.card, shadow.card, { backgroundColor: c.card, borderColor: c.line, borderRadius: r.xxl }]}>
          {data.openingLine ? (
            <Text style={[type.display(18, { color: c.goldText, ls: -0.2, lh: 22 }), styles.opening]}>{data.openingLine}</Text>
          ) : null}

          <View style={[styles.cells, styles.head]}>
            <View style={[styles.headPill, { backgroundColor: c.brand }]}>
              <MaterialCommunityIcons name="leaf" size={14} color={c.onBrand} />
              <Text style={type.ui(13, "extrabold", c.onBrand, { letterSpacing: 0.3 })} numberOfLines={1}>
                {data.oursLabel || copy.oursLabel}
              </Text>
            </View>
            <View style={[styles.headPill, { backgroundColor: c.soft }]}>
              <Text style={type.ui(13, "bold", c.inkMute, { letterSpacing: 0.3 })} numberOfLines={1}>
                {data.ordinaryLabel || copy.ordinaryLabel}
              </Text>
            </View>
          </View>

          {data.rows.map((row, i) => (
            <CompareRow key={row.id} row={row} index={i} last={i === data.rows.length - 1} />
          ))}

          {data.closingTagline ? (
            <View style={styles.closing}>
              <LinearGradient
                colors={[withAlpha(c.gold, 0), withAlpha(c.gold, 0.7), withAlpha(c.gold, 0)]}
                start={{ x: 0, y: 0.5 }}
                end={{ x: 1, y: 0.5 }}
                style={styles.rule}
              />
              <Text style={[type.ui(12.5, "semibold", c.goldText, { letterSpacing: 0.2 }), styles.tagline]}>{data.closingTagline}</Text>
            </View>
          ) : null}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 14 },
  card: { borderWidth: StyleSheet.hairlineWidth, paddingHorizontal: 14, paddingTop: 16, paddingBottom: 14, overflow: "hidden" },
  opening: { textAlign: "center", marginBottom: 12 },
  head: { marginBottom: 4 },
  headPill: { flex: 1, height: 36, borderRadius: 18, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6 },
  row: { paddingVertical: 12, gap: 8 },
  rowLabel: { paddingLeft: 2 },
  cells: { flexDirection: "row", gap: 8 },
  cell: { flex: 1, borderRadius: 16, paddingHorizontal: 10, paddingVertical: 10, gap: 6, minHeight: 74 },
  mark: { marginBottom: 1 },
  cellText: { lineHeight: 18 },
  closing: { marginTop: 8, alignItems: "center", gap: 10 },
  rule: { alignSelf: "stretch", height: 1.5 },
  tagline: { textAlign: "center", paddingHorizontal: 8 },
});
