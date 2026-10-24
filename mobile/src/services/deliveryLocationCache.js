import AsyncStorage from "@react-native-async-storage/async-storage";

const CACHE_KEY = "@kankreg_delivery_snippet";
const CONFIRMED_KEY = "@kankreg_delivery_confirmed_at";
const CACHE_TTL_MS = 30 * 60 * 1000;
export const DELIVERY_CONFIRM_TTL_MS = 24 * 60 * 60 * 1000;

export async function loadCachedDeliverySnippet() {
  try {
    const raw = await AsyncStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return null;
    const lat = Number(parsed.latitude ?? parsed.lat);
    const lng = Number(parsed.longitude ?? parsed.lng);
    const hasPoint = Number.isFinite(lat) && Number.isFinite(lng) && Math.abs(lat) > 0.2 && Math.abs(lng) > 0.2;
    const updatedAt = Number(parsed.updatedAt || 0);
    const fresh = updatedAt && Date.now() - updatedAt <= CACHE_TTL_MS;
    if (!fresh && !hasPoint) return null;
    return parsed;
  } catch {
    return null;
  }
}

export async function saveCachedDeliverySnippet(snippet) {
  try {
    await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(snippet));
  } catch {
    // Best-effort cache for header display.
  }
}

export async function loadDeliveryConfirmedAt() {
  try {
    const raw = await AsyncStorage.getItem(CONFIRMED_KEY);
    const ts = Number(raw || 0);
    return Number.isFinite(ts) && ts > 0 ? ts : null;
  } catch {
    return null;
  }
}

export async function saveDeliveryConfirmedAt(timestamp = Date.now()) {
  try {
    if (!timestamp) {
      await AsyncStorage.removeItem(CONFIRMED_KEY);
      return;
    }
    await AsyncStorage.setItem(CONFIRMED_KEY, String(timestamp));
  } catch {
    // Best-effort persistence.
  }
}

export function isDeliveryLocationConfirmed(confirmedAt) {
  if (!confirmedAt) return false;
  return Date.now() - confirmedAt < DELIVERY_CONFIRM_TTL_MS;
}
