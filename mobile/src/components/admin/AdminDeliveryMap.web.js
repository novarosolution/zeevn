import React, { useEffect } from "react";
import { StyleSheet, Text, View } from "react-native";
import L from "leaflet";
import "../../styles/leafletWeb.css";
import { Circle, CircleMarker, MapContainer, Marker, Polygon, Polyline, TileLayer, useMap, useMapEvents } from "react-leaflet";

const FALLBACK = [23.2156, 72.6369];
const MAP_H = 460;

function MapReady() {
  const map = useMap();
  useEffect(() => {
    const kick = () => map.invalidateSize({ animate: false });
    kick();
    const frame = requestAnimationFrame(kick);
    const t1 = setTimeout(kick, 80);
    const t2 = setTimeout(kick, 400);
    window.addEventListener("resize", kick);
    return () => {
      cancelAnimationFrame(frame);
      clearTimeout(t1);
      clearTimeout(t2);
      window.removeEventListener("resize", kick);
    };
  }, [map]);
  return null;
}

function ClickCatch({ onClick, draw }) {
  const map = useMap();
  useEffect(() => {
    map.getContainer().style.cursor = draw ? "crosshair" : "grab";
  }, [map, draw]);
  useMapEvents({
    click(e) {
      onClick?.({ lat: e.latlng.lat, lng: e.latlng.lng });
    },
  });
  return null;
}

const shopIcon = L.divIcon({
  className: "admin-store-pin",
  html: `<div style="width:36px;height:36px;border-radius:18px;background:#fff;border:2px solid #C9A227;display:flex;align-items:center;justify-content:center;box-shadow:0 2px 8px rgba(0,0,0,.18);font-size:16px;line-height:1;">🏪</div>`,
  iconSize: [36, 36],
  iconAnchor: [18, 36],
});

const mute = { interactive: false };

export default function AdminDeliveryMap({
  store,
  radiusKm = 25,
  zones = [],
  draft = [],
  hint = "",
  mode = "store",
  onMapClick,
}) {
  const lat = Number(store?.latitude);
  const lng = Number(store?.longitude);
  const center = Number.isFinite(lat) && Number.isFinite(lng) ? [lat, lng] : FALLBACK;
  const hasStore = Number.isFinite(lat) && Number.isFinite(lng);
  const draftPos = draft.map((p) => [p.lat, p.lng]);

  return (
    <View style={styles.wrap} pointerEvents="auto">
      <MapContainer
        className="admin-delivery-map"
        center={center}
        zoom={13}
        style={{ height: MAP_H, width: "100%" }}
        scrollWheelZoom
        doubleClickZoom={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <MapReady />
        <ClickCatch onClick={onMapClick} draw={mode === "draw"} />
        {hasStore ? (
          <>
            <Marker position={center} icon={shopIcon} />
            {Number(radiusKm) > 0 ? (
              <Circle
                center={center}
                radius={Number(radiusKm) * 1000}
                pathOptions={{ color: "#A06C24", weight: 2, fillColor: "#DCAC74", fillOpacity: 0.1, ...mute }}
                interactive={false}
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
              pathOptions={{ color: "#244424", weight: 2, fillColor: "#5C6834", fillOpacity: 0.16, ...mute }}
              interactive={false}
            />
          );
        })}
        {draftPos.length >= 2 ? (
          <Polyline positions={draftPos} pathOptions={{ color: "#B8442F", weight: 3, ...mute }} interactive={false} />
        ) : null}
        {draftPos.length >= 3 ? (
          <Polygon
            positions={draftPos}
            pathOptions={{ color: "#B8442F", weight: 2, fillColor: "#B8442F", fillOpacity: 0.14, ...mute }}
            interactive={false}
          />
        ) : null}
        {draftPos.map((pos, i) => (
          <CircleMarker
            key={`v-${i}`}
            center={pos}
            radius={7}
            pathOptions={{ color: "#fff", weight: 2, fillColor: "#B8442F", fillOpacity: 1 }}
            interactive={false}
          />
        ))}
      </MapContainer>
      {hint ? (
        <View style={styles.hint} pointerEvents="none">
          <Text style={styles.hintText}>{hint}</Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    height: MAP_H,
    width: "100%",
    overflow: "hidden",
    borderRadius: 20,
    position: "relative",
    backgroundColor: "#efe8dc",
  },
  hint: {
    position: "absolute",
    left: 12,
    top: 12,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 999,
    backgroundColor: "rgba(255,252,247,0.92)",
  },
  hintText: { fontSize: 12, fontWeight: "600", color: "#19140f" },
});
