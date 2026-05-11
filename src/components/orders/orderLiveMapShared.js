import { Linking, Platform } from "react-native";

/** Follow-up (not in-app yet): iOS Dynamic Island / Live Activities need a dev client + native module (e.g. expo prebuild). */

export const POLL_MS = 14000;
export const STALE_MS = 2 * 60 * 1000;

export function openMapsDirections(partner, destination) {
  const po = partner?.latitude != null && partner?.longitude != null;
  const de =
    destination?.latitude != null &&
    destination?.longitude != null &&
    Number.isFinite(Number(destination.latitude)) &&
    Number.isFinite(Number(destination.longitude));

  const plat = Number(partner?.latitude);
  const plng = Number(partner?.longitude);
  const dlat = Number(destination?.latitude);
  const dlng = Number(destination?.longitude);

  if (Platform.OS === "web") {
    let webUrl;
    if (po && de) {
      webUrl = `https://www.google.com/maps/dir/${plat},${plng}/${dlat},${dlng}`;
    } else if (de) {
      webUrl = `https://www.google.com/maps/search/?api=1&query=${dlat},${dlng}`;
    } else if (po) {
      webUrl = `https://www.google.com/maps/search/?api=1&query=${plat},${plng}`;
    }
    if (webUrl) Linking.openURL(webUrl);
    return;
  }

  let url;
  if (po && de) {
    if (Platform.OS === "ios") {
      url = `http://maps.apple.com/?saddr=${plat},${plng}&daddr=${dlat},${dlng}`;
    } else {
      url = `https://www.google.com/maps/dir/${plat},${plng}/${dlat},${dlng}`;
    }
  } else if (de) {
    if (Platform.OS === "ios") {
      url = `http://maps.apple.com/?daddr=${dlat},${dlng}`;
    } else {
      url = `https://www.google.com/maps/search/?api=1&query=${dlat},${dlng}`;
    }
  } else if (po) {
    if (Platform.OS === "ios") {
      url = `http://maps.apple.com/?daddr=${plat},${plng}`;
    } else {
      url = `https://www.google.com/maps/search/?api=1&query=${plat},${plng}`;
    }
  }
  if (url) Linking.openURL(url);
}

/**
 * Navigate to a single drop-off (delivery partner). Prefers coordinates; falls back to address query.
 */
export function openNavigateToDropoff({ latitude, longitude, addressQuery }) {
  const lat = Number(latitude);
  const lng = Number(longitude);

  if (Platform.OS === "web") {
    if (Number.isFinite(lat) && Number.isFinite(lng)) {
      Linking.openURL(`https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`);
      return;
    }
    const q = String(addressQuery || "").trim();
    if (q) Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q)}`);
    return;
  }

  if (Number.isFinite(lat) && Number.isFinite(lng)) {
    if (Platform.OS === "ios") {
      Linking.openURL(`http://maps.apple.com/?daddr=${lat},${lng}`);
      return;
    }
    Linking.openURL(`https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`);
    return;
  }
  const q = String(addressQuery || "").trim();
  if (!q) return;
  const enc = encodeURIComponent(q);
  if (Platform.OS === "ios") {
    Linking.openURL(`http://maps.apple.com/?daddr=${enc}`);
    return;
  }
  Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${enc}`);
}
