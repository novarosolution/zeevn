import React, { useMemo } from "react";
import { Platform, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useAdminChrome, useAdminCompactLayout } from "../../theme/adminLayout";
import { FONT_HEADING } from "../../theme/typographyRoles";
import { fonts } from "../../theme/tokens";

/**
 * Settings block: a short explanation on the left, the controls in a white card on the right (stacked on a phone).
 * `status` renders under the description (a badge, a link…).
 */
export default function AdminSection({ title, description, icon, status, children, style }) {
  const chrome = useAdminChrome();
  const compact = useAdminCompactLayout();
  const styles = useMemo(() => createStyles(chrome), [chrome]);

  return (
    <View style={[styles.section, compact && styles.sectionCompact, style]}>
      <View style={[styles.side, compact && styles.sideCompact]}>
        <View style={styles.titleRow}>
          {icon ? (
            <View style={styles.iconWell}>
              <Ionicons name={icon} size={15} color={chrome.goldDeep} />
            </View>
          ) : null}
          <Text style={styles.title}>{title}</Text>
        </View>
        {description ? <Text style={styles.description}>{description}</Text> : null}
        {status ? <View style={styles.status}>{status}</View> : null}
      </View>
      <View style={styles.card}>{children}</View>
    </View>
  );
}

/** One line inside a settings card: label + explanation on the left, the control on the right. */
export function AdminSettingRow({ title, description, right, children, last = false, disabled = false }) {
  const chrome = useAdminChrome();
  const styles = useMemo(() => createStyles(chrome), [chrome]);

  return (
    <View style={[styles.row, !last && styles.rowBorder, disabled && styles.rowDisabled]}>
      <View style={styles.rowTop}>
        <View style={styles.rowCopy}>
          <Text style={styles.rowTitle}>{title}</Text>
          {description ? <Text style={styles.rowDescription}>{description}</Text> : null}
        </View>
        {right ? <View style={styles.rowRight}>{right}</View> : null}
      </View>
      {children ? <View style={styles.rowBody}>{children}</View> : null}
    </View>
  );
}

function createStyles(chrome) {
  return StyleSheet.create({
    section: { flexDirection: "row", alignItems: "flex-start", gap: 28, paddingVertical: 6 },
    sectionCompact: { flexDirection: "column", gap: 12 },
    side: { width: 280, flexShrink: 0, gap: 8, paddingTop: 6 },
    sideCompact: { width: "100%", paddingTop: 0 },
    titleRow: { flexDirection: "row", alignItems: "center", gap: 10 },
    iconWell: {
      width: 30,
      height: 30,
      borderRadius: 10,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: chrome.chipOnBg,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: chrome.chipOnBorder,
    },
    title: { fontFamily: FONT_HEADING, fontSize: 19, letterSpacing: -0.3, color: chrome.ink, fontWeight: "500" },
    description: { fontSize: 13, lineHeight: 19, color: chrome.inkFaint, fontFamily: fonts.regular },
    status: { marginTop: 2 },
    card: {
      flex: 1,
      minWidth: 0,
      width: "100%",
      backgroundColor: chrome.card,
      borderRadius: 16,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: chrome.line,
      ...Platform.select({ web: { boxShadow: "0 1px 1px rgba(31,51,31,0.03), 0 10px 26px -20px rgba(31,51,31,0.14)" }, default: {} }),
    },
    row: { paddingHorizontal: 18, paddingVertical: 16, gap: 12 },
    rowBorder: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: chrome.lineSoft },
    rowDisabled: { opacity: 0.5 },
    rowTop: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 16 },
    rowCopy: { flex: 1, minWidth: 0 },
    rowTitle: { fontSize: 14, color: chrome.ink, fontFamily: fonts.semibold },
    rowDescription: { marginTop: 3, fontSize: 12.5, lineHeight: 18, color: chrome.inkFaint, fontFamily: fonts.regular },
    rowRight: { flexShrink: 0 },
    rowBody: { gap: 12 },
  });
}
