import { Platform, StyleSheet } from "react-native";
import { WEB_BACKDROP } from "./tokens";

/**
 * Web z-index ladder (bottom → top). Pair every z-index with non-static `position` on web
 * (`webZIndex`, `webFixedLayer`, or explicit `position: relative|fixed|absolute`).
 *
 * | Layer            | z-index | Examples |
 * |------------------|---------|----------|
 * | Page content     | 1       | Scroll views, PLP grid |
 * | Auth form chrome | 20–30   | AuthShell elevated fields |
 * | Fixed header     | 1000    | `WebAppHeader` shell |
 * | In-page sticky   | 1010    | Home micro-bars, PLP sticky filters |
 * | Popover scrim    | 1095    | Search suggestions dismiss layer |
 * | Header popovers  | 1100    | Account menu, search suggestions (closes under overlays) |
 * | In-page banners  | 1150    | Home inline toast stack (below overlays) |
 * | Overlay scrim    | 3000    | Cart drawer, nav drawer, search overlay, modal scrims |
 * | Overlay panel    | 3010    | Drawer panels, full-screen search body |
 * | Dialog           | 3020    | `ConfirmDialog`, profile modals — **above cart drawer** |
 * | Toast portal     | 9999    | `#zeevan-toast-root` — always on top |
 *
 * Simultaneous overlays (cart + confirm + toast):
 * - Dialog (3020) covers cart panel (3010) and scrim (3000).
 * - Toast (9999) covers everything.
 * - Header dropdowns (1100) sit under overlay scrims — no bleed-through menus on open drawer.
 *
 * RN `Modal` portals are siblings in DOM order; explicit z-index on each root `View` enforces
 * this ladder when multiple modals are mounted.
 */
export const WEB_Z_INDEX = {
  content: 1,
  authForm: 20,
  authInteractive: 30,
  header: 1000,
  sticky: 1010,
  /** Full-screen invisible dismiss layer under header popovers */
  dropdownScrim: 1095,
  dropdown: 1100,
  /** Non-portal toasts / snackbars anchored in page layout */
  banner: 1150,
  overlay: 3000,
  overlayPanel: 3010,
  dialog: 3020,
  toast: 9999,
};

export function webZIndex(zIndex) {
  if (Platform.OS !== "web" || zIndex == null) return {};
  return {
    position: "relative",
    zIndex,
  };
}

export function webElevatedLayer(zIndex = 10) {
  if (Platform.OS !== "web") return {};
  return {
    position: "relative",
    zIndex,
    pointerEvents: "auto",
  };
}

export function webDecorLayer(zIndex = 0) {
  if (Platform.OS !== "web") return {};
  return {
    position: "relative",
    zIndex,
    pointerEvents: "none",
  };
}

export function webFixedLayer(zIndex) {
  if (Platform.OS !== "web" || zIndex == null) return {};
  return {
    position: "fixed",
    zIndex,
  };
}

/** Shared `backdrop-filter` for header, drawer, and modal scrims. */
export function webBackdropFilterStyle() {
  if (Platform.OS !== "web") return {};
  return {
    WebkitBackdropFilter: WEB_BACKDROP.filter,
    backdropFilter: WEB_BACKDROP.filter,
  };
}

export function webScrimColor(isDark) {
  return isDark ? WEB_BACKDROP.scrimDark : WEB_BACKDROP.scrimLight;
}

/** Full-bleed dismiss scrim with glass blur (modals, drawers). */
export function webOverlayScrimStyle(isDark = false) {
  return {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: webScrimColor(isDark),
    ...webBackdropFilterStyle(),
  };
}

/** Root wrapper inside RN `Modal` on web. */
export function webOverlayRootStyle(zIndex = WEB_Z_INDEX.overlay) {
  const base = { flex: 1 };
  if (Platform.OS !== "web") return base;
  return {
    ...base,
    position: "relative",
    zIndex,
    minHeight: "100vh",
  };
}

export function webOverlayPanelStyle(zIndex = WEB_Z_INDEX.overlayPanel) {
  return webZIndex(zIndex);
}

export function webDialogLayerStyle(zIndex = WEB_Z_INDEX.dialog) {
  return webZIndex(zIndex);
}
