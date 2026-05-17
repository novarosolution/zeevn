import AsyncStorage from "@react-native-async-storage/async-storage";
import { useCallback, useEffect, useState } from "react";
import { Platform } from "react-native";

const STORAGE_KEY = "@zeevan/recent-searches-v8";
const LEGACY_KEY = "@zeevan/home/recent-searches";
const MAX_ITEMS = 8;

function readWeb(key) {
  if (typeof localStorage === "undefined") return null;
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function writeWeb(key, value) {
  if (typeof localStorage === "undefined") return;
  try {
    localStorage.setItem(key, value);
  } catch {
    /* ignore */
  }
}

async function getStorageRaw(key) {
  if (Platform.OS === "web") return Promise.resolve(readWeb(key));
  return AsyncStorage.getItem(key);
}

async function setStorageRaw(key, value) {
  if (Platform.OS === "web") return Promise.resolve(writeWeb(key, value));
  return AsyncStorage.setItem(key, value);
}

function normalizeList(parsed) {
  if (!Array.isArray(parsed)) return [];
  return parsed.filter((item) => typeof item === "string").map((s) => String(s).trim()).filter(Boolean);
}

/**
 * Recent search terms (shared web header + home). Max 8, case-insensitive dedupe.
 */
export default function useRecentSearches() {
  const [recentSearches, setRecentSearches] = useState([]);

  const hydrate = useCallback(async () => {
    try {
      let raw = await getStorageRaw(STORAGE_KEY);
      let list = normalizeList(raw ? JSON.parse(raw) : []);
      if (list.length === 0) {
        const legacyRaw = await getStorageRaw(LEGACY_KEY);
        const legacyList = normalizeList(legacyRaw ? JSON.parse(legacyRaw) : []);
        if (legacyList.length > 0) {
          list = legacyList.slice(0, MAX_ITEMS);
          await setStorageRaw(STORAGE_KEY, JSON.stringify(list));
        }
      }
      setRecentSearches(list);
    } catch {
      setRecentSearches([]);
    }
  }, []);

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  const add = useCallback(async (term) => {
    const normalized = String(term || "").trim();
    if (!normalized) return;
    setRecentSearches((prev) => {
      const next = [normalized, ...prev.filter((item) => item.toLowerCase() !== normalized.toLowerCase())].slice(
        0,
        MAX_ITEMS
      );
      setStorageRaw(STORAGE_KEY, JSON.stringify(next)).catch(() => {});
      return next;
    });
  }, []);

  const list = useCallback(() => recentSearches, [recentSearches]);

  return { recentSearches, add, list, hydrate };
}
