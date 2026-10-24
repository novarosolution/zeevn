import React, { useMemo } from "react";
import { Platform, Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useAdminChrome } from "../../../theme/adminLayout";
import { fonts } from "../../../theme/tokens";
import { openExternal, telHref, timeAgo } from "../../../utils/adminFormat";
import AdminAvatar from "../AdminAvatar";
import AdminBadge from "../AdminBadge";
import AdminButton from "../AdminButton";

/** Riders tab: who is online, what they're carrying, where they deliver. Selecting one flies the map to them. */
export default function ZoneRiders({ riders, selectedId, onSelect, onShowOrders, onManage }) {
  const chrome = useAdminChrome();
  const styles = useMemo(() => createStyles(chrome), [chrome]);
  const ordered = useMemo(
    () => [...riders].sort((a, b) => Number(b.online) - Number(a.online) || (b.active || 0) - (a.active || 0) || String(a.name).localeCompare(String(b.name))),
    [riders]
  );

  if (!riders.length) {
    return (
      <View style={styles.empty}>
        <Ionicons name="bicycle-outline" size={26} color={chrome.inkFaint} />
        <Text style={styles.emptyTitle}>No riders yet</Text>
        <Text style={styles.emptyText}>Turn a user into a delivery partner and they show up here with a live location.</Text>
        <AdminButton label="Open Users" icon="people-outline" variant="primary" size="sm" onPress={onManage} />
      </View>
    );
  }

  return (
    <View style={styles.list}>
      {ordered.map((rider) => {
        const selected = String(rider._id) === String(selectedId);
        return (
          <Pressable
            key={String(rider._id)}
            onPress={() => onSelect(rider)}
            style={({ hovered, pressed }) => [styles.card, hovered && styles.hover, pressed && styles.pressed, selected && styles.selected]}
          >
            <View style={styles.top}>
              <AdminAvatar name={rider.name} size={38} online={rider.online} />
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text style={styles.name} numberOfLines={1}>
                  {rider.name || "Rider"}
                </Text>
                <Text style={styles.sub} numberOfLines={1}>
                  {rider.online ? "Online now" : rider.location?.updatedAt ? `Last seen ${timeAgo(rider.location.updatedAt)}` : "No location shared yet"}
                </Text>
              </View>
              {rider.awaitingAccept ? <AdminBadge label={`${rider.awaitingAccept} to accept`} tone="gold" size="sm" /> : null}
            </View>

            <View style={styles.stats}>
              <View style={styles.stat}>
                <Text style={styles.statValue}>{rider.active || 0}</Text>
                <Text style={styles.statLabel}>On the road</Text>
              </View>
              <View style={styles.stat}>
                <Text style={styles.statValue}>{rider.deliveredToday || 0}</Text>
                <Text style={styles.statLabel}>Delivered today</Text>
              </View>
              <View style={[styles.stat, { flex: 1.4 }]}>
                <Text style={styles.zonesText} numberOfLines={2}>
                  {rider.zones?.length ? rider.zones.map((z) => z.name).join(", ") : "Any zone"}
                </Text>
                <Text style={styles.statLabel}>Delivers in</Text>
              </View>
            </View>

            <View style={styles.actions}>
              <AdminButton label="Show on map" icon="locate-outline" size="xs" variant="soft" disabled={!rider.location} onPress={() => onSelect(rider)} />
              <AdminButton label="Orders" icon="receipt-outline" size="xs" variant="soft" onPress={() => onShowOrders(rider)} />
              {telHref(rider.phone) ? <AdminButton label={rider.phone} icon="call-outline" size="xs" variant="ghost" onPress={() => openExternal(telHref(rider.phone))} /> : null}
            </View>
          </Pressable>
        );
      })}
      <AdminButton label="Add or remove riders in Users" icon="people-outline" variant="ghost" size="sm" onPress={onManage} />
    </View>
  );
}

function createStyles(chrome) {
  return StyleSheet.create({
    list: { gap: 10 },
    card: {
      padding: 14,
      gap: 12,
      borderRadius: 14,
      backgroundColor: chrome.card,
      borderWidth: 1,
      borderColor: chrome.line,
      ...Platform.select({ web: { cursor: "pointer", transition: "border-color 120ms ease-out, background-color 120ms ease-out" }, default: {} }),
    },
    hover: { borderColor: chrome.inkFaint },
    pressed: { backgroundColor: chrome.paper },
    selected: {
      borderColor: chrome.goldDeep,
      backgroundColor: chrome.chipOnBg,
      ...Platform.select({ web: { boxShadow: "0 0 0 3px rgba(169, 119, 46, 0.14)" }, default: {} }),
    },
    top: { flexDirection: "row", alignItems: "center", gap: 10 },
    name: { fontSize: 14.5, color: chrome.ink, fontFamily: fonts.bold },
    sub: { fontSize: 12, color: chrome.inkFaint, fontFamily: fonts.regular, marginTop: 1 },
    stats: { flexDirection: "row", gap: 10 },
    stat: { flex: 1, minWidth: 0, gap: 2, paddingVertical: 8, paddingHorizontal: 10, borderRadius: 10, backgroundColor: chrome.paper },
    statValue: { fontSize: 17, color: chrome.ink, fontFamily: fonts.bold },
    statLabel: { fontSize: 11, color: chrome.inkFaint, fontFamily: fonts.medium },
    zonesText: { fontSize: 12.5, color: chrome.ink, fontFamily: fonts.semibold },
    actions: { flexDirection: "row", flexWrap: "wrap", alignItems: "center", gap: 8 },
    empty: { alignItems: "center", gap: 8, padding: 26 },
    emptyTitle: { fontSize: 15, color: chrome.ink, fontFamily: fonts.bold },
    emptyText: { textAlign: "center", fontSize: 12.5, lineHeight: 18, color: chrome.inkFaint, fontFamily: fonts.regular, marginBottom: 4 },
  });
}
