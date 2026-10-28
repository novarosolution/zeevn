import React, { useMemo } from "react";
import { Platform, Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { ADMIN_FONT, useAdminChrome } from "../../theme/adminLayout";

/** Orders that need a human, one tappable row each: the order, why, and a chevron. items: { id, title, reason }. */
export default function AdminAttentionList({ items, onPress }) {
  const chrome = useAdminChrome();
  const styles = useMemo(() => createStyles(chrome), [chrome]);

  return (
    <View style={styles.list}>
      {items.map((item) => (
        <Pressable
          key={item.id}
          onPress={() => onPress(item)}
          accessibilityRole="button"
          accessibilityLabel={`${item.title}. ${item.reason}`}
          style={({ hovered, pressed }) => [styles.row, hovered && styles.rowHover, pressed && styles.rowPressed]}
        >
          <View style={styles.dot} />
          <Text style={styles.title} numberOfLines={1}>
            {item.title}
          </Text>
          <View style={styles.reasonPill}>
            <Text style={styles.reason} numberOfLines={1}>
              {item.reason}
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={14} color={chrome.inkFaint} />
        </Pressable>
      ))}
    </View>
  );
}

function createStyles(chrome) {
  return StyleSheet.create({
    list: { gap: 6 },
    row: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      paddingHorizontal: 12,
      minHeight: 42,
      borderRadius: 11,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: chrome.line,
      backgroundColor: chrome.card,
      ...Platform.select({ web: { cursor: "pointer", transition: "background-color 100ms ease-out" }, default: {} }),
    },
    rowHover: { backgroundColor: chrome.rowHover },
    rowPressed: { transform: [{ scale: 0.99 }] },
    dot: { width: 7, height: 7, borderRadius: 4, backgroundColor: chrome.goldDeep },
    title: {
      flex: 1,
      minWidth: 0,
      fontSize: 13,
      color: chrome.ink,
      fontFamily: ADMIN_FONT.semibold,
      fontWeight: "600",
      fontVariant: ["tabular-nums"],
    },
    reasonPill: {
      paddingHorizontal: 9,
      paddingVertical: 3,
      borderRadius: 999,
      backgroundColor: chrome.tileOnBg,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: chrome.tileOnBorder,
      maxWidth: "55%",
    },
    reason: { fontSize: 11.5, color: chrome.goldDeep, fontFamily: ADMIN_FONT.medium },
  });
}
