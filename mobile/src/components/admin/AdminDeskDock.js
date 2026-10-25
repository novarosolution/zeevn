import React, { useMemo } from "react";
import { StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAdminChrome } from "../../theme/adminLayout";

/** Sticky phone action bar under a desk. */
export default function AdminDeskDock({ children }) {
  const chrome = useAdminChrome();
  const insets = useSafeAreaInsets();
  const styles = useMemo(() => createStyles(chrome), [chrome]);

  return <View style={[styles.dock, { paddingBottom: Math.max(insets.bottom, 10) }]}>{children}</View>;
}

function createStyles(chrome) {
  return StyleSheet.create({
    dock: {
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: chrome.line,
      backgroundColor: chrome.card,
      paddingHorizontal: 12,
      paddingTop: 8,
      gap: 8,
    },
  });
}
