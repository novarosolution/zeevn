import React, { memo, useMemo } from "react";
import { StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useStoreTheme, withAlpha } from "../../../theme/storefront";
import { buildOrderTimeline } from "../../../utils/orderInsights";
import PremiumBoundary from "./PremiumBoundary";

const DOT = 22;

function Dot({ state }) {
  const { c, isDark } = useStoreTheme();
  if (state === "done") {
    return (
      <View style={[styles.dot, { backgroundColor: c.brand }]}>
        <Ionicons name="checkmark" size={14} color={c.onBrand} />
      </View>
    );
  }
  if (state === "active") {
    return (
      <View style={[styles.dotHalo, { backgroundColor: withAlpha(c.gold, isDark ? 0.28 : 0.32) }]}>
        <View style={[styles.dotActive, { backgroundColor: c.gold, borderColor: c.card }]} />
      </View>
    );
  }
  if (state === "skipped") {
    return (
      <View style={[styles.dot, { backgroundColor: c.softStrong }]}>
        <Ionicons name="close" size={12} color={c.inkMute} />
      </View>
    );
  }
  return <View style={[styles.dot, { backgroundColor: c.card, borderWidth: 2, borderColor: c.lineStrong }]} />;
}

/**
 * Vertical timeline of an order's journey (placed → confirmed → preparing → ready → on the way → delivered). Finished
 * steps are olive ticks, the current one a glowing gold dot, the rest hollow; times show where the order recorded them.
 *
 * props: order, style
 */
function OrderTimelineBase({ order, style }) {
  const { c, type } = useStoreTheme();
  const steps = useMemo(() => buildOrderTimeline(order), [order]);
  if (!steps.length) return null;

  return (
    <View style={style} accessibilityRole="list" accessibilityLabel="Order progress">
      {steps.map((step, i) => {
        const last = i === steps.length - 1;
        const next = steps[i + 1];
        const lineDone = step.state === "done" && next && (next.state === "done" || next.state === "active");
        return (
          <View key={step.key} style={styles.row} accessible accessibilityLabel={`${step.title}, ${step.state === "done" ? "done" : step.state === "active" ? "current" : "pending"}${step.at ? `, ${step.at}` : ""}`}>
            <View style={styles.rail}>
              <Dot state={step.state} />
              {last ? null : <View style={[styles.line, { backgroundColor: lineDone ? c.brand : c.softStrong }]} />}
            </View>
            <View style={[styles.text, !last && styles.textGap]}>
              <Text style={type.ui(14.5, step.state === "active" ? "extrabold" : "semibold", step.state === "todo" || step.state === "skipped" ? c.inkMute : c.ink)}>
                {step.title}
              </Text>
              <Text style={type.ui(12.5, "medium", step.state === "active" ? c.goldText : c.inkMute)}>
                {step.at || (step.state === "active" ? step.subtitle : step.state === "todo" ? step.subtitle : "")}
              </Text>
            </View>
          </View>
        );
      })}
    </View>
  );
}

const Memo = memo(OrderTimelineBase);

export default function OrderTimeline(props) {
  return (
    <PremiumBoundary name="OrderTimeline">
      <Memo {...props} />
    </PremiumBoundary>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", gap: 14 },
  rail: { width: DOT + 8, alignItems: "center" },
  line: { width: 2, flex: 1, marginTop: 2, marginBottom: 2, borderRadius: 1 },
  dot: { width: DOT, height: DOT, borderRadius: DOT / 2, alignItems: "center", justifyContent: "center" },
  dotHalo: { width: DOT + 8, height: DOT + 8, borderRadius: (DOT + 8) / 2, alignItems: "center", justifyContent: "center", marginTop: -4 },
  dotActive: { width: DOT - 4, height: DOT - 4, borderRadius: (DOT - 4) / 2, borderWidth: 3 },
  text: { flex: 1, minWidth: 0, gap: 1 },
  textGap: { paddingBottom: 16 },
});
