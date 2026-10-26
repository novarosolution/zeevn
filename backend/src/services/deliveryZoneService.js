const DeliveryZone = require("../models/DeliveryZone");
const StoreSettings = require("../models/StoreSettings");
const { cleanMapCoord } = require("../utils/shopLocation");
const { distanceKm, pointInPolygon, minutesFromKm, formatMinutes, formatKm } = require("./deliveryGeo");

function normalizePostalCode(raw) {
  const digits = String(raw || "").replace(/\D/g, "");
  return digits.length === 6 ? digits : "";
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

const DELIVERY_NOT_POSSIBLE = "Delivery is not possible to this area";

function decorateQuote(quote, settings, km) {
  const next = { ...quote, distanceKm: null, distanceLabel: "", etaLabel: "", etaMinutesMin: null, etaMinutesMax: null };
  if (Number.isFinite(km)) {
    next.distanceKm = Math.round(km * 10) / 10;
    next.distanceLabel = formatKm(km);
    const minutes = minutesFromKm(km, settings?.minutesPerKm);
    if (minutes != null) {
      next.etaMinutesMin = minutes;
      next.etaMinutesMax = minutes;
      next.etaLabel = formatMinutes(minutes);
    }
  }
  return next;
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
      message: DELIVERY_NOT_POSSIBLE,
    };
  }
  return {
    serviceable: true,
    fee: feeForZone(zone, itemsTotal),
    freeAbove: Number(zone.freeAbove || 0),
    etaMinutesMin: null,
    etaMinutesMax: null,
    zoneId: String(zone._id),
    zoneName: zone.name || "",
    message: "",
  };
}

/** Nearest store that covers this point (own radius, or any drawn zone). */
function pickCoveringStore(stores, lat, lng, inAnyZone) {
  let store = null;
  let km = Infinity;
  for (const row of stores || []) {
    if (row?.isActive === false) continue;
    const d = distanceKm({ lat, lng }, row);
    if (d == null) continue;
    const inRadius = Number(row.maxRadiusKm) > 0 && d <= Number(row.maxRadiusKm);
    if (inAnyZone || inRadius) {
      if (d < km) {
        km = d;
        store = row;
      }
    }
  }
  return { store, km: store ? km : null };
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

async function findZoneForPoint(lat, lng) {
  const zones = await DeliveryZone.find({ isActive: true, "polygon.2": { $exists: true } }).lean();
  return zones.find((z) => pointInPolygon(lat, lng, z.polygon)) || null;
}

function storePinFrom(store, settings) {
  return {
    storeId: store?._id ? String(store._id) : null,
    storeName: store?.label || "",
    storeLatitude: cleanMapCoord(store?.latitude, 90),
    storeLongitude: cleanMapCoord(store?.longitude),
    minutesPerKm: Number(settings?.minutesPerKm) > 0 ? Number(settings.minutesPerKm) : 3,
  };
}

/**
 * With a real pin: covered = drawn polygon OR shop radius. City/pincode never override the map.
 * Time is always km × minutesPerKm. Without a pin: pincode/city can still say yes/no, but no fake ETA.
 */
async function resolveDeliveryQuote({ postalCode, city, itemsTotal = 0, latitude, longitude } = {}) {
  const settings = await StoreSettings.get();
  const stores = StoreSettings.listStores(settings);
  const lat = cleanMapCoord(latitude, 90);
  const lng = cleanMapCoord(longitude);
  const inIndia = lat != null && lng != null && lat >= 6 && lat <= 38 && lng >= 68 && lng <= 98;
  const hasPoint = inIndia;

  if (hasPoint) {
    const zone = await findZoneForPoint(lat, lng);
    let picked = pickCoveringStore(stores, lat, lng, false);
    if (zone && !picked.store) picked = pickCoveringStore(stores, lat, lng, true);
    const store = picked.store || stores[0];
    const km = store ? distanceKm({ lat, lng }, store) : null;
    const pin = storePinFrom(store, settings);

    if (zone) {
      return decorateQuote({ ...quoteFromZone(zone, itemsTotal), ...pin }, settings, km);
    }
    if (picked.store) {
      return decorateQuote(
        {
          serviceable: true,
          fee: 0,
          freeAbove: 0,
          zoneId: null,
          zoneName: picked.store.label || "Store area",
          message: "",
          ...pin,
        },
        settings,
        picked.km
      );
    }
    return decorateQuote({ ...quoteFromZone(null), ...pin }, settings, km);
  }

  const zone = await findZoneForAddress({ postalCode, city });
  return decorateQuote({ ...quoteFromZone(zone, itemsTotal), ...storePinFrom(stores[0], settings) }, settings, null);
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
  const polygon = (Array.isArray(body.polygon) ? body.polygon : [])
    .map((p) => ({
      lat: Number(p.lat ?? p.latitude),
      lng: Number(p.lng ?? p.longitude),
    }))
    .filter((p) => Number.isFinite(p.lat) && Number.isFinite(p.lng));

  return {
    name: String(body.name || "").trim(),
    postalCodes,
    cities,
    polygon: polygon.length >= 3 ? polygon : [],
    isActive: body.isActive === undefined ? true : Boolean(body.isActive),
    deliveryFee: Math.max(0, Number(body.deliveryFee ?? 0)),
    freeAbove: Math.max(0, Number(body.freeAbove ?? 1499)),
    partnerIds,
  };
}

module.exports = {
  DELIVERY_NOT_POSSIBLE,
  normalizePostalCode,
  normalizeCity,
  feeForZone,
  quoteFromZone,
  pickCoveringStore,
  findZoneForAddress,
  resolveDeliveryQuote,
  findPostalCodeConflict,
  sanitizeZoneBody,
};

if (require.main === module) {
  const a = { label: "A", latitude: 23.22, longitude: 72.64, maxRadiusKm: 5, isActive: true };
  const b = { label: "B", latitude: 21.17, longitude: 72.83, maxRadiusKm: 8, isActive: true };
  const nearA = pickCoveringStore([a, b], 23.23, 72.64, false);
  console.assert(nearA.store?.label === "A", nearA);
  const far = pickCoveringStore([a, b], 19.07, 72.87, false);
  console.assert(!far.store, far);
  const inZoneFarFromBoth = pickCoveringStore([a, b], 19.07, 72.87, true);
  console.assert(inZoneFarFromBoth.store, inZoneFarFromBoth);
  console.log("deliveryZoneService ok");
}
