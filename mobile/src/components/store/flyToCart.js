/**
 * Fly-to-cart: when a product is added, its photo hops along a curve into the cart button.
 *
 *   flyToCart({ uri, from })   from = { x, y, width, height } in window coordinates (`measureInWindow`)
 *   setCartTarget(rect)        called by the floating nav so the flight knows where to land
 *   <FlyToCartLayer />         mounted once at the app root; draws the flights above every screen
 *
 * Skips quietly when the cart button is not on screen or the system "Reduce Motion" is on.
 */
import React, { useCallback, useEffect, useRef, useState } from "react";
import { Platform, StyleSheet, View } from "react-native";
import { Image } from "expo-image";
import Animated, {
  Easing,
  interpolate,
  runOnJS,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";

export const FLIGHT_MS = 640;
const SIZE = 60;

let cartTarget = null;
let flyingUntil = 0;
let sequence = 0;
const listeners = new Set();

/** True once the floating nav has reported where the cart button is (so a flight can land). */
export function hasCartTarget() {
  return Platform.OS !== "web" && Boolean(cartTarget);
}

export function setCartTarget(rect) {
  if (rect && Number.isFinite(rect.x) && Number.isFinite(rect.y)) cartTarget = rect;
}

/** True while a product is in the air — the cart badge waits for it to land before it bumps. */
export function isFlyingToCart() {
  return Date.now() < flyingUntil;
}

/** Milliseconds from now until the current flight lands (0 when idle). */
export function flightRemainingMs() {
  return Math.max(0, flyingUntil - Date.now());
}

export function flyToCart({ uri, from }) {
  if (Platform.OS === "web" || !cartTarget || !from || !(from.width > 0)) return;
  flyingUntil = Date.now() + FLIGHT_MS;
  const item = { id: ++sequence, uri, from, to: cartTarget };
  listeners.forEach((listener) => listener(item));
}

function Flyer({ item, offset, onDone }) {
  const t = useSharedValue(0);
  const startX = item.from.x + item.from.width / 2 - offset.x;
  const startY = item.from.y + item.from.height / 2 - offset.y;
  const endX = item.to.x + item.to.width / 2 - offset.x;
  const endY = item.to.y + item.to.height / 2 - offset.y;
  const lift = Math.min(150, Math.max(70, Math.abs(startY - endY) * 0.22));

  useEffect(() => {
    t.value = withTiming(1, { duration: FLIGHT_MS, easing: Easing.bezier(0.3, 0.1, 0.25, 1) }, (finished) => {
      if (finished) runOnJS(onDone)(item.id);
    });
  }, [t, onDone, item.id]);

  const style = useAnimatedStyle(() => {
    const p = t.value;
    return {
      opacity: interpolate(p, [0, 0.08, 0.86, 1], [0, 1, 1, 0]),
      transform: [
        { translateX: startX + (endX - startX) * p - SIZE / 2 },
        { translateY: startY + (endY - startY) * p - Math.sin(Math.PI * p) * lift - SIZE / 2 },
        { scale: interpolate(p, [0, 0.3, 1], [0.9, 1, 0.28]) },
        { rotate: `${interpolate(p, [0, 1], [0, 14])}deg` },
      ],
    };
  });

  return (
    <Animated.View style={[styles.flyer, style]}>
      <View style={styles.clip}>
        {item.uri ? (
          <Image source={{ uri: item.uri }} style={StyleSheet.absoluteFill} contentFit="cover" />
        ) : (
          <View style={[StyleSheet.absoluteFill, styles.fallback]} />
        )}
      </View>
    </Animated.View>
  );
}

export function FlyToCartLayer() {
  const reduced = useReducedMotion();
  const layerRef = useRef(null);
  const offset = useRef({ x: 0, y: 0 });
  const [flights, setFlights] = useState([]);

  const measure = useCallback(() => {
    layerRef.current?.measureInWindow?.((x, y) => {
      offset.current = { x: x || 0, y: y || 0 };
    });
  }, []);

  useEffect(() => {
    if (reduced) return undefined;
    const listener = (item) => {
      measure();
      setFlights((current) => [...current.slice(-3), item]);
    };
    listeners.add(listener);
    return () => listeners.delete(listener);
  }, [measure, reduced]);

  const remove = useCallback((id) => setFlights((current) => current.filter((flight) => flight.id !== id)), []);

  if (Platform.OS === "web") return null;
  return (
    <View ref={layerRef} collapsable={false} pointerEvents="none" onLayout={measure} style={styles.layer}>
      {flights.map((flight) => (
        <Flyer key={flight.id} item={flight} offset={offset.current} onDone={remove} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  layer: { ...StyleSheet.absoluteFillObject, zIndex: 9999, elevation: 9999 },
  flyer: {
    position: "absolute",
    left: 0,
    top: 0,
    width: SIZE,
    height: SIZE,
    borderRadius: 18,
    backgroundColor: "#FFFFFF",
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
  },
  clip: { flex: 1, borderRadius: 18, overflow: "hidden", borderWidth: 2.5, borderColor: "#FFFFFF" },
  fallback: { backgroundColor: "#244424" },
});
