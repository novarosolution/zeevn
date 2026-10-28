const crypto = require("crypto");
const jwt = require("jsonwebtoken");

const APPLE_ISSUER = "https://appleid.apple.com";
const APPLE_KEYS_URL = "https://appleid.apple.com/auth/keys";
const APPLE_KEYS_TTL_MS = 6 * 60 * 60 * 1000;

let appleKeysCache = { keys: null, fetchedAt: 0 };

async function getAppleKeys(forceRefresh = false) {
  const fresh = appleKeysCache.keys && Date.now() - appleKeysCache.fetchedAt < APPLE_KEYS_TTL_MS;
  if (fresh && !forceRefresh) return appleKeysCache.keys;
  const res = await fetch(APPLE_KEYS_URL);
  const data = await res.json().catch(() => ({}));
  if (!res.ok || !Array.isArray(data.keys)) {
    throw new Error("Could not reach Apple to verify the sign-in.");
  }
  appleKeysCache = { keys: data.keys, fetchedAt: Date.now() };
  return data.keys;
}

const GOOGLE_CLIENT_IDS = String(process.env.GOOGLE_OAUTH_CLIENT_ID || "")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

const APPLE_CLIENT_IDS = [
  process.env.APPLE_CLIENT_ID,
  process.env.APPLE_BUNDLE_ID,
  process.env.EXPO_PUBLIC_APPLE_CLIENT_ID,
]
  .filter(Boolean)
  .map((s) => String(s).trim());

async function verifyGoogleIdToken(idToken) {
  if (!idToken) {
    throw new Error("Google idToken is required.");
  }
  const res = await fetch(
    `https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(idToken)}`
  );
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error_description || data.error || "Invalid Google token.");
  }
  if (GOOGLE_CLIENT_IDS.length === 0) {
    const err = new Error("Google sign-in is not configured on the server.");
    err.statusCode = 503;
    throw err;
  }
  if (!GOOGLE_CLIENT_IDS.includes(data.aud)) {
    throw new Error("Google token audience mismatch.");
  }
  if (!data.email) {
    throw new Error("Google account did not return an email.");
  }
  if (!(data.email_verified === "true" || data.email_verified === true)) {
    throw new Error("Your Google email is not verified.");
  }
  return {
    provider: "google",
    providerId: data.sub,
    email: String(data.email).toLowerCase().trim(),
    name: data.name || data.email.split("@")[0],
    avatar: data.picture || "",
    emailVerified: data.email_verified === "true" || data.email_verified === true,
  };
}

/** Verify the Apple identity token's signature, issuer, audience and expiry against Apple's published keys. */
async function verifyAppleIdentityToken(identityToken) {
  if (!identityToken) {
    throw new Error("Apple identityToken is required.");
  }
  if (APPLE_CLIENT_IDS.length === 0) {
    const err = new Error("Apple sign-in is not configured on the server.");
    err.statusCode = 503;
    throw err;
  }
  const decoded = jwt.decode(identityToken, { complete: true });
  if (!decoded?.header?.kid || decoded.header.alg !== "RS256") {
    throw new Error("Invalid Apple identity token.");
  }

  let keys = await getAppleKeys();
  let jwk = keys.find((k) => k.kid === decoded.header.kid);
  if (!jwk) {
    keys = await getAppleKeys(true);
    jwk = keys.find((k) => k.kid === decoded.header.kid);
  }
  if (!jwk) {
    throw new Error("Invalid Apple identity token.");
  }

  let payload;
  try {
    payload = jwt.verify(identityToken, crypto.createPublicKey({ key: jwk, format: "jwk" }), {
      algorithms: ["RS256"],
      issuer: APPLE_ISSUER,
      audience: APPLE_CLIENT_IDS,
    });
  } catch {
    throw new Error("Invalid Apple identity token.");
  }
  if (!payload.sub) {
    throw new Error("Apple account did not return enough identity data.");
  }

  const email = payload.email ? String(payload.email).toLowerCase().trim() : "";
  const emailVerified = payload.email_verified === true || payload.email_verified === "true";
  return {
    provider: "apple",
    providerId: payload.sub,
    email: email || `apple_${payload.sub}@users.kankreg.local`,
    name: "",
    avatar: "",
    emailVerified: Boolean(email) && emailVerified,
  };
}

module.exports = {
  verifyGoogleIdToken,
  verifyAppleIdentityToken,
  isGoogleOAuthConfigured: () => GOOGLE_CLIENT_IDS.length > 0,
  isAppleOAuthConfigured: () => APPLE_CLIENT_IDS.length > 0,
};
