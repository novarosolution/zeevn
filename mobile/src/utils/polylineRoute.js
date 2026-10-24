import polyline from "@mapbox/polyline";

/**
 * Decode Google-encoded polyline to react-native-maps coordinates.
 * @param {string | null | undefined} encoded
 * @returns {{ latitude: number; longitude: number }[] | null}
 */
export function pathFromQuote(quote) {
  const decoded = decodeGooglePolyline(quote?.encodedPolyline);
  if (decoded) return decoded;
  const path = quote?.path;
  if (!Array.isArray(path) || path.length < 2) return null;
  const next = path
    .map((p) => ({
      latitude: Number(p?.latitude ?? p?.lat),
      longitude: Number(p?.longitude ?? p?.lng),
    }))
    .filter((p) => Number.isFinite(p.latitude) && Number.isFinite(p.longitude));
  return next.length >= 2 ? next : null;
}

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
