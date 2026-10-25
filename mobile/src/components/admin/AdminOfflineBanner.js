import React, { useCallback, useEffect, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { ADMIN_FONT, useAdminChrome } from "../../theme/adminLayout";
import { listAdminOfflineDrafts } from "../../utils/adminOfflineQueue";
import AdminButton from "./AdminButton";

export default function AdminOfflineBanner({ onSync, syncing = false, kinds = [] }) {
  const chrome = useAdminChrome();
  const [count, setCount] = useState(0);
  const kindKey = Array.isArray(kinds) ? kinds.join(",") : "";

  const load = useCallback(async () => {
    const rows = await listAdminOfflineDrafts();
    const allow = kindKey ? kindKey.split(",") : [];
    const list = allow.length ? rows.filter((row) => allow.includes(row.kind)) : rows;
    setCount(list.length);
  }, [kindKey]);

  useEffect(() => {
    load();
  }, [load]);

  if (!count) return null;

  return (
    <View style={[styles.bar, { backgroundColor: chrome.tileOnBg, borderColor: chrome.goldLine }]}>
      <Text style={[styles.copy, { color: chrome.ink }]}>
        {count} draft{count === 1 ? "" : "s"} waiting on this phone.
      </Text>
      {onSync ? (
        <AdminButton label="Sync" size="sm" variant="soft" loading={syncing} onPress={onSync} />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
  },
  copy: { flex: 1, fontFamily: ADMIN_FONT.medium, fontSize: 13 },
});
