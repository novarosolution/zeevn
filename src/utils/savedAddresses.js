import AsyncStorage from "@react-native-async-storage/async-storage";
import { fetchUserProfile, updateUserProfile } from "../services/userService";
import { isDeviceOffline } from "./authNetwork";
import { WRITE_TYPES, enqueueCriticalWrite } from "./criticalWriteQueue";

export const SAVED_ADDRESSES_KEY = "@zeevan_saved_addresses_v1";

export function createAddressId() {
  return `addr_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

export function tagLabel(addr) {
  if (!addr) return "HOME";
  if (addr.tag === "OTHER" && String(addr.customTag || "").trim()) {
    return String(addr.customTag).trim().toUpperCase();
  }
  return String(addr.tag || "HOME").toUpperCase();
}

export function formatAddressLines(addr) {
  const lines = [];
  const l1 = String(addr?.line1 || "").trim();
  const l2 = String(addr?.line2 || "").trim();
  const landmark = String(addr?.landmark || "").trim();
  if (l1) lines.push(l1);
  if (l2) lines.push(l2);
  if (landmark) lines.push(landmark);
  const cityLine = [addr?.city, addr?.state, addr?.postalCode].filter(Boolean).join(", ");
  if (cityLine) lines.push(cityLine);
  if (addr?.country && addr.country !== "India") lines.push(String(addr.country));
  return lines;
}

export function formatPhoneLine(addr) {
  const code = String(addr?.countryCode || "+91").trim();
  const phone = String(addr?.phone || "").trim();
  if (!phone) return "";
  return `${code} ${phone}`;
}

function normalizeOne(raw, index = 0) {
  const id = String(raw?.id || raw?._id || `addr_${index}`);
  const tag = ["HOME", "WORK", "OTHER"].includes(String(raw?.tag || "").toUpperCase())
    ? String(raw.tag).toUpperCase()
    : "HOME";
  return {
    id,
    fullName: String(raw?.fullName || raw?.name || "").trim(),
    phone: String(raw?.phone || "").trim(),
    countryCode: String(raw?.countryCode || "+91").trim() || "+91",
    postalCode: String(raw?.postalCode || "").trim(),
    city: String(raw?.city || "").trim(),
    state: String(raw?.state || "").trim(),
    country: String(raw?.country || "India").trim() || "India",
    line1: String(raw?.line1 || "").trim(),
    line2: String(raw?.line2 || "").trim(),
    landmark: String(raw?.landmark || "").trim(),
    tag,
    customTag: String(raw?.customTag || "").trim(),
    isDefault: Boolean(raw?.isDefault),
  };
}

function addressFromProfileDefault(defaultAddress, profileName = "") {
  const a = defaultAddress || {};
  if (!String(a.line1 || "").trim()) return null;
  return normalizeOne(
    {
      id: "default",
      fullName: profileName,
      line1: a.line1,
      city: a.city,
      state: a.state,
      postalCode: a.postalCode,
      country: a.country || "India",
      tag: "HOME",
      isDefault: true,
    },
    0
  );
}

export function toBackendDefaultAddress(addr) {
  if (!addr) return null;
  const parts = [addr.line1, addr.line2, addr.landmark].filter(Boolean);
  return {
    line1: parts.join(", "),
    city: addr.city,
    state: addr.state,
    postalCode: addr.postalCode,
    country: addr.country || "India",
  };
}

async function readStoredList() {
  try {
    const raw = await AsyncStorage.getItem(SAVED_ADDRESSES_KEY);
    const parsed = JSON.parse(raw || "[]");
    if (!Array.isArray(parsed)) return [];
    return parsed.map(normalizeOne).filter((a) => a.line1);
  } catch {
    return [];
  }
}

export async function loadSavedAddresses(token) {
  const stored = await readStoredList();
  if (stored.length > 0) {
    const hasDefault = stored.some((a) => a.isDefault);
    if (!hasDefault && stored[0]) stored[0] = { ...stored[0], isDefault: true };
    return stored;
  }

  if (!token) return [];

  try {
    const profile = await fetchUserProfile();
    const migrated = addressFromProfileDefault(profile?.defaultAddress, profile?.name);
    if (!migrated) return [];
    await AsyncStorage.setItem(SAVED_ADDRESSES_KEY, JSON.stringify([migrated]));
    return [migrated];
  } catch {
    return [];
  }
}

export async function saveSavedAddresses(list, { token, updateStoredUser } = {}) {
  const normalized = (Array.isArray(list) ? list : []).map(normalizeOne).filter((a) => a.line1);
  let next = normalized;
  const defaults = normalized.filter((a) => a.isDefault);
  if (defaults.length > 1) {
    const keepId = defaults[0].id;
    next = normalized.map((a) => ({ ...a, isDefault: a.id === keepId }));
  } else if (normalized.length && !defaults.length) {
    next = normalized.map((a, i) => ({ ...a, isDefault: i === 0 }));
  }

  await AsyncStorage.setItem(SAVED_ADDRESSES_KEY, JSON.stringify(next));

  const primary = next.find((a) => a.isDefault) || next[0];
  if (token && primary) {
    const payload = toBackendDefaultAddress(primary);
    if (payload?.line1) {
      try {
        const updated = await updateUserProfile(token, { defaultAddress: payload });
        if (typeof updateStoredUser === "function") await updateStoredUser(updated);
      } catch (err) {
        const offline = err?.code === "OFFLINE" || (await isDeviceOffline().catch(() => false));
        if (offline) {
          await enqueueCriticalWrite(WRITE_TYPES.ADDRESS_SAVE, { list: next });
        } else {
          throw err;
        }
      }
    }
  } else if (token && next.length === 0) {
    try {
      const updated = await updateUserProfile(token, {
        defaultAddress: { line1: "", city: "", state: "", postalCode: "", country: "" },
      });
      if (typeof updateStoredUser === "function") await updateStoredUser(updated);
    } catch (err) {
      const offline = err?.code === "OFFLINE" || (await isDeviceOffline().catch(() => false));
      if (offline) {
        await enqueueCriticalWrite(WRITE_TYPES.ADDRESS_SAVE, { list: next });
      } else {
        throw err;
      }
    }
  }

  return next;
}
