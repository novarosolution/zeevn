import React, { useState } from "react";
import { ActivityIndicator, Keyboard, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { PICK_LOCATION_UI } from "../../content/appContent";
import { STORE_COMMON, STORE_LOCATION } from "../../content/storefrontContent";
import { useStoreTheme, withAlpha } from "../../theme/storefront";
import PickLocationMap from "../location/PickLocationMap";
import { DeliveryChip, GlassPill, placeLines } from "./AddressKit";
import Glass from "./Glass";
import PressableScale from "./PressableScale";
import { Button } from "./StoreKit";

/** Rounded corners of the bottom sheet continue this far below the screen edge, so only the top two show. */
const SHEET_RADIUS = 28;
/** Search row: back button + field. */
const TOP_ROW = 44;

const hitSubtitle = (place) => [place?.line1, place?.city, place?.postalCode].filter(Boolean).join(", ") || place?.label || "";

/**
 * Native "Select location": the map fills the screen, glass controls float over it (back, search, locate) and a glass
 * sheet at the bottom names the pinned place, how far and how fast we deliver there, and confirms it. State and
 * handlers live in `PickLocationScreen`; this is only the view.
 */
export default function StorePickLocation({
  onBack,
  query,
  onQuery,
  hits,
  searching,
  showHits,
  onHit,
  latitude,
  longitude,
  quote,
  routePath,
  onMapPick,
  draft,
  hasPin,
  busy,
  error,
  onGps,
  onConfirm,
}) {
  const { c, r, type, isDark, gutter } = useStoreTheme();
  const insets = useSafeAreaInsets();
  const [sheetH, setSheetH] = useState(250);
  const lines = draft ? placeLines(draft) : null;
  const title = lines?.title || (hasPin ? STORE_LOCATION.selectedPlace : PICK_LOCATION_UI.hint);
  const detail = lines?.detail || "";
  const hasQuery = query.trim().length >= 2;
  const topPad = insets.top + 8;

  return (
    <View style={[styles.screen, { backgroundColor: c.page }]}>
      <PickLocationMap
        fill
        dark={isDark}
        latitude={latitude}
        longitude={longitude}
        storeLatitude={quote?.storeLatitude}
        storeLongitude={quote?.storeLongitude}
        path={routePath}
        padding={{ top: topPad + TOP_ROW + 8, bottom: Math.max(0, sheetH - SHEET_RADIUS) }}
        onPick={(point) => {
          Keyboard.dismiss();
          onMapPick(point);
        }}
        hint={false}
      />

      <LinearGradient
        pointerEvents="none"
        colors={[withAlpha(c.page, isDark ? 0.82 : 0.9), withAlpha(c.page, 0)]}
        style={[styles.scrim, { height: insets.top + 28 }]}
      />

      <View style={[styles.top, { paddingTop: topPad, paddingHorizontal: gutter }]} pointerEvents="box-none">
        <View style={styles.topRow}>
          <GlassPill icon="chevron-back" size={TOP_ROW} onPress={onBack} accessibilityLabel={STORE_COMMON.back} />
          <Glass material="regular" radius={TOP_ROW / 2} lift style={styles.search} contentStyle={styles.searchBody}>
            <Ionicons name="search" size={18} color={c.inkMute} />
            <TextInput
              value={query}
              onChangeText={onQuery}
              placeholder={PICK_LOCATION_UI.searchPlaceholder}
              placeholderTextColor={c.inkMute}
              selectionColor={c.brand}
              style={[type.ui(15.5, "medium", c.ink), styles.input]}
              autoCorrect={false}
              autoCapitalize="words"
              returnKeyType="search"
              accessibilityLabel={PICK_LOCATION_UI.title}
            />
            {searching ? (
              <ActivityIndicator size="small" color={c.brand} />
            ) : query ? (
              <PressableScale scaleTo={0.88} lite hitSlop={13} onPress={() => onQuery("")} accessibilityRole="button" accessibilityLabel="Clear search">
                <Ionicons name="close-circle" size={19} color={c.inkMute} />
              </PressableScale>
            ) : null}
          </Glass>
        </View>

        {showHits && hasQuery ? (
          <Glass material="regular" radius={r.xl} lift style={styles.hits} contentStyle={styles.hitsBody}>
            {searching ? (
              <Text style={[type.ui(14, "medium", c.inkMute), styles.hitMeta]}>{PICK_LOCATION_UI.searching}</Text>
            ) : hits.length === 0 ? (
              <Text style={[type.ui(14, "medium", c.inkMute), styles.hitMeta]}>{PICK_LOCATION_UI.empty}</Text>
            ) : (
              <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false} style={styles.hitScroll}>
                {hits.map((hit, index) => (
                  <PressableScale
                    key={`${hit.latitude}-${hit.longitude}-${index}`}
                    scaleTo={0.985}
                    lite
                    onPress={() => {
                      Keyboard.dismiss();
                      onHit(hit);
                    }}
                    accessibilityRole="button"
                    accessibilityLabel={hit.line1 || hit.city || STORE_LOCATION.place}
                    style={[styles.hit, index > 0 && { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: c.line }]}
                  >
                    <View style={[styles.hitIcon, { backgroundColor: c.brandSoft }]}>
                      <Ionicons name="location-outline" size={18} color={c.brand} />
                    </View>
                    <View style={styles.hitText}>
                      <Text style={type.ui(15, "bold", c.ink)} numberOfLines={1}>
                        {hit.line1 || hit.city || STORE_LOCATION.place}
                      </Text>
                      <Text style={type.ui(12.5, "medium", c.inkMute)} numberOfLines={2}>
                        {hitSubtitle(hit)}
                      </Text>
                    </View>
                  </PressableScale>
                ))}
              </ScrollView>
            )}
          </Glass>
        ) : null}
      </View>

      <View style={[styles.locate, { right: gutter, bottom: sheetH - SHEET_RADIUS + 14 }]} pointerEvents="box-none">
        <GlassPill icon="locate" size={TOP_ROW} onPress={onGps} loading={busy} accessibilityLabel={PICK_LOCATION_UI.gps} />
      </View>

      <View style={styles.sheetWrap} pointerEvents="box-none" onLayout={(e) => setSheetH(e.nativeEvent.layout.height)}>
        <Glass
          material="regular"
          radius={SHEET_RADIUS}
          lift="up"
          contentStyle={[styles.sheetBody, { paddingBottom: Math.max(16, insets.bottom) + SHEET_RADIUS, paddingHorizontal: gutter }]}
        >
          <View style={styles.sheetRow}>
            <View style={[styles.bubble, { backgroundColor: c.brandSoft }]}>
              <Ionicons name="location" size={21} color={c.brand} />
            </View>
            <View style={styles.sheetText}>
              <Text style={type.ui(17, "bold", c.ink, { letterSpacing: -0.2 })} numberOfLines={2}>
                {title}
              </Text>
              {detail ? (
                <Text style={type.ui(13.5, "medium", c.inkMute)} numberOfLines={2}>
                  {detail}
                </Text>
              ) : null}
            </View>
          </View>

          {hasPin && quote ? <DeliveryChip quote={quote} fromShop style={styles.chip} /> : null}

          {error ? (
            <View style={styles.errorRow}>
              <Ionicons name="alert-circle-outline" size={16} color={c.danger} />
              <Text style={[type.ui(13, "medium", c.danger), styles.errorText]}>{error}</Text>
            </View>
          ) : null}

          <Button label={PICK_LOCATION_UI.useHere} onPress={onConfirm} loading={busy} disabled={!hasPin} style={styles.confirm} />
        </Glass>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  scrim: { position: "absolute", top: 0, left: 0, right: 0 },
  top: { position: "absolute", top: 0, left: 0, right: 0 },
  topRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  search: { flex: 1, height: TOP_ROW },
  searchBody: { height: TOP_ROW, flexDirection: "row", alignItems: "center", gap: 9, paddingHorizontal: 15 },
  input: { flex: 1, minWidth: 0, paddingVertical: 0, height: TOP_ROW },
  hits: { marginTop: 10, maxHeight: 300 },
  hitsBody: { maxHeight: 300 },
  hitScroll: { maxHeight: 300 },
  hitMeta: { padding: 16 },
  hit: { flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 14, paddingVertical: 12 },
  hitIcon: { width: 36, height: 36, borderRadius: 13, alignItems: "center", justifyContent: "center" },
  hitText: { flex: 1, minWidth: 0, gap: 1 },
  locate: { position: "absolute" },
  sheetWrap: { position: "absolute", left: 0, right: 0, bottom: -SHEET_RADIUS },
  sheetBody: { paddingTop: 20 },
  sheetRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  bubble: { width: 44, height: 44, borderRadius: 16, alignItems: "center", justifyContent: "center" },
  sheetText: { flex: 1, minWidth: 0, gap: 2 },
  chip: { marginTop: 12, marginLeft: 56 },
  errorRow: { flexDirection: "row", alignItems: "center", gap: 7, marginTop: 12 },
  errorText: { flex: 1, minWidth: 0 },
  confirm: { marginTop: 16 },
});
