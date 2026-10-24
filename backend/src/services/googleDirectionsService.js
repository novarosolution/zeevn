/**
 * Google Directions API — server-side only (key never exposed to clients).
 * See https://developers.google.com/maps/documentation/directions/overview
 */

const ROUTE_CACHE_TTL_MS = 60 * 1000;
const ROUTE_CACHE_MAX = 400;

/** @type {Map<string, { encodedPolyline: string; expiresAt: number }>} */
const routeCache = new Map();

function round4(n) {
  const x = Number(n);
  if (!Number.isFinite(x)) return "x";
  return x.toFixed(4);
}

function cacheKey(orderId, oLat, oLng, dLat, dLng) {
  return `${String(orderId)}:${round4(oLat)}:${round4(oLng)}:${round4(dLat)}:${round4(dLng)}`;
}

function pruneCacheIfNeeded() {
  if (routeCache.size <= ROUTE_CACHE_MAX) return;
  const now = Date.now();
  for (const [k, v] of routeCache.entries()) {
    if (v.expiresAt <= now) routeCache.delete(k);
  }
  while (routeCache.size > ROUTE_CACHE_MAX) {
    const first = routeCache.keys().next().value;
    if (first === undefined) break;
    routeCache.delete(first);
  }
}

/**
 * @param {string} orderId
 * @param {number} originLat
 * @param {number} originLng
 * @param {number} destLat
 * @param {number} destLng
 * @param {string} apiKey
 * @returns {Promise<{ encodedPolyline: string, distanceKm: number|null }|null>}
 */
async function fetchDrivingRouteEncodedPolyline(orderId, originLat, originLng, destLat, destLng, apiKey) {
  const key = cacheKey(orderId, originLat, originLng, destLat, destLng);
  const hit = routeCache.get(key);
  if (hit && Date.now() < hit.expiresAt) {
    return {
      encodedPolyline: hit.encodedPolyline,
      distanceKm: hit.distanceKm ?? null,
      durationSec: hit.durationSec ?? null,
    };
  }

  const params = new URLSearchParams({
    origin: `${originLat},${originLng}`,
    destination: `${destLat},${destLng}`,
    mode: "driving",
    key: apiKey,
  });
  const url = `https://maps.googleapis.com/maps/api/directions/json?${params.toString()}`;

  let data;
  try {
    const res = await fetch(url);
    data = await res.json();
  } catch {
    return null;
  }

  if (!data || data.status !== "OK" || !Array.isArray(data.routes) || data.routes.length === 0) {
    return null;
  }

  const points = data.routes[0]?.overview_polyline?.points;
  if (!points || typeof points !== "string") {
    return null;
  }

  const legs = data.routes[0].legs || [];
  const meters = legs.reduce((sum, leg) => sum + Number(leg?.distance?.value || 0), 0);
  const seconds = legs.reduce((sum, leg) => sum + Number(leg?.duration?.value || 0), 0);
  const distanceKm = meters > 0 ? Math.round((meters / 1000) * 10) / 10 : null;
  const durationSec = seconds > 0 ? seconds : null;

  pruneCacheIfNeeded();
  routeCache.set(key, {
    encodedPolyline: points,
    distanceKm,
    durationSec,
    expiresAt: Date.now() + ROUTE_CACHE_TTL_MS,
  });

  return { encodedPolyline: points, distanceKm, durationSec };
}

function getDirectionsApiKey() {
  return (
    process.env.GOOGLE_MAPS_ROUTES_API_KEY ||
    process.env.GOOGLE_MAPS_API_KEY ||
    process.env.GOOGLE_MAPS_SERVER_KEY ||
    ""
  ).trim();
}

module.exports = {
  fetchDrivingRouteEncodedPolyline,
  getDirectionsApiKey,
};
