import React, { useMemo } from "react";
import { StyleSheet, Text, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useTheme } from "../../context/ThemeContext";
import { getAdminChrome } from "../../theme/adminLayout";
import { fonts } from "../../theme/tokens";

export default function AdminCategoryBar({ name, percent }) {
  const { colors: c, isDark } = useTheme();
  const chrome = useMemo(() => getAdminChrome(c, isDark), [c, isDark]);
  const styles = useMemo(() => createStyles(chrome), [chrome]);
  const pct = Math.max(0, Math.min(100, Number(percent) || 0));

  return (
    <View style={styles.wrap}>
      <View style={styles.top}>
        <Text style={styles.name}>{name}</Text>
        <Text style={styles.pct}>{pct}%</Text>
      </View>
      <View style={styles.track}>
        <LinearGradient
          colors={isDark ? ["#C4D088", "#5C6834"] : ["#788844", "#244424"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={[styles.fill, { width: `${pct}%` }]}
        />
      </View>
    </View>
  );
}

function createStyles(chrome) {
  return StyleSheet.create({
    wrap: { marginVertical: 11 },
    top: {
      flexDirection: "row",
      justifyContent: "space-between",
      marginBottom: 5,
    },
    name: {
      fontSize: 12,
      color: chrome.inkSoft,
      fontFamily: fonts.medium,
    },
    pct: {
      fontSize: 12,
      color: chrome.ink,
      fontFamily: fonts.semibold,
    },
    track: {
      height: 6,
      borderRadius: 3,
      backgroundColor: chrome.paper,
      overflow: "hidden",
    },
    fill: {
      height: 6,
      borderRadius: 3,
    },
  });
}
