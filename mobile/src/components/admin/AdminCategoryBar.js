import React, { useMemo } from "react";
import { StyleSheet, Text, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useTheme } from "../../context/ThemeContext";
import { ADMIN_FONT, getAdminChrome } from "../../theme/adminLayout";
import { ZEEVAN_GOLD, ZEEVAN_GREEN } from "../../theme/kankregWeb";

export default function AdminCategoryBar({ name, percent, meta }) {
  const { colors: c, isDark } = useTheme();
  const chrome = useMemo(() => getAdminChrome(c, isDark), [c, isDark]);
  const styles = useMemo(() => createStyles(chrome), [chrome]);
  const pct = Math.max(0, Math.min(100, Number(percent) || 0));

  return (
    <View style={styles.wrap}>
      <View style={styles.top}>
        <Text style={styles.name}>{name}</Text>
        <Text style={styles.pct}>{meta || `${pct}%`}</Text>
      </View>
      <View style={styles.track}>
        <LinearGradient
          colors={isDark ? [ZEEVAN_GOLD.bright, ZEEVAN_GREEN.leaf] : [ZEEVAN_GOLD.base, ZEEVAN_GREEN.deep]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={[styles.fill, { width: `${Math.max(pct, pct > 0 ? 6 : 0)}%` }]}
        />
      </View>
    </View>
  );
}

function createStyles(chrome) {
  return StyleSheet.create({
    wrap: { marginVertical: 8 },
    top: {
      flexDirection: "row",
      justifyContent: "space-between",
      marginBottom: 6,
    },
    name: {
      fontSize: 13,
      color: chrome.ink,
      fontFamily: ADMIN_FONT.medium,
    },
    pct: {
      fontSize: 13,
      color: chrome.inkSoft,
      fontFamily: ADMIN_FONT.semibold,
    },
    track: {
      height: 8,
      borderRadius: 999,
      backgroundColor: chrome.paper,
      overflow: "hidden",
    },
    fill: {
      height: 8,
      borderRadius: 999,
    },
  });
}
