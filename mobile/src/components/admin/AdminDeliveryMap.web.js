import React, { useMemo } from "react";
import { StyleSheet, View } from "react-native";
import L from "leaflet";
import "../../styles/leafletWeb.css";
import { Circle, MapContainer, Marker, Polygon, Polyline, TileLayer, useMapEvents } from "react-leaflet";

const FALLBACK = [23.2156, 72.6369];

function ClickCatch({ onClick }) {
  useMapEvents({
    click(e) {
      onClick?.({ lat: e.latlng.lat, lng: e.latlng.lng });
    },
  });
  return null;
}

const shopIcon = L.divIcon({
  className: "admin-store-pin",
  html: `<div style="width:34px;height:34px;border-radius:17px;background:#fff;border:2px solid #C9A227;display:flex;align-items:center;justify-content:center;box-shadow:0 2px 8px rgba(0,0,0,.18);font-size:15px;">🏪</div>`,
  iconSize: [34, 34],
  iconAnchor: [17, 34],
});

export default function AdminDeliveryMap({
  store,
  radiusKm = 25,
  zones = [],
  draft = [],
  onMapClick,
}) {
  const center = useMemo(() => {
    const lat = Number(store?.latitude);
    const lng = Number(store?.longitude);
    return Number.isFinite(lat) && Number.isFinite(lng) ? [lat, lng] : FALLBACK;
  }, [store?.latitude, store?.longitude]);

  const draftPos = draft.map((p) => [p.lat, p.lng]);
  const hasStore = Number.isFinite(Number(store?.latitude)) && Number.isFinite(Number(store?.longitude));

  return (
    <View style={styles.wrap}>
      <MapContainer
        center={center}
        zoom={12}
        style={{ height: 360, width: "100%", borderRadius: 16 }}
        scrollWheelZoom
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <ClickCatch onClick={onMapClick} />
        {hasStore ? (
          <>
            <Marker position={center} icon={shopIcon} />
            {Number(radiusKm) > 0 ? (
              <Circle
                center={center}
                radius={Number(radiusKm) * 1000}
                pathOptions={{ color: "#A06C24", weight: 2, fillColor: "#DCAC74", fillOpacity: 0.12 }}
              />
            ) : null}
          </>
        ) : null}
        {zones.map((z) => {
          const ring = (z.polygon || []).map((p) => [p.lat, p.lng]);
          if (ring.length < 3) return null;
          return (
            <Polygon
              key={String(z._id || z.name)}
              positions={ring}
              pathOptions={{ color: "#244424", weight: 2, fillColor: "#5C6834", fillOpacity: 0.18 }}
            />
          );
        })}
        {draftPos.length >= 2 ? (
          <Polyline positions={draftPos} pathOptions={{ color: "#B8442F", weight: 3 }} />
        ) : null}
        {draftPos.length >= 3 ? (
          <Polygon positions={draftPos} pathOptions={{ color: "#B8442F", weight: 2, fillColor: "#B8442F", fillOpacity: 0.12 }} />
        ) : null}
      </MapContainer>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { overflow: "hidden", borderRadius: 16, minHeight: 360 },
});
