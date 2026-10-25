import React, { useMemo } from "react";
import { Platform, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useTheme } from "../../context/ThemeContext";
import { ADMIN_FONT, getAdminChrome } from "../../theme/adminLayout";
import { getAdminTone } from "../../theme/adminTones";

/**
 * Segmented tabs. Items: `{ key, label, count?, tone? }`. A `count` renders as a small number chip; give `tone`
 * (e.g. "red", "gold") to make the chip stand out when the number needs attention.
 */
export default function AdminFilterTabs({ items, value, onChange, style }) {
  const { colors: c, isDark } = useTheme();
  const chrome = useMemo(() => getAdminChrome(c, isDark), [c, isDark]);
  const styles = useMemo(() => createStyles(chrome), [chrome]);

  return (
    <View style={[styles.track, style]}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
        {items.map((item) => {
          const key = item.key ?? item.value ?? item.label;
          const on = value === key;
          const hasCount = item.count !== undefined && item.count !== null;
          const chip = item.tone && item.count > 0 ? getAdminTone(item.tone, isDark) : null;
          return (
            <Pressable
              key={key}
              onPress={() => onChange(key)}
              style={({ pressed, hovered }) => [
                styles.tab,
                on && styles.tabOn,
                hovered && !on && styles.tabHover,
                pressed && styles.tabPressed,
              ]}
              accessibilityRole="button"
              accessibilityState={{ selected: on }}
            >
              <Text style={[styles.tabText, on && styles.tabTextOn]}>{item.label}</Text>
              {hasCount ? (
                <View
                  style={[
                    styles.count,
                    on && styles.countOn,
                    chip && !on && { backgroundColor: chip.bg, borderColor: chip.border },
                  ]}
                >
                  <Text style={[styles.countText, on && styles.countTextOn, chip && !on && { color: chip.fg }]}>{item.count}</Text>
                </View>
              ) : null}
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}

function createStyles(chrome) {
  return StyleSheet.create({
    track: Platform.select({
      web: {
        alignSelf: "stretch",
        borderRadius: 12,
        padding: 3,
        backgroundColor: chrome.paper,
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: chrome.line,
      },
      default: {},
    }),
    row: {
      flexDirection: "row",
      gap: Platform.select({ web: 4, default: 6 }),
      paddingVertical: Platform.select({ web: 0, default: 2 }),
    },
    tab: {
      flexDirection: "row",
      alignItems: "center",
      gap: 7,
      paddingHorizontal: Platform.select({ web: 13, default: 13 }),
      paddingVertical: Platform.select({ web: 7, default: 7 }),
      borderRadius: Platform.select({ web: 9, default: 999 }),
      borderWidth: Platform.select({ web: 0, default: 1 }),
      borderColor: chrome.line,
      backgroundColor: Platform.select({ web: "transparent", default: chrome.card }),
      ...Platform.select({
        web: { cursor: "pointer", transition: "transform 100ms ease-out, background-color 100ms ease-out" },
        default: {},
      }),
    },
    tabHover: { backgroundColor: chrome.rowHover },
    tabPressed: { transform: [{ scale: 0.97 }] },
    tabOn: {
      backgroundColor: chrome.tabOnBg,
      borderColor: chrome.tabOnBorder,
      ...Platform.select({ web: { boxShadow: "0 1px 3px rgba(25,20,15,0.12)" }, default: {} }),
    },
    tabText: { fontSize: 12.5, color: chrome.inkSoft, fontFamily: ADMIN_FONT.medium },
    tabTextOn: { color: chrome.tabOnText, fontFamily: ADMIN_FONT.semibold },
    count: {
      minWidth: 20,
      height: 18,
      paddingHorizontal: 6,
      borderRadius: 9,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: chrome.chipOnBg,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: "transparent",
    },
    countOn: { backgroundColor: "rgba(246, 241, 230, 0.2)" },
    countText: { fontSize: 11, color: chrome.inkSoft, fontFamily: ADMIN_FONT.semibold },
    countTextOn: { color: chrome.tabOnText },
  });
}
