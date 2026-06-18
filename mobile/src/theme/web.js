import { Platform } from "react-native";
import { KANKREG_CHROME } from "./kankregWeb";
import {
  WEB_FONT_STACK_BODY,
  WEB_FONT_STACK_DISPLAY,
} from "./webTypography";

/** Fixed top bar height on web (desktop). */
export const WEB_HEADER_HEIGHT = 68;
/** Narrow web / tablet below desktop nav breakpoint. */
export const WEB_HEADER_HEIGHT_MOBILE = 56;
/** Phone web — compact top bar (kankreg.html ≤560px). */
export const WEB_HEADER_HEIGHT_COMPACT = 52;
/** Slim in-flow header on native — bottom tab bar handles primary nav. */
export const NATIVE_HEADER_HEIGHT = 52;
/** @deprecated Announce strip removed — kept at 0 for layout constants. */
export const WEB_ANNOUNCE_HEIGHT = 0;
/** Fixed header chrome — desktop default; use {@link getWebHeaderHeight} for responsive layouts. */
export const WEB_CHROME_TOP = WEB_HEADER_HEIGHT;

/** Responsive web header height from viewport width (kankreg.html breakpoints). */
export function getWebHeaderHeight(width = 0) {
  if (width >= 1080) return WEB_HEADER_HEIGHT;
  if (width < 560) return WEB_HEADER_HEIGHT_COMPACT;
  return WEB_HEADER_HEIGHT_MOBILE;
}
/** Shared top offset for sticky page chrome below fixed header. */
export const WEB_STICKY_TOP_OFFSET = WEB_CHROME_TOP + 12;
/** Shared z-index ladder to prevent header/dropdown overlap bugs. */
export const WEB_Z_INDEX = {
  header: 1000,
  overlay: 1100,
  /** Above exported LCP shell (9999) when it has not been dismissed yet. */
  dropdown: 10050,
};

/** Root shell: full viewport height on web so the layout feels like a real page. */
export const webRootStyle = Platform.select({
  web: {
    flex: 1,
    width: "100%",
    maxWidth: "100%",
    // Match Expo’s html/body/#root chain so flex children get a real height (avoids blank web).
    minHeight: "100dvh",
    height: "100%",
  },
  default: {
    flex: 1,
  },
});

let premiumChromeInjected = false;

/** No-op — display fonts load via Expo Google Fonts in App.js (faster than CDN). */
export function injectWebDisplayFont() {}

/** Web-only: description, theme-color, lang, Open Graph, JSON-LD. */
export function injectWebDocumentMeta() {
  if (Platform.OS !== "web") return;
  // eslint-disable-next-line global-require
  const { injectWebSeoBootstrap } = require("../utils/webSeo");
  injectWebSeoBootstrap();
}

/**
 * Web-only: fixed gradient page backdrop, font smoothing, selection & focus rings.
 * Call when theme (light/dark) changes.
 */
