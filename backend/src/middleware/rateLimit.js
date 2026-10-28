/**
 * Small in-memory rate limiter (no extra dependency). One API process, so a Map is enough.
 *
 * rateLimit({ windowMs, max, key }) counts hits per key inside a rolling window and answers 429 past `max`.
 * `key(req)` should name what is being protected (an account, not just an IP: the shop sits behind a proxy
 * that can make many customers share one address).
 */
function rateLimit({ windowMs, max, key, message = "Too many attempts. Try again in a few minutes." }) {
  const hits = new Map();

  function prune(now) {
    if (hits.size < 1000) return;
    for (const [k, entry] of hits) {
      if (now - entry.windowStart >= windowMs) hits.delete(k);
    }
  }

  return function rateLimitMiddleware(req, res, next) {
    const now = Date.now();
    prune(now);
    const id = String(key ? key(req) : req.ip || "anon");
    let entry = hits.get(id);
    if (!entry || now - entry.windowStart >= windowMs) {
      entry = { windowStart: now, count: 0 };
      hits.set(id, entry);
    }
    entry.count += 1;
    if (entry.count > max) {
      res.set("Retry-After", String(Math.ceil((entry.windowStart + windowMs - now) / 1000)));
      return res.status(429).json({ message, code: "RATE_LIMITED" });
    }
    return next();
  };
}

const lowerEmail = (req) => String(req.body?.email || "").trim().toLowerCase();

/** Password guessing: tight per account, loose per address. */
const loginLimiter = [
  rateLimit({ windowMs: 15 * 60 * 1000, max: 10, key: (req) => `acct:${lowerEmail(req) || req.ip}` }),
  rateLimit({ windowMs: 15 * 60 * 1000, max: 300, key: (req) => `ip:${req.ip}` }),
];

/** Sign-up, social sign-in and token refresh: per address. */
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 60,
  key: (req) => `ip:${req.ip}`,
});

module.exports = { rateLimit, loginLimiter, authLimiter };
