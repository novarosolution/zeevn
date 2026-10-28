import React, { useMemo } from "react";
import { Platform, StyleSheet, Text, View } from "react-native";
import { ADMIN_FONT, useAdminChrome } from "../../theme/adminLayout";
import { useTheme } from "../../context/ThemeContext";
import AdminButton from "./AdminButton";

function greeting(date = new Date()) {
  const hour = date.getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

/**
 * Top of the dashboard: who is signed in, today in one line, and the four things an owner reaches for most.
 * `stats` is a short list of { label, value } shown as a quiet strip under the greeting.
 */
export default function AdminWelcomeBand({ name, stats = [], actions = [], compact = false }) {
  const chrome = useAdminChrome();
  const { isDark } = useTheme();
  const styles = useMemo(() => createStyles(chrome, isDark, compact), [chrome, isDark, compact]);
  const first = String(name || "").trim().split(/\s+/)[0] || "there";
  const today = new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long" });

  return (
    <View style={styles.band} accessibilityRole="header">
      <View style={styles.main}>
        <Text style={styles.date}>{today}</Text>
        <Text style={styles.hello}>
          {greeting()}, {first}
        </Text>
        {stats.length ? (
          <View style={styles.stats}>
            {stats.map((item, index) => (
              <View key={item.label} style={[styles.stat, index > 0 && styles.statDivided]}>
                <Text style={styles.statValue}>{item.value}</Text>
                <Text style={styles.statLabel}>{item.label}</Text>
              </View>
            ))}
          </View>
        ) : null}
      </View>
      {actions.length ? (
        <View style={styles.actions}>
          {actions.map((action) => (
            <AdminButton
              key={action.label}
              label={action.label}
              icon={action.icon}
              variant={action.primary ? "primary" : "secondary"}
              size="md"
              onPress={action.onPress}
            />
          ))}
        </View>
      ) : null}
    </View>
  );
}

function createStyles(chrome, isDark, compact) {
  return StyleSheet.create({
    band: {
      flexDirection: compact ? "column" : "row",
      alignItems: compact ? "stretch" : "center",
      justifyContent: "space-between",
      gap: compact ? 16 : 24,
      padding: compact ? 18 : 24,
      marginBottom: 16,
      borderRadius: 18,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: isDark ? chrome.line : "rgba(184, 136, 76, 0.28)",
      backgroundColor: isDark ? chrome.card : "#FBF7EE",
      ...Platform.select({
        web: {
          backgroundImage: isDark
            ? "none"
            : "linear-gradient(120deg, #FBF7EE 0%, #F6EFDD 55%, #F1E6C9 100%)",
          boxShadow: "0 1px 1px rgba(31,51,31,.04), 0 18px 36px -26px rgba(122,92,42,.35)",
        },
        default: {},
      }),
    },
    main: { flexShrink: 1, minWidth: 0 },
    date: {
      fontSize: 11.5,
      letterSpacing: 0.8,
      textTransform: "uppercase",
      color: chrome.goldDeep,
      fontFamily: ADMIN_FONT.semibold,
    },
    hello: {
      marginTop: 4,
      fontSize: compact ? 22 : 26,
      letterSpacing: -0.5,
      color: chrome.ink,
      fontFamily: ADMIN_FONT.semibold,
      fontWeight: "600",
    },
    stats: { flexDirection: "row", flexWrap: "wrap", marginTop: 14, rowGap: 8 },
    stat: { paddingRight: 18 },
    statDivided: {
      paddingLeft: 18,
      borderLeftWidth: StyleSheet.hairlineWidth,
      borderLeftColor: chrome.line,
    },
    statValue: {
      fontSize: 18,
      color: chrome.ink,
      fontFamily: ADMIN_FONT.bold,
      fontWeight: "600",
      letterSpacing: -0.3,
      fontVariant: ["tabular-nums"],
    },
    statLabel: { marginTop: 1, fontSize: 11.5, color: chrome.inkSoft, fontFamily: ADMIN_FONT.regular },
    actions: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 8,
      justifyContent: compact ? "flex-start" : "flex-end",
      flexShrink: 0,
      maxWidth: compact ? "100%" : 420,
    },
  });
}
