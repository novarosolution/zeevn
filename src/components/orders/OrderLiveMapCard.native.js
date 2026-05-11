import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Linking,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from "react-native-maps";
import { useFocusEffect } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../context/ThemeContext";
import { ORDER_LIVE_TRACKING } from "../../content/appContent";
import { fetchOrderDrivingRoute, fetchOrderLiveLocation } from "../../services/userService";
import { decodeGooglePolyline } from "../../utils/polylineRoute";
import { formatLiveLocationUpdatedLine } from "../../utils/formatLiveLocationUpdated";
import { fonts, icon, radius, semanticRadius, spacing, typography } from "../../theme/tokens";
import { ALCHEMY } from "../../theme/customerAlchemy";
import { platformShadow } from "../../theme/shadowPlatform";
import PremiumCard from "../ui/PremiumCard";
import PremiumButton from "../ui/PremiumButton";
import PremiumSectionHeader from "../ui/PremiumSectionHeader";
import { openMapsDirections, POLL_MS, STALE_MS } from "./orderLiveMapShared";

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
  return Boolean(
    String(dest.fullName || "").trim() ||
      String(dest.line1 || "").trim() ||
      String(dest.city || "").trim() ||
      String(dest.phone || "").trim()
  );
}

function formatDestinationSubtitle(dest) {
  if (!dest || typeof dest !== "object") return "";
  const cityState = [dest.city, dest.state].filter((x) => String(x || "").trim()).join(", ");
  const parts = [String(dest.line1 || "").trim(), cityState, String(dest.postalCode || "").trim()].filter(
    Boolean
  );
  return parts.join(" · ");
}

