import React, { useMemo } from "react";
import { Platform, Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useAdminChrome } from "../../../theme/adminLayout";
import { fonts } from "../../../theme/tokens";
import AdminBadge from "../AdminBadge";
import AdminButton from "../AdminButton";
import AdminCard from "../AdminCard";
import AdminInput from "../AdminInput";
import AdminSwitch from "../AdminSwitch";

/**
 * Shops tab: where deliveries start from, how far each shop delivers on its own, and how delivery time is worked out.
 * All edits are local until "Save shops" — the parent owns the data and the save.
 */
export default function ZoneShops({
  stores,
  storeId,
  minutesPerKm,
  dirty,
  busy,
  pinMode,
  canPin = true,
  onSelect,
  onChangeStore,
  onChangeMinutes,
  onPinMode,
  onSave,
  onReset,
}) {
  const chrome = useAdminChrome();
  const styles = useMemo(() => createStyles(chrome), [chrome]);
  const minutes = Number(minutesPerKm);
  const example = Number.isFinite(minutes) && minutes > 0 ? Math.max(1, Math.round(5 * minutes)) : null;

  return (
    <View style={styles.wrap}>
      <AdminCard title="Delivery time" icon="timer-outline" subtitle="Time shown to customers is the distance from the nearest shop times this.">
        <AdminInput label="Minutes per km" value={String(minutesPerKm)} onChangeText={onChangeMinutes} numeric suffix="min / km" placeholder="3" style={styles.minutes} />
        {example ? <Text style={styles.preview}>A customer 5 km away is quoted about {example} minutes.</Text> : <Text style={styles.warn}>Enter a number above 0.</Text>}
      </AdminCard>

      <Text style={styles.listTitle}>Shop</Text>

      {stores.map((shop, index) => {
        const selected = String(shop._id) === String(storeId);
        const off = shop.isActive === false;
        return (
          <View key={String(shop._id || index)} style={[styles.card, selected && styles.selected]}>
            <Pressable onPress={() => onSelect(shop)} style={styles.cardTop} accessibilityRole="button">
              <View style={styles.shopIcon}>
                <Ionicons name="storefront-outline" size={16} color={chrome.goldDeep} />
              </View>
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text style={styles.shopName} numberOfLines={1}>
                  {shop.label || `Shop ${index + 1}`}
                </Text>
                <Text style={styles.sub} numberOfLines={1}>
                  {Number(shop.maxRadiusKm) > 0 ? `Delivers up to ${Number(shop.maxRadiusKm)} km on its own` : "No radius — zones only"} · {Number(shop.latitude).toFixed(4)}, {Number(shop.longitude).toFixed(4)}
                </Text>
              </View>
              <AdminBadge label={off ? "Closed" : "Open"} tone={off ? "neutral" : "green"} size="sm" dot />
            </Pressable>

            {selected ? (
              <View style={styles.editor}>
                <AdminInput label="Shop name" value={shop.label || ""} onChangeText={(v) => onChangeStore(shop._id, { label: v })} autoCapitalize="words" />
                <AdminInput
                  label="Delivers on its own up to"
                  value={String(shop.maxRadiusKm ?? "")}
                  onChangeText={(v) => onChangeStore(shop._id, { maxRadiusKm: v })}
                  numeric
                  suffix="km"
                  hint="Customers inside this circle are covered even without a drawn zone. 0 = zones only."
                />
                <View style={styles.switchRow}>
                  <Text style={styles.switchTitle}>Shop is open for deliveries</Text>
                  <AdminSwitch value={!off} onChange={(on) => onChangeStore(shop._id, { isActive: on })} accessibilityLabel="Shop active" />
                </View>
                {canPin ? (
                  <View style={styles.buttons}>
                    <AdminButton
                      label={pinMode ? "Click the map…" : "Move pin on map"}
                      icon="locate-outline"
                      size="sm"
                      variant={pinMode ? "primary" : "soft"}
                      onPress={onPinMode}
                    />
                  </View>
                ) : (
                  <Text style={styles.sub}>The shop pin is set on the web admin or Store home.</Text>
                )}
              </View>
            ) : null}
          </View>
        );
      })}

      {dirty ? (
        <View style={styles.saveBar}>
          <Text style={styles.saveText}>Unsaved shop changes</Text>
          <AdminButton label="Reset" variant="ghost" size="sm" onPress={onReset} disabled={busy} />
          <AdminButton label="Save shops" icon="checkmark" variant="primary" size="sm" loading={busy} onPress={onSave} />
        </View>
      ) : null}
    </View>
  );
}

function createStyles(chrome) {
  return StyleSheet.create({
    wrap: { gap: 12 },
    minutes: { maxWidth: 220 },
    preview: { fontSize: 13, color: chrome.ink, fontFamily: fonts.medium },
    warn: { fontSize: 12.5, color: chrome.danger, fontFamily: fonts.medium },
    listHead: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingTop: 4 },
    listTitle: { fontSize: 11, letterSpacing: 0.6, textTransform: "uppercase", color: chrome.inkFaint, fontFamily: fonts.semibold },
    card: { borderRadius: 14, backgroundColor: chrome.card, borderWidth: 1, borderColor: chrome.line, overflow: "hidden" },
    selected: { borderColor: chrome.goldDeep },
    cardTop: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      padding: 14,
      ...Platform.select({ web: { cursor: "pointer" }, default: {} }),
    },
    shopIcon: {
      width: 32,
      height: 32,
      borderRadius: 10,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: chrome.chipOnBg,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: chrome.chipOnBorder,
    },
    shopName: { fontSize: 14.5, color: chrome.ink, fontFamily: fonts.bold },
    sub: { fontSize: 11.5, color: chrome.inkFaint, fontFamily: fonts.regular, marginTop: 1 },
    editor: { gap: 12, padding: 14, paddingTop: 12, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: chrome.lineSoft, backgroundColor: chrome.paper },
    switchRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 12 },
    switchTitle: { flex: 1, fontSize: 13.5, color: chrome.ink, fontFamily: fonts.semibold },
    buttons: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
    saveBar: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      padding: 12,
      borderRadius: 14,
      backgroundColor: chrome.card,
      borderWidth: 1,
      borderColor: chrome.goldDeep,
      ...Platform.select({ web: { position: "sticky", bottom: 12, zIndex: 5, boxShadow: "0 12px 30px -14px rgba(20,24,16,0.35)" }, default: {} }),
    },
    saveText: { flex: 1, fontSize: 13, color: chrome.ink, fontFamily: fonts.semibold },
  });
}
