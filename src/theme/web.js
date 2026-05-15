import { Platform } from "react-native";
import { ALCHEMY, HERITAGE } from "./customerAlchemy";

/** Fixed top bar height on web — slimmer so content starts sooner. */
export const WEB_HEADER_HEIGHT = 66;
/** Shared top offset for sticky page chrome below fixed header. */
export const WEB_STICKY_TOP_OFFSET = WEB_HEADER_HEIGHT + 16;
/** Shared z-index ladder to prevent header/dropdown overlap bugs. */
export const WEB_Z_INDEX = {
  header: 1000,
  sticky: 1050,
  dropdown: 1200,
  overlay: 1100,
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

/**
 * Web-only: calm page backdrop, font smoothing, selection & focus rings.
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
    const darkGradient = `radial-gradient(ellipse 120% 90% at 88% 0%, rgba(239,68,68,0.06) 0%, transparent 34%), radial-gradient(ellipse 100% 80% at 10% 4%, rgba(96,165,250,0.05) 0%, transparent 38%), linear-gradient(180deg, #060A12 0%, #0B1120 44%, #141B2B 100%)`;
    body.style.background = backgroundSolid || darkGradient;
    body.style.backgroundAttachment = "fixed";
    html.style.background = backgroundSolid || darkGradient;
    html.style.colorScheme = "dark";
  } else {
    const g = `radial-gradient(ellipse 120% 80% at 88% 0%, ${ALCHEMY.goldMist} 0%, transparent 30%), radial-gradient(ellipse 100% 70% at 10% 8%, rgba(37,99,235,0.05) 0%, transparent 38%), radial-gradient(ellipse 90% 70% at 10% 100%, ${HERITAGE.mist} 0%, transparent 34%), linear-gradient(180deg, #FFFDFC 0%, ${ALCHEMY.creamHighlight} 20%, ${ALCHEMY.cream} 54%, ${ALCHEMY.pearl} 100%)`;
    body.style.background = g;
    body.style.backgroundAttachment = "fixed";
    html.style.background = g;
    html.style.colorScheme = "light";
  }

  body.style.webkitFontSmoothing = "antialiased";
  // @ts-ignore
  body.style.MozOsxFontSmoothing = "grayscale";
  body.style.textRendering = "optimizeLegibility";
  body.style.fontFeatureSettings = '"cv11","ss01","ss03"';

  if (!premiumChromeInjected) {
    premiumChromeInjected = true;
    const style = document.createElement("style");
    style.setAttribute("data-zeevan", "premium-chrome");
    style.textContent = `
      html {
        scroll-behavior: smooth;
      }
      body {
        overscroll-behavior-y: none;
        -webkit-tap-highlight-color: transparent;
      }
      ::-webkit-scrollbar {
        width: 10px;
        height: 10px;
      }
      ::-webkit-scrollbar-track {
        background: rgba(100, 116, 139, 0.06);
      }
      ::-webkit-scrollbar-thumb {
        background: rgba(148, 163, 184, 0.4);
        border-radius: 999px;
      }
      ::-webkit-scrollbar-thumb:hover {
        background: rgba(100, 116, 139, 0.56);
      }
      ::selection {
        background: rgba(220, 38, 38, 0.22);
        color: inherit;
      }
      *:focus-visible {
        outline: 2px solid rgba(220, 38, 38, 0.38);
        outline-offset: 2px;
        border-radius: 12px;
      }
      a, button, [role="button"], [role="tab"] {
        transition: box-shadow 180ms ease, opacity 180ms ease, background-color 180ms ease, border-color 180ms ease;
      }
      @media (max-width: 760px) {
        ::-webkit-scrollbar {
          width: 7px;
          height: 7px;
        }
      }
    `;
    document.head.appendChild(style);
  }
}
