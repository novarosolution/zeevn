import polyline from "@mapbox/polyline";

/**
 * Decode Google-encoded polyline to react-native-maps coordinates.
 * @param {string | null | undefined} encoded
 * @returns {{ latitude: number; longitude: number }[] | null}
 */
export function decodeGooglePolyline(encoded) {
  if (!encoded || typeof encoded !== "string") return null;
  try {
    const decoded = polyline.decode(encoded);
    if (!Array.isArray(decoded) || decoded.length < 2) return null;
    return decoded.map(([latitude, longitude]) => ({ latitude, longitude }));
  } catch {
    return null;
  }
}
