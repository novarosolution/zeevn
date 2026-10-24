import React, { useMemo, useState } from "react";
import { Platform, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useAdminChrome } from "../../../theme/adminLayout";
import { getAdminTone } from "../../../theme/adminTones";
import { useTheme } from "../../../context/ThemeContext";
import { fonts } from "../../../theme/tokens";
import AdminAvatar from "../AdminAvatar";
import AdminBadge from "../AdminBadge";
import AdminButton from "../AdminButton";
import AdminCard from "../AdminCard";
import AdminCheckbox from "../AdminCheckbox";
import AdminChipsInput from "../AdminChipsInput";
import AdminInput from "../AdminInput";
import AdminSwitch from "../AdminSwitch";
import { feePreview, isValidPincode, zonePartnerIds } from "./zoneHelpers";

/**
 * Create / edit one zone beside the map. The drawn area lives in the parent (`points`) because the map edits it;
 * everything else is local form state, sent to `onSave` as one payload.
 */
export default function ZoneEditor({ zone, riders, points, drawing, saving, error, canDraw = true, onToggleDraw, onUndo, onClearArea, onSave, onCancel, onDelete }) {
  const chrome = useAdminChrome();
  const { isDark } = useTheme();
  const styles = useMemo(() => createStyles(chrome), [chrome]);
  const red = getAdminTone("red", isDark);

  const [name, setName] = useState(zone?.name || "");
  const [active, setActive] = useState(zone ? zone.isActive !== false : true);
  const [fee, setFee] = useState(String(zone?.deliveryFee ?? 0));
  const [freeAbove, setFreeAbove] = useState(String(zone?.freeAbove ?? 1499));
  const [pins, setPins] = useState(zone?.postalCodes || []);
  const [cities, setCities] = useState(zone?.cities || []);
  const [partnerIds, setPartnerIds] = useState(zone ? zonePartnerIds(zone) : []);
  const [touched, setTouched] = useState(false);

  const hasArea = points.length >= 3;
  const nameMissing = !name.trim();
  const blocked = nameMissing;

  const toggleRider = (id) => setPartnerIds((list) => (list.includes(id) ? list.filter((x) => x !== id) : [...list, id]));

  const submit = () => {
    setTouched(true);
    if (blocked || saving) return;
    onSave({
      name: name.trim(),
      isActive: active,
      deliveryFee: Math.max(0, Number(fee) || 0),
      freeAbove: Math.max(0, Number(freeAbove) || 0),
      postalCodes: pins,
      cities,
      polygon: points,
      partnerIds,
    });
  };

  return (
    <View style={styles.wrap}>
      <View style={styles.head}>
        <AdminButton icon="arrow-back" label="All zones" variant="ghost" size="sm" onPress={onCancel} />
        <AdminBadge label={zone ? "Editing" : "New zone"} tone={zone ? "gold" : "olive"} />
      </View>

      <AdminCard title="Basics" icon="location-outline">
        <AdminInput
          label="Zone name"
          value={name}
          onChangeText={setName}
          placeholder="e.g. Gandhinagar Central"
          autoCapitalize="words"
          error={touched && nameMissing ? "Give the zone a name." : undefined}
        />
        <View style={styles.switchRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.switchTitle}>Accepting deliveries</Text>
            <Text style={styles.hint}>{active ? "Customers in this zone can order." : "Paused — customers here are told delivery isn't possible."}</Text>
          </View>
          <AdminSwitch value={active} onChange={setActive} accessibilityLabel="Zone live" />
        </View>
      </AdminCard>

      <AdminCard title="Delivery price" icon="pricetag-outline">
        <View style={styles.twoCol}>
          <AdminInput label="Delivery fee" value={fee} onChangeText={setFee} numeric prefix="₹" placeholder="0" style={styles.col} />
          <AdminInput label="Free above" value={freeAbove} onChangeText={setFreeAbove} numeric prefix="₹" placeholder="0" style={styles.col} />
        </View>
        <Text style={styles.preview}>{feePreview(fee, freeAbove)}</Text>
        <Text style={styles.hint}>Set “Free above” to 0 if delivery is never free.</Text>
      </AdminCard>

      <AdminCard title="Where it covers" icon="map-outline" subtitle="Use any mix — a drawn area is the most exact.">
        <View style={styles.areaRow}>
          {hasArea ? <AdminBadge label={`Area drawn · ${points.length} points`} tone="green" icon="checkmark-circle-outline" /> : <AdminBadge label={points.length ? `${points.length} of 3 points` : "No area drawn"} tone="neutral" />}
        </View>
        {canDraw ? (
          <>
            <View style={styles.buttons}>
              <AdminButton
                label={drawing ? "Finish drawing" : points.length ? "Edit on map" : "Draw on map"}
                icon={drawing ? "checkmark" : "create-outline"}
                size="sm"
                variant={drawing ? "primary" : "soft"}
                onPress={onToggleDraw}
              />
              {points.length ? <AdminButton label="Undo" icon="arrow-undo-outline" size="sm" variant="ghost" onPress={onUndo} /> : null}
              {points.length ? <AdminButton label="Clear" icon="trash-outline" size="sm" variant="ghost" onPress={onClearArea} /> : null}
            </View>
            {drawing ? <Text style={styles.drawHint}>Click the map to add corners. Drag a numbered point to adjust it, click one to remove it. You need at least 3.</Text> : null}
          </>
        ) : (
          <Text style={styles.hint}>The outline is drawn on the web admin.</Text>
        )}

        <AdminChipsInput
          label="Pincodes"
          values={pins}
          onChange={setPins}
          placeholder="382007, 382010 …"
          normalize={(raw) => (isValidPincode(raw) ? String(raw).replace(/\s/g, "") : "")}
          invalidMessage="Pincodes are 6 digits."
          tone="olive"
        />
        <AdminChipsInput
          label="Cities"
          values={cities}
          onChange={setCities}
          placeholder="Only if you can't draw — e.g. Gandhinagar"
          normalize={(raw) => String(raw).trim().toLowerCase().replace(/\s+/g, " ")}
          separators={/[,\n]+/}
          tone="blue"
        />
        <Text style={styles.hint}>
          {"When we know a customer's exact pin, the drawn area (or the shop radius) decides. Pincodes and cities are used when we don't."}
        </Text>
      </AdminCard>

      <AdminCard title="Riders" icon="bicycle-outline" subtitle={partnerIds.length ? `${partnerIds.length} chosen — only they are assigned here.` : "Nobody chosen — any rider can be assigned here."}>
        {riders.length ? (
          riders.map((rider) => {
            const id = String(rider._id);
            const on = partnerIds.includes(id);
            return (
              <View key={id} style={styles.riderRow}>
                <AdminCheckbox checked={on} onChange={() => toggleRider(id)} accessibilityLabel={`${rider.name} delivers here`} />
                <AdminAvatar name={rider.name} size={28} online={rider.online} />
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Text style={styles.riderName} numberOfLines={1}>
                    {rider.name}
                  </Text>
                  <Text style={styles.hint} numberOfLines={1}>
                    {rider.online ? "Online now" : "Offline"} · {rider.active ? `${rider.active} active` : "free"}
                  </Text>
                </View>
              </View>
            );
          })
        ) : (
          <Text style={styles.hint}>No delivery partners yet. Turn a user into a rider from the Users page.</Text>
        )}
      </AdminCard>

      {error ? (
        <View style={[styles.errorBox, { backgroundColor: red.bg, borderColor: red.border }]}>
          <Ionicons name="alert-circle-outline" size={15} color={red.fg} />
          <Text style={[styles.errorText, { color: red.fg }]}>{error}</Text>
        </View>
      ) : null}

      <View style={styles.footer}>
        <AdminButton label="Cancel" variant="soft" size="md" onPress={onCancel} disabled={saving} />
        <AdminButton label={zone ? "Save changes" : "Create zone"} icon="checkmark" variant="primary" size="md" loading={saving} onPress={submit} />
      </View>

      {zone ? (
        <View style={styles.danger}>
          <AdminButton label="Delete this zone" icon="trash-outline" variant="danger" size="sm" onPress={onDelete} disabled={saving} />
          <Text style={styles.hint}>Existing orders keep their zone name. Customers in this area will no longer be deliverable unless the shop radius covers them.</Text>
        </View>
      ) : null}
    </View>
  );
}

