import React, { useMemo } from "react";
import { Platform, StyleSheet, Text, View } from "react-native";
import { useAdminChrome, useAdminCompactLayout } from "../../../theme/adminLayout";
import { fonts } from "../../../theme/tokens";
import { BULK_STATUS_TARGETS } from "../../../utils/adminOrderUi";
import { plural } from "../../../utils/adminFormat";
import AdminButton from "../AdminButton";
import AdminInput from "../AdminInput";
import AdminSelect from "../AdminSelect";
import { buildRiderOptions } from "./riderOptions";

const RELEASE = "__release__";

/** Sticky bar shown while orders are ticked: move them along, hand them to a rider, or settle cash in one go. */
export default function AdminBulkBar({ count, cashDueCount, riders, busy, note = "", onNote, onMove, onAssign, onCollectCash, onClear }) {
  const chrome = useAdminChrome();
  const compact = useAdminCompactLayout();
  const styles = useMemo(() => createStyles(chrome), [chrome]);

  const moveOptions = BULK_STATUS_TARGETS.map((t) => ({ value: t.to, label: t.label, icon: t.icon }));
  const riderOptions = [{ value: RELEASE, label: "Release riders", icon: "person-remove-outline" }, ...buildRiderOptions(riders)];

  return (
    <View style={[styles.bar, compact && styles.barCompact]}>
      <View style={styles.left}>
        <Text style={styles.count}>{plural(count, "order")} selected</Text>
        <AdminButton label="Clear" variant="ghost" size="xs" onPress={onClear} />
      </View>
      {onNote ? (
        <AdminInput
          value={note}
          onChangeText={onNote}
          placeholder="Optional note (saved on the status event)"
          maxLength={300}
          style={styles.note}
        />
      ) : null}
      <View style={[styles.actions, compact && styles.actionsCompact]}>
        <AdminSelect
          compact
          value={null}
          placeholder="Move to…"
          icon="arrow-forward-circle-outline"
          options={moveOptions}
          disabled={busy}
          minMenuWidth={200}
          align="right"
          style={styles.select}
          onChange={(to) => onMove(BULK_STATUS_TARGETS.find((t) => t.to === to))}
        />
        <AdminSelect
          compact
          value={null}
          placeholder="Assign rider…"
          icon="person-add-outline"
          options={riderOptions}
          searchable={riders.length > 6}
          disabled={busy}
          minMenuWidth={260}
          align="right"
          style={styles.select}
          onChange={(id) => onAssign(id === RELEASE ? null : id, riders.find((r) => String(r._id) === String(id))?.name)}
        />
        {cashDueCount > 0 ? (
          <AdminButton label={`Cash collected (${cashDueCount})`} icon="cash-outline" size="sm" variant="tint" tone="gold" disabled={busy} onPress={onCollectCash} />
        ) : null}
      </View>
    </View>
  );
}

function createStyles(chrome) {
  return StyleSheet.create({
    bar: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      flexWrap: "wrap",
      gap: 10,
      paddingHorizontal: 14,
      paddingVertical: 9,
      borderRadius: 14,
      backgroundColor: chrome.card,
      borderWidth: 1,
      borderColor: chrome.goldDeep,
      zIndex: 7,
      ...Platform.select({
        web: { position: "sticky", top: 76, boxShadow: "0 14px 34px -14px rgba(20,24,16,0.35), 0 2px 6px rgba(20,24,16,0.06)" },
        default: {},
      }),
    },
    barCompact: { flexDirection: "column", alignItems: "stretch" },
    left: { flexDirection: "row", alignItems: "center", gap: 8 },
    count: { fontSize: 13.5, color: chrome.ink, fontFamily: fonts.bold },
    actions: { flexDirection: "row", flexWrap: "wrap", alignItems: "center", gap: 8 },
    actionsCompact: { flexDirection: "column", alignItems: "stretch" },
    select: { minWidth: 150 },
    note: { width: "100%", flexBasis: "100%" },
  });
}
