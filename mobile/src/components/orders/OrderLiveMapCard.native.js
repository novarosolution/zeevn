import React, { useEffect, useRef, useState } from "react";
import { ActivityIndicator, Linking, Platform, StyleSheet, Text, View } from "react-native";
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from "react-native-maps";
import { Ionicons } from "@expo/vector-icons";
import Animated, {
  Easing,
  cancelAnimation,
  interpolate,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";
import { ORDER_LIVE_TRACKING } from "../../content/appContent";
import { fetchOrderDrivingRoute } from "../../services/userService";
import useOrderLiveLocation from "../../hooks/useOrderLiveLocation";
import { useStoreTheme, withAlpha } from "../../theme/storefront";
import { decodeGooglePolyline } from "../../utils/polylineRoute";
import { formatLiveLocationUpdatedLine } from "../../utils/formatLiveLocationUpdated";
import { collectOrderMapPoints, computeMapRegionFromPoints } from "../../utils/orderMapBounds";
import PressableScale from "../store/PressableScale";
import { Button, Card } from "../store/StoreKit";
import { openMapsDirections, STALE_MS } from "./orderLiveMapShared";

const MAP_HEIGHT = 220;

/** The API answers 404/403 with these while a delivery is simply not under way yet. That is a state, not an error. */
const WAITING_RE = /no delivery partner|not shared|available after|not been assigned/i;
const isWaitingMessage = (message) => WAITING_RE.test(String(message || ""));

/** Minimal Google Maps styling for Android dark mode (fewer POIs, muted roads). */
const ANDROID_MAP_STYLE_DARK = [
  { elementType: "geometry", stylers: [{ color: "#1f2937" }] },
  { elementType: "labels.icon", stylers: [{ visibility: "off" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#9ca3af" }] },
  { featureType: "poi", stylers: [{ visibility: "off" }] },
  { featureType: "road", elementType: "geometry", stylers: [{ color: "#374151" }] },
  { featureType: "water", elementType: "geometry", stylers: [{ color: "#111827" }] },
];

function hasDestinationSummary(dest) {
  if (!dest || typeof dest !== "object") return false;
  return Boolean(String(dest.fullName || "").trim() || String(dest.line1 || "").trim() || String(dest.city || "").trim());
}

function formatDestinationSubtitle(dest) {
  if (!dest || typeof dest !== "object") return "";
  const cityState = [dest.city, dest.state].filter((x) => String(x || "").trim()).join(", ");
  const parts = [String(dest.line1 || "").trim(), cityState, String(dest.postalCode || "").trim()].filter(Boolean);
  return parts.join(" · ");
}

/** A small "live" dot with one soft ring that expands and fades. Holds still with Reduce Motion. */
function LiveDot({ color }) {
  const reduced = useReducedMotion();
  const t = useSharedValue(0);
  useEffect(() => {
    if (reduced) return undefined;
    t.value = withRepeat(withTiming(1, { duration: 1800, easing: Easing.out(Easing.quad) }), -1, false);
    return () => cancelAnimation(t);
  }, [reduced, t]);
  const ring = useAnimatedStyle(() => ({
    opacity: interpolate(t.value, [0, 1], [0.45, 0]),
    transform: [{ scale: interpolate(t.value, [0, 1], [1, 2.6]) }],
  }));
  return (
    <View style={styles.dotBox}>
      <Animated.View style={[styles.dotRing, { backgroundColor: color }, ring]} />
      <View style={[styles.dot, { backgroundColor: color }]} />
    </View>
  );
}

/**
 * Live delivery tracking on an order: who is bringing it, where they are, and where it is going. Until the partner shares a
 * location the card says so plainly (no map, no admin hints); once they do it shows the map, the route and "Open in Maps".
 */
export default function OrderLiveMapCard({ orderId }) {
  const { c, r, type, isDark } = useStoreTheme();
  const { data, error, loading } = useOrderLiveLocation(orderId);
  const [routeCoords, setRouteCoords] = useState(null);
  const lastDrivingFetchRef = useRef(0);

  const partnerName = data?.partner?.name?.trim() || "";
  const partnerPhone = data?.partner?.phone?.trim() || "";
  const trackable = Boolean(data?.trackable);
  const plat = Number(data?.latitude);
  const plng = Number(data?.longitude);
  const shop = data?.shop && typeof data.shop === "object" ? data.shop : {};
  const shopLabel = String(shop.name || "").trim() || ORDER_LIVE_TRACKING.markerShop;
  const slat = Number(shop.latitude);
  const slng = Number(shop.longitude);
  const hasShop = Number.isFinite(slat) && Number.isFinite(slng);

  const dest = data?.destination && typeof data.destination === "object" ? data.destination : {};
  const dlat = Number(dest.latitude);
  const dlng = Number(dest.longitude);
  const hasDest = Number.isFinite(dlat) && Number.isFinite(dlng);
  const hasPartner = Number.isFinite(plat) && Number.isFinite(plng);

  const mapPoints = collectOrderMapPoints({
    shop: hasShop ? { latitude: slat, longitude: slng } : null,
    partner: hasPartner ? { latitude: plat, longitude: plng } : null,
    destination: hasDest ? { latitude: dlat, longitude: dlng } : null,
  });

  useEffect(() => {
    lastDrivingFetchRef.current = 0;
    setRouteCoords(null);
  }, [orderId]);

  useEffect(() => {
    if (!trackable || !hasPartner || !hasDest || !orderId) {
      setRouteCoords(null);
      return;
    }
    const now = Date.now();
    const throttleMs = 40000;
    if (lastDrivingFetchRef.current !== 0 && now - lastDrivingFetchRef.current < throttleMs) {
      return;
    }
    lastDrivingFetchRef.current = now;

    let cancelled = false;
    fetchOrderDrivingRoute(orderId)
      .then((res) => {
        if (cancelled) return;
        const enc = res?.encodedPolyline;
        if (!enc || typeof enc !== "string") {
          setRouteCoords(null);
          return;
        }
        const decoded = decodeGooglePolyline(enc);
        setRouteCoords(decoded && decoded.length >= 2 ? decoded : null);
      })
      .catch(() => {
        if (!cancelled) setRouteCoords(null);
      });

    return () => {
      cancelled = true;
    };
  }, [orderId, trackable, hasPartner, hasDest, plat, plng, dlat, dlng, data?.updatedAt]);

  let stale = false;
  if (data?.updatedAt) {
    const t = new Date(data.updatedAt).getTime();
    if (Number.isFinite(t) && Date.now() - t > STALE_MS) stale = true;
  }

  const region = computeMapRegionFromPoints(mapPoints);
  const polyStroke = isDark ? "rgba(232, 197, 90, 0.92)" : "rgba(138, 90, 18, 0.85)";
  const destTitle = String(dest.fullName || "").trim() || String(dest.line1 || "").trim() || ORDER_LIVE_TRACKING.markerDestination;
  const destSubtitle = formatDestinationSubtitle(dest);
  const markerFill = isDark ? "rgba(28, 25, 23, 0.96)" : c.card;

  if (loading && !data) {
    return (
      <Card tone="soft" style={styles.pad}>
        <View style={styles.inline}>
          <ActivityIndicator color={c.brand} />
          <Text style={type.ui(14, "medium", c.inkSoft)}>{ORDER_LIVE_TRACKING.loading}</Text>
        </View>
      </Card>
    );
  }

  // "No partner assigned yet" arrives as an HTTP error; it is just the waiting state.
  const waitingFromError = Boolean(error) && !data && isWaitingMessage(error);
  if (error && !data && !waitingFromError) {
    return (
      <Card tone="soft" style={styles.pad}>
        <View style={styles.inline}>
          <Ionicons name="cloud-offline-outline" size={20} color={c.inkMute} />
          <Text style={[type.ui(14, "medium", c.inkSoft), styles.flex]}>{ORDER_LIVE_TRACKING.loadFailed}</Text>
        </View>
      </Card>
    );
  }

  const waiting = waitingFromError || !trackable;
  const showMap = trackable && (hasPartner || hasDest || hasShop);
  const updatedLine = trackable && data?.updatedAt ? formatLiveLocationUpdatedLine(data.updatedAt) : "";

  return (
    <Card padded={false} style={styles.card}>
      <View style={styles.head}>
        <View style={styles.headTitle}>
          <LiveDot color={waiting ? c.gold : c.brand} />
          <Text style={type.display(19, { semi: true, ls: -0.3, lh: 24 })} numberOfLines={1}>
            {ORDER_LIVE_TRACKING.title}
          </Text>
        </View>
        {updatedLine ? (
          <Text style={type.ui(12, "semibold", stale ? c.goldText : c.inkMute)} numberOfLines={1}>
            {updatedLine}
          </Text>
        ) : null}
      </View>

      {partnerName ? (
        <View style={styles.partner}>
          <View style={[styles.avatar, { backgroundColor: c.brandSoft }]}>
            <Ionicons name="bicycle" size={22} color={c.brand} />
          </View>
          <View style={styles.flex}>
            <Text style={type.ui(15.5, "bold", c.ink)} numberOfLines={1}>
              {partnerName}
            </Text>
            <Text style={type.ui(12.5, "medium", c.inkMute)} numberOfLines={1}>
              {ORDER_LIVE_TRACKING.partnerFallback}
            </Text>
          </View>
          {partnerPhone ? (
            <PressableScale
              onPress={() => Linking.openURL(`tel:${partnerPhone.replace(/\s/g, "")}`)}
              scaleTo={0.92}
              accessibilityRole="button"
              accessibilityLabel={ORDER_LIVE_TRACKING.callPartnerA11y}
              hitSlop={6}
              style={[styles.call, { backgroundColor: c.brand }]}
            >
              <Ionicons name="call" size={18} color={c.onBrand} />
            </PressableScale>
          ) : null}
        </View>
      ) : null}

      {waiting ? (
        <View style={[styles.note, { backgroundColor: c.goldSoft, borderColor: withAlpha(c.gold, 0.45) }]}>
          <Ionicons name="time-outline" size={18} color={c.goldText} />
          <Text style={[type.ui(13.5, "medium", c.inkSoft, { lineHeight: 19 }), styles.flex]}>{ORDER_LIVE_TRACKING.waitingDefault}</Text>
        </View>
      ) : null}

      {stale && trackable ? (
        <View style={[styles.note, { backgroundColor: c.goldSoft, borderColor: withAlpha(c.gold, 0.45) }]}>
          <Ionicons name="warning-outline" size={18} color={c.goldText} />
          <Text style={[type.ui(13.5, "medium", c.inkSoft, { lineHeight: 19 }), styles.flex]}>{ORDER_LIVE_TRACKING.staleBanner}</Text>
        </View>
      ) : null}

      {hasDestinationSummary(dest) ? (
        <View style={[styles.dest, { backgroundColor: c.cardSoft, borderColor: c.line, borderRadius: r.lg }]}>
          <View style={[styles.destIcon, { backgroundColor: c.goldSoft }]}>
            <Ionicons name="home-outline" size={18} color={c.goldText} />
          </View>
          <View style={styles.flex}>
            <Text style={type.eyebrow(c.inkMute, 10.5)}>{ORDER_LIVE_TRACKING.deliverToEyebrow}</Text>
            <Text style={type.ui(14.5, "bold", c.ink)} numberOfLines={1}>
              {destTitle}
            </Text>
            {destSubtitle ? (
              <Text style={type.ui(12.5, "medium", c.inkSoft)} numberOfLines={2}>
                {destSubtitle}
              </Text>
            ) : null}
          </View>
        </View>
      ) : null}

      {showMap ? (
        <View style={[styles.mapShell, { borderColor: c.line, borderRadius: r.lg }]}>
          <MapView
            provider={Platform.OS === "android" ? PROVIDER_GOOGLE : undefined}
            mapType={Platform.OS === "ios" ? "mutedStandard" : "standard"}
            userInterfaceStyle={isDark ? "dark" : "light"}
            customMapStyle={Platform.OS === "android" && isDark ? ANDROID_MAP_STYLE_DARK : undefined}
            style={styles.map}
            initialRegion={region}
            scrollEnabled={false}
            rotateEnabled={false}
            pitchEnabled={false}
            showsPointsOfInterest={false}
            showsBuildings={false}
          >
            {hasPartner && hasDest ? (
              <Polyline
                coordinates={
                  routeCoords && routeCoords.length >= 2
                    ? routeCoords
                    : [
                        { latitude: plat, longitude: plng },
                        { latitude: dlat, longitude: dlng },
                      ]
                }
                strokeColor={polyStroke}
                strokeWidth={3}
              />
            ) : null}
            {hasShop ? (
              <Marker
                coordinate={{ latitude: slat, longitude: slng }}
                anchor={{ x: 0.5, y: 1 }}
                tracksViewChanges={false}
                accessibilityLabel={`${shopLabel}, ${ORDER_LIVE_TRACKING.markerShop}`}
              >
                <View style={[styles.shopMarker, { borderColor: c.gold, backgroundColor: markerFill }]}>
                  <Ionicons name="storefront" size={16} color={c.goldText} />
                </View>
              </Marker>
            ) : null}
            {hasPartner ? (
              <Marker
                coordinate={{ latitude: plat, longitude: plng }}
                anchor={{ x: 0.5, y: 1 }}
                tracksViewChanges={false}
                accessibilityLabel={`${partnerName || ORDER_LIVE_TRACKING.partnerFallback}, ${ORDER_LIVE_TRACKING.markerPartner}`}
              >
                <View style={[styles.partnerMarker, { borderColor: c.brand, backgroundColor: markerFill }]}>
                  <Ionicons name="bicycle" size={22} color={c.brand} />
                </View>
              </Marker>
            ) : null}
            {hasDest ? (
              <Marker
                coordinate={{ latitude: dlat, longitude: dlng }}
                anchor={{ x: 0.5, y: 1 }}
                tracksViewChanges={false}
                accessibilityLabel={ORDER_LIVE_TRACKING.markerDestination}
              >
                <View style={[styles.destMarker, { backgroundColor: c.brand }]}>
                  <Ionicons name="home" size={16} color="#fff" />
                </View>
              </Marker>
            ) : null}
          </MapView>
        </View>
      ) : null}

      {showMap && routeCoords && routeCoords.length > 2 ? (
        <Text style={[type.ui(10.5, "medium", c.inkMute), styles.attrib]}>{ORDER_LIVE_TRACKING.googleRouteAttrib}</Text>
      ) : null}

      {showMap ? (
        <View style={styles.actions}>
          <Button
            label={ORDER_LIVE_TRACKING.openMapsCta}
            icon="map-outline"
            tone="secondary"
            compact
            onPress={() =>
              openMapsDirections(
                hasPartner ? { latitude: plat, longitude: plng } : hasShop ? { latitude: slat, longitude: slng } : null,
                hasDest ? { latitude: dlat, longitude: dlng } : null
              )
            }
          />
        </View>
      ) : null}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { overflow: "hidden", paddingBottom: 16 },
  pad: { padding: 16 },
  flex: { flex: 1, minWidth: 0 },
  inline: { flexDirection: "row", alignItems: "center", gap: 12 },
  head: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 12, paddingHorizontal: 16, paddingTop: 16, paddingBottom: 12 },
  headTitle: { flex: 1, minWidth: 0, flexDirection: "row", alignItems: "center", gap: 12 },
  dotBox: { width: 12, height: 12, alignItems: "center", justifyContent: "center" },
  dot: { width: 8, height: 8, borderRadius: 4 },
  dotRing: { position: "absolute", width: 8, height: 8, borderRadius: 4 },
  partner: { flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 16, paddingBottom: 12 },
  avatar: { width: 44, height: 44, borderRadius: 22, alignItems: "center", justifyContent: "center" },
  call: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center" },
  note: { flexDirection: "row", alignItems: "center", gap: 10, marginHorizontal: 16, marginBottom: 12, padding: 12, borderRadius: 16, borderWidth: 1 },
  dest: { flexDirection: "row", alignItems: "flex-start", gap: 12, marginHorizontal: 16, marginBottom: 12, padding: 12, borderWidth: StyleSheet.hairlineWidth },
  destIcon: { width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center" },
  mapShell: { marginHorizontal: 16, marginBottom: 12, overflow: "hidden", borderWidth: StyleSheet.hairlineWidth },
  map: { width: "100%", height: MAP_HEIGHT },
  attrib: { paddingHorizontal: 16, marginBottom: 8 },
  actions: { paddingHorizontal: 16 },
  partnerMarker: { width: 42, height: 42, borderRadius: 21, alignItems: "center", justifyContent: "center", borderWidth: 2 },
  shopMarker: { width: 34, height: 34, borderRadius: 17, alignItems: "center", justifyContent: "center", borderWidth: 2 },
  destMarker: { width: 30, height: 30, borderRadius: 15, alignItems: "center", justifyContent: "center", borderWidth: 2, borderColor: "#fff" },
});
