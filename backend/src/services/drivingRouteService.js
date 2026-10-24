const { fetchDrivingRouteEncodedPolyline, getDirectionsApiKey } = require("./googleDirectionsService");
const { minutesFromKm, formatMinutes, formatKm } = require("./deliveryGeo");

function downsamplePath(points, max = 80) {
  if (!Array.isArray(points) || points.length <= max) return points || [];
  const step = (points.length - 1) / (max - 1);
  const out = [];
  for (let i = 0; i < max; i += 1) out.push(points[Math.round(i * step)]);
  return out;
}

function cleanPoint(lat, lng) {
  const a = Number(lat);
  const b = Number(lng);
  if (!Number.isFinite(a) || !Number.isFinite(b) || Math.abs(a) <= 0.2 || Math.abs(b) <= 0.2) return null;
  return { latitude: a, longitude: b };
}

async function fetchOsrmRoute(origin, dest) {
  const url = `https://router.project-osrm.org/route/v1/driving/${origin.longitude},${origin.latitude};${dest.longitude},${dest.latitude}?overview=full&geometries=geojson`;
  const res = await fetch(url, { signal: AbortSignal.timeout(4500) });
  if (!res.ok) return null;
  const data = await res.json();
  const route = data?.routes?.[0];
  const coords = route?.geometry?.coordinates;
  if (!Array.isArray(coords) || coords.length < 2) return null;
  const path = downsamplePath(
    coords.map(([lng, lat]) => ({ latitude: Number(lat), longitude: Number(lng) }))
  );
  const km = Number(route.distance) / 1000;
  const durationSec = Number(route.duration);
  if (!Number.isFinite(km) || path.length < 2) return null;
  return {
    path,
    distanceKm: Math.round(km * 10) / 10,
    durationSec: Number.isFinite(durationSec) && durationSec > 0 ? durationSec : null,
    provider: "osrm",
    encodedPolyline: null,
  };
}

/**
 * Shortest driving path. Google if a key is set, otherwise public OSRM.
 */
async function fetchDrivingRoute(originLat, originLng, destLat, destLng, cacheId = "quote") {
  const origin = cleanPoint(originLat, originLng);
  const dest = cleanPoint(destLat, destLng);
  if (!origin || !dest) return null;

  const apiKey = getDirectionsApiKey();
  if (apiKey) {
    try {
      const google = await fetchDrivingRouteEncodedPolyline(
        cacheId,
        origin.latitude,
        origin.longitude,
        dest.latitude,
        dest.longitude,
        apiKey
      );
      const encoded = typeof google === "string" ? google : google?.encodedPolyline;
      if (encoded) {
        return {
          encodedPolyline: encoded,
          path: null,
          distanceKm: typeof google === "object" ? google.distanceKm : null,
          durationSec: typeof google === "object" ? google.durationSec : null,
          provider: "google",
        };
      }
    } catch {
      /* fall through to OSRM */
    }
  }

  try {
    return await fetchOsrmRoute(origin, dest);
  } catch {
    return null;
  }
}

function etaMinutesFromRoute(km, minutesPerKm, durationSec) {
  if (Number.isFinite(durationSec) && durationSec > 0) return Math.max(1, Math.round(durationSec / 60));
  return minutesFromKm(km, minutesPerKm);
}

function applyRoadEta(quote, minutesPerKm, km, durationSec) {
  const minutes = etaMinutesFromRoute(km, minutesPerKm, durationSec);
  const next = { ...quote };
  if (Number.isFinite(km)) {
    next.distanceKm = Math.round(km * 10) / 10;
    next.distanceLabel = formatKm(km);
  }
  if (minutes != null) {
    next.etaMinutesMin = minutes;
    next.etaMinutesMax = minutes;
    next.etaLabel = formatMinutes(minutes);
  }
  return next;
}

/** Shortest-path line + drive minutes (OSRM/Google duration). km × minutesPerKm only if the router is silent. */
async function enrichQuoteWithRoute(quote, { latitude, longitude, minutesPerKm = 3 } = {}) {
  if (!quote) return quote;
  const origin = cleanPoint(quote.storeLatitude, quote.storeLongitude);
  const dest = cleanPoint(latitude, longitude);
  if (!origin || !dest) return quote;

  const route = await fetchDrivingRoute(
    origin.latitude,
    origin.longitude,
    dest.latitude,
    dest.longitude,
    `store:${quote.storeId || "shop"}`
  );
  if (!route) return quote;

  const next = applyRoadEta(quote, minutesPerKm, route.distanceKm, route.durationSec);
  return {
    ...next,
    encodedPolyline: route.encodedPolyline || null,
    path: route.path || null,
    routeProvider: route.provider || null,
  };
}

module.exports = { fetchDrivingRoute, enrichQuoteWithRoute, etaMinutesFromRoute };

if (require.main === module) {
  console.assert(etaMinutesFromRoute(15, 3, 25 * 60) === 25, "drive time wins");
  console.assert(etaMinutesFromRoute(15, 3, null) === 45, "km × 3 only without a route");
  console.log("drivingRouteService ok");
}
