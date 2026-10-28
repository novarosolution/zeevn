const STATIC_ORIGINS = new Set([
  "https://novarosolution.com",
  "https://www.novarosolution.com",
  "https://zeevan.app",
  "https://www.zeevan.app",
  "https://zeevan.shop",
  "https://www.zeevan.shop",
]);

/** Shop domains, local dev, and anything listed in CORS_EXTRA_ORIGINS (e.g. a Vercel preview or the EC2 address). */
function isAllowedOrigin(origin) {
  // Native apps and server-to-server calls send no Origin header; browsers always do.
  if (!origin) return true;
  if (STATIC_ORIGINS.has(origin)) return true;
  if (process.env.NODE_ENV !== "production" && /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i.test(origin)) return true;
  const extra = process.env.CORS_EXTRA_ORIGINS;
  if (extra) {
    for (const o of extra.split(",").map((s) => s.trim()).filter(Boolean)) {
      if (origin === o) return true;
    }
  }
  return false;
}

function corsOriginCallback(origin, callback) {
  if (isAllowedOrigin(origin)) {
    return callback(null, true);
  }
  // Reject without throwing — avoids HTTP 500 on browser preflight.
  return callback(null, false);
}

module.exports = {
  isAllowedOrigin,
  corsOriginCallback,
};
