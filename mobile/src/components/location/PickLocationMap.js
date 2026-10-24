import React, { useEffect, useRef } from "react";
import { StyleSheet, Text, View } from "react-native";
import MapView, { Marker } from "react-native-maps";
import { validMapCoord } from "../../services/locationService";

const FALLBACK = { latitude: 23.2156, longitude: 72.6369 };

/** Tap the map to move the delivery pin. Native = react-native-maps (already used for live orders). */
export default function PickLocationMap({ latitude, longitude, onPick, height = 240 }) {
  const mapRef = useRef(null);
  const hasPin = validMapCoord(latitude) && validMapCoord(longitude);
  const coord = hasPin
    ? { latitude: Number(latitude), longitude: Number(longitude) }
    : FALLBACK;

  useEffect(() => {
    if (!hasPin || !mapRef.current) return;
    mapRef.current.animateToRegion(
      { ...coord, latitudeDelta: 0.012, longitudeDelta: 0.012 },
      220
    );
  }, [coord.latitude, coord.longitude, hasPin]);

  return (
    <View style={[styles.wrap, { height }]}>
      <MapView
        ref={mapRef}
        style={StyleSheet.absoluteFill}
        initialRegion={{ ...coord, latitudeDelta: 0.02, longitudeDelta: 0.02 }}
        onPress={(e) => {
          const next = e.nativeEvent?.coordinate;
          if (next) onPick?.({ latitude: next.latitude, longitude: next.longitude });
        }}
      >
        {hasPin ? <Marker coordinate={coord} /> : null}
      </MapView>
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
    overflow: "hidden",
    textAlign: "center",
  },
});
