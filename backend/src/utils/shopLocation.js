const HomeViewConfig = require("../models/HomeViewConfig");

/**
 * Drop 0,0 / junk GPS so quotes and maps do not pin the Atlantic. `limit` is the largest valid magnitude:
 * 90 for a latitude, 180 (the default) for a longitude.
 */
function cleanMapCoord(n, limit = 180) {
  if (n === null || n === undefined || n === "") return null;
  const v = Number(n);
  return Number.isFinite(v) && Math.abs(v) > 0.2 && Math.abs(v) <= limit ? v : null;
}

function normalizeShopLocation(raw) {
  const shop = raw && typeof raw === "object" ? raw : {};
  return {
    name: String(shop.name || "Zeevan Shop").trim() || "Zeevan Shop",
    line1: String(shop.line1 || "").trim(),
    city: String(shop.city || "").trim(),
    state: String(shop.state || "").trim(),
    postalCode: String(shop.postalCode || "").trim(),
    latitude: cleanMapCoord(shop.latitude, 90),
    longitude: cleanMapCoord(shop.longitude),
  };
}

/** Shop / pickup pin from admin storefront settings — used on live order maps. */
async function getShopLocationPayload() {
  const config = await HomeViewConfig.findOne().lean();
  return normalizeShopLocation(config?.shopLocation);
}

module.exports = { getShopLocationPayload, normalizeShopLocation, cleanMapCoord };
