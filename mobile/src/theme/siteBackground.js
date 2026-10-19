import { Image } from "react-native";

const SITE_BG = require("../../assets/site-bg-premium-4k.jpg");

/** Resolved web URL for the site-wide backdrop (kept for callers; unused when canvas is flat white). */
export function getSiteBackgroundUri() {
  try {
    const src = Image.resolveAssetSource(SITE_BG);
    return src?.uri || "";
  } catch {
    return "";
  }
}

/** Flat white page canvas (light web). */
export const SITE_BG_FALLBACK = "#FFFFFF";

/**
 * CSS background stack — solid white (light web). Kept as a function for callers.
 * @param {string} [_uri]
 */
export function buildSiteBackgroundCss(_uri = getSiteBackgroundUri()) {
  return "none";
}

export function siteBackgroundStyle(isDark) {
  if (isDark) {
    return { backgroundColor: "#050403" };
  }
  return { backgroundColor: SITE_BG_FALLBACK };
}
