import { Platform } from "react-native";
import { HERO_LCP_SRC, HERO_SRCSET } from "../constants/heroLcp.web";

const PRELOAD_IDS = {
  hero: "zv-preload-hero-lcp",
  inter400: "zv-preload-font-inter-400",
  inter500: "zv-preload-font-inter-500",
  playfair600: "zv-preload-font-playfair-600",
};

const isDevWeb =
  typeof __DEV__ !== "undefined" && __DEV__ && typeof window !== "undefined";

/** Expo `useFonts` family names → self-hosted WOFF2 under /public/fonts. */
const SELF_HOSTED_APP_FONTS = [
  { family: "Inter_400Regular", file: "/fonts/Inter-400.woff2", weight: 400 },
  { family: "Inter_500Medium", file: "/fonts/Inter-500.woff2", weight: 500 },
  { family: "Inter_600SemiBold", file: "/fonts/Inter-600.woff2", weight: 600 },
  { family: "Inter_700Bold", file: "/fonts/Inter-700.woff2", weight: 700 },
  { family: "Inter_800ExtraBold", file: "/fonts/Inter-800.woff2", weight: 800 },
  { family: "PlayfairDisplay_600SemiBold", file: "/fonts/PlayfairDisplay-600.woff2", weight: 600 },
  { family: "PlayfairDisplay_700Bold", file: "/fonts/PlayfairDisplay-700.woff2", weight: 700 },
  {
    family: "PlayfairDisplay_400Regular_Italic",
    file: "/fonts/PlayfairDisplay-400Italic.woff2",
    weight: 400,
    style: "italic",
  },
];

function resolveWebHref(path) {
  if (!path || typeof path !== "string") return "";
  if (/^https?:\/\//i.test(path)) return path;
  if (typeof window !== "undefined" && window.location?.origin) {
    return `${window.location.origin}${path.startsWith("/") ? path : `/${path}`}`;
  }
  return path.startsWith("/") ? path : `/${path}`;
}

function isValidPreloadHref(href) {
  if (!href || typeof href !== "string") return false;
  try {
    const parsed = new URL(href, typeof window !== "undefined" ? window.location.href : "http://localhost");
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

/**
 * Upsert a <link> in document.head using DOM properties (valid preload attrs for Chrome).
 */
function upsertLink(id, apply) {
  if (typeof document === "undefined") return;
  let el = document.getElementById(id);
  if (!el) {
    el = document.createElement("link");
    el.id = id;
    document.head.appendChild(el);
  }
  apply(el);
  const href = el.getAttribute("href");
  if (!href || !isValidPreloadHref(href)) {
    el.remove();
  }
}

function upsertStyle(id, css) {
  if (typeof document === "undefined") return;
  let el = document.getElementById(id);
  if (!el) {
    el = document.createElement("style");
    el.id = id;
    document.head.appendChild(el);
  }
  el.textContent = css;
}

function buildSelfHostedFontFaceCss() {
  return SELF_HOSTED_APP_FONTS.map(
    ({ family, file, weight, style = "normal" }) => `
    @font-face {
      font-family: "${family}";
      font-style: ${style};
      font-weight: ${weight};
      font-display: swap;
      src: url("${file}") format("woff2");
    }`
  ).join("");
}

/**
 * Self-hosted @font-face for Expo font family names (web skips expo-font preload).
 */
export function injectSelfHostedFontFaces() {
  if (Platform.OS !== "web") return;
  upsertStyle("zv-self-hosted-fonts", buildSelfHostedFontFaceCss());
}

/** Preload home LCP hero (call when route is `/`). */
export function preloadHomeHeroLcp() {
  if (Platform.OS !== "web" || isDevWeb) return;
  const href = resolveWebHref(HERO_LCP_SRC);
  if (!isValidPreloadHref(href)) return;
  upsertLink(PRELOAD_IDS.hero, (el) => {
    el.rel = "preload";
    el.as = "image";
    el.setAttribute("href", href);
    el.removeAttribute("type");
    el.removeAttribute("crossorigin");
    if ("fetchPriority" in el) {
      el.fetchPriority = "high";
    }
    if (HERO_SRCSET) {
      el.setAttribute("imagesrcset", HERO_SRCSET);
      el.setAttribute("imagesizes", "100vw");
    } else {
      el.removeAttribute("imagesrcset");
      el.removeAttribute("imagesizes");
    }
  });
}

function preloadFont(id, href, type = "font/woff2") {
  const resolved = resolveWebHref(href);
  if (!isValidPreloadHref(resolved)) return;
  upsertLink(id, (el) => {
    el.rel = "preload";
    el.as = "font";
    el.setAttribute("type", type);
    el.setAttribute("href", resolved);
    el.setAttribute("crossorigin", "anonymous");
  });
}

export function preloadCriticalWebFonts() {
  if (Platform.OS !== "web" || isDevWeb) return;
  preloadFont(PRELOAD_IDS.inter400, "/fonts/Inter-400.woff2");
  preloadFont(PRELOAD_IDS.inter500, "/fonts/Inter-500.woff2");
  preloadFont(PRELOAD_IDS.playfair600, "/fonts/PlayfairDisplay-600.woff2");
}

export function enforceMobileViewportMeta() {
  if (Platform.OS !== "web" || typeof document === "undefined") return;
  let tag = document.querySelector('meta[name="viewport"]');
  if (!tag) {
    tag = document.createElement("meta");
    tag.setAttribute("name", "viewport");
    document.head.appendChild(tag);
  }
  tag.setAttribute("content", "width=device-width, initial-scale=1, viewport-fit=cover");
}

export function clearHomeHeroPreload() {
  if (typeof document === "undefined") return;
  document.getElementById(PRELOAD_IDS.hero)?.remove();
}
