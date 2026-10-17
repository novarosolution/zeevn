/**
 * Storefront festival looks the native app Home can show (API + Mongoose enum must match).
 * "" = auto: the app follows its own festival calendar. Every non-empty key must also exist in
 * `FESTIVAL_THEMES` (mobile/src/content/storefrontContent.js) and in the admin picker
 * (`ADMIN_HOME_VIEW_COPY.festivalOptions` in mobile/src/content/appContent.js).
 */
const FESTIVAL_KEY_AUTO = "";
const FESTIVAL_KEY_VALUES = [FESTIVAL_KEY_AUTO, "everyday", "navratri", "diwali"];

/** Strict parse for writes: the canonical key ("" = auto, null also clears), or `null` when not allowed. */
function parseFestivalKey(value) {
  if (value === null) return FESTIVAL_KEY_AUTO;
  if (typeof value !== "string") return null;
  const key = value.trim().toLowerCase();
  return FESTIVAL_KEY_VALUES.includes(key) ? key : null;
}

/** Lenient read for responses: anything missing or unknown (older documents) is auto. */
function normalizeFestivalKey(value) {
  return parseFestivalKey(value) ?? FESTIVAL_KEY_AUTO;
}

module.exports = {
  FESTIVAL_KEY_AUTO,
  FESTIVAL_KEY_VALUES,
  parseFestivalKey,
  normalizeFestivalKey,
};
