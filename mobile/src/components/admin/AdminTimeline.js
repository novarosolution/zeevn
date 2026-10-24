import React, { useMemo } from "react";
import { StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useAdminChrome } from "../../theme/adminLayout";
import { getAdminTone } from "../../theme/adminTones";
import { useTheme } from "../../context/ThemeContext";
import { fonts } from "../../theme/tokens";

/** Vertical history list. Items: `{ key, title, meta?, note?, tone?, icon? }`, oldest first. */
export default function AdminTimeline({ items = [], emptyText = "Nothing yet." }) {
  const chrome = useAdminChrome();
  const { isDark } = useTheme();
  const styles = useMemo(() => createStyles(chrome), [chrome]);

  if (!items.length) return <Text style={styles.empty}>{emptyText}</Text>;

  return (
    <View>
      {items.map((item, index) => {
        const t = getAdminTone(item.tone || "neutral", isDark);
        const last = index === items.length - 1;
        return (
          <View key={item.key ?? index} style={styles.row}>
            <View style={styles.rail}>
              <View style={[styles.dot, { backgroundColor: t.bg, borderColor: t.solid }]}>
                {item.icon ? <Ionicons name={item.icon} size={9} color={t.fg} /> : null}
              </View>
              {last ? null : <View style={styles.line} />}
            </View>
            <View style={[styles.copy, last && styles.copyLast]}>
              <View style={styles.titleRow}>
                <Text style={styles.title}>{item.title}</Text>
                {item.meta ? <Text style={styles.meta}>{item.meta}</Text> : null}
              </View>
              {item.note ? <Text style={styles.note}>{item.note}</Text> : null}
            </View>
          </View>
        );
      })}
    </View>
  );
}

function createStyles(chrome) {
  return StyleSheet.create({
    empty: { fontSize: 12.5, color: chrome.inkFaint, fontFamily: fonts.regular },
    row: { flexDirection: "row", gap: 12 },
    rail: { width: 16, alignItems: "center" },
    dot: { width: 16, height: 16, borderRadius: 8, borderWidth: 1.5, alignItems: "center", justifyContent: "center", marginTop: 1 },
    line: { flex: 1, width: 1.5, backgroundColor: chrome.line, marginVertical: 2 },
    copy: { flex: 1, minWidth: 0, paddingBottom: 14 },
    copyLast: { paddingBottom: 0 },
    titleRow: { flexDirection: "row", alignItems: "baseline", justifyContent: "space-between", gap: 10, flexWrap: "wrap" },
    title: { fontSize: 13, color: chrome.ink, fontFamily: fonts.semibold },
    meta: { fontSize: 11.5, color: chrome.inkFaint, fontFamily: fonts.regular },
    note: { marginTop: 2, fontSize: 12, lineHeight: 17, color: chrome.inkSoft, fontFamily: fonts.regular },
  });
}
