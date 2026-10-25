import React, { useMemo } from "react";
import { Platform, StyleSheet, Text, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useTheme } from "../../context/ThemeContext";
import { ADMIN_FONT, getAdminChrome } from "../../theme/adminLayout";
import { ZEEVAN_GOLD, ZEEVAN_GREEN } from "../../theme/kankregWeb";
import { formatINR, formatINRCompact } from "../../utils/currency";

export default function AdminRevenueBars({ labels = [], values = [], height = 196 }) {
  const { colors: c, isDark } = useTheme();
  const chrome = useMemo(() => getAdminChrome(c, isDark), [c, isDark]);
  const styles = useMemo(() => createStyles(chrome), [chrome]);
  const nums = values.map((v) => Math.max(0, Number(v) || 0));
  const max = Math.max(...nums, 1);
  const peak = nums.reduce((i, v, idx) => (v > nums[i] ? idx : i), 0);
  const peakColors = isDark
    ? [ZEEVAN_GOLD.bright, ZEEVAN_GREEN.leaf]
    : [ZEEVAN_GOLD.base, ZEEVAN_GREEN.deep];
  const calmColors = isDark ? ["#7A8A4A", "#3C4A28"] : ["#C9BE8E", ZEEVAN_GREEN.base];
  const plotH = height - 8;

  if (!nums.length) {
    return <Text style={styles.empty}>No revenue in this period</Text>;
  }

  const ticks = [max, max / 2, 0];

  return (
    <View style={styles.well}>
      <View style={styles.chart}>
        <View style={[styles.yAxis, { height: plotH }]}>
          {ticks.map((tick) => (
            <Text key={`y-${tick}`} style={styles.yLabel}>
              {tick === 0 ? "0" : formatINRCompact(tick)}
            </Text>
          ))}
        </View>
        <View style={styles.plotWrap}>
          <View style={[styles.plot, { height: plotH }]} accessibilityRole="image" accessibilityLabel="Revenue by day">
            {ticks.map((tick) => (
              <View key={`g-${tick}`} style={[styles.grid, { top: tick === 0 ? plotH - 1 : plotH * (1 - tick / max) }]} />
            ))}
            <View style={styles.row}>
              {nums.map((v, i) => {
                const hot = i === peak && v > 0;
                const h = v > 0 ? Math.max(16, Math.round((v / max) * (plotH - 22))) : 4;
                const showValue = hot || (v > 0 && v / max >= 0.28);
                return (
                  <View
                    key={`rev-bar-${i}`}
                    style={styles.col}
                    {...(Platform.OS === "web" ? { title: `${labels[i] || ""} · ${formatINR(v)}` } : null)}
                    accessibilityLabel={`${labels[i] || "Day"} ${formatINR(v)}`}
                  >
                    {showValue ? (
                      <Text style={[styles.value, hot && styles.valueHot]} numberOfLines={1}>
                        {formatINRCompact(v)}
                      </Text>
                    ) : (
                      <View style={styles.valueSlot} />
                    )}
                    {v > 0 ? (
                      <LinearGradient
                        colors={hot ? peakColors : calmColors}
                        style={[styles.bar, { height: h }, hot && styles.barHot]}
                      />
                    ) : (
                      <View style={styles.tick} />
                    )}
                  </View>
                );
              })}
            </View>
          </View>
          <View style={styles.axis}>
            {nums.map((_, i) => (
              <Text key={`rev-lbl-${i}`} style={[styles.label, i === peak && styles.labelHot]} numberOfLines={1}>
                {labels[i] || ""}
              </Text>
            ))}
          </View>
        </View>
      </View>
      {nums[peak] > 0 ? (
        <Text style={styles.caption}>
          Best day · {labels[peak] || "—"} · {formatINR(nums[peak])}
        </Text>
      ) : null}
    </View>
  );
}

function createStyles(chrome) {
  return StyleSheet.create({
    well: {
      borderRadius: 16,
      backgroundColor: chrome.paper,
      paddingTop: 16,
      paddingBottom: 12,
      paddingHorizontal: 12,
    },
    chart: { flexDirection: "row", alignItems: "stretch", gap: 8 },
    yAxis: { width: 40, justifyContent: "space-between", alignItems: "flex-end", paddingBottom: 4 },
    yLabel: {
      fontSize: 10,
      lineHeight: 12,
      color: chrome.inkFaint,
      fontFamily: ADMIN_FONT.medium,
    },
    plotWrap: { flex: 1, minWidth: 0 },
    plot: { position: "relative", justifyContent: "flex-end" },
    grid: {
      position: "absolute",
      left: 0,
      right: 0,
      height: StyleSheet.hairlineWidth,
      backgroundColor: chrome.line,
    },
    row: {
      ...StyleSheet.absoluteFillObject,
      flexDirection: "row",
      alignItems: "flex-end",
      justifyContent: "space-around",
      gap: 4,
    },
    col: {
      flex: 1,
      maxWidth: 40,
      alignItems: "center",
      justifyContent: "flex-end",
      gap: 5,
      ...Platform.select({ web: { cursor: "default" }, default: {} }),
    },
    value: {
      fontSize: 10,
      lineHeight: 12,
      color: chrome.inkSoft,
      fontFamily: ADMIN_FONT.semibold,
    },
    valueHot: { color: chrome.ink },
    valueSlot: { height: 12 },
    bar: {
      width: 18,
      borderTopLeftRadius: 7,
      borderTopRightRadius: 7,
      borderBottomLeftRadius: 2,
      borderBottomRightRadius: 2,
    },
    barHot: {
      width: 20,
      ...Platform.select({
        web: { boxShadow: "0 8px 16px -8px rgba(31, 51, 31, 0.4)" },
        default: {},
      }),
    },
    tick: {
      width: 10,
      height: 4,
      borderRadius: 2,
      backgroundColor: chrome.line,
    },
    axis: {
      flexDirection: "row",
      justifyContent: "space-around",
      gap: 4,
      marginTop: 8,
    },
    label: {
      flex: 1,
      maxWidth: 40,
      fontSize: 10,
      color: chrome.inkFaint,
      fontFamily: ADMIN_FONT.medium,
      textAlign: "center",
    },
    labelHot: { color: chrome.ink, fontFamily: ADMIN_FONT.semibold },
    caption: {
      marginTop: 12,
      fontSize: 12,
      color: chrome.inkSoft,
      fontFamily: ADMIN_FONT.medium,
    },
    empty: {
      fontSize: 13,
      color: chrome.inkSoft,
      fontFamily: ADMIN_FONT.medium,
      paddingVertical: 28,
      textAlign: "center",
    },
  });
}
