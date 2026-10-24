import React, { useMemo } from "react";
import { Platform, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useTheme } from "../../context/ThemeContext";
import { getAdminChrome } from "../../theme/adminLayout";
import { fonts } from "../../theme/tokens";

export default function AdminFilterTabs({ items, value, onChange, style }) {
  const { colors: c, isDark } = useTheme();
  const chrome = useMemo(() => getAdminChrome(c, isDark), [c, isDark]);
  const styles = useMemo(() => createStyles(chrome), [chrome]);

  return (
    <View style={[styles.track, style]}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.row}
      >
        {items.map((item) => {
          const key = item.key ?? item.value ?? item.label;
          const on = value === key;
          return (
            <Pressable
              key={key}
              onPress={() => onChange(key)}
              style={({ pressed }) => [
                styles.tab,
                on && styles.tabOn,
                pressed && styles.tabPressed,
              ]}
              accessibilityRole="button"
              accessibilityState={{ selected: on }}
            >
              <Text style={[styles.tabText, on && styles.tabTextOn]}>{item.label}</Text>
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
      paddingHorizontal: Platform.select({ web: 14, default: 13 }),
      paddingVertical: Platform.select({ web: 8, default: 7 }),
      borderRadius: Platform.select({ web: 9, default: 999 }),
      borderWidth: Platform.select({ web: 0, default: 1 }),
      borderColor: chrome.line,
      backgroundColor: Platform.select({ web: "transparent", default: chrome.card }),
      ...Platform.select({
        web: { cursor: "pointer", transition: "transform 100ms ease-out, background-color 100ms ease-out" },
        default: {},
      }),
    },
    tabPressed: { transform: [{ scale: 0.97 }] },
    tabOn: {
      backgroundColor: chrome.tabOnBg,
      borderColor: chrome.tabOnBorder,
      ...Platform.select({
        web: {
          boxShadow: "0 1px 3px rgba(25,20,15,0.12)",
        },
        default: {},
      }),
    },
    tabText: {
      fontSize: 12,
      color: chrome.inkSoft,
      fontFamily: fonts.medium,
    },
    tabTextOn: {
      color: chrome.tabOnText,
      fontFamily: fonts.semibold,
    },
  });
}
