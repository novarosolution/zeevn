const logger = require("../utils/logger");

function requestLogger(req, res, next) {
  const start = Date.now();
  res.on("finish", () => {
    const durationMs = Date.now() - start;
    const entry = {
      requestId: req.requestId,
      method: req.method,
      path: req.originalUrl || req.url,
      status: res.statusCode,
      durationMs,
    };
    if (res.statusCode >= 500) {
      logger.error(entry, "request failed");
    } else if (res.statusCode >= 400) {
      logger.warn(entry, "client error");
    } else if (durationMs > 2000) {
      logger.warn({ ...entry, slow: true }, "slow request");
    } else {
      logger.info(entry, "request");
    }
  });
  next();
}

module.exports = { requestLogger };
