import React, { useMemo } from "react";
import { StyleSheet, Text, View } from "react-native";
import { ADMIN_FONT, useAdminChrome } from "../../theme/adminLayout";
import { spacing } from "../../theme/tokens";

/** Page title inside a desk screen. Prefer AdminTopBar for the shell title. */
export default function AdminPageHeading({ title, subtitle, right, compact = false }) {
  const chrome = useAdminChrome();
  const styles = useMemo(() => createStyles(chrome, compact), [chrome, compact]);

  return (
    <View style={styles.wrap}>
      <View style={styles.row}>
        <View style={styles.textCol}>
          <Text style={styles.title}>{title}</Text>
          {subtitle && !compact ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
        </View>
        {right ? <View style={styles.right}>{right}</View> : null}
      </View>
    </View>
  );
}

function createStyles(chrome, compact) {
  return StyleSheet.create({
    wrap: {
      marginBottom: compact ? spacing.sm : spacing.md,
      flex: 1,
      minWidth: 0,
    },
    row: {
      flexDirection: "row",
      alignItems: "flex-start",
      justifyContent: "space-between",
      gap: spacing.md,
    },
    textCol: { flex: 1, minWidth: 0 },
    title: {
      fontSize: compact ? 18 : 22,
      letterSpacing: -0.35,
      fontFamily: ADMIN_FONT.semibold,
      fontWeight: "600",
      color: chrome.ink,
    },
    subtitle: {
      marginTop: 4,
      fontSize: 13,
      lineHeight: 18,
      color: chrome.inkSoft,
      fontFamily: ADMIN_FONT.regular,
    },
    right: { flexShrink: 0, alignItems: "flex-end" },
  });
}
