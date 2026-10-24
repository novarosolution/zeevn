/**
 * Storefront design system — the premium Zeevan look for the native app
 * (Home, Shop, Profile, floating nav). Olive + ghee-gold on a pure white page, with a
 * soft serif (Fraunces) for display text and Hanken Grotesk for UI.
 */
import { useEffect, useMemo, useSyncExternalStore } from "react";
import { Platform } from "react-native";
import * as Font from "expo-font";
import { Fraunces_600SemiBold, Fraunces_700Bold } from "@expo-google-fonts/fraunces";
import { useTheme } from "../context/ThemeContext";
import { FONT_DISPLAY, FONT_DISPLAY_SEMI } from "./customerAlchemy";
import { fonts } from "./tokens";

/** Page gutter used by every storefront section. */
export const STORE_GUTTER = 16;

/** Floating nav pill / cart FAB — compact enough that 22pt icons sit in air, not a fat disc. */
export const STORE_NAV_HEIGHT = 52;

export const STORE_RADIUS = {
  xs: 8,
  sm: 12,
  md: 16,
  lg: 20,
  xl: 24,
  xxl: 30,
  pill: 999,
};

const LIGHT = {
  /** The ivory canvas (the launcher-icon cream) every screen sits on — white cards and product photos float on it. */
  page: "#FBF6EC",
  pageDeep: "#F4ECD9",
  canvas: "#FBF6EC",
  canvasDeep: "#F4ECD9",
  /** Fine gold hairline for premium card edges. */
  goldLine: "rgba(160, 108, 36, 0.2)",
  card: "#FFFFFF",
  cardSoft: "#FFFCF6",
  /** Warm sand for inputs, segmented tracks and quiet fills (never a cold grey on ivory). */
  soft: "#F4EDDE",
  softStrong: "#EBE1CB",
  well: "#FFFFFF",
  ink: "#1A2216",
  inkSoft: "#4A5340",
  inkMute: "#7C765F",
  line: "rgba(104, 82, 40, 0.11)",
  lineStrong: "rgba(104, 82, 40, 0.2)",
  brand: "#244424",
  brandAlt: "#5C6834",
  brandBright: "#788844",
  brandSoft: "#EEF2DF",
  brandSoftStrong: "#E0E9C9",
  onBrand: "#FFFFFF",
  gold: "#DCAC74",
  goldBright: "#EDC27D",
  goldText: "#A06C24",
  goldSoft: "#FBEFD6",
  saffron: "#E9822B",
  danger: "#B8442F",
  dangerSoft: "#FBE9E4",
  shadow: "#3D2A12",
  /** Lite glass fills (opaque enough without BlurView). */
  glass: "rgba(251, 246, 236, 0.9)",
  glassStrong: "rgba(251, 246, 236, 0.96)",
  glassBorder: "rgba(255, 255, 255, 0.7)",
  scrim: "rgba(20, 24, 14, 0.50)",
  /** Header wash only — fades into the ivory page below. */
  headerGradient: ["#F2D082", "#F7E0A8", "#FAEECF", "#FBF6EC"],
  headerLocations: [0, 0.34, 0.7, 1],
  /** The softer gold wash behind an inner screen's title (StoreScreen). */
  washGradient: ["#F6E2B0", "#F9EAC8", "#FBF1DE", "#FBF6EC"],
  washLocations: [0, 0.38, 0.74, 1],
  /** Pastel tile washes (category grid, bento) — cycled by index. */
  tiles: [
    ["#F1F5E3", "#DDE8C3"],
    ["#FDF1D2", "#F6E0A4"],
    ["#FCE9DB", "#F5D1B3"],
    ["#F7F0DD", "#EADFC0"],
    ["#F6E8DE", "#EBCFBF"],
    ["#EAF1E6", "#D3E3CD"],
  ],
  /** Bento washes — warm gold / peach / sage, richer for the tall corner tile. */
  bentoTall: ["#FFE29A", "#EFB84A"],
  bentoTiles: [
    ["#FFF1CC", "#F5D57A"],
    ["#FFE6CF", "#F5C49A"],
    ["#F3F5D4", "#D9E4A8"],
    ["#FFECD0", "#F2CC7E"],
  ],
  /**
   * One soft wash per range (ghee / tel / masala / honey / gifts): `wash` is the gradient fill, `accent` the deeper
   * tone for small marks and `ink` the text colour that sits on the wash. Used by the range tiles and rail bands.
   */
  ranges: {
    ghee: { wash: ["#FFF5D8", "#F9DE9A"], accent: "#B8821E", ink: "#46300A" },
    tel: { wash: ["#F5F9E4", "#D9E6AE"], accent: "#667F25", ink: "#26350F" },
    masala: { wash: ["#FEEBDF", "#F4C0A0"], accent: "#B94F25", ink: "#4A1D0A" },
    honey: { wash: ["#FFF0C9", "#F7CA6C"], accent: "#A8690C", ink: "#46290A" },
    gifts: { wash: ["#FBF0D9", "#EBCD92"], accent: "#A06C24", ink: "#3A2A0C" },
    more: { wash: ["#F3F6E6", "#DCE5C0"], accent: "#5C6834", ink: "#243014" },
  },
};

