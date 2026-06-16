import React, { useMemo } from "react";
import { StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { SHOP_SCREEN_UI } from "../../content/shopPageContent";
import { useTheme } from "../../context/ThemeContext";
import { getShopTheme } from "../../theme/shopTheme";
import { FONT_HEADING } from "../../theme/typographyRoles";
import { COMING_SOON_RED } from "../../theme/comingSoonTheme";
import { fonts, icon, radius, spacing, typography } from "../../theme/tokens";

function StatChip({ label, value, tone = "default", compact }) {
  const { isDark } = useTheme();
  const t = getShopTheme(isDark);
  const isSoon = tone === "soon";

  return (
    <View
      style={[
        styles.chip,
        compact && styles.chipCompact,
        {
          backgroundColor: isSoon ? "rgba(254, 242, 242, 0.72)" : t.surfaceChip,
          borderColor: isSoon ? COMING_SOON_RED.cardBorder : t.border,
        },
        isDark && isSoon && styles.chipSoonDark,
      ]}
    >
      <Text style={[styles.chipValue, compact && styles.chipValueCompact, { color: isSoon ? COMING_SOON_RED.mid : t.text }]}>
        {value}
      </Text>
      <Text style={[styles.chipLabel, { color: isSoon ? COMING_SOON_RED.deep : t.textMuted }]} numberOfLines={1}>
        {label}
      </Text>
    </View>
  );
}

/** Premium catalog summary — lean stats bar by default. */
export default function ShopCatalogHero({ summary, compact = false }) {
  const { isDark } = useTheme();
  const t = getShopTheme(isDark);
  const copy = SHOP_SCREEN_UI.hero;
  const layout = SHOP_SCREEN_UI.layout || {};
  const lean = layout.premiumLean !== false;
  const s = summary || { total: 0, inStock: 0, comingSoon: 0, onSale: 0 };
  const badges = useMemo(() => SHOP_SCREEN_UI.trustBadges || [], []);
  const showTitle = !lean && layout.showHeroTitle !== false && copy.title;
  const showBody = !lean && layout.showHeroBody !== false && copy.body;
  const showBadges = badges.length && !compact && !lean;

  return (
    <View style={[styles.wrap, compact && styles.wrapCompact, lean && styles.wrapLean, { borderColor: t.border }, t.cardShadow]}>
      <LinearGradient
        colors={
          isDark
            ? ["rgba(52, 211, 153, 0.1)", "rgba(28, 25, 23, 0.98)"]
            : ["rgba(240, 248, 244, 0.98)", "rgba(255, 255, 255, 0.92)"]
        }
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFillObject}
      />
      <LinearGradient
        colors={isDark ? [t.accent, "rgba(31, 92, 71, 0.15)", "transparent"] : [t.accent, "rgba(31, 92, 71, 0.08)", "transparent"]}
        start={{ x: 0, y: 0.5 }}
        end={{ x: 1, y: 0.5 }}
        style={styles.topAccent}
      />

      {(showTitle || (copy.eyebrow && !lean)) ? (
        <View style={styles.headCopy}>
          {copy.eyebrow && !lean ? (
            <Text style={[styles.eyebrow, { color: t.accent }]}>{copy.eyebrow}</Text>
          ) : null}
          {showTitle ? (
            <Text style={[styles.title, compact && styles.titleCompact, { color: t.text }]}>{copy.title}</Text>
          ) : null}
          {showBody ? (
            <Text style={[styles.body, { color: t.textMuted }]} numberOfLines={compact ? 2 : 3}>
              {copy.body}
            </Text>
          ) : null}
        </View>
      ) : null}

      <View style={[styles.statsRow, compact && styles.statsRowCompact, lean && styles.statsRowLean]}>
        <StatChip label={copy.totalLabel} value={s.total} compact={compact || lean} />
        <StatChip label={copy.inStockLabel} value={s.inStock} compact={compact || lean} />
        {s.comingSoon > 0 ? (
          <StatChip label={copy.comingSoonLabel} value={s.comingSoon} tone="soon" compact={compact || lean} />
        ) : null}
        {s.onSale > 0 ? <StatChip label={copy.onSaleLabel} value={s.onSale} compact={compact || lean} /> : null}
      </View>

      {showBadges ? (
        <View style={styles.trustRow}>
          {badges.map((b) => (
            <View key={b.label} style={[styles.trustBadge, { backgroundColor: t.surfaceMuted, borderColor: t.border }]}>
              <Ionicons name={b.icon || "checkmark-circle-outline"} size={icon.xs} color={t.accent} />
              <Text style={[styles.trustBadgeText, { color: t.textMuted }]}>{b.label}</Text>
            </View>
          ))}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    borderRadius: radius.lg + 2,
    borderWidth: StyleSheet.hairlineWidth,
    padding: spacing.md + 2,
    marginBottom: spacing.md,
    overflow: "hidden",
    gap: spacing.sm + 2,
  },
  wrapCompact: {
    padding: spacing.sm + 2,
    marginBottom: spacing.xs,
    borderRadius: radius.md,
  },
  wrapLean: {
    paddingVertical: spacing.sm + 2,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.sm,
    gap: spacing.xs,
  },
  topAccent: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 2,
  },
  headCopy: {
    gap: 4,
  },
  eyebrow: {
    fontFamily: fonts.semibold,
    fontSize: 10,
    letterSpacing: 1.2,
    textTransform: "uppercase",
  },
  title: {
    fontFamily: FONT_HEADING,
    fontSize: typography.h3,
    letterSpacing: -0.3,
    lineHeight: typography.h3 + 4,
  },
  titleCompact: {
    fontSize: typography.body + 2,
    lineHeight: 22,
  },
  body: {
    fontFamily: fonts.regular,
    fontSize: typography.bodySmall,
    lineHeight: 20,
    marginTop: 2,
  },
  statsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  statsRowCompact: {
    gap: spacing.xs,
  },
  statsRowLean: {
    gap: spacing.xs,
    marginTop: 0,
  },
  chip: {
    minWidth: 72,
    paddingVertical: spacing.xs + 4,
    paddingHorizontal: spacing.sm + 4,
    borderRadius: radius.md + 2,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: "center",
    gap: 2,
  },
  chipCompact: {
    minWidth: 56,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
  },
  chipSoonDark: {
    backgroundColor: "rgba(127, 29, 29, 0.28)",
    borderColor: COMING_SOON_RED.cardBorderDark,
  },
  chipValue: {
    fontFamily: fonts.bold,
    fontSize: typography.body + 1,
  },
  chipValueCompact: {
    fontSize: typography.bodySmall + 1,
  },
  chipLabel: {
    fontFamily: fonts.medium,
    fontSize: 9,
    letterSpacing: 0.4,
    textTransform: "uppercase",
    textAlign: "center",
  },
  trustRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.xs,
    marginTop: 2,
  },
  trustBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: radius.pill,
    borderWidth: StyleSheet.hairlineWidth,
  },
  trustBadgeText: {
    fontFamily: fonts.medium,
    fontSize: 11,
  },
});
