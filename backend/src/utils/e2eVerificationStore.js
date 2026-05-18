/**
 * In-memory store of raw email-verification tokens for E2E / non-production only.
 * Never enable in production.
 */

const store = new Map();

function isTestRoutesEnabled() {
  if (process.env.NODE_ENV === "production") return false;
  if (process.env.ENABLE_TEST_ROUTES === "false") return false;
  return true;
}

function rememberVerificationToken(email, rawToken) {
  if (!isTestRoutesEnabled()) return;
  const key = String(email || "")
    .trim()
    .toLowerCase();
  if (!key || !rawToken) return;
  store.set(key, {
    rawToken: String(rawToken),
    createdAt: Date.now(),
  });
}

function getLastVerificationToken(email) {
  const key = String(email || "")
    .trim()
    .toLowerCase();
  const entry = store.get(key);
  if (!entry) return null;
  return entry.rawToken;
}

function clearVerificationToken(email) {
  store.delete(
    String(email || "")
      .trim()
      .toLowerCase()
  );
}

module.exports = {
  isTestRoutesEnabled,
  rememberVerificationToken,
  getLastVerificationToken,
  clearVerificationToken,
};
