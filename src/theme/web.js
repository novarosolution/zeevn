import { Platform } from "react-native";
import { ALCHEMY, HERITAGE } from "./customerAlchemy";
import { WEB_BACKDROP } from "./tokens";
import { APP_VIEWPORT_MIN_HEIGHT } from "../utils/webViewport";
import { getLiteLightPageBackground, isWebLiteMode } from "../utils/webPerformance";

/** Web header tallest band (desktop default, unscrolled); layout padding clears this. */
export const WEB_HEADER_HEIGHT = 72;
/** Shared top offset for sticky page chrome below fixed header. */
export const WEB_STICKY_TOP_OFFSET = WEB_HEADER_HEIGHT + 16;

/** Responsive header height bands — WebAppHeader uses these internally. */
export const WEB_HEADER_BAND = {
  desktopDefault: 72,
  desktopScrolled: 60,
  tabletDefault: 64,
  tabletScrolled: 56,
  phoneDefault: 56,
  phoneScrolled: 52,
};
export {
  WEB_Z_INDEX,
  webZIndex,
  webElevatedLayer,
  webDecorLayer,
  webFixedLayer,
  webBackdropFilterStyle,
  webOverlayScrimStyle,
  webOverlayRootStyle,
  webOverlayPanelStyle,
  webDialogLayerStyle,
  webScrimColor,
} from "./webStacking";

/** Root shell: full viewport height on web so the layout feels like a real page. */
export const webRootStyle = Platform.select({
  web: {
    flex: 1,
    width: "100%",
    maxWidth: "100%",
    // Match Expo’s html/body/#root chain so flex children get a real height (avoids blank web).
    minHeight: APP_VIEWPORT_MIN_HEIGHT,
    height: "100%",
  },
  default: {
    flex: 1,
  },
});

let premiumChromeInjected = false;

/**
 * Web-only: calm page backdrop, font smoothing, selection & focus rings.
 * Call when theme (light/dark) changes.
 */
const WEB_PAGE_BG_LIGHT = "#FAFAF7";
const WEB_PAGE_BG_DARK = "#0B1120";

/**
 * Keep html/body, meta theme-color, and CSS vars aligned with React theme tokens.
 */
export function syncWebThemeDocument({ isDark, background, surface, liteMode } = {}) {
  if (Platform.OS !== "web" || typeof document === "undefined") return;

  const lite = liteMode ?? isWebLiteMode();
  const pageBg = background || (isDark ? WEB_PAGE_BG_DARK : WEB_PAGE_BG_LIGHT);
  const pageSurface = surface || pageBg;

  applyWebPremiumChrome(isDark, pageBg, lite);

  const html = document.documentElement;
  html.style.colorScheme = isDark ? "dark" : "light";
  html.style.setProperty("--zv-bg", pageBg);
  html.style.setProperty("--zv-surface", pageSurface);
  html.style.setProperty("--zv-selection-bg", isDark ? "rgba(200,169,126,0.38)" : "rgba(200,169,126,0.30)");
  html.style.setProperty("--zv-selection-color", isDark ? "#F8FAFC" : "#0E0E0E");

  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) {
    meta.setAttribute("content", isDark ? WEB_PAGE_BG_DARK : WEB_PAGE_BG_LIGHT);
  }
}

