/** Haversine km. */
function distanceKm(a, b) {
  const lat1 = Number(a?.lat ?? a?.latitude);
  const lon1 = Number(a?.lng ?? a?.longitude);
  const lat2 = Number(b?.lat ?? b?.latitude);
  const lon2 = Number(b?.lng ?? b?.longitude);
  if (![lat1, lon1, lat2, lon2].every(Number.isFinite)) return null;
  const rad = Math.PI / 180;
  const dLat = (lat2 - lat1) * rad;
  const dLon = (lon2 - lon1) * rad;
  const h =
    Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * rad) * Math.cos(lat2 * rad) * Math.sin(dLon / 2) ** 2;
  return 6371 * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
}

function pointInPolygon(lat, lng, ring) {
  if (!Array.isArray(ring) || ring.length < 3) return false;
  const y = Number(lat);
  const x = Number(lng);
  if (!Number.isFinite(y) || !Number.isFinite(x)) return false;
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const yi = Number(ring[i].lat ?? ring[i].latitude);
    const xi = Number(ring[i].lng ?? ring[i].longitude);
    const yj = Number(ring[j].lat ?? ring[j].latitude);
    const xj = Number(ring[j].lng ?? ring[j].longitude);
    if (![yi, xi, yj, xj].every(Number.isFinite)) continue;
    const intersect = yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi;
    if (intersect) inside = !inside;
  }
  return inside;
}

function minutesFromKm(km, minutesPerKm = 3) {
  if (!Number.isFinite(km) || km < 0) return null;
  const rate = Number(minutesPerKm);
  const per = Number.isFinite(rate) && rate > 0 ? rate : 3;
  return Math.max(1, Math.round(km * per));
}

function formatMinutes(min) {
  const n = Math.max(1, Math.round(Number(min) || 0));
  if (n < 60) return `${n} minute${n === 1 ? "" : "s"}`;
  const h = Math.floor(n / 60);
  const m = n % 60;
  if (!m) return h === 1 ? "1 hour" : `${h} hours`;
  return `${h}h ${m}m`;
}

function formatKm(km) {
  if (!Number.isFinite(km)) return "";
  if (km < 1) return `${Math.max(100, Math.round((km * 1000) / 50) * 50)} m`;
  return `${km < 10 ? km.toFixed(1).replace(/\.0$/, "") : Math.round(km)} km`;
}

module.exports = { distanceKm, pointInPolygon, minutesFromKm, formatMinutes, formatKm };

if (require.main === module) {
  const km = distanceKm({ lat: 23.2156, lng: 72.6369 }, { lat: 23.2246, lng: 72.6369 });
  console.assert(km > 0.9 && km < 1.1, `1km north should be ~1, got ${km}`);
  const square = [
    { lat: 23.2, lng: 72.6 },
    { lat: 23.3, lng: 72.6 },
    { lat: 23.3, lng: 72.7 },
    { lat: 23.2, lng: 72.7 },
  ];
  console.assert(pointInPolygon(23.25, 72.65, square), "inside square");
  console.assert(!pointInPolygon(23.0, 72.0, square), "outside square");
  console.assert(minutesFromKm(1, 3) === 3, "1km = 3min");
  console.assert(formatMinutes(3) === "3 minutes", formatMinutes(3));
  console.log("deliveryGeo ok");
}
