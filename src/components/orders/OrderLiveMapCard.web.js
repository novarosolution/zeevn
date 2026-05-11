import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ActivityIndicator, Linking, Pressable, StyleSheet, Text, View } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { MapContainer, Marker, Polyline, Popup, TileLayer, useMap } from "react-leaflet";
import { useTheme } from "../../context/ThemeContext";
import { ORDER_LIVE_TRACKING } from "../../content/appContent";
import { fetchOrderDrivingRoute, fetchOrderLiveLocation } from "../../services/userService";
import { decodeGooglePolyline } from "../../utils/polylineRoute";
import { formatLiveLocationUpdatedLine } from "../../utils/formatLiveLocationUpdated";
import { fonts, icon, radius, semanticRadius, spacing, typography } from "../../theme/tokens";
import PremiumCard from "../ui/PremiumCard";
import PremiumButton from "../ui/PremiumButton";
import PremiumSectionHeader from "../ui/PremiumSectionHeader";
import { openMapsDirections, POLL_MS, STALE_MS } from "./orderLiveMapShared";

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

const leafletChromeStyles = StyleSheet.create({
  leafletWrap: {
    marginHorizontal: spacing.md,
    marginBottom: spacing.sm,
    overflow: "hidden",
    borderRadius: semanticRadius.card,
    borderWidth: StyleSheet.hairlineWidth,
    borderTopWidth: 2,
  },
  osmAttrib: {
    fontSize: 10,
    color: "#71717A",
    marginTop: 6,
    paddingHorizontal: spacing.xs,
  },
  googleAttrib: {
    fontSize: 10,
    color: "#71717A",
    marginTop: 4,
    paddingHorizontal: spacing.xs,
  },
});

function MapViewSync({ plat, plng, dlat, dlng, hasPartner, hasDest }) {
  const map = useMap();
  useEffect(() => {
    if (hasPartner && hasDest) {
      map.fitBounds(L.latLngBounds(L.latLng(plat, plng), L.latLng(dlat, dlng)), {
        padding: [28, 28],
        maxZoom: 15,
      });
    } else if (hasPartner) {
      map.setView([plat, plng], 14, { animate: false });
    } else if (hasDest) {
      map.setView([dlat, dlng], 14, { animate: false });
    }
  }, [map, plat, plng, dlat, dlng, hasPartner, hasDest]);
  return null;
}