const DARK = {
  page: "#0C1610",
  pageDeep: "#122016",
  canvas: "#0C1610",
  canvasDeep: "#122016",
  goldLine: "rgba(232, 188, 132, 0.22)",
  card: "#1B1712",
  cardSoft: "#211C15",
  soft: "#2A241B",
  softStrong: "#37301F",
  well: "#F2EBDA",
  ink: "#F6EFE0",
  inkSoft: "#CFC7B4",
  inkMute: "#9A917B",
  line: "rgba(255, 255, 255, 0.09)",
  lineStrong: "rgba(255, 255, 255, 0.17)",
  brand: "#B9CC7A",
  brandAlt: "#A8B86C",
  brandBright: "#C4D088",
  brandSoft: "rgba(168, 184, 108, 0.14)",
  brandSoftStrong: "rgba(168, 184, 108, 0.24)",
  onBrand: "#18200C",
  gold: "#E8BC84",
  goldBright: "#F2CE9B",
  goldText: "#E8BC84",
  goldSoft: "rgba(232, 188, 132, 0.14)",
  saffron: "#F0974A",
  danger: "#F28B76",
  dangerSoft: "rgba(242, 139, 118, 0.14)",
  shadow: "#000000",
  glass: "rgba(15, 36, 24, 0.88)",
  glassStrong: "rgba(15, 36, 24, 0.94)",
  glassBorder: "rgba(255, 255, 255, 0.14)",
  scrim: "rgba(6, 14, 10, 0.62)",
  headerGradient: ["#1A3D24", "#14301C", "#0F2418", "#0C1610"],
  headerLocations: [0, 0.34, 0.7, 1],
  washGradient: ["#1A3320", "#142818", "#0F1E14", "#0C1610"],
  washLocations: [0, 0.38, 0.74, 1],
  tiles: [
    ["#232B17", "#1A2111"],
    ["#33290F", "#271F0B"],
    ["#33210F", "#281A0B"],
    ["#2B2517", "#211C10"],
    ["#33211A", "#271913"],
    ["#1C2A1F", "#14201A"],
  ],
  bentoTall: ["#4A3812", "#342609"],
  bentoTiles: [
    ["#3A2E14", "#2B220E"],
    ["#3A2819", "#2B1D11"],
    ["#2B3119", "#212713"],
    ["#392D15", "#2A2010"],
  ],
  ranges: {
    ghee: { wash: ["#3E3014", "#2B200C"], accent: "#E8BC84", ink: "#F6E7C2" },
    tel: { wash: ["#2C3518", "#1F2711"], accent: "#B9CC7A", ink: "#E4EDC8" },
    masala: { wash: ["#41251A", "#2C190F"], accent: "#F0974A", ink: "#F9DCC8" },
    honey: { wash: ["#43310F", "#2F2209"], accent: "#F2CE9B", ink: "#FBE8C2" },
    gifts: { wash: ["#3A2D18", "#2A200F"], accent: "#E8BC84", ink: "#F6E7C2" },
    more: { wash: ["#2A3118", "#1E2412"], accent: "#B9CC7A", ink: "#E4EDC8" },
  },
};

