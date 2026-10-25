import React, { useMemo, useState } from "react";
import { Platform, Pressable, StyleSheet, Text, View } from "react-native";
import { ADMIN_NAV_GROUPS, openAdminNavLink } from "../../content/adminNav";
import { useTheme } from "../../context/ThemeContext";
import { ADMIN_FONT, getAdminChrome } from "../../theme/adminLayout";
import { spacing } from "../../theme/tokens";
import AdminInput from "./AdminInput";
import AdminNavIcon from "./AdminNavIcon";
import AdminPanel from "./AdminPanel";

/** Easy-manage launcher — every admin tool, searchable. */
export default function AdminToolsGrid({ navigation, current, compact = false }) {
  const { colors: c, isDark } = useTheme();
  const chrome = useMemo(() => getAdminChrome(c, isDark), [c, isDark]);
  const styles = useMemo(() => createStyles(chrome, compact), [chrome, compact]);
  const [query, setQuery] = useState("");
  const q = query.trim().toLowerCase();

  const groups = useMemo(() => {
    if (!q) return ADMIN_NAV_GROUPS;
    return ADMIN_NAV_GROUPS.map((group) => ({
      ...group,
      links: group.links.filter((link) =>
        `${link.label} ${link.hint || ""} ${group.label}`.toLowerCase().includes(q)
      ),
    })).filter((group) => group.links.length);
  }, [q]);

  return (
    <AdminPanel
      title="All tools"
      icon="apps-outline"
      description="Search or tap a tool. Same list as the sidebar."
    >
      <AdminInput
        value={query}
        onChangeText={setQuery}
        placeholder="Find a tool — orders, stock, riders…"
        icon="search-outline"
        autoCapitalize="none"
      />
      {groups.length ? (
        groups.map((group) => (
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
                    accessibilityLabel={link.hint ? `${link.label}. ${link.hint}` : link.label}
                    style={({ pressed }) => [styles.card, on && styles.cardOn, pressed ? styles.cardPressed : null]}
                  >
                    <AdminNavIcon icon={link.icon} tone={link.tone} size={28} active={on} />
                    <View style={styles.copy}>
                      <Text style={[styles.label, on && styles.labelOn]} numberOfLines={1}>
                        {link.label}
                      </Text>
                      {link.hint ? (
                        <Text style={styles.hint} numberOfLines={1}>
                          {link.hint}
                        </Text>
                      ) : null}
                    </View>
                  </Pressable>
                );
              })}
            </View>
          </View>
        ))
      ) : (
        <Text style={styles.empty}>No tool matches “{query.trim()}”.</Text>
      )}
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
      fontFamily: ADMIN_FONT.semibold,
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
        web: compact ? "calc(50% - 6px)" : "calc(16.6% - 10px)",
        default: "48%",
      }),
      minWidth: Platform.select({ web: 132, default: 140 }),
      maxWidth: Platform.select({ web: undefined, default: "48%" }),
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      paddingVertical: 10,
      paddingHorizontal: 10,
      borderRadius: 14,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: chrome.line,
      backgroundColor: chrome.card,
      ...Platform.select({
        web: {
          cursor: "pointer",
          boxShadow: "0 1px 1px rgba(20,24,16,0.03), 0 10px 22px -18px rgba(20,24,16,0.12)",
          transition: "transform 100ms ease-out, background-color 100ms ease-out, border-color 100ms ease-out",
        },
        default: {},
      }),
    },
    cardOn: {
      borderColor: chrome.tileOnBorder,
      backgroundColor: chrome.tileOnBg,
    },
    cardPressed: { transform: [{ scale: 0.97 }] },
    copy: { flex: 1, minWidth: 0, gap: 2 },
    label: {
      fontFamily: ADMIN_FONT.semibold,
      fontSize: 13,
      fontWeight: "600",
      color: chrome.ink,
      letterSpacing: -0.1,
    },
    labelOn: {
      color: chrome.linkOnText,
    },
    hint: {
      fontSize: 11,
      color: chrome.inkFaint,
      fontFamily: ADMIN_FONT.regular,
    },
    empty: {
      fontSize: 13,
      color: chrome.inkSoft,
      fontFamily: ADMIN_FONT.medium,
      paddingVertical: 12,
    },
  });
}
