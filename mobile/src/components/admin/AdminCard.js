import React, { useMemo } from "react";
import { Platform, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { ADMIN_FONT, useAdminChrome } from "../../theme/adminLayout";
import { fonts } from "../../theme/tokens";

/**
 * Dense white card with an optional header row. Lighter than `AdminPanel`: use it for blocks inside drawers, side
 * columns and settings forms. `flush` removes body padding (tables, lists that draw their own rows).
 */
export default function AdminCard({ title, subtitle, icon, right, children, flush = false, tone = "default", style, bodyStyle }) {
  const chrome = useAdminChrome();
  const styles = useMemo(() => createStyles(chrome), [chrome]);

  return (
    <View style={[styles.card, tone === "soft" && styles.soft, style]}>
      {title || right ? (
        <View style={[styles.head, flush && styles.headFlush]}>
          <View style={styles.headCopy}>
            {icon ? (
              <View style={styles.iconWell}>
                <Ionicons name={icon} size={14} color={chrome.goldDeep} />
              </View>
            ) : null}
            <View style={styles.titleCol}>
              {title ? (
                <Text style={styles.title} numberOfLines={1}>
                  {title}
                </Text>
              ) : null}
              {subtitle ? (
                <Text style={styles.subtitle} numberOfLines={2}>
                  {subtitle}
                </Text>
              ) : null}
            </View>
          </View>
          {right || null}
        </View>
      ) : null}
      <View style={[flush ? null : styles.body, bodyStyle]}>{children}</View>
    </View>
  );
}

function createStyles(chrome) {
  return StyleSheet.create({
    card: {
      backgroundColor: chrome.card,
      borderRadius: 16,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: chrome.line,
      overflow: "hidden",
      ...Platform.select({ web: { boxShadow: "0 1px 1px rgba(20,24,16,0.03), 0 12px 28px -20px rgba(20,24,16,0.14)" }, default: {} }),
    },
    soft: { backgroundColor: chrome.paper },
    head: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 12,
      paddingHorizontal: 16,
      paddingTop: 14,
      paddingBottom: 12,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: chrome.lineSoft,
    },
    headFlush: { paddingHorizontal: 16 },
    headCopy: { flex: 1, minWidth: 0, flexDirection: "row", alignItems: "center", gap: 10 },
    iconWell: {
      width: 28,
      height: 28,
      borderRadius: 9,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: chrome.chipOnBg,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: chrome.chipOnBorder,
    },
    titleCol: { flex: 1, minWidth: 0 },
    title: { fontFamily: ADMIN_FONT.semibold, fontSize: 16, letterSpacing: -0.2, color: chrome.ink, fontWeight: "600" },
    subtitle: { marginTop: 2, fontSize: 12, lineHeight: 16, color: chrome.inkSoft, fontFamily: ADMIN_FONT.regular },
    body: { padding: 16, gap: 12 },
  });
}
