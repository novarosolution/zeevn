import React, { useEffect, useMemo } from "react";
import { StyleSheet, Text, View } from "react-native";
import L from "leaflet";
import "../../styles/leafletWeb.css";
import { MapContainer, Marker, Polyline, Popup, TileLayer, useMap } from "react-leaflet";
import { ORDER_LIVE_TRACKING } from "../../content/appContent";
import { semanticRadius, spacing } from "../../theme/tokens";
import { computeMapRegionFromPoints } from "../../utils/orderMapBounds";

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
    color: "#6E6254",
    marginTop: 6,
    paddingHorizontal: spacing.xs,
  },
  googleAttrib: {
    fontSize: 10,
    color: "#6E6254",
    marginTop: 4,
    paddingHorizontal: spacing.xs,
  },
});

function MapViewSync({ mapPoints }) {
  const map = useMap();
  useEffect(() => {
    if (!mapPoints?.length) return;
    if (mapPoints.length === 1) {
      const p = mapPoints[0];
      map.setView([p.latitude, p.longitude], 14, { animate: false });
      return;
    }
    const bounds = L.latLngBounds(mapPoints.map((p) => L.latLng(p.latitude, p.longitude)));
    map.fitBounds(bounds, { padding: [28, 28], maxZoom: 15 });
  }, [map, mapPoints]);
  return null;
}

/** Leaflet map — loaded only when order live map is shown. */
export default function OrderLiveMapLeaflet({
  plat,
  plng,
  slat,
  slng,
  dlat,
  dlng,
  hasPartner,
  hasShop,
  hasDest,
  partnerLabel,
  shopLabel,
  isDark,
  routeColor,
  routePositions,
  mapPoints,
}) {
  const center = useMemo(() => {
    const region = computeMapRegionFromPoints(mapPoints);
    return [region.latitude, region.longitude];
  }, [mapPoints]);

  const partnerBikeIcon = useMemo(() => {
    const bg = isDark ? "rgba(28,25,23,0.96)" : "#FFFCF8";
    const border = isDark ? "#E8C85A" : "#C9A227";
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

  const shopIcon = useMemo(() => {
    const border = isDark ? "#E8C85A" : "#C9A227";
    const bg = isDark ? "rgba(28,25,23,0.96)" : "#FFFCF8";
    return L.divIcon({
      className: "order-live-map-shop-icon",
      html: `<div style="width:34px;height:34px;border-radius:17px;background:${bg};border:2px solid ${border};display:flex;align-items:center;justify-content:center;box-shadow:0 2px 8px rgba(0,0,0,.18);font-size:15px;line-height:1;">🏪</div>`,
      iconSize: [34, 34],
      iconAnchor: [17, 34],
    });
  }, [isDark]);

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
          borderColor: isDark ? "rgba(255,255,255,0.12)" : "rgba(22, 69, 51, 0.15)",
          borderTopColor: isDark ? "rgba(52, 211, 153, 0.42)" : "rgba(31, 92, 71, 0.45)",
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
        <MapViewSync mapPoints={mapPoints} />
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
        {hasShop ? (
          <Marker position={[slat, slng]} icon={shopIcon}>
            <Popup>{shopLabel}</Popup>
          </Marker>
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
