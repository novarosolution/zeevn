const crypto = require("crypto");

function parseDeviceName(userAgent = "") {
  const ua = String(userAgent);
  if (/iPhone|iPad|iPod/i.test(ua)) return "Safari on iPhone";
  if (/Android/i.test(ua)) return /Chrome/i.test(ua) ? "Chrome on Android" : "Android device";
  if (/Macintosh|Mac OS/i.test(ua)) return /Chrome/i.test(ua) ? "Chrome on Mac" : "Safari on MacBook";
  if (/Windows/i.test(ua)) return /Chrome/i.test(ua) ? "Chrome on Windows" : "Windows device";
  if (/Linux/i.test(ua)) return "Linux browser";
  return "Unknown device";
}

function roughLocation(req) {
  const ip =
    String(req.headers["x-forwarded-for"] || "")
      .split(",")[0]
      .trim() ||
    req.ip ||
    req.socket?.remoteAddress ||
    "";
  if (!ip || ip === "::1" || ip === "127.0.0.1") return "Local network";
  return `Approx. ${ip}`;
}

function logAccountActivity(user, type, detail = "") {
  if (!user) return;
  const entry = { type, detail: String(detail || "").slice(0, 240), at: new Date() };
  const list = Array.isArray(user.accountActivity) ? user.accountActivity : [];
  user.accountActivity = [entry, ...list].slice(0, 100);
}

async function recordUserSession(user, req) {
  const sessionId = crypto.randomUUID();
  const deviceName = parseDeviceName(req.headers["user-agent"]);
  const location = roughLocation(req);
  const entry = {
    sessionId,
    deviceName,
    location,
    lastActiveAt: new Date(),
    userAgent: String(req.headers["user-agent"] || "").slice(0, 200),
  };
  const sessions = Array.isArray(user.activeSessions) ? user.activeSessions : [];
  user.activeSessions = [entry, ...sessions.filter((s) => s.sessionId !== sessionId)].slice(0, 10);
  await user.save();
  return sessionId;
}

function touchSession(user, sessionId) {
  if (!sessionId || !Array.isArray(user.activeSessions)) return;
  const row = user.activeSessions.find((s) => s.sessionId === sessionId);
  if (row) row.lastActiveAt = new Date();
}

module.exports = {
  parseDeviceName,
  roughLocation,
  logAccountActivity,
  recordUserSession,
  touchSession,
};
