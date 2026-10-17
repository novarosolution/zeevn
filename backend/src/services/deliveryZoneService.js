const DeliveryZone = require("../models/DeliveryZone");

function normalizePostalCode(raw) {
  const digits = String(raw || "").replace(/\D/g, "");
  if (digits.length >= 6) return digits.slice(0, 6);
  return digits;
}

function normalizeCity(raw) {
  return String(raw || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
}

function feeForZone(zone, itemsTotal) {
  const fee = Number(zone?.deliveryFee || 0);
  const freeAbove = Number(zone?.freeAbove || 0);
  const total = Number(itemsTotal || 0);
  if (freeAbove > 0 && total >= freeAbove) return 0;
  return Number.isFinite(fee) ? Math.max(0, fee) : 0;
}

function quoteFromZone(zone, itemsTotal = 0) {
  if (!zone) {
    return {
      serviceable: false,
      fee: 0,
      freeAbove: 0,
      etaMinutesMin: null,
      etaMinutesMax: null,
      zoneId: null,
      zoneName: "",
    };
  }
  return {
    serviceable: true,
    fee: feeForZone(zone, itemsTotal),
    freeAbove: Number(zone.freeAbove || 0),
    etaMinutesMin: Number(zone.etaMinutesMin || 0),
    etaMinutesMax: Number(zone.etaMinutesMax || 0),
    zoneId: String(zone._id),
    zoneName: zone.name || "",
  };
}

/**
 * Resolve active zone by pincode first, then city fallback.
 */
async function findZoneForAddress({ postalCode, city } = {}) {
  const pin = normalizePostalCode(postalCode);
  if (pin.length === 6) {
    const byPin = await DeliveryZone.findOne({
      isActive: true,
      postalCodes: pin,
    }).lean();
    if (byPin) return byPin;
  }

  const cityKey = normalizeCity(city);
  if (cityKey) {
    const byCity = await DeliveryZone.findOne({
      isActive: true,
      cities: cityKey,
    }).lean();
    if (byCity) return byCity;
  }

  return null;
}

async function resolveDeliveryQuote({ postalCode, city, itemsTotal = 0 } = {}) {
  const zone = await findZoneForAddress({ postalCode, city });
  return quoteFromZone(zone, itemsTotal);
}

/**
 * Ensure no other zone already claims these postal codes.
 * @returns {Promise<string|null>} conflict message or null
 */
async function findPostalCodeConflict(postalCodes, excludeZoneId = null) {
  const pins = [...new Set((postalCodes || []).map(normalizePostalCode).filter((p) => p.length === 6))];
  if (!pins.length) return null;
  const query = { postalCodes: { $in: pins } };
  if (excludeZoneId) query._id = { $ne: excludeZoneId };
  const hit = await DeliveryZone.findOne(query).select("name postalCodes").lean();
  if (!hit) return null;
  const overlap = (hit.postalCodes || []).filter((p) => pins.includes(p));
  return `Pincode(s) ${overlap.join(", ")} already used by zone "${hit.name}".`;
}

function sanitizeZoneBody(body = {}) {
  const postalCodes = [
    ...new Set(
      (Array.isArray(body.postalCodes) ? body.postalCodes : String(body.postalCodes || "").split(/[,\s]+/))
        .map(normalizePostalCode)
        .filter((p) => p.length === 6)
    ),
  ];
  const cities = [
    ...new Set(
      (Array.isArray(body.cities) ? body.cities : String(body.cities || "").split(/[,]+/))
        .map(normalizeCity)
        .filter(Boolean)
    ),
  ];
  const partnerIds = Array.isArray(body.partnerIds)
    ? body.partnerIds.map((id) => String(id)).filter(Boolean)
    : [];

  return {
    name: String(body.name || "").trim(),
    postalCodes,
    cities,
    isActive: body.isActive === undefined ? true : Boolean(body.isActive),
    deliveryFee: Math.max(0, Number(body.deliveryFee ?? 0)),
    freeAbove: Math.max(0, Number(body.freeAbove ?? 1499)),
    etaMinutesMin: Math.max(0, Number(body.etaMinutesMin ?? 60)),
    etaMinutesMax: Math.max(0, Number(body.etaMinutesMax ?? 180)),
    partnerIds,
  };
}

module.exports = {
  normalizePostalCode,
  normalizeCity,
  feeForZone,
  quoteFromZone,
  findZoneForAddress,
  resolveDeliveryQuote,
  findPostalCodeConflict,
  sanitizeZoneBody,
};
