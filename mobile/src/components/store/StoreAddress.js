import React, { useEffect, useRef } from "react";
import { StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { MANAGE_ADDRESS_SCREEN_UI } from "../../content/appContent";
import { STORE_ADDRESS } from "../../content/storefrontContent";
import { useDeliveryLocation } from "../../context/DeliveryLocationContext";
import { useStoreTheme } from "../../theme/storefront";
import { hapticSuccess } from "../../utils/haptics";
import { DeliveryChip, FormField, FormGroup, FormPair, GlassPill, MapThumb, StatusChip, placeLines } from "./AddressKit";
import Glass, { GlassDock } from "./Glass";
import StoreBanner from "./StoreBanner";
import StoreScreen from "./StoreScreen";
import { Button, Rise, SectionLabel, Segmented } from "./StoreKit";

const TYPES = [
  { key: "Home", label: STORE_ADDRESS.types.Home, icon: "home-outline" },
  { key: "Work", label: STORE_ADDRESS.types.Work, icon: "briefcase-outline" },
  { key: "Other", label: STORE_ADDRESS.types.Other, icon: "location-outline" },
];

/**
 * The saved address as one card: a map with the pin (tap it to move the pin), glass controls over the map, then the
 * street, the area and how far / how fast we deliver there.
 */
function PlaceCard({ kind, house, line1, landmark, city, postalCode, latitude, longitude, gps, detecting, detectLabel, onOpenMap, onDetect }) {
  const { c, r, type, shadow } = useStoreTheme();
  const { quote } = useDeliveryLocation();
  const hasAddress = Boolean(line1 || city);
  const { title, detail } = placeLines({ houseNumber: house, line1, landmark, city, postalCode });
  const icon = (TYPES.find((t) => t.key === kind) || TYPES[0]).icon;
  const mapLabel = MANAGE_ADDRESS_SCREEN_UI.useMap;

  return (
    <View style={[shadow.card, { backgroundColor: c.card, borderRadius: r.xl }]}>
      <View style={[styles.clip, { borderRadius: r.xl, borderColor: c.line }]}>
        <MapThumb latitude={latitude} longitude={longitude} height={168} inset={54} onPress={onOpenMap} accessibilityLabel={mapLabel}>
          {hasAddress ? (
            <View style={styles.mapTop} pointerEvents="none">
              <Glass material="thin" radius={15} style={styles.kindChip} contentStyle={styles.kindChipBody}>
                <Ionicons name={icon} size={15} color={c.brand} />
                <Text style={type.ui(12.5, "bold", c.ink)}>{`${kind || "Home"} · Default`}</Text>
              </Glass>
            </View>
          ) : null}
          <View style={styles.mapControls} pointerEvents="box-none">
            <GlassPill icon="map-outline" label={mapLabel} onPress={onOpenMap} />
            <GlassPill icon="locate" onPress={onDetect} loading={detecting} accessibilityLabel={detectLabel} />
          </View>
        </MapThumb>

        <View style={styles.body}>
          {hasAddress ? (
            <>
              <Text style={type.ui(17, "bold", c.ink, { letterSpacing: -0.2 })} numberOfLines={2}>
                {title}
              </Text>
              {detail ? (
                <Text style={type.ui(13.5, "medium", c.inkMute)} numberOfLines={2}>
                  {detail}
                </Text>
              ) : null}
              {quote || gps ? (
                <View style={styles.chips}>
                  <DeliveryChip quote={quote} />
                  {gps ? <StatusChip icon="checkmark-circle" label={STORE_ADDRESS.gpsVerified} /> : null}
                </View>
              ) : null}
            </>
          ) : (
            <>
              <Text style={type.ui(17, "bold", c.ink, { letterSpacing: -0.2 })}>{STORE_ADDRESS.add}</Text>
              <Text style={type.ui(13.5, "medium", c.inkMute)}>{MANAGE_ADDRESS_SCREEN_UI.mapHint}</Text>
            </>
          )}
        </View>
      </View>
    </View>
  );
}

/** Native address editor: the saved place on a map, then a grouped form, with Save always in reach. */
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
  latitude,
  longitude,
  gps,
  fieldErrors,
  detecting,
  detectLabel,
  onDetect,
  onOpenMap,
  saving,
  onSave,
}) {
  const scrollRef = useRef(null);
  const lastSuccess = useRef("");
  const fields = useRef([]);
  const focusNext = (index) => () => fields.current[index + 1]?.focus?.();
  const attach = (index) => (node) => {
    fields.current[index] = node;
  };

  useEffect(() => {
    if (success && success !== lastSuccess.current) hapticSuccess();
    lastSuccess.current = success;
  }, [success]);

  // Messages sit at the top of the page, so bring them into view.
  useEffect(() => {
    if (error || success) scrollRef.current?.scrollTo?.({ y: 0, animated: true });
  }, [error, success]);

  return (
    <StoreScreen
      title={STORE_ADDRESS.title}
      navigation={navigation}
      scrollRef={scrollRef}
      dock={
        <GlassDock>
          <Button label={saving ? STORE_ADDRESS.saving : STORE_ADDRESS.save} onPress={onSave} loading={saving} />
        </GlassDock>
      }
    >
      {error ? <StoreBanner message={error} onClose={onDismissError} /> : null}
      {success ? <StoreBanner tone="success" message={success} onClose={onDismissSuccess} /> : null}

      <Rise index={0}>
        <PlaceCard
          kind={addressType}
          house={houseNumber}
          line1={line1}
          landmark={landmark}
          city={city}
          postalCode={postalCode}
          latitude={latitude}
          longitude={longitude}
          gps={gps}
          detecting={detecting}
          detectLabel={detectLabel}
          onOpenMap={onOpenMap}
          onDetect={onDetect}
        />
      </Rise>

      <Rise index={1}>
        <SectionLabel>{STORE_ADDRESS.saveAs}</SectionLabel>
        <Segmented options={TYPES} value={addressType || "Home"} onChange={onAddressType} />
      </Rise>

      <Rise index={2}>
        <FormGroup>
          <FormField
            label={STORE_ADDRESS.fields.house}
            value={houseNumber}
            onChangeText={onHouseNumber}
            error={fieldErrors.houseNumber}
            inputRef={attach(0)}
            returnKeyType="next"
            blurOnSubmit={false}
            onSubmitEditing={focusNext(0)}
          />
          <FormField
            label={STORE_ADDRESS.fields.street}
            value={line1}
            onChangeText={onLine1}
            error={fieldErrors.line1}
            inputRef={attach(1)}
            returnKeyType="next"
            blurOnSubmit={false}
            onSubmitEditing={focusNext(1)}
          />
          <FormField
            label={STORE_ADDRESS.fields.landmark}
            value={landmark}
            onChangeText={onLandmark}
            placeholder={STORE_ADDRESS.fields.landmarkHint}
            inputRef={attach(2)}
            returnKeyType="next"
            blurOnSubmit={false}
            onSubmitEditing={focusNext(2)}
          />
          <FormPair>
            <FormField
              style={styles.half}
              label={STORE_ADDRESS.fields.city}
              value={city}
              onChangeText={onCity}
              error={fieldErrors.city}
              inputRef={attach(3)}
              returnKeyType="next"
              blurOnSubmit={false}
              onSubmitEditing={focusNext(3)}
            />
            <FormField
              style={styles.half}
              label={STORE_ADDRESS.fields.pincode}
              value={postalCode}
              onChangeText={onPostalCode}
              error={fieldErrors.postalCode}
              keyboardType="number-pad"
              inputRef={attach(4)}
              returnKeyType="done"
            />
          </FormPair>
        </FormGroup>
      </Rise>
    </StoreScreen>
  );
}

const styles = StyleSheet.create({
  clip: { overflow: "hidden", borderWidth: StyleSheet.hairlineWidth },
  mapTop: { position: "absolute", top: 12, left: 12 },
  kindChip: { height: 30 },
  kindChipBody: { height: 30, flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 11 },
  mapControls: { position: "absolute", left: 12, right: 12, bottom: 12, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  body: { paddingHorizontal: 16, paddingTop: 14, paddingBottom: 16, gap: 3 },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 9 },
  half: { flex: 1 },
});
