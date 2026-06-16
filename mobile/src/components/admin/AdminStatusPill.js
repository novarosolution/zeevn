import React, { useMemo } from "react";
import { StyleSheet, Text, View } from "react-native";
import { useTheme } from "../../context/ThemeContext";
import { fonts } from "../../theme/tokens";

function buildTones(c, isDark) {
  return {
    paid: {
      bg: isDark ? "rgba(74, 222, 128, 0.14)" : "rgba(60,98,72,0.13)",
      color: c.success,
    },
    ok: {
      bg: isDark ? "rgba(74, 222, 128, 0.14)" : "rgba(60,98,72,0.13)",
      color: c.success,
    },
    pend: {
      bg: isDark ? "rgba(52, 211, 153, 0.16)" : "rgba(169,119,46,0.15)",
      color: c.primaryDark,
    },
    soon: {
      bg: isDark ? "rgba(52, 211, 153, 0.2)" : "rgba(52, 211, 153, 0.22)",
      color: c.primaryBright,
    },
    cancel: {
      bg: isDark ? "rgba(248, 113, 113, 0.14)" : "rgba(168,68,47,0.12)",
      color: c.danger,
    },
    low: {
      bg: isDark ? "rgba(248, 113, 113, 0.14)" : "rgba(168,68,47,0.12)",
      color: c.danger,
    },
  };
}

export function orderStatusTone(status) {
  const s = String(status || "").toLowerCase();
  if (s === "delivered" || s === "paid") return "paid";
  if (s === "cancelled") return "cancel";
  return "pend";
}

export default function AdminStatusPill({ label, tone = "pend", style }) {
  const { colors: c, isDark } = useTheme();
  const palette = useMemo(() => buildTones(c, isDark)[tone] || buildTones(c, isDark).pend, [c, isDark, tone]);

  return (
    <View style={[styles.pill, { backgroundColor: palette.bg }, style]}>
      <Text style={[styles.text, { color: palette.color }]} numberOfLines={1}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    alignSelf: "flex-start",
    paddingHorizontal: 9,
    paddingVertical: 3,
    borderRadius: 999,
  },
  text: {
    fontSize: 10,
    fontFamily: fonts.semibold,
  },
});