function LiveLeafletMap({
  plat,
  plng,
  dlat,
  dlng,
  hasPartner,
  hasDest,
  partnerLabel,
  isDark,
  routeColor,
  routePositions,
}) {
  const center = useMemo(() => {
    if (hasPartner) return [plat, plng];
    if (hasDest) return [dlat, dlng];
    return [20.5937, 78.9629];
  }, [hasPartner, hasDest, plat, plng, dlat, dlng]);

  const partnerBikeIcon = useMemo(() => {
    const bg = isDark ? "rgba(28,25,23,0.96)" : "#FFFFFF";
    const border = isDark ? "#F87171" : "#DC2626";
    const shadow = isDark ? "0 4px 14px rgba(0,0,0,0.38)" : "0 3px 10px rgba(61,42,18,0.14)";
    const html = `<div style="width:42px;height:42px;border-radius:21px;background:${bg};border:2px solid ${border};box-shadow:${shadow};display:flex;align-items:center;justify-content:center;font-size:20px;line-height:1;">🚴</div>`;
    return L.divIcon({
      className: "order-live-map-partner-bike",
      html,
      iconSize: [42, 42],
      iconAnchor: [21, 42],
    });
  }, [isDark]);

  const destIcon = useMemo(
    () =>
      L.divIcon({
        className: "order-live-map-dest-icon",
        html: `<div style="width:30px;height:30px;border-radius:50%;background:#16a34a;border:2px solid #fff;display:flex;align-items:center;justify-content:center;box-shadow:0 2px 6px rgba(0,0,0,.22);font-size:14px;line-height:1;">🏠</div>`,
        iconSize: [30, 30],
        iconAnchor: [15, 30],
      }),
    []
  );

  const tile = isDark
    ? {
        url: "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
      }
    : {
        url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      };

  return (
    <View
      style={[
        leafletChromeStyles.leafletWrap,
        {
          borderColor: isDark ? "rgba(255,255,255,0.12)" : "rgba(63, 63, 70, 0.15)",
          borderTopColor: isDark ? "rgba(220, 38, 38, 0.42)" : "rgba(185, 28, 28, 0.45)",
        },
      ]}
    >
      <MapContainer
        key={isDark ? "dark" : "light"}
        center={center}
        zoom={hasPartner && hasDest ? 12 : 14}
        style={{ height: 256, width: "100%", borderRadius: semanticRadius.card }}
        scrollWheelZoom={false}
        attributionControl
      >
        <TileLayer attribution={tile.attribution} url={tile.url} />
        <MapViewSync
          plat={plat}
          plng={plng}
          dlat={dlat}
          dlng={dlng}
          hasPartner={hasPartner}
          hasDest={hasDest}
        />
        {hasPartner && hasDest ? (
          <Polyline
            positions={
              routePositions && routePositions.length >= 2
                ? routePositions
                : [
                    [plat, plng],
                    [dlat, dlng],
                  ]
            }
            pathOptions={{ color: routeColor, weight: 3, opacity: 0.88 }}
          />
        ) : null}
        {hasPartner ? (
          <Marker position={[plat, plng]} icon={partnerBikeIcon}>
            <Popup>{partnerLabel}</Popup>
          </Marker>
        ) : null}
        {hasDest ? (
          <Marker position={[dlat, dlng]} icon={destIcon}>
            <Popup>{ORDER_LIVE_TRACKING.markerDestination}</Popup>
          </Marker>
        ) : null}
      </MapContainer>
      <Text style={leafletChromeStyles.osmAttrib} accessibilityRole="text">
        {isDark ? ORDER_LIVE_TRACKING.osmAttribDark : ORDER_LIVE_TRACKING.osmAttrib}
      </Text>
      {routePositions && routePositions.length > 2 ? (
        <Text style={leafletChromeStyles.googleAttrib} accessibilityRole="text">
          {ORDER_LIVE_TRACKING.googleRouteAttrib}
        </Text>
      ) : null}
    </View>
  );
}

