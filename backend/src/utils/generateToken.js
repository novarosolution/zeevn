const jwt = require("jsonwebtoken");

const ACCESS_DEFAULT = "1d";
const REFRESH_DEFAULT = "30d";

function requireSecret(name = "JWT_SECRET") {
  const secret = process.env[name] || (name === "JWT_REFRESH_SECRET" ? process.env.JWT_SECRET : "");
  if (!secret) {
    const err = new Error("Login is not configured on the server.");
    err.statusCode = 503;
    err.code = "AUTH_MISCONFIGURED";
    throw err;
  }
  return secret;
}

/** Short-lived access token. Used as the bearer for normal API calls. */
function generateToken(userId) {
  return jwt.sign({ id: userId, type: "access" }, requireSecret(), {
    expiresIn: process.env.JWT_EXPIRES_IN || ACCESS_DEFAULT,
  });
}

/**
 * Long-lived refresh token. Signed with a separate secret when configured so
 * leaked access tokens don't compromise refresh; falls back to JWT_SECRET when
 * JWT_REFRESH_SECRET is not provided (keeps current envs working).
 */
function generateRefreshToken(userId) {
  return jwt.sign({ id: userId, type: "refresh" }, requireSecret("JWT_REFRESH_SECRET"), {
    expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || REFRESH_DEFAULT,
  });
}

function verifyRefreshToken(token) {
  return jwt.verify(token, requireSecret("JWT_REFRESH_SECRET"));
}

module.exports = generateToken;
module.exports.generateToken = generateToken;
module.exports.generateRefreshToken = generateRefreshToken;
module.exports.verifyRefreshToken = verifyRefreshToken;
