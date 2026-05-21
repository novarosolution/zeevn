import { Platform } from "react-native";

/**
 * One-way user id for Sentry tags (never send raw PII).
 */
export function hashUserIdForTelemetry(userId) {
  const raw = String(userId || "").trim();
  if (!raw) return "anonymous";
  if (Platform.OS === "web" && typeof crypto !== "undefined" && crypto.subtle) {
    return hashWebSubtle(raw);
  }
  return hashFnv1a(raw);
}

function hashFnv1a(input) {
  let h = 2166136261;
  for (let i = 0; i < input.length; i += 1) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return `u_${(h >>> 0).toString(16)}`;
}

async function hashWebSubtle(input) {
  try {
    const data = new TextEncoder().encode(input);
    const digest = await crypto.subtle.digest("SHA-256", data);
    const hex = Array.from(new Uint8Array(digest))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
    return `u_${hex.slice(0, 16)}`;
  } catch {
    return hashFnv1a(input);
  }
}

/** Sync wrapper for Sentry tags (uses FNV-1a; web async SHA-256 is optional elsewhere). */
export function hashUserIdForTelemetrySync(userId) {
  const raw = String(userId ?? "").trim();
  if (!raw) return "anonymous";
  return hashFnv1a(raw);
}
