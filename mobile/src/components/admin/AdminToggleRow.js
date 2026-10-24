import React, { useMemo } from "react";
import { StyleSheet, Switch, Text, View } from "react-native";
import { useTheme } from "../../context/ThemeContext";
import { getAdminChrome } from "../../theme/adminLayout";
import { fonts } from "../../theme/tokens";

export default function AdminToggleRow({ title, subtitle, value, onValueChange, isLast }) {
  const { colors: c, isDark } = useTheme();
  const chrome = useMemo(() => getAdminChrome(c, isDark), [c, isDark]);
  const styles = useMemo(() => createStyles(chrome), [chrome]);

  return (
    <View style={[styles.row, isLast && styles.rowLast]}>
      <View style={styles.textCol}>
        <Text style={styles.title}>{title}</Text>
        {subtitle ? <Text style={styles.sub}>{subtitle}</Text> : null}
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{ false: chrome.line, true: chrome.tabOnBg }}
        thumbColor="#fff"
      />
    </View>
  );
}

function createStyles(chrome) {
  return StyleSheet.create({
    row: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: chrome.line,
    },
    rowLast: { borderBottomWidth: 0 },
    textCol: { flex: 1, paddingRight: 12 },
    title: {
      fontSize: 13,
      fontFamily: fonts.semibold,
      color: chrome.ink,
    },
    sub: {
      fontSize: 11,
      color: chrome.inkFaint,
      marginTop: 2,
      fontFamily: fonts.regular,
    },
  });
}
