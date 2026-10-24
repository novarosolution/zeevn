const { getPublicStoreInfo } = require("../services/storeOpsService");

/** Public — whether the shop is taking orders right now, its cart rules and how to reach it. */
async function getStoreInfo(req, res, next) {
  try {
    res.json(await getPublicStoreInfo());
  } catch (error) {
    next(error);
  }
}

module.exports = { getStoreInfo };
