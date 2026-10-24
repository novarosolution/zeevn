import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import PickLocationMap from "../components/location/PickLocationMap";
import { StorePickLocation } from "../components/store/entry";
import { useDeliveryLocation } from "../context/DeliveryLocationContext";
import { useTheme } from "../context/ThemeContext";
import { PICK_LOCATION_UI } from "../content/appContent";
import { checkDeliveryServiceability, etaFromQuote } from "../services/deliveryService";
import {
  addressFromCoords,
  getCurrentAddressFromGPS,
  searchPlaces,
  validMapCoord,
} from "../services/locationService";
import { pathFromQuote } from "../utils/polylineRoute";
import { FIGMA } from "../theme/figmaApp";
import { fonts, spacing } from "../theme/tokens";

function placeLabel(place) {
  return (
    place?.label ||
    [place?.line1, place?.city, place?.postalCode].filter(Boolean).join(", ") ||
    "Selected place"
  );
}

export default function PickLocationScreen({ navigation, route }) {
  const { colors: c, isDark } = useTheme();
  const { applyPlace } = useDeliveryLocation();
  const startLat = route?.params?.latitude;
  const startLng = route?.params?.longitude;
  const applyLive = route?.params?.applyLive !== false;
  const returnTo = route?.params?.returnTo;
  const returnParams = route?.params?.returnParams || {};

  const [latitude, setLatitude] = useState(validMapCoord(startLat) ? Number(startLat) : null);
  const [longitude, setLongitude] = useState(validMapCoord(startLng) ? Number(startLng) : null);
  const [draft, setDraft] = useState(null);
  const [query, setQuery] = useState("");
  const [hits, setHits] = useState([]);
  const [searching, setSearching] = useState(false);
  const [showHits, setShowHits] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [mapH, setMapH] = useState(420);
  const [quote, setQuote] = useState(null);

  const hasPin = validMapCoord(latitude) && validMapCoord(longitude);
  const routePath = useMemo(() => pathFromQuote(quote), [quote]);
  const eta = etaFromQuote(quote);
  const distance = quote?.distanceLabel || "";
  const preview = [
    draft ? placeLabel(draft) : hasPin ? PICK_LOCATION_UI.hint : PICK_LOCATION_UI.hint,
    quote?.serviceable === false
      ? quote.message
      : [distance && `${distance} from shop`, eta].filter(Boolean).join(" · "),
  ]
    .filter(Boolean)
    .join("\n");

  useEffect(() => {
    const q = query.trim();
    if (q.length < 2) {
      setHits([]);
      setSearching(false);
      setShowHits(false);
      return undefined;
    }
    let cancelled = false;
    const t = setTimeout(async () => {
      setSearching(true);
      try {
        const next = await searchPlaces(q);
        if (!cancelled) {
          setHits(next);
          setShowHits(true);
        }
      } catch {
        if (!cancelled) setHits([]);
      } finally {
        if (!cancelled) setSearching(false);
      }
    }, 350);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [query]);

  useEffect(() => {
    if (!hasPin) {
      setQuote(null);
      return undefined;
    }
    let cancelled = false;
    const t = setTimeout(() => {
      checkDeliveryServiceability({ latitude, longitude })
        .then((res) => {
          if (!cancelled) setQuote(res);
        })
        .catch(() => {
          if (!cancelled) setQuote(null);
        });
    }, 280);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [hasPin, latitude, longitude]);

  // Opened on a saved pin: name the place right away instead of waiting for a tap on the map.
  const namedStart = useRef(false);
  useEffect(() => {
    if (namedStart.current || !hasPin || draft) return undefined;
    namedStart.current = true;
    let cancelled = false;
    addressFromCoords(latitude, longitude)
      .then((place) => {
        if (!cancelled) setDraft((current) => current || place);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [hasPin, draft, latitude, longitude]);

  const goBack = () => {
    if (returnTo) {
      navigation.navigate({ name: returnTo, params: returnParams, merge: true });
      return;
    }
    if (navigation.canGoBack()) navigation.goBack();
    else navigation.navigate("ManageAddress");
  };

  const setPlace = (place) => {
    if (!place) return;
    if (validMapCoord(place.latitude)) setLatitude(Number(place.latitude));
    if (validMapCoord(place.longitude)) setLongitude(Number(place.longitude));
    setDraft(place);
    setError("");
    setHits([]);
  };

  const handleMapPick = async ({ latitude: lat, longitude: lng }) => {
    setLatitude(lat);
    setLongitude(lng);
    try {
      const place = await addressFromCoords(lat, lng);
      setDraft(place);
      setError("");
    } catch (err) {
      setDraft({ latitude: lat, longitude: lng, label: "Selected place" });
      setError(err.message || "Pin set. Search if the street is blank.");
    }
  };

  const handleHit = (place) => {
    setQuery(place.line1 || place.city || "");
    setShowHits(false);
    setPlace(place);
  };

  const handleGps = async () => {
    try {
      setBusy(true);
      setError("");
      const place = await getCurrentAddressFromGPS();
      setPlace(place);
    } catch (err) {
      setError(err.message || "Unable to get current location.");
    } finally {
      setBusy(false);
    }
  };

  const handleConfirm = async () => {
    if (!hasPin) {
      setError("Search or tap the map first.");
      return;
    }
    try {
      setBusy(true);
      setError("");
      const place =
        draft && validMapCoord(draft.latitude)
          ? draft
          : await addressFromCoords(latitude, longitude);
      if (applyLive) await applyPlace(place);
      if (returnTo) {
        navigation.navigate({
          name: returnTo,
          params: { ...returnParams, pickedPlace: place },
          merge: true,
        });
        return;
      }
      navigation.goBack();
    } catch (err) {
      setError(err.message || "Unable to use this place.");
    } finally {
      setBusy(false);
    }
  };

  const styles = useMemo(() => createStyles(c, isDark), [c, isDark]);

  if (Platform.OS !== "web") {
    return (
      <StorePickLocation
        onBack={goBack}
        query={query}
        onQuery={(text) => {
          setQuery(text);
          setShowHits(true);
        }}
        hits={hits}
        searching={searching}
        showHits={showHits}
        onHit={handleHit}
        latitude={latitude}
        longitude={longitude}
        quote={quote}
        routePath={routePath}
        onMapPick={handleMapPick}
        draft={draft}
        hasPin={hasPin}
        busy={busy}
        error={error}
        onGps={handleGps}
        onConfirm={handleConfirm}
      />
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <View style={styles.top}>
          <Pressable
            onPress={goBack}
            style={({ pressed }) => [styles.back, pressed && styles.pressed]}
            accessibilityRole="button"
            accessibilityLabel="Back"
          >
            <Ionicons name="chevron-back" size={22} color={c.textPrimary} />
          </Pressable>
          <Text style={styles.title}>{PICK_LOCATION_UI.title}</Text>
          <View style={styles.back} />
        </View>

        <View style={styles.searchWrap}>
          <View style={styles.searchBox}>
            <Ionicons name="search" size={16} color={c.textMuted || FIGMA.inkFaint} />
            <TextInput
              value={query}
              onChangeText={(text) => {
                setQuery(text);
                setShowHits(true);
              }}
              placeholder={PICK_LOCATION_UI.searchPlaceholder}
              placeholderTextColor={c.textMuted || FIGMA.inkFaint}
              style={styles.searchInput}
              autoCorrect={false}
              autoCapitalize="words"
              returnKeyType="search"
            />
            {query ? (
              <Pressable onPress={() => setQuery("")} hitSlop={8} accessibilityRole="button">
                <Ionicons name="close-circle" size={16} color={c.textMuted || FIGMA.inkFaint} />
              </Pressable>
            ) : null}
          </View>
          {showHits && query.trim().length >= 2 ? (
            <View style={styles.hits}>
              {searching ? (
                <Text style={styles.hitMeta}>{PICK_LOCATION_UI.searching}</Text>
              ) : hits.length === 0 ? (
                <Text style={styles.hitMeta}>{PICK_LOCATION_UI.empty}</Text>
              ) : (
                hits.map((hit, index) => (
                  <Pressable
                    key={`${hit.latitude}-${hit.longitude}-${index}`}
                    onPress={() => handleHit(hit)}
                    style={({ pressed }) => [styles.hit, pressed && styles.pressed]}
                  >
                    <Ionicons name="location-outline" size={16} color={FIGMA.goldDeep} />
                    <View style={styles.hitText}>
                      <Text style={styles.hitTitle} numberOfLines={1}>
                        {hit.line1 || hit.city || "Place"}
                      </Text>
                      <Text style={styles.hitSub} numberOfLines={2}>
                        {placeLabel(hit)}
                      </Text>
                    </View>
                  </Pressable>
                ))
              )}
            </View>
          ) : null}
        </View>

        <View style={styles.map} onLayout={(e) => setMapH(Math.max(220, e.nativeEvent.layout.height))}>
          <PickLocationMap
            latitude={latitude}
            longitude={longitude}
            storeLatitude={quote?.storeLatitude}
            storeLongitude={quote?.storeLongitude}
            path={routePath}
            onPick={handleMapPick}
            height={mapH}
            hint={false}
          />
        </View>

        <View style={styles.dock}>
          {error ? <Text style={styles.error}>{error}</Text> : null}
          <Text style={styles.preview} numberOfLines={3}>
            {preview}
          </Text>
          <Pressable
            onPress={handleGps}
            disabled={busy}
            style={({ pressed }) => [styles.gps, pressed && styles.pressed]}
          >
            <Ionicons name="locate" size={16} color={FIGMA.goldDeep} />
            <Text style={styles.gpsText}>{busy ? PICK_LOCATION_UI.locating : PICK_LOCATION_UI.gps}</Text>
          </Pressable>
          <Pressable
            onPress={handleConfirm}
            disabled={busy || !hasPin}
            style={({ pressed }) => [styles.confirm, (!hasPin || busy) && styles.confirmOff, pressed && styles.pressed]}
            accessibilityRole="button"
          >
            {busy ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.confirmText}>{PICK_LOCATION_UI.useHere}</Text>
            )}
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function createStyles(c, isDark) {
  return StyleSheet.create({
    safe: { flex: 1, backgroundColor: isDark ? c.background : FIGMA.paper },
    flex: { flex: 1 },
    top: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 12,
      paddingBottom: 8,
    },
    back: {
      width: 40,
      height: 40,
      borderRadius: 20,
      alignItems: "center",
      justifyContent: "center",
    },
    title: {
      flex: 1,
      textAlign: "center",
      fontFamily: fonts.semibold,
      fontSize: 17,
      color: c.textPrimary,
      letterSpacing: -0.2,
    },
    searchWrap: {
      zIndex: 8,
      paddingHorizontal: 16,
      marginBottom: 10,
    },
    searchBox: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      minHeight: 48,
      paddingHorizontal: 14,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: c.border || FIGMA.line,
      backgroundColor: isDark ? c.surface : "#fff",
    },
    searchInput: {
      flex: 1,
      fontFamily: fonts.medium,
      fontSize: 16,
      color: c.textPrimary,
      paddingVertical: 10,
    },
    hits: {
      marginTop: 8,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: c.border || FIGMA.line,
      backgroundColor: isDark ? c.surface : "#fff",
      overflow: "hidden",
      maxHeight: 260,
    },
    hit: {
      flexDirection: "row",
      alignItems: "flex-start",
      gap: 10,
      paddingHorizontal: 12,
      paddingVertical: 12,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: c.border || FIGMA.line,
    },
    hitText: { flex: 1, minWidth: 0 },
    hitTitle: {
      fontFamily: fonts.semibold,
      fontSize: 14,
      color: c.textPrimary,
    },
    hitSub: {
      fontFamily: fonts.regular,
      fontSize: 12,
      color: c.textSecondary,
      marginTop: 2,
    },
    hitMeta: {
      fontFamily: fonts.medium,
      fontSize: 13,
      color: c.textSecondary,
      padding: 14,
    },
    map: {
      flex: 1,
      minHeight: 240,
      marginHorizontal: 16,
      borderRadius: 18,
      overflow: "hidden",
    },
    dock: {
      paddingHorizontal: 16,
      paddingTop: 12,
      paddingBottom: spacing.sm,
      gap: 8,
    },
    preview: {
      fontFamily: fonts.medium,
      fontSize: 13,
      color: c.textSecondary,
      lineHeight: 18,
    },
    error: {
      fontFamily: fonts.medium,
      fontSize: 13,
      color: c.danger || "#9A3B2F",
    },
    gps: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
      minHeight: 44,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: "rgba(220, 172, 116, 0.4)",
      backgroundColor: "rgba(176,141,87,0.08)",
    },
    gpsText: {
      fontFamily: fonts.semibold,
      fontSize: 14,
      color: c.textPrimary,
    },
    confirm: {
      minHeight: 50,
      borderRadius: 999,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: "#1a1612",
    },
    confirmOff: { opacity: 0.45 },
    confirmText: {
      fontFamily: fonts.bold,
      fontSize: 15,
      color: "#fff",
    },
    pressed: { opacity: 0.88, transform: [{ scale: 0.97 }] },
  });
}
