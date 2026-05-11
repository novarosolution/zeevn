const jwt = require("jsonwebtoken");

const ACCESS_DEFAULT = "1d";
const REFRESH_DEFAULT = "30d";

/** Short-lived access token. Used as the bearer for normal API calls. */
function generateToken(userId) {
  return jwt.sign({ id: userId, type: "access" }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || ACCESS_DEFAULT,
  });
}

/**
 * Long-lived refresh token. Signed with a separate secret when configured so
 * leaked access tokens don't compromise refresh; falls back to JWT_SECRET when
 * JWT_REFRESH_SECRET is not provided (keeps current envs working).
 */
function generateRefreshToken(userId) {
  const secret = process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET;
  return jwt.sign({ id: userId, type: "refresh" }, secret, {
    expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || REFRESH_DEFAULT,
  });
}

function verifyRefreshToken(token) {
  const secret = process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET;
  return jwt.verify(token, secret);
}

module.exports = generateToken;
module.exports.generateToken = generateToken;
module.exports.generateRefreshToken = generateRefreshToken;
module.exports.verifyRefreshToken = verifyRefreshToken;
