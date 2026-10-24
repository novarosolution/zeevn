const DeliveryZone = require("../models/DeliveryZone");
const StoreSettings = require("../models/StoreSettings");
const { distanceKm, pointInPolygon, minutesFromKm, formatMinutes, formatKm } = require("./deliveryGeo");

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

const DELIVERY_NOT_POSSIBLE = "Delivery is not possible to this area";

function decorateQuote(quote, settings, km) {
  const next = { ...quote, distanceKm: null, distanceLabel: "", etaLabel: "" };
  if (Number.isFinite(km)) {
    next.distanceKm = Math.round(km * 10) / 10;
    next.distanceLabel = formatKm(km);
    const minutes = minutesFromKm(km, settings?.minutesPerKm);
    if (minutes != null) {
      next.etaMinutesMin = minutes;
      next.etaMinutesMax = minutes;
      next.etaLabel = formatMinutes(minutes);
    }
  } else if (quote.etaMinutesMin != null) {
    next.etaLabel = formatMinutes(quote.etaMinutesMin);
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
    etaMinutesMin: Number(zone.etaMinutesMin || 0),
    etaMinutesMax: Number(zone.etaMinutesMax || 0),
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

async function resolveDeliveryQuote({ postalCode, city, itemsTotal = 0, latitude, longitude } = {}) {
  const settings = await StoreSettings.get();
  const stores = StoreSettings.listStores(settings);
  const lat = Number(latitude);
  const lng = Number(longitude);
  const hasPoint = Number.isFinite(lat) && Number.isFinite(lng);

  let zone = hasPoint ? await findZoneForPoint(lat, lng) : null;
  if (!zone) zone = await findZoneForAddress({ postalCode, city });

  const picked = hasPoint ? pickCoveringStore(stores, lat, lng, Boolean(zone)) : { store: null, km: null };
  const store = picked.store || stores[0];
  const km = picked.km != null ? picked.km : hasPoint && store ? distanceKm({ lat, lng }, store) : null;

  const storePin = {
    storeId: store?._id ? String(store._id) : null,
    storeName: store?.label || "",
    storeLatitude: Number.isFinite(Number(store?.latitude)) ? Number(store.latitude) : null,
    storeLongitude: Number.isFinite(Number(store?.longitude)) ? Number(store.longitude) : null,
    minutesPerKm: Number(settings?.minutesPerKm) > 0 ? Number(settings.minutesPerKm) : 3,
  };

  if (zone) {
    return decorateQuote(
      { ...quoteFromZone(zone, itemsTotal), ...storePin },
      settings,
      km
    );
  }

  if (picked.store) {
    return decorateQuote(
      {
        serviceable: true,
        fee: 0,
        freeAbove: 0,
        etaMinutesMin: minutesFromKm(picked.km, settings.minutesPerKm),
        etaMinutesMax: minutesFromKm(picked.km, settings.minutesPerKm),
        zoneId: null,
        zoneName: picked.store.label || "Store area",
        ...storePin,
        storeId: picked.store._id ? String(picked.store._id) : storePin.storeId,
        storeName: picked.store.label || storePin.storeName,
        message: "",
      },
      settings,
      picked.km
    );
  }

  return decorateQuote(
    { ...quoteFromZone(null), ...storePin },
    settings,
    km
  );
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
    polygon,
    isActive: body.isActive === undefined ? true : Boolean(body.isActive),
    deliveryFee: Math.max(0, Number(body.deliveryFee ?? 0)),
    freeAbove: Math.max(0, Number(body.freeAbove ?? 1499)),
    etaMinutesMin: Math.max(0, Number(body.etaMinutesMin ?? 60)),
    etaMinutesMax: Math.max(0, Number(body.etaMinutesMax ?? 180)),
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