export default function OrderLiveMapCard({ orderId }) {
  const { colors: c, isDark } = useTheme();
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [routeCoords, setRouteCoords] = useState(null);
  const lastDrivingFetchRef = useRef(0);

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      setLoading(true);
      (async () => {
        try {
          const res = await fetchOrderLiveLocation(orderId);
          if (!cancelled) {
            setData(res);
            setError("");
          }
        } catch (err) {
          if (!cancelled) {
            setError(err.message || ORDER_LIVE_TRACKING.loadFailed);
            setData(null);
          }
        } finally {
          if (!cancelled) setLoading(false);
        }
      })();
      const t = setInterval(() => {
        fetchOrderLiveLocation(orderId)
          .then((res) => {
            if (!cancelled) {
              setData(res);
              setError("");
            }
          })
          .catch((err) => {
            if (!cancelled) setError(err.message || ORDER_LIVE_TRACKING.loadFailed);
          });
      }, POLL_MS);
      return () => {
        cancelled = true;
        clearInterval(t);
      };
    }, [orderId])
  );

  const styles = useMemo(() => createOrderMapStyles(c, isDark), [c, isDark]);

  const partnerLabel = data?.partner?.name?.trim() || ORDER_LIVE_TRACKING.partnerFallback;
  const trackable = Boolean(data?.trackable);
  const plat = Number(data?.latitude);
  const plng = Number(data?.longitude);
  const dest = data?.destination && typeof data.destination === "object" ? data.destination : {};
  const dlat = Number(dest.latitude);
  const dlng = Number(dest.longitude);
  const hasDest = Number.isFinite(dlat) && Number.isFinite(dlng);
  const hasPartner = Number.isFinite(plat) && Number.isFinite(plng);

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

  const region =
    hasPartner && hasDest
      ? {
          latitude: (plat + dlat) / 2,
          longitude: (plng + dlng) / 2,
          latitudeDelta: Math.max(Math.abs(plat - dlat) * 2.2, 0.02),
          longitudeDelta: Math.max(Math.abs(plng - dlng) * 2.2, 0.02),
        }
      : hasPartner
        ? {
            latitude: plat,
            longitude: plng,
            latitudeDelta: 0.06,
            longitudeDelta: 0.06,
          }
        : hasDest
          ? {
              latitude: dlat,
              longitude: dlng,
              latitudeDelta: 0.06,
              longitudeDelta: 0.06,
            }
          : {
              latitude: 20.5937,
              longitude: 78.9629,
              latitudeDelta: 40,
              longitudeDelta: 40,
            };

  const polyStroke = isDark ? "rgba(232, 197, 90, 0.92)" : "rgba(82, 82, 91, 0.85)";
  const destSummary = hasDestinationSummary(dest);
  const destTitle =
    String(dest.fullName || "").trim() || String(dest.line1 || "").trim() || ORDER_LIVE_TRACKING.markerDestination;
  const destSubtitle = formatDestinationSubtitle(dest);
  const destPhone = String(dest.phone || "").trim();

  if (loading && !data) {
    return (
      <PremiumCard variant="panel" padding="md" style={styles.wrap}>
        <View style={styles.loadingRow}>
          <ActivityIndicator color={c.primary} />
          <Text style={[styles.body, { color: c.textSecondary }]}>{ORDER_LIVE_TRACKING.loading}</Text>
        </View>
      </PremiumCard>
    );
  }

  if (error && !data) {
    return (
      <PremiumCard variant="panel" padding="md" style={styles.wrap}>
        <Text style={[styles.title, { color: c.textPrimary }]}>{ORDER_LIVE_TRACKING.errorTitle}</Text>
        <Text style={[styles.body, { color: c.danger }]}>{error}</Text>
      </PremiumCard>
    );
  }

  const showMap = trackable && (hasPartner || hasDest);
  const partnerSubtitle = [partnerLabel, data?.partner?.phone?.trim()].filter(Boolean).join(" · ");

  return (
    <PremiumCard goldAccent variant="accent" padding="none" style={styles.wrap}>
      <View style={styles.sectionHeaderPad}>
        <PremiumSectionHeader
          compact
          overline={ORDER_LIVE_TRACKING.overline}
          title={ORDER_LIVE_TRACKING.title}
          subtitle={partnerSubtitle}
        />
      </View>

      {destSummary ? (
        <View style={[styles.destStrip, { borderColor: c.border, backgroundColor: isDark ? c.surfaceMuted : c.surface }]}>
          <View style={styles.destStripIcon}>
            <Ionicons name="home-outline" size={icon.md} color={c.secondary} />
          </View>
          <View style={styles.destStripText}>
            <Text style={[styles.destEyebrow, { color: c.textMuted }]}>{ORDER_LIVE_TRACKING.deliverToEyebrow}</Text>
            <Text style={[styles.destTitle, { color: c.textPrimary }]} numberOfLines={2}>
              {destTitle}
            </Text>
            {destSubtitle ? (
              <Text style={[styles.destSub, { color: c.textSecondary }]} numberOfLines={2}>
                {destSubtitle}
              </Text>
            ) : null}
            {destPhone ? (
              <TouchableOpacity
                onPress={() => Linking.openURL(`tel:${destPhone.replace(/\s/g, "")}`)}
                accessibilityRole="button"
                accessibilityLabel={ORDER_LIVE_TRACKING.deliverPhoneA11y}
                style={styles.destPhoneRow}
                hitSlop={8}
              >
                <Ionicons name="call-outline" size={icon.sm} color={c.secondary} />
                <Text style={[styles.destPhone, { color: c.secondary }]}>{destPhone}</Text>
              </TouchableOpacity>
            ) : null}
          </View>
        </View>
      ) : null}

      {stale && trackable ? (
        <View style={styles.staleBanner}>
          <Ionicons name="warning-outline" size={icon.sm} color={c.primary} />
          <Text style={styles.staleText}>{ORDER_LIVE_TRACKING.staleBanner}</Text>
        </View>
      ) : null}

      {!trackable ? (
        <Text style={[styles.body, { color: c.textSecondary, padding: spacing.md }]}>
          {data?.message || ORDER_LIVE_TRACKING.waitingDefault}
        </Text>
      ) : null}

      {showMap ? (
        <View
          style={[
            styles.mapShell,
            {
              borderColor: c.border,
              borderTopColor: isDark ? "rgba(220, 38, 38, 0.42)" : "rgba(185, 28, 28, 0.45)",
            },
          ]}
        >
          <MapView
            provider={Platform.OS === "android" ? PROVIDER_GOOGLE : undefined}
            mapType={Platform.OS === "ios" ? "mutedStandard" : "standard"}
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
            {hasPartner ? (
              <Marker
                coordinate={{ latitude: plat, longitude: plng }}
                anchor={{ x: 0.5, y: 1 }}
                tracksViewChanges={false}
                accessibilityLabel={`${partnerLabel}, ${ORDER_LIVE_TRACKING.markerPartner}`}
              >
                <View
                  style={[
                    styles.partnerBikeMarker,
                    {
                      borderColor: isDark ? ALCHEMY.goldBright : ALCHEMY.gold,
                      backgroundColor: isDark ? "rgba(28, 25, 23, 0.96)" : ALCHEMY.cardBg,
                      ...platformShadow({
                        ios: {
                          shadowColor: "#000",
                          shadowOffset: { width: 0, height: 2 },
                          shadowOpacity: isDark ? 0.35 : 0.12,
                          shadowRadius: 4,
                        },
                        android: { elevation: 4 },
                        web: {
                          boxShadow: isDark
                            ? "0 4px 12px rgba(0,0,0,0.35)"
                            : "0 3px 10px rgba(24, 24, 27, 0.12)",
                        },
                      }),
                    },
                  ]}
                >
                  <Ionicons
                    name="bicycle"
                    size={icon.md}
                    color={isDark ? ALCHEMY.goldBright : ALCHEMY.goldDeep}
                  />
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
                <View
                  style={[
                    styles.destHomeMarker,
                    {
                      borderColor: "#fff",
                      ...platformShadow({
                        ios: {
                          shadowColor: "#000",
                          shadowOffset: { width: 0, height: 1 },
                          shadowOpacity: 0.2,
                          shadowRadius: 3,
                        },
                        android: { elevation: 3 },
                        web: { boxShadow: "0 2px 6px rgba(0,0,0,0.2)" },
                      }),
                    },
                  ]}
                >
                  <Ionicons name="home" size={icon.sm} color="#fff" />
                </View>
              </Marker>
            ) : null}
          </MapView>
        </View>
      ) : null}

      {showMap && routeCoords && routeCoords.length > 2 ? (
        <Text style={[styles.routeAttrib, { color: c.textMuted }]}>{ORDER_LIVE_TRACKING.googleRouteAttrib}</Text>
      ) : null}

      {trackable ? (
        <Text style={[styles.updated, { color: c.textMuted }]}>
          {data?.updatedAt ? formatLiveLocationUpdatedLine(data.updatedAt) : ""}
        </Text>
      ) : null}

      <View style={styles.actions}>
        <PremiumButton
          label={ORDER_LIVE_TRACKING.openMapsCta}
          iconLeft="map-outline"
          variant="secondary"
          size="sm"
          fullWidth
          onPress={() =>
            openMapsDirections(
              hasPartner ? { latitude: plat, longitude: plng } : null,
              hasDest ? { latitude: dlat, longitude: dlng } : null
            )
          }
          disabled={!hasPartner && !hasDest}
        />
      </View>
    </PremiumCard>
  );
}

