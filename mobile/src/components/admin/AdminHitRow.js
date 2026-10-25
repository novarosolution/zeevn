import React, { useMemo } from "react";
import { Platform, Pressable, StyleSheet, Text, View } from "react-native";
import { ADMIN_FONT, useAdminChrome } from "../../theme/adminLayout";
import AdminProductCell from "./AdminProductCell";

/** Tappable catalog/customer row used on till, transfers, and stock-out. */
export default function AdminHitRow({ name, imageUri, meta, selected, onPress, children, accessibilityLabel }) {
  const chrome = useAdminChrome();
  const styles = useMemo(() => createStyles(chrome), [chrome]);

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel || name}
      style={({ pressed }) => [styles.row, selected && styles.rowOn, pressed && styles.pressed]}
    >
      <View style={styles.main}>
        {name ? <AdminProductCell name={name} imageUri={imageUri} /> : null}
        {meta ? (
          <Text style={styles.meta} numberOfLines={2}>
            {meta}
          </Text>
        ) : null}
        {children}
      </View>
    </Pressable>
  );
}

function createStyles(chrome) {
  return StyleSheet.create({
    row: {
      paddingVertical: 10,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: chrome.lineSoft,
      gap: 4,
      ...Platform.select({ web: { cursor: "pointer" }, default: {} }),
    },
    rowOn: {
      backgroundColor: chrome.tileOnBg,
      marginHorizontal: -8,
      paddingHorizontal: 8,
      borderRadius: 10,
    },
    pressed: { opacity: 0.86 },
    main: { gap: 4 },
    meta: {
      fontFamily: ADMIN_FONT.regular,
      fontSize: 12,
      color: chrome.inkFaint,
      paddingLeft: 44,
    },
  });
}
