export const APP_VH_CSS_VAR = "--app-vh";
export const APP_VIEWPORT_MIN_HEIGHT = "100%";

export function supportsCssFeature() {
  return false;
}

export function supportsBackdropFilter() {
  return false;
}

export function setViewportHeightVar() {}

export function installWebViewportWorkarounds() {
  return () => {};
}

export function isAndroidUserAgent() {
  return false;
}

