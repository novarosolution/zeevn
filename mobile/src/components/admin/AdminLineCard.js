import React, { useMemo } from "react";
import { StyleSheet, Text, View } from "react-native";
import { ADMIN_FONT, useAdminChrome } from "../../theme/adminLayout";
import AdminButton from "./AdminButton";

/** One bill / transfer line: name, stepper, amount, optional remove. */
export default function AdminLineCard({ name, meta, amount, onRemove, children }) {
  const chrome = useAdminChrome();
  const styles = useMemo(() => createStyles(chrome), [chrome]);

  return (
    <View style={styles.line}>
      <View style={styles.who}>
        <Text style={styles.name} numberOfLines={1}>
          {name}
        </Text>
        {meta ? (
          <Text style={styles.meta} numberOfLines={1}>
            {meta}
          </Text>
        ) : null}
      </View>
      {children}
      {amount ? <Text style={styles.amount}>{amount}</Text> : null}
      {onRemove ? <AdminButton label="Remove" icon="trash-outline" variant="ghost" size="xs" onPress={onRemove} /> : null}
    </View>
  );
}

function createStyles(chrome) {
  return StyleSheet.create({
    line: {
      gap: 8,
      paddingVertical: 10,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: chrome.lineSoft,
    },
    who: { minWidth: 0 },
    name: { fontFamily: ADMIN_FONT.semibold, fontSize: 14, color: chrome.ink },
    meta: { fontFamily: ADMIN_FONT.regular, fontSize: 12, color: chrome.inkFaint, marginTop: 2 },
    amount: { fontFamily: ADMIN_FONT.semibold, fontSize: 13, color: chrome.goldDeep },
  });
}
