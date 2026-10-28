import React from "react";
import { StyleSheet, View } from "react-native";
import AdminNotice from "./AdminNotice";
import { spacing } from "../../theme/tokens";

export default function AdminAlerts({ error, success, onCloseError, onCloseSuccess }) {
  if (!error && !success) return null;
  return (
    <View style={styles.wrap}>
      {error ? (
        <AdminNotice severity="error" message={error} onClose={onCloseError} compact />
      ) : null}
      {success ? (
        <AdminNotice severity="success" message={success} onClose={onCloseSuccess} compact />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: spacing.xs,
    marginBottom: spacing.md,
    borderRadius: 14,
    overflow: "hidden",
  },
});
