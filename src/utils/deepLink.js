/**
 * Deep-link helpers for auth returnTo params (web JSON encoding).
 */

export function parseLoginReturnToParam(value) {
  if (value == null || value === "") return undefined;
  if (typeof value === "object" && value?.name) return value;
  if (typeof value !== "string" || value === "[object Object]") return undefined;
  try {
    const parsed = JSON.parse(decodeURIComponent(value));
    return parsed?.name ? parsed : undefined;
  } catch {
    return undefined;
  }
}

export function stringifyLoginReturnToParam(value) {
  if (!value?.name) return undefined;
  return encodeURIComponent(JSON.stringify(value));
}

export function encodeReturnToObject(returnTo) {
  if (!returnTo?.name) return null;
  return JSON.stringify(returnTo);
}

export function decodeReturnToString(raw) {
  if (raw == null || raw === "") return null;
  if (typeof raw === "object" && raw?.name) return raw;
  if (typeof raw !== "string" || raw === "[object Object]") return null;
  try {
    const parsed = JSON.parse(decodeURIComponent(raw));
    return parsed?.name ? parsed : null;
  } catch {
    return null;
  }
}
