/**
 * Building blocks shared by the premium website Home sections: gold eyebrow, serif title, section head and a pill link.
 * Web-home only — the editorial primitives in `./editorial` (used by many other screens) are left alone.
 */
import React from "react";
import { Platform, Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../context/ThemeContext";
import { useKankregLayout } from "../../theme/kankregBreakpoints";
import { WP, webTitleSize } from "../../theme/webPremium";
import { FONT_HEADING } from "../../theme/typographyRoles";
import { fonts } from "../../theme/tokens";
import { ensureWebPremiumCss } from "../../utils/webPremiumCss";

if (Platform.OS === "web") ensureWebPremiumCss();

/** A short gold rule and a letter-spaced label; `align="center"` puts a rule on both sides. */
export function WebEyebrow({ children, align = "left", onDark = false, style }) {
  const { isDark } = useTheme();
  const label = String(children ?? "").trim();
  if (!label) return null;
  const color = onDark || isDark ? WP.gold.bright : WP.gold.deep;
  return (
    <View style={[styles.eyebrowRow, align === "center" && styles.eyebrowCenter, style]}>
      <View style={[styles.rule, { backgroundColor: color }]} />
      <Text style={[styles.eyebrow, { color }]} numberOfLines={1}>
        {label.toUpperCase()}
      </Text>
      {align === "center" ? <View style={[styles.rule, { backgroundColor: color }]} /> : null}
    </View>
  );
}

export function WebSectionTitle({ children, align = "left", onDark = false, size, style, numberOfLines = 3 }) {
  const { isDark } = useTheme();
  const { width } = useKankregLayout();
  const fontSize = size || webTitleSize(width);
  const color = onDark || isDark ? WP.cream : WP.ink;
  return (
    <Text
      accessibilityRole="header"
      numberOfLines={numberOfLines}
      style={[
        styles.title,
        { fontSize, lineHeight: Math.round(fontSize * 1.1), letterSpacing: -fontSize * 0.018, color },
        align === "center" && styles.center,
        style,
      ]}
    >
      {children}
    </Text>
  );
}

/** Eyebrow + title (+ kicker) on the left, optional action (e.g. a pill link) on the right. */
export function WebSectionHead({ eyebrow, title, kicker, action, align = "left", onDark = false, style }) {
  const { isDark } = useTheme();
  const centered = align === "center";
  const kickerColor = onDark || isDark ? "rgba(250, 248, 244, 0.72)" : WP.inkSoft;
  return (
    <View style={[styles.head, centered && styles.headCenter, style]}>
      <View style={centered ? styles.headCopyCenter : styles.headCopy}>
        <WebEyebrow align={align} onDark={onDark}>
          {eyebrow}
        </WebEyebrow>
        <WebSectionTitle align={align} onDark={onDark}>
          {title}
        </WebSectionTitle>
        {kicker ? (
          <Text style={[styles.kicker, { color: kickerColor }, centered && styles.center]}>{kicker}</Text>
        ) : null}
      </View>
      {action && !centered ? <View style={styles.headAction}>{action}</View> : null}
    </View>
  );
}

/** Outlined pill with an arrow that nudges on hover; `filled` makes it a solid brand-green pill. */
export function WebPillLink({ label, onPress, onDark = false, filled = false, accessibilityLabel }) {
  const { isDark } = useTheme();
  const light = onDark || isDark;
  return (
    <Pressable
      onPress={onPress}
      className={filled ? "zv-btn" : "zv-link"}
      accessibilityRole="link"
      accessibilityLabel={accessibilityLabel || label}
      style={({ hovered }) => [
        styles.pill,
        filled
          ? styles.pillFilled
          : { borderColor: light ? "rgba(250,248,244,0.5)" : WP.green.deep },
        !filled && hovered ? { backgroundColor: light ? "rgba(250,248,244,0.12)" : "rgba(31,51,31,0.06)" } : null,
      ]}
    >
      <Text style={[styles.pillText, { color: filled ? "#FFFFFF" : light ? WP.cream : WP.green.deep }]}>{label}</Text>
      <View className="zv-link-arrow">
        <Ionicons name="arrow-forward" size={16} color={filled ? "#FFFFFF" : light ? WP.cream : WP.green.deep} />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  eyebrowRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  eyebrowCenter: { alignSelf: "center", justifyContent: "center" },
  rule: { width: 34, height: 1 },
  eyebrow: { fontFamily: fonts.bold, fontSize: 12.5, letterSpacing: 3 },
  title: { fontFamily: FONT_HEADING },
  center: { textAlign: "center", alignSelf: "center" },
  head: {
    width: "100%",
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    gap: 24,
  },
  headCenter: { justifyContent: "center" },
  headCopy: { flex: 1, minWidth: 0, gap: 14, alignItems: "flex-start" },
  headCopyCenter: { minWidth: 0, maxWidth: 900, gap: 14, alignItems: "center" },
  headAction: { flexShrink: 0, paddingBottom: 6 },
  kicker: { fontFamily: fonts.regular, fontSize: 16.5, lineHeight: 26, maxWidth: 620 },
  pill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 22,
    borderRadius: WP.radius.pill,
    borderWidth: 1.5,
    ...Platform.select({ web: { cursor: "pointer", transition: "background-color 0.25s ease" }, default: {} }),
  },
  pillFilled: {
    borderWidth: 0,
    paddingVertical: 13.5,
    ...Platform.select({
      web: { backgroundImage: WP.gradient.green, boxShadow: WP.shadow.green },
      default: { backgroundColor: WP.green.deep },
    }),
  },
  pillText: { fontFamily: fonts.bold, fontSize: 14, letterSpacing: 0.3 },
});