function createStyles(chrome) {
  return StyleSheet.create({
    wrap: { gap: 12 },
    head: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
    switchRow: { flexDirection: "row", alignItems: "center", gap: 12, paddingTop: 4 },
    switchTitle: { fontSize: 13.5, color: chrome.ink, fontFamily: fonts.semibold },
    hint: { fontSize: 12, lineHeight: 17, color: chrome.inkFaint, fontFamily: fonts.regular },
    twoCol: { flexDirection: "row", gap: 10 },
    col: { flex: 1, minWidth: 0 },
    preview: { fontSize: 13, lineHeight: 19, color: chrome.ink, fontFamily: fonts.medium },
    areaRow: { flexDirection: "row", alignItems: "center", gap: 8 },
    buttons: { flexDirection: "row", flexWrap: "wrap", alignItems: "center", gap: 8 },
    drawHint: { fontSize: 12.5, lineHeight: 18, color: chrome.goldDeep, fontFamily: fonts.medium },
    riderRow: { flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 6 },
    riderName: { fontSize: 13.5, color: chrome.ink, fontFamily: fonts.semibold },
    errorBox: { flexDirection: "row", alignItems: "center", gap: 8, padding: 10, borderRadius: 10, borderWidth: StyleSheet.hairlineWidth },
    errorText: { flex: 1, fontSize: 12.5, fontFamily: fonts.semibold },
    footer: {
      flexDirection: "row",
      justifyContent: "flex-end",
      gap: 10,
      padding: 12,
      borderRadius: 14,
      backgroundColor: chrome.card,
      borderWidth: 1,
      borderColor: chrome.line,
      ...Platform.select({ web: { position: "sticky", bottom: 12, zIndex: 5, boxShadow: "0 12px 30px -14px rgba(20,24,16,0.35)" }, default: {} }),
    },
    danger: { gap: 8, paddingTop: 6 },
  });
}
