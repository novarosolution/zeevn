import { realCoord } from "./geoCoord";

const DEFAULT_REGION = {
  latitude: 20.5937,
  longitude: 78.9629,
  latitudeDelta: 40,
  longitudeDelta: 40,
};

function pointOf(place, kind) {
  const latitude = realCoord(place?.latitude);
  const longitude = realCoord(place?.longitude);
  return latitude === null || longitude === null ? null : { latitude, longitude, kind };
}

/** Collect real lat/lng points for map fitting. */
export function collectOrderMapPoints({ shop, partner, destination } = {}) {
  return [pointOf(shop, "shop"), pointOf(partner, "partner"), pointOf(destination, "destination")].filter(Boolean);
}

/** React Native Maps `initialRegion` from multiple markers. */
export function computeMapRegionFromPoints(points, { paddingFactor = 2.4, minDelta = 0.025 } = {}) {
  const valid = (points || []).filter((p) => realCoord(p?.latitude) !== null && realCoord(p?.longitude) !== null);
  if (!valid.length) return DEFAULT_REGION;
  if (valid.length === 1) {
    return {
      latitude: Number(valid[0].latitude),
      longitude: Number(valid[0].longitude),
      latitudeDelta: 0.06,
      longitudeDelta: 0.06,
    };
  }

  const lats = valid.map((p) => Number(p.latitude));
  const lngs = valid.map((p) => Number(p.longitude));
  const minLat = Math.min(...lats);
  const maxLat = Math.max(...lats);
  const minLng = Math.min(...lngs);
  const maxLng = Math.max(...lngs);

  return {
    latitude: (minLat + maxLat) / 2,
    longitude: (minLng + maxLng) / 2,
    latitudeDelta: Math.max((maxLat - minLat) * paddingFactor, minDelta),
    longitudeDelta: Math.max((maxLng - minLng) * paddingFactor, minDelta),
  };
}
