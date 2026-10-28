import React, { useMemo } from "react";
import { StyleSheet, Text, View } from "react-native";
import { useTheme } from "../../context/ThemeContext";
import { ADMIN_FONT } from "../../theme/adminLayout";
import { getAdminTone } from "../../theme/adminTones";

function toneFor(name) {
  if (name === "paid" || name === "ok") return "green";
  if (name === "cancel" || name === "low") return "red";
  if (name === "soon") return "teal";
  return "gold";
}

export function orderStatusTone(status) {
  const s = String(status || "").toLowerCase();
  if (s === "delivered" || s === "paid") return "paid";
  if (s === "cancelled") return "cancel";
  return "pend";
}

export default function AdminStatusPill({ label, tone = "pend", style }) {
  const { isDark } = useTheme();
  const palette = useMemo(() => getAdminTone(toneFor(tone), isDark), [isDark, tone]);

  return (
    <View style={[styles.pill, { backgroundColor: palette.bg, borderColor: palette.border }, style]}>
      <View style={[styles.dot, { backgroundColor: palette.solid }]} />
      <Text style={[styles.text, { color: palette.fg }]} numberOfLines={1}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  dot: { width: 5, height: 5, borderRadius: 3 },
  pill: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth,
  },
  text: {
    fontSize: 10.5,
    fontFamily: ADMIN_FONT.semibold,
    letterSpacing: 0.2,
  },
});
