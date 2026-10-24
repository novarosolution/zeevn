import { formatRupees } from "../../../utils/adminFormat";

/** Clean `[{ lat, lng }]` from a zone's stored polygon. */
export function polygonPoints(zone) {
  return (zone?.polygon || [])
    .map((p) => ({ lat: Number(p.lat ?? p.latitude), lng: Number(p.lng ?? p.longitude) }))
    .filter((p) => Number.isFinite(p.lat) && Number.isFinite(p.lng));
}

export function zoneHasArea(zone) {
  return polygonPoints(zone).length >= 3;
}

/** One plain sentence explaining what a customer pays in this zone. */
export function feePreview(fee, freeAbove) {
  const f = Math.max(0, Number(fee) || 0);
  const free = Math.max(0, Number(freeAbove) || 0);
  if (f === 0) return "Delivery is free in this zone.";
  if (free === 0) return `Customers always pay ${formatRupees(f)} for delivery.`;
  return `Orders under ${formatRupees(free)} pay ${formatRupees(f)}; ${formatRupees(free)} and above get free delivery.`;
}

export function feeSummary(zone) {
  const fee = Number(zone?.deliveryFee || 0);
  const free = Number(zone?.freeAbove || 0);
  if (fee === 0) return "Free delivery";
  return free > 0 ? `${formatRupees(fee)} · free above ${formatRupees(free)}` : `${formatRupees(fee)} flat`;
}

/** What a zone is matched by: a drawn area, pincodes, cities. */
export function coverageParts(zone) {
  const parts = [];
  const points = polygonPoints(zone).length;
  if (points >= 3) parts.push({ key: "area", label: "Map area", icon: "map-outline" });
  const pins = (zone?.postalCodes || []).length;
  if (pins) parts.push({ key: "pins", label: `${pins} pincode${pins === 1 ? "" : "s"}`, icon: "pin-outline" });
  const cities = (zone?.cities || []).length;
  if (cities) parts.push({ key: "cities", label: `${cities} cit${cities === 1 ? "y" : "ies"}`, icon: "business-outline" });
  return parts;
}

/** Ids of the riders assigned to a zone (populated or plain). */
export function zonePartnerIds(zone) {
  return (zone?.partnerIds || []).map((p) => String(p?._id || p)).filter(Boolean);
}

export const isValidPincode = (value) => /^\d{6}$/.test(String(value).replace(/\s/g, ""));

function usableMapCoord(value) {
  const n = Number(value);
  if (!Number.isFinite(n) || Math.abs(n) <= 0.2) return null;
  return n;
}

/** Orders worth drawing on the map: live, with a usable pin. Never treats 0,0 as a point. */
export function mapOrdersFrom(items = [], refOf = (o) => String(o._id).slice(-5), nameOf = (o) => "Customer", labelOf = (s) => s) {
  const out = [];
  for (const order of items) {
    const lat = usableMapCoord(order.shippingAddress?.latitude);
    const lng = usableMapCoord(order.shippingAddress?.longitude);
    if (lat == null || lng == null) continue;
    out.push({
      _id: String(order._id),
      lat,
      lng,
      status: order.status,
      assigned: Boolean(order.assignedDeliveryUser),
      flagged: Boolean(order.flag && order.flag.code !== "cash_due"),
      label: `${refOf(order)} · ${nameOf(order)} · ${labelOf(order.status)}`,
    });
  }
  return out;
}
