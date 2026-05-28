/** Native — no web performance profile. */
export function getWebPerformanceProfile() {
  return { lite: false, android: false, coarse: false, reduced: false };
}

export function isWebLiteMode() {
  return false;
}

export function applyWebDocumentPerfClasses() {}

export function bindWebPerformanceListeners() {
  return () => {};
}
