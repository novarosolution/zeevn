const HomeViewConfig = require("../models/HomeViewConfig");
const { normalizeShopLocation } = require("../utils/shopLocation");
const {
  normalizeAboutSection,
  normalizeCommunitySection,
  normalizeCompareSection,
  normalizeProcessSection,
  normalizeHeroSlides,
} = require("../utils/homeViewMedia");
const { parseFestivalKey, normalizeFestivalKey } = require("../utils/festivalKey");

/** In-memory defaults when the config document cannot be created (e.g. DB name case mismatch). */
function buildDefaultHomeViewConfig() {
  const doc = new HomeViewConfig();
  const obj = doc.toObject();
  delete obj._id;
  delete obj.__v;
  delete obj.createdAt;
  delete obj.updatedAt;
  return obj;
}

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

function logHomeViewDbError(err) {
  const msg = err?.message || String(err);
  if (/different case/i.test(msg)) {
    console.error(
      "[home-view] MongoDB database name case mismatch. Use MONGO_URI with db segment `Zeevan` (capital Z) or set MONGO_DB_NAME=Zeevan."
    );
  } else {
    console.warn("[home-view] Database error:", msg);
  }
}

/** Public read — never 500 when defaults can be served in memory. */
async function getPublicHomeViewPayload() {
  const existing = await HomeViewConfig.findOne().lean();
  if (existing) return existing;

  try {
    const created = await HomeViewConfig.create({});
    return created.toObject();
  } catch (err) {
    logHomeViewDbError(err);
    return buildDefaultHomeViewConfig();
  }
}

/** Admin read/write — needs a real Mongoose document. */
async function getOrCreateConfigDocument() {
  let config = await HomeViewConfig.findOne();
  if (config) return config;
  return HomeViewConfig.create({});
}

function serializeHomeViewConfig(config) {
  const obj = config?.toObject ? config.toObject() : { ...config };
  return {
    ...obj,
    festivalKey: normalizeFestivalKey(obj.festivalKey),
    heroSlides: normalizeHeroSlides(obj.heroSlides),
    aboutSection: normalizeAboutSection(obj.aboutSection),
    communitySection: normalizeCommunitySection(obj.communitySection),
    compareSection: normalizeCompareSection(obj.compareSection),
    processSection: normalizeProcessSection(obj.processSection),
  };
}

async function getPublicHomeViewConfig(req, res, next) {
  try {
    const config = await getPublicHomeViewPayload();
    res.json(serializeHomeViewConfig(config));
  } catch (error) {
    next(error);
  }
}

async function getAdminHomeViewConfig(req, res, next) {
  try {
    const config = await getOrCreateConfigDocument();
    res.json(serializeHomeViewConfig(config));
  } catch (error) {
    logHomeViewDbError(error);
    next(error);
  }
}

async function updateAdminHomeViewConfig(req, res, next) {
  try {
    const config = await getOrCreateConfigDocument();
    const {
      heroTitle,
      heroSubtitle,
      primeSectionTitle,
      productTypeTitle,
      showPrimeSection,
      showHomeSections,
      showProductTypeSections,
      productCardStyle,
      festivalKey,
      shopLocation,
      heroSlides,
      aboutSection,
      communitySection,
      compareSection,
      processSection,
    } = req.body || {};

    let nextFestivalKey;
    if (festivalKey !== undefined) {
      nextFestivalKey = parseFestivalKey(festivalKey);
      if (nextFestivalKey === null) {
        return res.status(400).json({
          message: 'Festival look must be "" (auto), "everyday", "navratri" or "diwali".',
        });
      }
    }

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
    if (nextFestivalKey !== undefined) config.festivalKey = nextFestivalKey;

    if (shopLocation !== undefined && shopLocation && typeof shopLocation === "object") {
      const next = normalizeShopLocation({ ...config.shopLocation?.toObject?.() || config.shopLocation, ...shopLocation });
      config.shopLocation = next;
      config.markModified("shopLocation");
    }

    if (heroSlides !== undefined) {
      config.heroSlides = normalizeHeroSlides(heroSlides);
      config.markModified("heroSlides");
    }

    if (aboutSection !== undefined && aboutSection && typeof aboutSection === "object") {
      config.aboutSection = normalizeAboutSection(aboutSection);
      config.markModified("aboutSection");
    }

    if (communitySection !== undefined && communitySection && typeof communitySection === "object") {
      config.communitySection = normalizeCommunitySection(communitySection);
      config.markModified("communitySection");
    }

    if (compareSection !== undefined && compareSection && typeof compareSection === "object") {
      config.compareSection = normalizeCompareSection(compareSection);
      config.markModified("compareSection");
    }

    if (processSection !== undefined && processSection && typeof processSection === "object") {
      config.processSection = normalizeProcessSection(processSection);
      config.markModified("processSection");
    }

    await config.save();
    res.json(serializeHomeViewConfig(config));
  } catch (error) {
    next(error);
  }
}


module.exports = {
  getPublicHomeViewConfig,
  getAdminHomeViewConfig,
  updateAdminHomeViewConfig,
};
