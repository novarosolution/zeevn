import React, { useEffect, useMemo } from "react";
import { StyleSheet, Text, View } from "react-native";
import L from "leaflet";
import "../../styles/leafletWeb.css";
import { MapContainer, Marker, TileLayer, useMap, useMapEvents } from "react-leaflet";
import { validMapCoord } from "../../services/locationService";

const FALLBACK = [23.2156, 72.6369];

function pinIcon() {
  return L.divIcon({
    className: "pick-loc-pin",
    html: `<div style="width:28px;height:28px;border-radius:14px;background:#1F331F;border:2px solid #E6BE88;box-shadow:0 2px 8px rgba(20,24,16,.28)"></div>`,
    iconSize: [28, 28],
    iconAnchor: [14, 28],
  });
}

function MapReady({ center }) {
  const map = useMap();
  useEffect(() => {
    const kick = () => {
      map.invalidateSize({ animate: false });
      map.setView(center, map.getZoom() || 15, { animate: false });
    };
    kick();
    const t = setTimeout(kick, 120);
    return () => clearTimeout(t);
  }, [map, center[0], center[1]]);
  return null;
}

function ClickCatch({ onPick }) {
  useMapEvents({
    click(e) {
      onPick?.({ latitude: e.latlng.lat, longitude: e.latlng.lng });
    },
  });
  return null;
}

/** Tap the map to move the delivery pin. Web = Leaflet (already in the admin desk). */
export default function PickLocationMap({ latitude, longitude, onPick, height = 240 }) {
  const center = useMemo(() => {
    if (validMapCoord(latitude) && validMapCoord(longitude)) return [Number(latitude), Number(longitude)];
    return FALLBACK;
  }, [latitude, longitude]);
  const hasPin = validMapCoord(latitude) && validMapCoord(longitude);

  return (
    <View style={[styles.wrap, { height }]}>
      <MapContainer
        className="pick-location-map"
        center={center}
        zoom={15}
        style={{ height, width: "100%" }}
        scrollWheelZoom
        doubleClickZoom={false}
      >
        <TileLayer
          attribution='&copy; OpenStreetMap'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <MapReady center={center} />
        <ClickCatch onPick={onPick} />
        {hasPin ? <Marker position={center} icon={pinIcon()} /> : null}
      </MapContainer>
      <Text style={styles.hint}>Tap the map to drop the pin — we fill the address.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    width: "100%",
    borderRadius: 16,
    overflow: "hidden",
    backgroundColor: "#E8E4D8",
  },
  hint: {
    position: "absolute",
    left: 10,
    right: 10,
    bottom: 8,
    fontSize: 11,
    color: "#1F331F",
    backgroundColor: "rgba(246,241,228,0.92)",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    textAlign: "center",
    overflow: "hidden",
  },
});
