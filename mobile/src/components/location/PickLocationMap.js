import React, { useEffect, useRef, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import MapView, { Marker, Polyline } from "react-native-maps";
import { validMapCoord } from "../../services/locationService";
import { PinGlyph } from "../store/AddressKit";

const FALLBACK = { latitude: 23.2156, longitude: 72.6369 };

/**
 * Tap the map, or drag the pin, to move the delivery pin. Native = react-native-maps (already used for live orders).
 * `fill` makes the map fill its parent (the full-screen picker) instead of a fixed-height card; `padding` is the
 * strip `{ top, bottom }` that floating controls cover, so the pin and the route settle in the part still visible;
 * `dark` follows the app's dark theme rather than the phone's.
 */
export default function PickLocationMap({
  latitude,
  longitude,
  storeLatitude,
  storeLongitude,
  path,
  onPick,
  height = 240,
  hint = true,
  fill = false,
  padding,
  dark = false,
}) {
  const mapRef = useRef(null);
  const padTop = padding?.top || 0;
  const padBottom = padding?.bottom || 0;
  // A custom marker view is drawn once into a bitmap: let it settle, then stop tracking so the map stays smooth.
  const [tracking, setTracking] = useState(true);
  const hasPin = validMapCoord(latitude) && validMapCoord(longitude);
  const hasShop = validMapCoord(storeLatitude) && validMapCoord(storeLongitude);
  const line = Array.isArray(path) && path.length >= 2 ? path : null;
  const coord = hasPin
    ? { latitude: Number(latitude), longitude: Number(longitude) }
    : FALLBACK;

  useEffect(() => {
    if (!mapRef.current) return;
    if (line) {
      mapRef.current.fitToCoordinates(line, {
        edgePadding: { top: 40 + padTop, right: 40, bottom: 40 + padBottom, left: 40 },
        animated: true,
      });
      return;
    }
    if (!hasPin) return;
    mapRef.current.animateToRegion(
      { latitude: coord.latitude, longitude: coord.longitude, latitudeDelta: 0.012, longitudeDelta: 0.012 },
      220
    );
  }, [coord.latitude, coord.longitude, hasPin, line, padTop, padBottom]);

  useEffect(() => {
    setTracking(true);
    const t = setTimeout(() => setTracking(false), 500);
    return () => clearTimeout(t);
  }, [dark, hasPin]);

  return (
    <View style={fill ? styles.fill : [styles.wrap, { height }]}>
      <MapView
        ref={mapRef}
        style={StyleSheet.absoluteFill}
        initialRegion={{ ...coord, latitudeDelta: 0.02, longitudeDelta: 0.02 }}
        mapPadding={{ top: padTop, left: 0, right: 0, bottom: padBottom }}
        userInterfaceStyle={dark ? "dark" : "light"}
        showsPointsOfInterest={false}
        onPress={(e) => {
          const next = e.nativeEvent?.coordinate;
          if (next) onPick?.({ latitude: next.latitude, longitude: next.longitude });
        }}
      >
        {line ? <Polyline coordinates={line} strokeColor="#1F331F" strokeWidth={4} /> : null}
        {hasShop ? (
          <Marker
            coordinate={{ latitude: Number(storeLatitude), longitude: Number(storeLongitude) }}
            title="Shop"
            pinColor="#B08A4A"
          />
        ) : null}
        {hasPin ? (
          <Marker
            coordinate={coord}
            anchor={{ x: 0.5, y: 1 }}
            draggable
            tracksViewChanges={tracking}
            onDragEnd={(e) => {
              const next = e.nativeEvent?.coordinate;
              if (next) onPick?.({ latitude: next.latitude, longitude: next.longitude });
            }}
            accessibilityLabel="Delivery pin"
          >
            <PinGlyph />
          </Marker>
        ) : null}
      </MapView>
      {hint ? <Text style={styles.hint}>Tap the map to drop the pin — we fill the address.</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { ...StyleSheet.absoluteFillObject, backgroundColor: "#E8E4D8" },
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
