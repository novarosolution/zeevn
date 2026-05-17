/**
 * Simple in-memory rate limit for auth routes (per IP).
 * Returns 429 with Retry-After when exceeded.
 */

const WINDOW_MS = 15 * 60 * 1000;
const MAX_ATTEMPTS = 20;
const buckets = new Map();

function clientKey(req) {
  return (
    req.headers["x-forwarded-for"]?.split(",")[0]?.trim() ||
    req.socket?.remoteAddress ||
    "unknown"
  );
}

function authRateLimit(req, res, next) {
  const key = clientKey(req);
  const now = Date.now();
  let bucket = buckets.get(key);
  if (!bucket || now - bucket.start > WINDOW_MS) {
    bucket = { start: now, count: 0 };
    buckets.set(key, bucket);
  }
  bucket.count += 1;
  if (bucket.count > MAX_ATTEMPTS) {
    const retryAfterSec = Math.ceil((bucket.start + WINDOW_MS - now) / 1000);
    res.set("Retry-After", String(retryAfterSec));
    return res.status(429).json({
      message: "Too many attempts. Please try again later.",
      retryAfterSeconds: retryAfterSec,
    });
  }
  return next();
}

module.exports = { authRateLimit };
