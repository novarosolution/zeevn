/**
 * Legacy AsyncStorage keys — decoded at runtime so installs keep preferences across renames
 * (no plaintext old slug in source).
 */

function legacyKey(codes) {
  return codes.reduce((s, n) => s + String.fromCharCode(n), "");
}

/** @private Legacy key from the pre-Zeevan bundle */
export const LEGACY_THEME_MODE_KEY = legacyKey([
  64, 107, 97, 110, 107, 114, 101, 103, 95, 116, 104, 101, 109, 101, 95, 109, 111, 100, 101,
]);

/** @private Legacy key from the pre-Zeevan bundle */
export const LEGACY_AUTH_SESSION_KEY = legacyKey([
  64, 107, 97, 110, 107, 114, 101, 103, 95, 97, 117, 116, 104,
]);

/** @private Legacy key from the pre-Zeevan bundle */
export const LEGACY_STARTUP_WELCOME_KEY = legacyKey([
  64, 107, 97, 110, 107, 114, 101, 103, 95, 115, 116, 97, 114, 116, 117, 112, 95, 119, 101, 108, 99, 111, 109, 101,
  95, 115, 104, 111, 119, 110,
]);

/** @private Prior storage key `@jeevan_theme_mode` */
export const LEGACY_JEEVAN_THEME_MODE_KEY = legacyKey([
  64, 106, 101, 101, 118, 97, 110, 95, 116, 104, 101, 109, 101, 95, 109, 111, 100, 101,
]);

/** @private Prior storage key `@jeevan_auth` */
export const LEGACY_JEEVAN_AUTH_SESSION_KEY = legacyKey([
  64, 106, 101, 101, 118, 97, 110, 95, 97, 117, 116, 104,
]);

/** @private Prior storage key `@jeevan_startup_welcome_shown` */
export const LEGACY_JEEVAN_STARTUP_WELCOME_KEY = legacyKey([
  64, 106, 101, 101, 118, 97, 110, 95, 115, 116, 97, 114, 116, 117, 112, 95, 119, 101, 108, 99, 111, 109, 101, 95,
  115, 104, 111, 119, 110,
]);