/** `#RRGGBB` + alpha → `rgba()`. Leaves non-hex colours untouched. */
export function withAlpha(color, alpha) {
  const value = String(color || "");
  const m = /^#([0-9a-f]{6})$/i.exec(value);
  if (!m) return value;
  const n = parseInt(m[1], 16);
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${alpha})`;
}

function buildShadows(isDark, c) {
  const color = isDark ? "#000000" : c.shadow;
  const make = (height, radius, opacity, elevation) =>
    Platform.select({
      ios: {
        shadowColor: color,
        shadowOffset: { width: 0, height },
        shadowOpacity: isDark ? Math.min(0.7, opacity * 3.2) : opacity,
        shadowRadius: radius,
      },
      android: { elevation: isDark ? elevation + 1 : elevation },
      default: {},
    });
  return {
    none: {},
    soft: make(2, 8, 0.06, 2),
    card: make(8, 20, 0.12, 5),
    lift: make(12, 28, 0.16, 8),
    float: make(16, 32, 0.22, 12),
  };
}

/* ---- display font readiness (Fraunces loads after first paint in App.js) ---- */

let displayFontsReady = false;
let displayFontsStarted = false;
const fontListeners = new Set();

function ensureDisplayFonts() {
  if (displayFontsStarted) return;
  displayFontsStarted = true;
  Font.loadAsync({ Fraunces_600SemiBold, Fraunces_700Bold })
    .then(() => {
      displayFontsReady = true;
      fontListeners.forEach((fn) => fn());
    })
    .catch(() => {});
}

function subscribeFonts(listener) {
  fontListeners.add(listener);
  return () => {
    fontListeners.delete(listener);
  };
}

const getFontsReady = () => displayFontsReady;

/** True once Fraunces is registered — lets text swap from the Hanken fallback without a remount. */
export function useDisplayFontsReady() {
  useEffect(() => {
    ensureDisplayFonts();
  }, []);
  return useSyncExternalStore(subscribeFonts, getFontsReady, getFontsReady);
}

function buildType(c, fontsReady) {
  const displayFamily = fontsReady ? FONT_DISPLAY : fonts.extrabold;
  const displaySemiFamily = fontsReady ? FONT_DISPLAY_SEMI : fonts.bold;
  return {
    /** Serif display text — hero greeting, section titles, prices on banners. */
    display: (size, { color = c.ink, semi = false, ls, lh } = {}) => ({
      fontFamily: semi ? displaySemiFamily : displayFamily,
      fontSize: size,
      lineHeight: lh ?? Math.round(size * (size >= 28 ? 1.05 : 1.14)),
      letterSpacing: ls ?? (size >= 28 ? -0.6 : size >= 20 ? -0.4 : -0.2),
      color,
    }),
    /** Sans UI text. weight: regular | medium | semibold | bold | extrabold */
    ui: (size, weight = "semibold", color = c.ink, extra = null) => ({
      fontFamily: fonts[weight] || fonts.semibold,
      fontSize: size,
      color,
      ...(extra || null),
    }),
    /** Small uppercase label with tracking. */
    eyebrow: (color = c.brandAlt, size = 10.5) => ({
      fontFamily: fonts.bold,
      fontSize: size,
      letterSpacing: 1.7,
      textTransform: "uppercase",
      color,
    }),
  };
}

/**
 * Theme bundle for storefront components: colours, shadows, radii, type helpers.
 * Memoised on theme + font readiness, so it is safe to call in every component.
 */
export function useStoreTheme() {
  const { isDark } = useTheme();
  const fontsReady = useDisplayFontsReady();
  return useMemo(() => {
    const c = isDark ? DARK : LIGHT;
    return {
      isDark,
      c,
      r: STORE_RADIUS,
      shadow: buildShadows(isDark, c),
      type: buildType(c, fontsReady),
      gutter: STORE_GUTTER,
    };
  }, [isDark, fontsReady]);
}

/** Pick a pastel tile gradient by index. */
export function pickTileColors(c, index = 0) {
  const list = c.tiles;
  return list[Math.abs(index) % list.length];
}

/** The wash / accent / ink set for a range key ("ghee", "tel", …); unknown ranges get the olive "more" set. */
export function pickRange(c, lineKey) {
  return c.ranges[String(lineKey || "").toLowerCase()] || c.ranges.more;
}
