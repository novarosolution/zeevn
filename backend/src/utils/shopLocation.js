const HomeViewConfig = require("../models/HomeViewConfig");

function normalizeShopLocation(raw) {
  const shop = raw && typeof raw === "object" ? raw : {};
  const lat = Number(shop.latitude);
  const lng = Number(shop.longitude);
  return {
    name: String(shop.name || "Zeevan Shop").trim() || "Zeevan Shop",
    line1: String(shop.line1 || "").trim(),
    city: String(shop.city || "").trim(),
    state: String(shop.state || "").trim(),
    postalCode: String(shop.postalCode || "").trim(),
    latitude: Number.isFinite(lat) ? lat : null,
    longitude: Number.isFinite(lng) ? lng : null,
  };
}

/** Shop / pickup pin from admin storefront settings — used on live order maps. */
async function getShopLocationPayload() {
  const config = await HomeViewConfig.findOne().lean();
  return normalizeShopLocation(config?.shopLocation);
}

module.exports = { getShopLocationPayload, normalizeShopLocation };