export function applyWebPremiumChrome(isDark, backgroundSolid, liteMode) {
  if (Platform.OS !== "web" || typeof document === "undefined") return;

  const lite = liteMode ?? isWebLiteMode();
  const html = document.documentElement;
  const body = document.body;
  body.style.margin = "0";
  body.style.minHeight = "100%";
  html.style.minHeight = "100%";
  html.classList.toggle("zv-lite", lite);
  html.classList.toggle("zv-dark", Boolean(isDark));

  const pageBg = backgroundSolid || (isDark ? WEB_PAGE_BG_DARK : WEB_PAGE_BG_LIGHT);

  if (isDark) {
    const darkGradient = `radial-gradient(ellipse 120% 90% at 88% 0%, rgba(239,68,68,0.06) 0%, transparent 34%), radial-gradient(ellipse 100% 80% at 10% 4%, rgba(96,165,250,0.05) 0%, transparent 38%), linear-gradient(180deg, #060A12 0%, #0B1120 44%, #141B2B 100%)`;
    const bg = lite ? pageBg : pageBg || darkGradient;
    body.style.background = bg;
    body.style.backgroundAttachment = "scroll";
    html.style.background = bg;
    html.style.colorScheme = "dark";
  } else {
    const richGradient = `radial-gradient(ellipse 120% 80% at 88% 0%, ${ALCHEMY.goldMist} 0%, transparent 30%), radial-gradient(ellipse 100% 70% at 10% 8%, rgba(37,99,235,0.05) 0%, transparent 38%), radial-gradient(ellipse 90% 70% at 10% 100%, ${HERITAGE.mist} 0%, transparent 34%), linear-gradient(180deg, #FFFDFC 0%, ${ALCHEMY.creamHighlight} 20%, ${ALCHEMY.cream} 54%, ${ALCHEMY.pearl} 100%)`;
    const bg = lite ? getLiteLightPageBackground() : pageBg === WEB_PAGE_BG_LIGHT ? richGradient : pageBg;
    body.style.background = bg;
    body.style.backgroundAttachment = "scroll";
    html.style.background = bg;
    html.style.colorScheme = "light";
  }

  body.style.webkitFontSmoothing = "antialiased";
  // @ts-ignore
  body.style.MozOsxFontSmoothing = "grayscale";
  body.style.textRendering = lite ? "auto" : "optimizeLegibility";
  body.style.fontFeatureSettings = lite ? "normal" : '"cv11","ss01","ss03"';

  if (!premiumChromeInjected) {
    premiumChromeInjected = true;
    const style = document.createElement("style");
    style.setAttribute("data-zeevan", "premium-chrome");
    style.textContent = `
      html {
        scroll-behavior: auto;
        scrollbar-color: rgba(200,169,126,0.32) transparent;
        scrollbar-width: thin;
        -webkit-text-size-adjust: 100%;
        text-size-adjust: 100%;
      }
      body {
        overscroll-behavior-y: none;
        -webkit-tap-highlight-color: transparent;
      }
      button, [role="button"], a {
        touch-action: manipulation;
      }
      /* Emergency override: prevent RN web touch-action:none from trapping page scroll. */
      .r-touchAction-19z077z {
        touch-action: pan-y !important;
      }
      @media (pointer: coarse) {
        input, textarea, select {
          font-size: 16px !important;
        }
      }
      ::-webkit-scrollbar {
        width: 10px;
        height: 10px;
      }
      ::-webkit-scrollbar-track {
        background: transparent;
      }
      ::-webkit-scrollbar-thumb {
        background: rgba(200,169,126,0.32);
        border-radius: 999px;
      }
      ::-webkit-scrollbar-thumb:hover {
        background: rgba(200,169,126,0.55);
      }
      ::selection {
        background: var(--zv-selection-bg, rgba(200,169,126,0.30));
        color: var(--zv-selection-color, #0E0E0E);
      }
      *:focus-visible {
        outline: 2px solid ${WEB_BACKDROP.focusRing};
        outline-offset: 2px;
        border-radius: 12px;
      }
      a, button, [role="button"], [role="tab"] {
        cursor: pointer;
      }
      @media (hover: hover) and (prefers-reduced-motion: no-preference) {
        a:hover, button:hover, [role="button"]:hover, [role="tab"]:hover {
          transition: box-shadow 140ms ease, opacity 140ms ease, background-color 140ms ease, border-color 140ms ease;
        }
      }
      /* RN Web (css-view-*): z-index only applies with non-static positioning */
      [data-zv-elevated="true"] {
        position: relative;
        pointer-events: auto;
      }
      [data-zv-decor="true"] {
        pointer-events: none;
      }
      button.zv-web-button,
      button[data-zv-button="true"] {
        box-sizing: border-box !important;
        flex-shrink: 0 !important;
        align-self: flex-start !important;
        overflow: hidden;
      }
      button.zv-web-text-link,
      button[role="checkbox"] {
        flex: 0 0 auto;
        height: auto;
        width: auto;
        max-height: none;
      }
      @media (max-width: 760px) {
        ::-webkit-scrollbar {
          width: 7px;
          height: 7px;
        }
      }
      /* Android / touch web: drop expensive paint (blur, decor layers) */
      html.zv-lite body {
        text-rendering: auto;
      }
      html.zv-lite:not(.zv-dark) body {
        background: var(--zv-bg, ${ALCHEMY.cream || "#FAF8F4"}) !important;
      }
      html.zv-lite.zv-dark body {
        background: var(--zv-bg, ${WEB_PAGE_BG_DARK}) !important;
      }
      html.zv-dark:not(.zv-lite) body {
        background: var(--zv-bg, ${WEB_PAGE_BG_DARK});
      }
      html:not(.zv-dark):not(.zv-lite) body {
        background: var(--zv-bg, ${WEB_PAGE_BG_LIGHT});
      }
      html.zv-lite * {
        backdrop-filter: none !important;
        -webkit-backdrop-filter: none !important;
      }
      html.zv-lite [data-zv-decor="true"] {
        display: none !important;
      }
      html.zv-lite .zv-no-lite-shadow {
        box-shadow: none !important;
      }
    `;
    document.head.appendChild(style);
  }
}
