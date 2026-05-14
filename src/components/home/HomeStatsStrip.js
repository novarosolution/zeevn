import React from "react";
import { Platform, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { fonts, icon, layout, radius, spacing, typography } from "../../theme/tokens";
import { ALCHEMY, FONT_DISPLAY } from "../../theme/customerAlchemy";
import { HOME_STATS_STRIP } from "../../content/appContent";
import useInViewport from "../../hooks/useInViewport";
import useCountUp from "../../hooks/useCountUp";
import useReducedMotion from "../../hooks/useReducedMotion";
import useGsapReveal from "../../hooks/useGsapReveal";

function formatStat(value, { precision = 0, prefix = "", suffix = "" }) {
  let numberPart = "";
  let n;
  if (precision > 0) {
    n = Number(value).toFixed(precision);
    numberPart = n;
  } else if (value >= 1000) {
    const thousands = value / 1000;
    n = thousands >= 100 ? Math.round(thousands).toString() : thousands.toFixed(1).replace(/\.0$/, "");
    numberPart = `${n}k`;
  } else {
    n = Math.round(value).toString();
    numberPart = n;
  }
  return { prefix, number: numberPart, suffix };
}

function StatCell({ item, active, reducedMotion, c, isDark }) {
  const value = useCountUp({
    target: item.target,
    duration: 1200,
    active,
    reducedMotion,
    precision: item.precision || 0,
  });
  const display = formatStat(active ? value : 0, item);

  return (
    <View style={styles.cell}>
      <View style={styles.iconWrap}>
        <Ionicons name={item.icon} size={icon.md + 1} color={isDark ? c.textPrimary : ALCHEMY.brownMuted} />
      </View>
      <Text style={[styles.statValue, { color: c.textPrimary }]} numberOfLines={1} adjustsFontSizeToFit>
        {display.prefix}
        {display.number}
        {display.suffix ? <Text style={[styles.statSuffix, { color: c.textMuted }]}>{display.suffix}</Text> : null}
      </Text>
      <Text style={[styles.statLabel, { color: c.textSecondary }]} numberOfLines={2}>
        {item.label}
      </Text>
    </View>
  );
}

export default function HomeStatsStrip({ c, isDark }) {
  const reduced = useReducedMotion();
  const { ref: ioRef, inView } = useInViewport({ threshold: 0.35, once: true });
  const { ref: revealRef } = useGsapReveal({ preset: "fade-up", start: "top 90%", reducedMotion: reduced });

  const setRefs = (node) => {
    ioRef(node);
    revealRef(node);
  };

  return (
    <View
      ref={setRefs}
      style={[
        styles.wrap,
        {
          borderTopColor: isDark ? "rgba(255,255,255,0.16)" : "rgba(63, 63, 70, 0.18)",
          borderBottomColor: isDark ? "rgba(255,255,255,0.16)" : "rgba(63, 63, 70, 0.18)",
          backgroundColor: isDark ? "rgba(255,255,255,0.03)" : "rgba(255, 255, 255, 0.98)",
        },
      ]}
    >
      <Text style={[styles.overline, { color: c.textMuted }]} numberOfLines={1}>
        {HOME_STATS_STRIP.overline}
      </Text>
      <View style={styles.row}>
        {HOME_STATS_STRIP.items.map((item, idx) => (
          <React.Fragment key={item.key}>
            {idx > 0 ? (
              <View
                style={[
                  styles.divider,
                  { backgroundColor: isDark ? "rgba(220, 38, 38, 0.28)" : "rgba(63, 63, 70, 0.16)" },
                ]}
              />
            ) : null}
            <StatCell item={item} active={reduced ? true : inView} reducedMotion={reduced} c={c} isDark={isDark} />
          </React.Fragment>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    width: "100%",
    maxWidth: layout.maxContentWidth,
    alignSelf: "center",
    borderRadius: radius.xxl - 2,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderBottomWidth: StyleSheet.hairlineWidth,
    paddingVertical: spacing.lg + 2,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.xl,
  },
  overline: {
    fontSize: typography.overline,
    fontFamily: fonts.extrabold,
    letterSpacing: 1.4,
    textTransform: "uppercase",
    textAlign: "center",
    marginBottom: spacing.md + 2,
  },
  row: {
    flexDirection: "row",
    alignItems: "stretch",
    justifyContent: "space-between",
  },
  divider: {
    width: StyleSheet.hairlineWidth,
    alignSelf: "stretch",
    marginVertical: spacing.xs,
  },
  cell: {
    flex: 1,
    alignItems: "center",
    paddingHorizontal: spacing.xs + 2,
    gap: 5,
  },
  iconWrap: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 1,
  },
  statValue: {
    fontFamily: FONT_DISPLAY,
    fontSize: Platform.OS === "web" ? 32 : 28,
    lineHeight: Platform.OS === "web" ? 38 : 34,
    letterSpacing: -0.4,
    fontVariant: ["tabular-nums"],
    textAlign: "center",
  },
  statSuffix: {
    fontSize: 18,
    lineHeight: 22,
    fontFamily: fonts.medium,
    color: "rgba(113,113,122,0.95)",
  },
  statLabel: {
    fontSize: 13,
    lineHeight: 17,
    fontFamily: fonts.medium,
    letterSpacing: 0.2,
    textAlign: "center",
  },
});