function createOrderMapStyles(c, isDark) {
  return StyleSheet.create({
    wrap: {
      marginTop: spacing.md,
      overflow: "hidden",
    },
    sectionHeaderPad: {
      paddingHorizontal: spacing.md,
      paddingTop: spacing.md,
    },
    destStrip: {
      flexDirection: "row",
      alignItems: "flex-start",
      gap: spacing.sm,
      marginHorizontal: spacing.md,
      marginBottom: spacing.sm,
      padding: spacing.md,
      borderRadius: radius.md,
      borderWidth: StyleSheet.hairlineWidth,
    },
    destStripIcon: {
      paddingTop: 2,
    },
    destStripText: {
      flex: 1,
      minWidth: 0,
      gap: 2,
    },
    destEyebrow: {
      fontFamily: fonts.extrabold,
      fontSize: typography.overline,
      letterSpacing: 1.2,
      textTransform: "uppercase",
    },
    destTitle: {
      fontFamily: fonts.semibold,
      fontSize: typography.bodySmall,
      lineHeight: 20,
    },
    destSub: {
      fontFamily: fonts.regular,
      fontSize: typography.caption,
      lineHeight: 18,
      marginTop: 2,
    },
    destPhoneRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      marginTop: spacing.xs,
    },
    destPhone: {
      fontFamily: fonts.semibold,
      fontSize: typography.caption,
    },
    mapShell: {
      marginHorizontal: spacing.md,
      marginBottom: spacing.sm,
      borderRadius: semanticRadius.card,
      overflow: "hidden",
      borderWidth: StyleSheet.hairlineWidth,
      borderTopWidth: 2,
    },
    partnerBikeMarker: {
      width: 42,
      height: 42,
      borderRadius: 21,
      alignItems: "center",
      justifyContent: "center",
      borderWidth: 2,
    },
    destHomeMarker: {
      width: 30,
      height: 30,
      borderRadius: 15,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: "#16a34a",
      borderWidth: 2,
    },
    routeAttrib: {
      fontSize: 10,
      fontFamily: fonts.medium,
      paddingHorizontal: spacing.md,
      marginBottom: spacing.xs,
    },
    title: {
      fontFamily: fonts.extrabold,
      fontSize: typography.body,
    },
    body: {
      fontSize: typography.caption,
      fontFamily: fonts.regular,
      marginTop: 2,
    },
    map: {
      width: "100%",
      height: 256,
    },
    loadingRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.sm,
    },
    staleBanner: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.sm,
      marginHorizontal: spacing.md,
      marginBottom: spacing.sm,
      padding: spacing.sm,
      borderRadius: radius.md,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: c.primaryBorder,
      backgroundColor: isDark ? c.brandYellowSoft : c.primarySoft,
    },
    staleText: {
      flex: 1,
      fontSize: typography.caption,
      fontFamily: fonts.medium,
      color: isDark ? c.brandYellow : c.primaryDark,
    },
    updated: {
      paddingHorizontal: spacing.md,
      paddingTop: spacing.xs,
      fontSize: typography.caption,
      fontFamily: fonts.regular,
    },
    actions: {
      padding: spacing.md,
      paddingTop: spacing.sm,
    },
  });
}