export function applyWebPremiumChrome(isDark, backgroundSolid) {
  if (Platform.OS !== "web" || typeof document === "undefined") return;

  const html = document.documentElement;
  const body = document.body;
  body.style.margin = "0";
  body.style.minHeight = "100%";
  html.style.minHeight = "100%";

  if (isDark) {
    body.style.background = backgroundSolid || "#050403";
    body.style.backgroundAttachment = "scroll";
    html.style.background = backgroundSolid || "#050403";
    html.style.colorScheme = "dark";
  } else {
    const g = `radial-gradient(1200px 620px at 92% -6%, rgba(120, 136, 68, 0.14), transparent 58%), radial-gradient(960px 540px at -6% 105%, rgba(36, 68, 36, 0.08), transparent 52%), linear-gradient(180deg, #FCF8F0 0%, ${KANKREG_CHROME.cream} 40%, #E8E4D0 100%)`;
    body.style.background = g;
    body.style.backgroundAttachment = "scroll";
    html.style.background = g;
    html.style.colorScheme = "light";
  }

  body.style.webkitFontSmoothing = "antialiased";
  // @ts-ignore
  body.style.MozOsxFontSmoothing = "grayscale";
  body.style.textRendering = "geometricPrecision";
  body.style.letterSpacing = "0.01em";
  body.style.fontFeatureSettings = '"cv11","ss01","ss03"';

  if (!premiumChromeInjected) {
    premiumChromeInjected = true;
    const style = document.createElement("style");
    style.setAttribute("data-kankreg", "premium-chrome");
    style.textContent = `
      html {
        scroll-behavior: smooth;
      }
      @media (max-width: 1080px) {
        html {
          scroll-behavior: auto;
        }
      }
      html, body {
        overflow-x: clip;
        width: 100%;
        max-width: 100%;
        margin: 0;
        padding: 0;
      }
      #root, [data-expo-root] {
        min-height: 100dvh;
        width: 100%;
        max-width: 100%;
        overflow-x: clip;
      }
      body {
        overscroll-behavior-y: none;
        -webkit-tap-highlight-color: transparent;
        font-family: ${WEB_FONT_STACK_BODY};
        font-size: 15px;
        line-height: 1.5;
      }
      #root, [data-expo-root] {
        font-family: ${WEB_FONT_STACK_BODY};
      }
      [data-zeevan-display="true"] {
        font-family: ${WEB_FONT_STACK_DISPLAY};
      }
      img {
        max-width: 100%;
        height: auto;
      }
      video {
        max-width: 100%;
      }
      video[data-kankreg-fill="true"],
      .kankreg-cinema-reel video,
      .kankreg-cinema-video {
        width: 100% !important;
        height: 100% !important;
        max-width: none;
      }
      ::-webkit-scrollbar {
        width: 10px;
        height: 10px;
      }
      a, button, [role="button"], [role="tab"] {
        transition: opacity 140ms ease, background-color 140ms ease, border-color 140ms ease;
      }
      @media (max-width: 760px) {
        ::-webkit-scrollbar {
          width: 7px;
          height: 7px;
        }
      }
      @media (max-width: 1080px) {
        [data-kankreg-scroll-panel] {
          max-width: 100%;
          overflow-x: clip;
        }
      }
      @media (max-width: 560px) {
        h1, h2, [role="heading"] {
          overflow-wrap: anywhere;
        }
      }
      @media (prefers-reduced-motion: reduce) {
        html { scroll-behavior: auto; }
        *, *::before, *::after {
          animation-duration: 0.01ms !important;
          animation-iteration-count: 1 !important;
          transition-duration: 0.01ms !important;
        }
      }
      [data-kankreg-display="true"],
      h1, h2, h3 {
        font-family: ${WEB_FONT_STACK_DISPLAY};
      }
    `;
    document.head.appendChild(style);
  }

  applyWebThemeChromeCSS(isDark);
}

/** Scrollbar, text selection, and focus rings — updated when light/dark toggles. */
function applyWebThemeChromeCSS(isDark) {
  const id = "kankreg-theme-chrome";
  let el = document.getElementById(id);
  if (!el) {
    el = document.createElement("style");
    el.id = id;
    el.setAttribute("data-kankreg", "theme-chrome");
    document.head.appendChild(el);
  }

  if (isDark) {
    el.textContent = `
      ::-webkit-scrollbar-track {
        background: rgba(255, 255, 255, 0.04);
      }
      ::-webkit-scrollbar-thumb {
        background: rgba(168, 184, 108, 0.35);
        border-radius: 999px;
      }
      ::-webkit-scrollbar-thumb:hover {
        background: rgba(168, 184, 108, 0.5);
      }
      ::selection {
        background: rgba(232, 188, 132, 0.32);
        color: #FAFAF9;
      }
      *:focus-visible {
        outline: 2px solid rgba(168, 184, 108, 0.48);
        outline-offset: 3px;
      }
    `;
    return;
  }

  el.textContent = `
    ::-webkit-scrollbar-track {
      background: rgba(100, 116, 139, 0.08);
    }
    ::-webkit-scrollbar-thumb {
      background: rgba(92, 104, 52, 0.32);
      border-radius: 999px;
    }
    ::-webkit-scrollbar-thumb:hover {
      background: rgba(92, 104, 52, 0.45);
    }
    ::selection {
      background: rgba(220, 172, 116, 0.28);
      color: #1E2018;
    }
    *:focus-visible {
      outline: 2px solid rgba(92, 104, 52, 0.42);
      outline-offset: 3px;
    }
  `;
}
