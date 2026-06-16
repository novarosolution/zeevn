/**
 * Forward geocode via OpenStreetMap Nominatim (server-side).
 * Used when order shipping address has text but no GPS coordinates.
 */

const USER_AGENT = "Zeevan-OrderTracking/1.0";

function buildQuery(address) {
  const a = address && typeof address === "object" ? address : {};
  return [a.line1, a.city, a.state, a.postalCode, a.country]
    .map((x) => String(x || "").trim())
    .filter(Boolean)
    .join(", ");
}

/**
 * @param {{ line1?: string, city?: string, state?: string, postalCode?: string, country?: string }} address
 * @returns {Promise<{ latitude: number, longitude: number } | null>}
 */
async function geocodeAddress(address) {
  const q = buildQuery(address);
  if (!q) return null;

  const url = `https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&q=${encodeURIComponent(q)}`;
  const response = await fetch(url, {
    headers: {
      Accept: "application/json",
      "User-Agent": USER_AGENT,
    },
  });

  if (!response.ok) return null;

  const rows = await response.json();
  const hit = Array.isArray(rows) ? rows[0] : null;
  if (!hit) return null;

  const latitude = Number(hit.lat);
  const longitude = Number(hit.lon);
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return null;

  return { latitude, longitude };
}

module.exports = { geocodeAddress, buildQuery };
