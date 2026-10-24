import React, { useEffect, useRef } from "react";
import { StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useStoreTheme } from "../../theme/storefront";
import { hapticSuccess } from "../../utils/haptics";
import StoreBanner from "./StoreBanner";
import StoreField from "./StoreField";
import StoreScreen from "./StoreScreen";
import { Button, Card, Rise, SectionLabel, Segmented } from "./StoreKit";

const TYPES = [
  { key: "Home", label: "Home", icon: "home-outline" },
  { key: "Work", label: "Work", icon: "briefcase-outline" },
  { key: "Other", label: "Other", icon: "location-outline" },
];

/** A landmark that already starts with a position word reads fine as is; anything else gets "Near". */
const LOCATIONAL = /^(near|nr\.?|opposite|opp\.?|behind|beside|next to|adjacent|above|below|in front of|front of|off|at|inside|within)\b/i;

function AddressPreview({ type, house, line1, landmark, city, postalCode, gps }) {
  const { c, type: font } = useStoreTheme();
  const icon = (TYPES.find((t) => t.key === type) || TYPES[0]).icon;
  const street = [house, line1].filter(Boolean).join(", ");
  const place = [city, postalCode].filter(Boolean).join(" · ");
  return (
    <Card style={styles.preview}>
      <View style={[styles.pin, { backgroundColor: c.brandSoft }]}>
        <Ionicons name={icon} size={24} color={c.brand} />
      </View>
      <View style={styles.previewText}>
        <View style={styles.previewHead}>
          <Text style={font.ui(16, "extrabold", c.ink)}>{type || "Home"}</Text>
          <View style={[styles.tag, { backgroundColor: c.goldSoft }]}>
            <Text style={font.ui(11, "extrabold", c.goldText, { letterSpacing: 0.4 })}>DEFAULT</Text>
          </View>
        </View>
        <Text style={font.ui(14.5, "medium", c.inkSoft, { lineHeight: 20 })} numberOfLines={2}>
          {street}
        </Text>
        {landmark ? (
          <Text style={font.ui(13, "medium", c.inkMute)} numberOfLines={1}>
            {LOCATIONAL.test(String(landmark).trim()) ? landmark : `Near ${landmark}`}
          </Text>
        ) : null}
        <Text style={font.ui(14.5, "semibold", c.ink)}>{place}</Text>
        {gps ? (
          <View style={styles.gps}>
            <Ionicons name="checkmark-circle" size={15} color={c.brand} />
            <Text style={font.ui(12.5, "bold", c.brand)}>GPS verified</Text>
          </View>
        ) : null}
      </View>
    </Card>
  );
}

/** Native address editor: saved-address preview, GPS detect, type switch and the fields. */
export default function StoreAddress({
  navigation,
  error,
  success,
  onDismissError,
  onDismissSuccess,
  addressType,
  onAddressType,
  houseNumber,
  onHouseNumber,
  line1,
  onLine1,
  landmark,
  onLandmark,
  city,
  onCity,
  postalCode,
  onPostalCode,
  country,
  onCountry,
  gps,
  fieldErrors,
  detecting,
  detectLabel,
  onDetect,
  saving,
  onSave,
}) {
  const hasAddress = Boolean(line1 || city);
  const lastSuccess = useRef("");

  useEffect(() => {
    if (success && success !== lastSuccess.current) hapticSuccess();
    lastSuccess.current = success;
  }, [success]);

  return (
    <StoreScreen title="Delivery address" navigation={navigation}>
      {error ? <StoreBanner message={error} onClose={onDismissError} /> : null}
      {success ? <StoreBanner tone="success" message={success} onClose={onDismissSuccess} /> : null}

      {hasAddress ? (
        <Rise index={0}>
          <AddressPreview type={addressType} house={houseNumber} line1={line1} landmark={landmark} city={city} postalCode={postalCode} gps={gps} />
        </Rise>
      ) : null}

      <Rise index={1}>
        <Button label={detectLabel} icon="locate" tone="secondary" onPress={onDetect} loading={detecting} />
      </Rise>

      <Rise index={2}>
        <SectionLabel>Save as</SectionLabel>
        <Segmented options={TYPES} value={addressType || "Home"} onChange={onAddressType} />
      </Rise>

      <Rise index={3}>
        <Card style={styles.fields}>
          <StoreField label="House / Flat / Building no." icon="business-outline" value={houseNumber} onChangeText={onHouseNumber} error={fieldErrors.houseNumber} />
          <StoreField label="Street / Area / Colony" icon="map-outline" value={line1} onChangeText={onLine1} error={fieldErrors.line1} />
          <StoreField label="Landmark (optional)" icon="navigate-outline" value={landmark} onChangeText={onLandmark} placeholder="e.g. Near city mall" />
          <View style={styles.pair}>
            <StoreField style={styles.half} label="City" value={city} onChangeText={onCity} error={fieldErrors.city} />
            <StoreField style={styles.half} label="Pincode" value={postalCode} onChangeText={onPostalCode} error={fieldErrors.postalCode} keyboardType="number-pad" />
          </View>
          <StoreField label="Country" icon="flag-outline" value={country} onChangeText={onCountry} placeholder="India" />
        </Card>
      </Rise>

      <Rise index={4}>
        <Button label="Save address" icon="save-outline" onPress={onSave} loading={saving} />
      </Rise>
    </StoreScreen>
  );
}

const styles = StyleSheet.create({
  preview: { flexDirection: "row", gap: 14, alignItems: "flex-start" },
  pin: { width: 52, height: 52, borderRadius: 18, alignItems: "center", justifyContent: "center" },
  previewText: { flex: 1, minWidth: 0, gap: 3 },
  previewHead: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 2 },
  tag: { height: 22, paddingHorizontal: 8, borderRadius: 11, alignItems: "center", justifyContent: "center" },
  gps: { flexDirection: "row", alignItems: "center", gap: 5, marginTop: 4 },
  fields: { gap: 12 },
  pair: { flexDirection: "row", gap: 12 },
  half: { flex: 1 },
});
