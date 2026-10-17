import { Image, Platform } from "react-native";
import { KANKREG_PALETTE } from "./kankregWeb";

const SITE_BG = require("../../assets/site-bg-premium-4k.jpg");

/** Resolved web URL for the site-wide premium backdrop. */
export function getSiteBackgroundUri() {
  try {
    const src = Image.resolveAssetSource(SITE_BG);
    return src?.uri || "";
  } catch {
    return "";
  }
}

/** Fallback solid when the photo is still loading / dark mode. */
export const SITE_BG_FALLBACK = KANKREG_PALETTE.paper;

/**
 * CSS background stack — photo + soft olive/gold veils (light web only).
 * @param {string} [uri]
 */
export function buildSiteBackgroundCss(uri = getSiteBackgroundUri()) {
  const photo = uri ? `url("${uri}")` : "none";
  return [
    "radial-gradient(1100px 560px at 88% -8%, rgba(120, 136, 68, 0.16), transparent 56%)",
    "radial-gradient(900px 520px at -4% 108%, rgba(212, 165, 116, 0.12), transparent 54%)",
    "linear-gradient(180deg, rgba(255,252,246,0.72) 0%, rgba(247,241,230,0.55) 45%, rgba(239,231,216,0.68) 100%)",
    photo,
  ].join(", ");
}

export function siteBackgroundStyle(isDark) {
  if (isDark || Platform.OS !== "web") {
    return { backgroundColor: isDark ? "#050403" : SITE_BG_FALLBACK };
  }
  const uri = getSiteBackgroundUri();
  return {
    backgroundColor: SITE_BG_FALLBACK,
    ...(uri
      ? {
          backgroundImage: buildSiteBackgroundCss(uri),
          backgroundSize: "auto, auto, auto, cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
          backgroundAttachment: "fixed",
        }
      : {}),
  };
}
