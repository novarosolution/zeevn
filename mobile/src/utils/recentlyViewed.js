import AsyncStorage from "@react-native-async-storage/async-storage";
import { useEffect, useState } from "react";

const STORAGE_KEY = "@zeevan_recently_viewed_v1";
const MAX_ITEMS = 12;

let cache = null;
let loading = null;
const listeners = new Set();

function emit() {
  const snapshot = cache ? cache.slice() : [];
  listeners.forEach((listener) => listener(snapshot));
}

async function load() {
  if (cache) return cache;
  if (!loading) {
    loading = (async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        const parsed = raw ? JSON.parse(raw) : [];
        cache = Array.isArray(parsed) ? parsed.map(String).filter(Boolean).slice(0, MAX_ITEMS) : [];
      } catch {
        cache = [];
      }
      return cache;
    })();
  }
  return loading;
}

/** Product ids the shopper opened, newest first. */
export async function readRecentlyViewed() {
  return (await load()).slice();
}

/** Remember that a product page was opened (moves it to the front, keeps the list short). */
export async function recordProductView(productId) {
  const id = String(productId || "").trim();
  if (!id) return;
  const list = await load();
  if (list[0] === id) return;
  cache = [id, ...list.filter((existing) => existing !== id)].slice(0, MAX_ITEMS);
  AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(cache)).catch(() => {});
  emit();
}

export async function clearRecentlyViewed() {
  cache = [];
  AsyncStorage.removeItem(STORAGE_KEY).catch(() => {});
  emit();
}

/** Live list of recently viewed product ids (newest first). Empty until storage has been read. */
export function useRecentlyViewedIds() {
  const [ids, setIds] = useState(() => (cache ? cache.slice() : []));
  useEffect(() => {
    let alive = true;
    load().then((list) => {
      if (alive) setIds(list.slice());
    });
    const listener = (next) => {
      if (alive) setIds(next);
    };
    listeners.add(listener);
    return () => {
      alive = false;
      listeners.delete(listener);
    };
  }, []);
  return ids;
}
