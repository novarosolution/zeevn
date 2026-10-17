/**
 * Simple per-user rate limit for PATCH /delivery/location (no extra dependency).
 * Caps burst abuse beyond the controller's 10s dedupe throttle.
 */
const WINDOW_MS = 60_000;
const MAX_HITS = 12;

const hitsByUser = new Map();

function prune(now) {
  if (hitsByUser.size < 500) return;
  for (const [key, entry] of hitsByUser) {
    if (now - entry.windowStart > WINDOW_MS * 2) hitsByUser.delete(key);
  }
}

function rateLimitDeliveryLocation(req, res, next) {
  const uid = String(req.user?._id || req.ip || "anon");
  const now = Date.now();
  prune(now);

  let entry = hitsByUser.get(uid);
  if (!entry || now - entry.windowStart >= WINDOW_MS) {
    entry = { windowStart: now, count: 0 };
    hitsByUser.set(uid, entry);
  }
  entry.count += 1;

  if (entry.count > MAX_HITS) {
    return res.status(429).json({
      message: "Too many location updates. Slow down and try again shortly.",
    });
  }
  return next();
}

module.exports = { rateLimitDeliveryLocation };
