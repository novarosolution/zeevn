const HomeViewConfig = require("../models/HomeViewConfig");

function normalizeBoolean(value, fallback) {
  if (value === undefined) return fallback;
  if (typeof value === "boolean") return value;
  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    if (["true", "1", "yes", "on"].includes(normalized)) return true;
    if (["false", "0", "no", "off"].includes(normalized)) return false;
  }
  return Boolean(value);
}

async function getOrCreateConfig() {
  let config = await HomeViewConfig.findOne();
  if (!config) {
    config = await HomeViewConfig.create({});
  }
  return config;
}

async function getPublicHomeViewConfig(req, res, next) {
  try {
    const config = await getOrCreateConfig();
    res.json(config);
  } catch (error) {
    next(error);
  }
}

async function getAdminHomeViewConfig(req, res, next) {
  try {
    const config = await getOrCreateConfig();
    res.json(config);
  } catch (error) {
    next(error);
  }
}

async function updateAdminHomeViewConfig(req, res, next) {
  try {
    const config = await getOrCreateConfig();
    const {
      heroTitle,
      heroSubtitle,
      primeSectionTitle,
      productTypeTitle,
      showPrimeSection,
      showHomeSections,
      showProductTypeSections,
      productCardStyle,
    } = req.body || {};

    if (heroTitle !== undefined) config.heroTitle = heroTitle;
    if (heroSubtitle !== undefined) config.heroSubtitle = heroSubtitle;
    if (primeSectionTitle !== undefined) config.primeSectionTitle = primeSectionTitle;
    if (productTypeTitle !== undefined) config.productTypeTitle = productTypeTitle;
    if (showPrimeSection !== undefined) {
      config.showPrimeSection = normalizeBoolean(showPrimeSection, config.showPrimeSection);
    }
    if (showHomeSections !== undefined) {
      config.showHomeSections = normalizeBoolean(showHomeSections, config.showHomeSections);
    }
    if (showProductTypeSections !== undefined) {
      config.showProductTypeSections = normalizeBoolean(
        showProductTypeSections,
        config.showProductTypeSections
      );
    }
    if (productCardStyle !== undefined && ["compact", "comfortable"].includes(String(productCardStyle))) {
      config.productCardStyle = productCardStyle;
    }

    await config.save();
    res.json(config);
  } catch (error) {
    next(error);
  }
}


module.exports = {
  getPublicHomeViewConfig,
  getAdminHomeViewConfig,
  updateAdminHomeViewConfig,
};
