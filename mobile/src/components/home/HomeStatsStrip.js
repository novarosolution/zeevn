import React from "react";
import { Platform, StyleSheet, Text, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { fonts, icon, layout, lineHeight, radius, spacing, typography } from "../../theme/tokens";
import { ALCHEMY } from "../../theme/customerAlchemy";
import { FONT_HEADING, FONT_PRICE } from "../../theme/typographyRoles";
import { HOME_STATS_STRIP } from "../../content/appContent";
import { useKankregLayout } from "../../theme/kankregBreakpoints";
import useInViewport from "../../hooks/useInViewport";
import useCountUp from "../../hooks/useCountUp";
import useReducedMotion from "../../hooks/useReducedMotion";
import useGsapReveal from "../../hooks/useGsapReveal";
import { platformShadow } from "../../theme/shadowPlatform";

const statsWrapShadow = platformShadow({
  ios: {
    shadowColor: "#3D2A12",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 18,
  },
  android: { elevation: 3 },
  web: {
    boxShadow:
      "0 14px 36px rgba(22, 69, 51, 0.07), 0 2px 10px rgba(28, 25, 23, 0.04), inset 0 1px 0 rgba(255, 255, 255, 0.94)",
  },
});

const styles = StyleSheet.create({
  wrap: {
    width: "100%",
    maxWidth: layout.maxContentWidth,
    alignSelf: "center",
    borderRadius: radius.xxl,
    borderWidth: StyleSheet.hairlineWidth,
    borderTopWidth: 2,
    borderTopColor: ALCHEMY.gold,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.xl,
    overflow: "hidden",
    ...statsWrapShadow,
  },
  overline: {
    fontSize: typography.overline + 1,
    fontFamily: fonts.extrabold,
    letterSpacing: 1.6,
    textTransform: "uppercase",
    textAlign: "center",
    marginBottom: spacing.md,
  },
  row: {
    flexDirection: "row",
    alignItems: "stretch",
    justifyContent: "space-between",
    width: "100%",
  },
  rowMobileWeb: {
    gap: spacing.xs,
  },
  divider: {
    width: StyleSheet.hairlineWidth,
    alignSelf: "stretch",
    marginVertical: spacing.xs,
  },
  cell: {
    flex: 1,
    alignItems: "center",
    paddingHorizontal: spacing.xs,
    gap: 6,
  },
  iconBadge: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: StyleSheet.hairlineWidth,
    marginBottom: 2,
  },
  statValue: {
    fontFamily: FONT_PRICE,
    fontSize: Platform.OS === "web" ? 30 : 26,
    lineHeight: Platform.OS === "web" ? 36 : 32,
    letterSpacing: -0.4,
    fontVariant: ["tabular-nums"],
  },
  statValueCompact: {
    fontSize: 22,
    lineHeight: 28,
  },
  dividerMobileWeb: {
    marginVertical: spacing.sm,
  },
  statLabel: {
    fontSize: typography.caption,
    lineHeight: lineHeight.caption,
    fontFamily: fonts.semibold,
    letterSpacing: 0.2,
    textAlign: "center",
  },
  peNone: {
    pointerEvents: "none",
  },
});

function formatStat(value, { precision = 0, prefix = "", suffix = "" }) {
  let n;
  if (precision > 0) {
    n = Number(value).toFixed(precision);
  } else if (value >= 1000) {
    const thousands = value / 1000;
    n = thousands >= 100 ? Math.round(thousands).toString() : thousands.toFixed(1).replace(/\.0$/, "");
    return `${prefix}${n}k${suffix}`;
  } else {
    n = Math.round(value).toString();
  }
  return `${prefix}${n}${suffix}`;
}

function StatCell({ item, active, reducedMotion, c, isDark, compact = false }) {
  const value = useCountUp({
    target: item.target,
    duration: 1500,
    active,
    reducedMotion,
    precision: item.precision || 0,
  });
  const display = formatStat(active ? value : 0, item);

  return (
    <View style={styles.cell}>
      <View
        style={[
          styles.iconBadge,
          {
            backgroundColor: isDark ? "rgba(31, 92, 71, 0.14)" : ALCHEMY.goldSoft,
            borderColor: isDark ? c.primaryBorder : "rgba(22, 69, 51, 0.12)",
          },
        ]}
      >
        <Ionicons
          name={item.icon}
          size={icon.sm + 2}
          color={isDark ? ALCHEMY.goldBright : ALCHEMY.brown}
        />
      </View>
      <Text
        style={[styles.statValue, compact && styles.statValueCompact, { color: c.textPrimary }]}
        numberOfLines={1}
      >
        {display}
      </Text>
      <Text style={[styles.statLabel, { color: c.textSecondary }]} numberOfLines={2}>
        {item.label}
      </Text>
    </View>
  );
}

export default function HomeStatsStrip({ c, isDark }) {
  const reduced = useReducedMotion();
  const { isMobileWeb } = useKankregLayout();
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
          borderColor: isDark ? "rgba(52, 211, 153, 0.22)" : "rgba(22, 69, 51, 0.14)",
          backgroundColor: isDark ? "rgba(28, 25, 23, 0.62)" : "rgba(255, 253, 249, 0.96)",
        },
      ]}
    >
      <LinearGradient
        colors={
          isDark
            ? ["rgba(31, 92, 71, 0.08)", "rgba(18, 16, 14, 0.32)", "rgba(8, 6, 5, 0.55)"]
            : ["rgba(255, 254, 252, 0.94)", "rgba(240, 248, 244, 0.55)", "rgba(255, 253, 249, 0.92)"]
        }
        locations={[0, 0.46, 1]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[StyleSheet.absoluteFillObject, styles.peNone, { borderRadius: radius.xxl }]}
      />
      <Text style={[styles.overline, { color: c.textMuted }]} numberOfLines={1}>
        {HOME_STATS_STRIP.overline}
      </Text>
      <View style={[styles.row, isMobileWeb && styles.rowMobileWeb]}>
        {HOME_STATS_STRIP.items.map((item, idx) => (
          <React.Fragment key={item.key}>
            {idx > 0 ? (
              <View
                style={[
                  styles.divider,
                  isMobileWeb && styles.dividerMobileWeb,
                  { backgroundColor: isDark ? "rgba(52, 211, 153, 0.28)" : "rgba(22, 69, 51, 0.16)" },
                ]}
              />
            ) : null}
            <StatCell item={item} active={inView} reducedMotion={reduced} c={c} isDark={isDark} compact={isMobileWeb} />
          </React.Fragment>
        ))}
      </View>
    </View>
  );
}