/** Web: Leaflet + OSM / Carto dark (no react-native-maps). */
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

  const cardStyles = useMemo(() => createWebStyles(c, isDark), [c, isDark]);

  const partnerLabel = data?.partner?.name?.trim() || ORDER_LIVE_TRACKING.partnerFallback;
  const trackable = Boolean(data?.trackable);
  const plat = Number(data?.latitude);
  const plng = Number(data?.longitude);
  const dest = data?.destination && typeof data.destination === "object" ? data.destination : {};
  const dlat = Number(dest.latitude);
  const dlng = Number(dest.longitude);
  const hasDest = Number.isFinite(dlat) && Number.isFinite(dlng);
  const hasPartner = Number.isFinite(plat) && Number.isFinite(plng);
  const routeColor = isDark ? c.primaryBright : c.primary;

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

  const routePositions = useMemo(() => {
    if (routeCoords && routeCoords.length >= 2) {
      return routeCoords.map((p) => [p.latitude, p.longitude]);
    }
    return null;
  }, [routeCoords]);

  let stale = false;
  if (data?.updatedAt) {
    const t = new Date(data.updatedAt).getTime();
    if (Number.isFinite(t) && Date.now() - t > STALE_MS) stale = true;
  }

  const showMap = trackable && (hasPartner || hasDest);
  const destSummary = hasDestinationSummary(dest);
  const destTitle =
    String(dest.fullName || "").trim() || String(dest.line1 || "").trim() || ORDER_LIVE_TRACKING.markerDestination;
  const destSubtitle = formatDestinationSubtitle(dest);
  const destPhone = String(dest.phone || "").trim();

  if (loading && !data) {
    return (
      <PremiumCard variant="panel" padding="md" style={cardStyles.wrap}>
        <View style={cardStyles.loadingRow}>
          <ActivityIndicator color={c.primary} />
          <Text style={[cardStyles.body, { color: c.textSecondary }]}>{ORDER_LIVE_TRACKING.loading}</Text>
        </View>
      </PremiumCard>
    );
  }

  if (error && !data) {
    return (
      <PremiumCard variant="panel" padding="md" style={cardStyles.wrap}>
        <Text style={[cardStyles.title, { color: c.textPrimary }]}>{ORDER_LIVE_TRACKING.errorTitle}</Text>
        <Text style={[cardStyles.body, { color: c.danger }]}>{error}</Text>
      </PremiumCard>
    );
  }

  const partnerSubtitle = [partnerLabel, data?.partner?.phone?.trim()].filter(Boolean).join(" · ");

  return (
    <PremiumCard goldAccent variant="accent" padding="none" style={cardStyles.wrap}>
      <View style={cardStyles.sectionHeaderPad}>
        <PremiumSectionHeader
          compact
          overline={ORDER_LIVE_TRACKING.overline}
          title={ORDER_LIVE_TRACKING.title}
          subtitle={partnerSubtitle}
        />
      </View>

      {destSummary ? (
        <View
          style={[
            cardStyles.destStrip,
            { borderColor: c.border, backgroundColor: isDark ? c.surfaceMuted : c.surface },
          ]}
        >
          <View style={cardStyles.destStripIcon}>
            <Ionicons name="home-outline" size={icon.md} color={c.secondary} />
          </View>
          <View style={cardStyles.destStripText}>
            <Text style={[cardStyles.destEyebrow, { color: c.textMuted }]}>{ORDER_LIVE_TRACKING.deliverToEyebrow}</Text>
            <Text style={[cardStyles.destTitle, { color: c.textPrimary }]} numberOfLines={2}>
              {destTitle}
            </Text>
            {destSubtitle ? (
              <Text style={[cardStyles.destSub, { color: c.textSecondary }]} numberOfLines={2}>
                {destSubtitle}
              </Text>
            ) : null}
            {destPhone ? (
              <Pressable
                onPress={() => Linking.openURL(`tel:${destPhone.replace(/\s/g, "")}`)}
                accessibilityRole="button"
                accessibilityLabel={ORDER_LIVE_TRACKING.deliverPhoneA11y}
                style={cardStyles.destPhoneRow}
              >
                <Ionicons name="call-outline" size={icon.sm} color={c.secondary} />
                <Text style={[cardStyles.destPhone, { color: c.secondary }]}>{destPhone}</Text>
              </Pressable>
            ) : null}
          </View>
        </View>
      ) : null}

      {stale && trackable ? (
        <View style={cardStyles.staleBanner}>
          <Ionicons name="warning-outline" size={icon.sm} color={c.primary} />
          <Text style={cardStyles.staleText}>{ORDER_LIVE_TRACKING.staleBanner}</Text>
        </View>
      ) : null}

      {!trackable ? (
        <Text style={[cardStyles.body, { color: c.textSecondary, padding: spacing.md }]}>
          {data?.message || ORDER_LIVE_TRACKING.waitingDefault}
        </Text>
      ) : null}

      {showMap ? (
        <LiveLeafletMap
          plat={plat}
          plng={plng}
          dlat={dlat}
          dlng={dlng}
          hasPartner={hasPartner}
          hasDest={hasDest}
          partnerLabel={partnerLabel}
          isDark={isDark}
          routeColor={routeColor}
          routePositions={routePositions}
        />
      ) : null}

      {trackable ? (
        <Text style={[cardStyles.updated, { color: c.textMuted }]}>
          {data?.updatedAt ? formatLiveLocationUpdatedLine(data.updatedAt) : ""}
        </Text>
      ) : null}

      <View style={cardStyles.actions}>
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

function createWebStyles(c, isDark) {
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
    title: {
      fontFamily: fonts.extrabold,
      fontSize: typography.body,
    },
    body: {
      fontSize: typography.caption,
      fontFamily: fonts.regular,
      marginTop: 2,
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
