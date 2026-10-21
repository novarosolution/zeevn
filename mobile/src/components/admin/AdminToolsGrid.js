import React, { useMemo } from "react";
import { Platform, Pressable, StyleSheet, Text, View } from "react-native";
import { ADMIN_NAV_GROUPS, openAdminNavLink } from "../../content/adminNav";
import { useTheme } from "../../context/ThemeContext";
import { getAdminChrome } from "../../theme/adminLayout";
import { FONT_HEADING } from "../../theme/typographyRoles";
import { fonts, spacing } from "../../theme/tokens";
import AdminNavIcon from "./AdminNavIcon";
import AdminPanel from "./AdminPanel";

/**
 * Easy-manage launcher — lists every admin tool with icon + hint.
 */
export default function AdminToolsGrid({ navigation, current, compact = false }) {
  const { colors: c, isDark } = useTheme();
  const chrome = useMemo(() => getAdminChrome(c, isDark), [c, isDark]);
  const styles = useMemo(() => createStyles(chrome, compact), [chrome, compact]);

  return (
    <AdminPanel
      title="All tools"
      icon="apps-outline"
      meta={`${ADMIN_NAV_GROUPS.reduce((n, g) => n + g.links.length, 0)} options`}
      description="Every admin section in one place — tap a card to open and manage."
    >
      {ADMIN_NAV_GROUPS.map((group) => (
        <View key={group.key} style={styles.group}>
          <Text style={styles.groupLabel}>{group.label}</Text>
          <View style={styles.grid}>
            {group.links.map((link) => {
              const on = current === link.key;
              return (
                <Pressable
                  key={link.key}
                  onPress={() => openAdminNavLink(navigation, link)}
                  accessibilityRole="button"
                  accessibilityState={{ selected: on }}
                  style={({ hovered, pressed }) => [
                    styles.card,
                    on && styles.cardOn,
                    hovered && Platform.OS === "web" ? styles.cardHover : null,
                    pressed ? styles.cardPressed : null,
                  ]}
                >
                  <AdminNavIcon
                    imageKey={link.image}
                    icon={link.icon}
                    tone={link.tone}
                    size={compact ? 44 : 52}
                    active={on}
                  />
                  <View style={styles.copy}>
                    <Text style={[styles.label, on && styles.labelOn]} numberOfLines={1}>
                      {link.label}
                    </Text>
                    <Text style={styles.hint} numberOfLines={2}>
                      {link.hint}
                    </Text>
                  </View>
                </Pressable>
              );
            })}
          </View>
        </View>
      ))}
    </AdminPanel>
  );
}

function createStyles(chrome, compact) {
  return StyleSheet.create({
    group: {
      marginBottom: spacing.md,
    },
    groupLabel: {
      fontSize: 10,
      letterSpacing: 1.5,
      textTransform: "uppercase",
      fontFamily: fonts.semibold,
      color: chrome.inkFaint,
      marginBottom: 10,
    },
    grid: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: compact ? 8 : 12,
    },
    card: {
      flexGrow: 1,
      flexBasis: Platform.select({
        web: compact ? "calc(50% - 6px)" : "calc(25% - 9px)",
        default: "48%",
      }),
      minWidth: Platform.select({ web: 168, default: 140 }),
      maxWidth: Platform.select({ web: undefined, default: "48%" }),
      flexDirection: "row",
      alignItems: "center",
      gap: 14,
      paddingVertical: 14,
      paddingHorizontal: 14,
      borderRadius: 18,
      borderWidth: 1,
      borderColor: chrome.line,
      backgroundColor: "#FFFFFF",
      ...Platform.select({
        web: {
          cursor: "pointer",
          transition: "transform 0.14s ease, box-shadow 0.14s ease, border-color 0.14s ease",
          boxShadow: "0 1px 2px rgba(25,20,15,.03), 0 12px 28px -20px rgba(25,20,15,.14)",
        },
        default: {},
      }),
    },
    cardOn: {
      borderColor: chrome.linkOnBorder,
      backgroundColor: chrome.linkOnBg,
    },
    cardHover: Platform.select({
      web: {
        transform: [{ translateY: -2 }],
        borderColor: "rgba(85,107,50,0.35)",
        boxShadow: "0 10px 26px -14px rgba(31,51,31,.22)",
      },
      default: {},
    }),
    cardPressed: { opacity: 0.92 },
    copy: { flex: 1, minWidth: 0, gap: 2 },
    label: {
      fontFamily: FONT_HEADING,
      fontSize: 15.5,
      fontWeight: "500",
      color: chrome.ink,
      letterSpacing: -0.25,
    },
    labelOn: {
      color: chrome.goldDeep,
    },
    hint: {
      fontSize: 12,
      lineHeight: 16,
      color: chrome.inkFaint,
      fontFamily: fonts.regular,
    },
  });
}
