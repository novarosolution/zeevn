import AsyncStorage from "@react-native-async-storage/async-storage";
import { useEffect, useState } from "react";

const STORAGE_KEY = "@zeevan_recent_searches_v1";
const MAX_ITEMS = 8;

let cache = null;
let loading = null;
const listeners = new Set();

const emit = () => {
  const snapshot = cache ? cache.slice() : [];
  listeners.forEach((listener) => listener(snapshot));
};

async function load() {
  if (cache) return cache;
  if (!loading) {
    loading = (async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        const parsed = raw ? JSON.parse(raw) : [];
        cache = Array.isArray(parsed) ? parsed.map((q) => String(q).trim()).filter(Boolean).slice(0, MAX_ITEMS) : [];
      } catch {
        cache = [];
      }
      return cache;
    })();
  }
  return loading;
}

/** Keep a search the shopper actually ran (2+ characters). Newest first, no case-insensitive duplicates. */
export async function rememberSearch(query) {
  const q = String(query || "").trim().replace(/\s+/g, " ");
  if (q.length < 2) return;
  const list = await load();
  if (list[0] && list[0].toLowerCase() === q.toLowerCase()) return;
  cache = [q, ...list.filter((existing) => existing.toLowerCase() !== q.toLowerCase())].slice(0, MAX_ITEMS);
  AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(cache)).catch(() => {});
  emit();
}

export async function forgetSearch(query) {
  const list = await load();
  cache = list.filter((existing) => existing.toLowerCase() !== String(query || "").trim().toLowerCase());
  AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(cache)).catch(() => {});
  emit();
}

export async function clearSearches() {
  cache = [];
  AsyncStorage.removeItem(STORAGE_KEY).catch(() => {});
  emit();
}

export function useRecentSearches() {
  const [items, setItems] = useState(() => (cache ? cache.slice() : []));
  useEffect(() => {
    let alive = true;
    load().then((list) => {
      if (alive) setItems(list.slice());
    });
    const listener = (next) => {
      if (alive) setItems(next);
    };
    listeners.add(listener);
    return () => {
      alive = false;
      listeners.delete(listener);
    };
  }, []);
  return items;
}
