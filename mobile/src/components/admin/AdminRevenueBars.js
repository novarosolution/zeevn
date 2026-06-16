import React, { useMemo } from "react";
import { StyleSheet, Text, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useTheme } from "../../context/ThemeContext";
import { getAdminChrome } from "../../theme/adminLayout";
import { fonts } from "../../theme/tokens";

export default function AdminRevenueBars({ labels = [], values = [], height = 160 }) {
  const { colors: c, isDark } = useTheme();
  const chrome = useMemo(() => getAdminChrome(c, isDark), [c, isDark]);
  const styles = useMemo(() => createStyles(chrome), [chrome]);
  const nums = values.map((v) => Math.max(0, Number(v) || 0));
  const max = Math.max(...nums, 1);
  const barColors = isDark ? ["#C4D088", "#5C6834"] : ["#DCAC74", "#244424"];

  return (
    <View style={[styles.chart, { height: height + 24 }]}>
      {nums.length ? (
        nums.map((v, i) => {
          const h = Math.max(6, Math.round((v / max) * height));
          return (
            <View key={`rev-bar-${i}`} style={styles.col}>
              <LinearGradient colors={barColors} style={[styles.bar, { height: h }]} />
              <Text style={styles.label} numberOfLines={1}>
                {labels[i] || ""}
              </Text>
            </View>
          );
        })
      ) : (
        <Text style={styles.empty}>No revenue data for this period</Text>
      )}
    </View>
  );
}

function createStyles(chrome) {
  return StyleSheet.create({
    chart: {
      flexDirection: "row",
      alignItems: "flex-end",
      gap: 8,
      paddingTop: 8,
      paddingHorizontal: 2,
    },
    col: {
      flex: 1,
      alignItems: "center",
      justifyContent: "flex-end",
    },
    bar: {
      width: "100%",
      borderTopLeftRadius: 6,
      borderTopRightRadius: 6,
      minHeight: 6,
    },
    label: {
      marginTop: 6,
      fontSize: 10,
      color: chrome.inkFaint,
      fontFamily: fonts.medium,
      textAlign: "center",
    },
    empty: {
      flex: 1,
      fontSize: 13,
      color: chrome.inkFaint,
      fontFamily: fonts.regular,
      paddingVertical: 24,
      textAlign: "center",
    },
  });
}
