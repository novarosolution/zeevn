import { Platform } from "react-native";

const TTL_MS = 5 * 60 * 1000;
const PREFIX = "zeevan_auth_form_";

const memoryCache = new Map();

function storageKey(screen) {
  return `${PREFIX}${screen}`;
}

function readRaw(screen) {
  if (Platform.OS === "web" && typeof sessionStorage !== "undefined") {
    try {
      return sessionStorage.getItem(storageKey(screen));
    } catch {
      return null;
    }
  }
  return memoryCache.get(screen) ?? null;
}

function writeRaw(screen, payload) {
  const json = JSON.stringify(payload);
  if (Platform.OS === "web" && typeof sessionStorage !== "undefined") {
    try {
      sessionStorage.setItem(storageKey(screen), json);
    } catch {
      memoryCache.set(screen, json);
    }
    return;
  }
  memoryCache.set(screen, json);
}

function removeRaw(screen) {
  if (Platform.OS === "web" && typeof sessionStorage !== "undefined") {
    try {
      sessionStorage.removeItem(storageKey(screen));
    } catch {
      /* noop */
    }
  }
  memoryCache.delete(screen);
}

/**
 * @param {'login' | 'register' | 'forgot'} screen
 * @returns {object|null}
 */
export function loadAuthFormDraft(screen) {
  const raw = readRaw(screen);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    if (!parsed?.savedAt || Date.now() - parsed.savedAt > TTL_MS) {
      removeRaw(screen);
      return null;
    }
    return parsed.fields ?? null;
  } catch {
    removeRaw(screen);
    return null;
  }
}

/** Never pass password fields. */
export function saveAuthFormDraft(screen, fields) {
  if (!fields || typeof fields !== "object") return;
  const safe = { ...fields };
  delete safe.password;
  delete safe.confirmPassword;
  writeRaw(screen, { savedAt: Date.now(), fields: safe });
}

export function clearAuthFormDraft(screen) {
  removeRaw(screen);
}
