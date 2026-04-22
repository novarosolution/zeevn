import { Platform } from "react-native";
import { ALCHEMY } from "./customerAlchemy";

/** Fixed top bar height on web — minimal vertical padding around the logo. */
export const WEB_HEADER_HEIGHT = 64;

/** Root shell: full viewport height on web so the layout feels like a real page. */
export const webRootStyle = Platform.select({
  web: {
    flex: 1,
    width: "100%",
    maxWidth: "100%",
    // Match Expo’s html/body/#root chain so flex children get a real height (avoids blank web).
    minHeight: "100vh",
    height: "100%",
  },
  default: {
    flex: 1,
  },
});

let premiumChromeInjected = false;

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
    body.style.background = backgroundSolid || "#0A0908";
    body.style.backgroundAttachment = "scroll";
    html.style.background = backgroundSolid || "#0A0908";
    html.style.colorScheme = "dark";
  } else {
    const g = `linear-gradient(168deg, ${ALCHEMY.creamHighlight} 0%, ${ALCHEMY.cream} 42%, ${ALCHEMY.creamDeep} 100%)`;
    body.style.background = g;
    body.style.backgroundAttachment = "fixed";
    html.style.background = g;
    html.style.colorScheme = "light";
  }

  // eslint-disable-next-line no-undef
  body.style.webkitFontSmoothing = "antialiased";
  // @ts-ignore
  body.style.MozOsxFontSmoothing = "grayscale";
  body.style.textRendering = "geometricPrecision";

  if (!premiumChromeInjected) {
    premiumChromeInjected = true;
    const style = document.createElement("style");
    style.setAttribute("data-kankreg", "premium-chrome");
    style.textContent = `
      ::selection {
        background: rgba(201, 162, 39, 0.22);
        color: inherit;
      }
      *:focus-visible {
        outline: 2px solid rgba(184, 134, 11, 0.42);
        outline-offset: 2px;
      }
    `;
    document.head.appendChild(style);
  }
}
