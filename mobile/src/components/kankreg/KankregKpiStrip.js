import React from "react";
import { Platform, Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useTheme } from "../../context/ThemeContext";
import { ALCHEMY } from "../../theme/customerAlchemy";
import { FONT_PRICE } from "../../theme/typographyRoles";
import { getKankregSurfaces, KANKREG_PALETTE } from "../../theme/kankregWeb";
import { useKankregLayout } from "../../theme/kankregBreakpoints";
import { fonts, icon, spacing } from "../../theme/tokens";
import { platformShadow } from "../../theme/shadowPlatform";
import SectionReveal from "../motion/SectionReveal";

const KPI_META = {
  orders: { icon: "bag-handle-outline", accent: KANKREG_PALETTE.greenDeep },
  saved: { icon: "wallet-outline", accent: ALCHEMY.goldDeep },
  points: { icon: "star", accent: ALCHEMY.goldBright },
};

const cardShadow = platformShadow({
  web: {
    boxShadow:
      "0 12px 28px rgba(22, 69, 51, 0.08), inset 0 1px 0 rgba(255,255,255,0.94)",
  },
  ios: {
    shadowColor: "#19140f",
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
  },
  android: { elevation: 3 },
});

/** kankreg.html `.kpis` row on profile (Orders / Saved / Points). */
export default function KankregKpiStrip({ items = [] }) {
  const { colors: c, isDark } = useTheme();
  const surfaces = getKankregSurfaces(isDark, c);
  const { isXs, isMobileWeb } = useKankregLayout();
  const stackVertically = isXs && !isMobileWeb;
  const compact = isXs || isMobileWeb;

  return (
    <View style={[styles.row, stackVertically ? styles.rowStack : styles.rowInline]}>
      {items.map((item, idx) => {
        const meta = KPI_META[item.key] || KPI_META.orders;
        return (
          <SectionReveal
            key={item.key}
            index={idx}
            preset="fade-up"
            delay={idx * 45}
            style={stackVertically ? styles.cellStack : styles.cellInline}
          >
            <Pressable
              onPress={item.onPress}
              disabled={!item.onPress}
              style={({ pressed, hovered }) => [
                styles.kpi,
                stackVertically ? styles.kpiStacked : styles.kpiInline,
                compact && styles.kpiCompact,
                {
                  backgroundColor: isDark ? c.surfaceElevated || c.surface : KANKREG_PALETTE.card,
                  borderColor: surfaces.border,
                },
                (pressed || (Platform.OS === "web" && hovered)) && item.onPress ? styles.kpiPressed : null,
              ]}
              accessibilityRole={item.onPress ? "button" : "text"}
            >
              <LinearGradient
                colors={[meta.accent, ALCHEMY.gold, meta.accent]}
                start={{ x: 0, y: 0.5 }}
                end={{ x: 1, y: 0.5 }}
                style={styles.kpiAccent}
                pointerEvents="none"
              />
              <View style={[styles.kpiIconWrap, isDark && styles.kpiIconWrapDark]}>
                <Ionicons
                  name={meta.icon}
                  size={compact ? icon.sm : icon.sm + 1}
                  color={isDark ? ALCHEMY.goldBright : meta.accent}
                />
              </View>
              <Text style={[styles.lbl, { color: surfaces.textMuted }]}>{item.label}</Text>
              <Text
                style={[
                  styles.n,
                  compact && styles.nCompact,
                  { color: surfaces.text },
                ]}
                numberOfLines={1}
                adjustsFontSizeToFit
                minimumFontScale={0.75}
              >
                {item.value}
              </Text>
            </Pressable>
          </SectionReveal>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    width: "100%",
    alignSelf: "stretch",
    gap: spacing.sm + 4,
    marginBottom: spacing.lg,
  },
  rowInline: {
    flexDirection: "row",
    alignItems: "stretch",
  },
  rowStack: {
    flexDirection: "column",
  },
  cellInline: {
    flex: 1,
    minWidth: 0,
  },
  cellStack: {
    width: "100%",
    alignSelf: "stretch",
  },
  kpi: {
    padding: spacing.md + 2,
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: "hidden",
    ...cardShadow,
    ...Platform.select({ web: { cursor: "pointer" }, default: {} }),
  },
  kpiCompact: {
    padding: spacing.md,
    minHeight: 96,
  },
  kpiInline: {
    flex: 1,
    minWidth: 0,
    minHeight: 104,
  },
  kpiStacked: {
    width: "100%",
    alignSelf: "stretch",
  },
  kpiPressed: {
    opacity: 0.94,
    transform: [{ scale: 0.985 }],
  },
  kpiAccent: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 2,
    opacity: 0.9,
  },
  kpiIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(31, 92, 71, 0.08)",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(31, 92, 71, 0.14)",
    marginBottom: spacing.sm,
  },
  kpiIconWrapDark: {
    backgroundColor: "rgba(52, 211, 153, 0.1)",
    borderColor: "rgba(52, 211, 153, 0.18)",
  },
  lbl: {
    fontSize: 10.5,
    fontFamily: fonts.bold,
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },
  n: {
    fontFamily: FONT_PRICE,
    fontSize: 28,
    fontWeight: "600",
    marginTop: spacing.xs + 2,
    letterSpacing: -0.4,
  },
  nCompact: {
    fontSize: 24,
    marginTop: spacing.xs,
  },
});
