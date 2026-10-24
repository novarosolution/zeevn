import React, { memo, useMemo } from "react";
import { Platform, Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useAdminChrome } from "../../../theme/adminLayout";
import { fonts } from "../../../theme/tokens";
import { formatMinutes } from "../../../utils/adminFormat";
import AdminAvatar from "../AdminAvatar";
import AdminBadge from "../AdminBadge";
import AdminButton from "../AdminButton";
import AdminSwitch from "../AdminSwitch";
import { coverageParts, feeSummary, zonePartnerIds } from "./zoneHelpers";

/** One delivery zone in the list: status switch, price, how it's matched, who delivers, how it's doing. */
const ZoneCard = memo(function ZoneCard({ zone, stats, riders, selected, busy, onSelect, onEdit, onToggle }) {
  const chrome = useAdminChrome();
  const styles = useMemo(() => createStyles(chrome), [chrome]);
  const off = zone.isActive === false;
  const parts = coverageParts(zone);
  const assigned = zonePartnerIds(zone)
    .map((id) => riders.find((r) => String(r._id) === id) || zone.partnerIds.find((p) => String(p?._id) === id))
    .filter(Boolean);
  const shown = assigned.slice(0, 3);

  return (
    <Pressable
      onPress={() => onSelect(zone)}
      accessibilityRole="button"
      accessibilityLabel={`Zone ${zone.name}`}
      style={({ hovered, pressed }) => [styles.card, hovered && styles.hover, pressed && styles.pressed, selected && styles.selected, off && styles.off]}
    >
      <View style={styles.top}>
        <View style={[styles.swatch, { backgroundColor: off ? chrome.inkFaint : "#2F6B3A" }]} />
        <Text style={styles.name} numberOfLines={1}>
          {zone.name}
        </Text>
        <AdminBadge label={off ? "Paused" : "Live"} tone={off ? "neutral" : "green"} size="sm" dot />
        <AdminSwitch value={!off} onChange={() => onToggle(zone)} disabled={busy} size="sm" accessibilityLabel={`${zone.name} active`} />
      </View>

      <View style={styles.chips}>
        <View style={styles.feeChip}>
          <Ionicons name="pricetag-outline" size={12} color={chrome.goldDeep} />
          <Text style={styles.feeText}>{feeSummary(zone)}</Text>
        </View>
        {parts.length ? (
          parts.map((part) => (
            <View key={part.key} style={styles.partChip}>
              <Ionicons name={part.icon} size={12} color={chrome.inkSoft} />
              <Text style={styles.partText}>{part.label}</Text>
            </View>
          ))
        ) : (
          <AdminBadge label="No coverage set" tone="red" size="sm" icon="alert-circle-outline" />
        )}
      </View>

      <View style={styles.bottom}>
        <View style={styles.riders}>
          {shown.length ? (
            <>
              <View style={styles.stack}>
                {shown.map((r, i) => (
                  <View key={String(r._id)} style={[styles.stackItem, i > 0 && { marginLeft: -8 }]}>
                    <AdminAvatar name={r.name} size={24} online={typeof r.online === "boolean" ? r.online : undefined} />
                  </View>
                ))}
              </View>
              <Text style={styles.meta} numberOfLines={1}>
                {assigned.length === 1 ? assigned[0].name : `${assigned.length} riders`}
              </Text>
            </>
          ) : (
            <Text style={styles.meta}>Any rider can deliver</Text>
          )}
        </View>
        <Text style={styles.meta} numberOfLines={1}>
          {stats?.orders ? `${stats.orders} orders${stats.avgMinutes ? ` · ~${formatMinutes(stats.avgMinutes)}` : ""}` : "No orders yet"}
        </Text>
      </View>

      <View style={styles.actions}>
        {stats?.active ? <AdminBadge label={`${stats.active} live now`} tone="blue" size="sm" /> : <View />}
        <AdminButton label="Edit zone" icon="create-outline" size="xs" variant="soft" onPress={() => onEdit(zone)} />
      </View>
    </Pressable>
  );
});

export default ZoneCard;

function createStyles(chrome) {
  return StyleSheet.create({
    card: {
      padding: 14,
      gap: 10,
      borderRadius: 14,
      backgroundColor: chrome.card,
      borderWidth: 1,
      borderColor: chrome.line,
      ...Platform.select({ web: { cursor: "pointer", transition: "border-color 120ms ease-out, background-color 120ms ease-out, box-shadow 120ms ease-out" }, default: {} }),
    },
    hover: { borderColor: chrome.inkFaint },
    pressed: { backgroundColor: chrome.paper },
    selected: {
      borderColor: chrome.goldDeep,
      backgroundColor: chrome.chipOnBg,
      ...Platform.select({ web: { boxShadow: "0 0 0 3px rgba(169, 119, 46, 0.14)" }, default: {} }),
    },
    off: { opacity: 0.78 },
    top: { flexDirection: "row", alignItems: "center", gap: 8 },
    swatch: { width: 10, height: 10, borderRadius: 3 },
    name: { flex: 1, minWidth: 0, fontSize: 14.5, color: chrome.ink, fontFamily: fonts.bold },
    chips: { flexDirection: "row", flexWrap: "wrap", alignItems: "center", gap: 6 },
    feeChip: {
      flexDirection: "row",
      alignItems: "center",
      gap: 5,
      height: 22,
      paddingHorizontal: 8,
      borderRadius: 999,
      backgroundColor: chrome.chipOnBg,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: chrome.chipOnBorder,
    },
    feeText: { fontSize: 11.5, color: chrome.goldDeep, fontFamily: fonts.semibold },
    partChip: {
      flexDirection: "row",
      alignItems: "center",
      gap: 5,
      height: 22,
      paddingHorizontal: 8,
      borderRadius: 999,
      backgroundColor: chrome.paper,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: chrome.line,
    },
    partText: { fontSize: 11.5, color: chrome.inkSoft, fontFamily: fonts.medium },
    bottom: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 10 },
    riders: { flexDirection: "row", alignItems: "center", gap: 8, flexShrink: 1, minWidth: 0 },
    stack: { flexDirection: "row", alignItems: "center" },
    stackItem: { borderRadius: 14 },
    meta: { fontSize: 12, color: chrome.inkFaint, fontFamily: fonts.regular },
    actions: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  });
}
