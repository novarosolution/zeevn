import React, { useMemo } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../context/ThemeContext";
import { getAdminChrome } from "../../theme/adminLayout";
import { fonts, spacing } from "../../theme/tokens";
import AdminNavIcon from "./AdminNavIcon";

/**
 * Phone / narrow admin nav.
 * Pass `groups` (Live Ops · Catalogue · …) for scannable buckets, or flat `links`.
 */
export default function AdminMobileNav({ links, groups, current, onNavigate, onExitStore }) {
  const { colors: c, isDark } = useTheme();
  const chrome = useMemo(() => getAdminChrome(c, isDark), [c, isDark]);
  const styles = useMemo(() => createStyles(chrome), [chrome]);

  const sections = Array.isArray(groups) && groups.length
    ? groups
    : [{ key: "all", label: null, links: links || [] }];

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={styles.wrap}
      contentContainerStyle={styles.row}
    >
      {sections.map((group, gi) => (
        <View key={group.key || `g-${gi}`} style={styles.bucket}>
          {group.label ? <Text style={styles.bucketLabel}>{group.label}</Text> : null}
          <View style={styles.chipRow}>
            {(group.links || []).map((link) => {
              const on = current === link.key;
              return (
                <Pressable
                  key={link.key}
                  onPress={() => onNavigate(link.key)}
                  style={[styles.chip, on && styles.chipOn]}
                  accessibilityRole="button"
                  accessibilityState={{ selected: on }}
                  accessibilityLabel={link.hint ? `${link.label}. ${link.hint}` : link.label}
                >
                  <AdminNavIcon
                    imageKey={link.image}
                    icon={link.icon}
                    tone={link.tone}
                    size={26}
                    compact
                    active={on}
                  />
                  <Text style={[styles.label, on && styles.labelOn]}>{link.label}</Text>
                </Pressable>
              );
            })}
          </View>
        </View>
      ))}
      {onExitStore ? (
        <View style={styles.bucket}>
          <Text style={styles.bucketLabel}>Leave</Text>
          <View style={styles.chipRow}>
            <Pressable
              onPress={onExitStore}
              style={styles.exitChip}
              accessibilityRole="button"
              accessibilityLabel="Exit to store"
            >
              <Ionicons name="storefront-outline" size={14} color={chrome.goldBright} />
              <Text style={styles.exitLabel}>Store</Text>
            </Pressable>
          </View>
        </View>
      ) : null}
    </ScrollView>
  );
}

function createStyles(chrome) {
  return StyleSheet.create({
    wrap: {
      marginBottom: spacing.sm,
      marginHorizontal: -4,
    },
    row: {
      flexDirection: "row",
      alignItems: "flex-end",
      gap: 14,
      paddingHorizontal: 4,
      paddingVertical: 2,
    },
    bucket: {
      gap: 4,
    },
    bucketLabel: {
      fontSize: 9,
      letterSpacing: 1.2,
      textTransform: "uppercase",
      fontFamily: fonts.semibold,
      color: chrome.inkFaint,
      paddingHorizontal: 4,
    },
    chipRow: {
      flexDirection: "row",
      gap: 6,
    },
    chip: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: chrome.line,
      backgroundColor: chrome.card,
    },
    chipOn: {
      backgroundColor: chrome.tabOnBg,
      borderColor: chrome.tabOnBorder,
    },
    label: {
      fontSize: 12,
      fontFamily: fonts.medium,
      color: chrome.inkSoft,
    },
    labelOn: {
      color: chrome.tabOnText,
      fontFamily: fonts.semibold,
    },
    exitChip: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: "rgba(232,200,90,0.4)",
      backgroundColor: "rgba(232,200,90,0.12)",
    },
    exitLabel: {
      fontSize: 12,
      fontFamily: fonts.semibold,
      color: chrome.goldBright,
    },
  });
}
