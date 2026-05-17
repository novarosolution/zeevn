import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

const STORAGE_KEY = "@zeevan_wishlist_product_ids_v1";

const WishlistContext = createContext(null);

export function WishlistProvider({ children }) {
  const [ids, setIds] = useState([]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (cancelled) return;
        const parsed = JSON.parse(raw || "[]");
        setIds(Array.isArray(parsed) ? parsed.map(String).filter(Boolean) : []);
      } catch {
        if (!cancelled) setIds([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const persist = useCallback(async (next) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      /* noop */
    }
  }, []);

  const toggle = useCallback(
    (productId) => {
      const id = String(productId || "").trim();
      if (!id) return;
      setIds((prev) => {
        const has = prev.includes(id);
        const next = has ? prev.filter((x) => x !== id) : [...prev, id];
        persist(next);
        return next;
      });
    },
    [persist]
  );

  const remove = useCallback(
    (productId) => {
      const id = String(productId || "").trim();
      if (!id) return;
      setIds((prev) => {
        const next = prev.filter((x) => x !== id);
        persist(next);
        return next;
      });
    },
    [persist]
  );

  const add = useCallback(
    (productId) => {
      const id = String(productId || "").trim();
      if (!id) return;
      setIds((prev) => {
        if (prev.includes(id)) return prev;
        const next = [...prev, id];
        persist(next);
        return next;
      });
    },
    [persist]
  );

  const clear = useCallback(() => {
    setIds([]);
    persist([]);
  }, [persist]);

  const has = useCallback((productId) => ids.includes(String(productId || "").trim()), [ids]);

  const value = useMemo(
    () => ({
      ids,
      count: ids.length,
      toggle,
      add,
      remove,
      clear,
      has,
    }),
    [add, clear, has, ids, remove, toggle]
  );

  return <WishlistContext.Provider value={value}>{children}</WishlistContext.Provider>;
}

export function useWishlist() {
  const ctx = useContext(WishlistContext);
  if (!ctx) {
    throw new Error("useWishlist must be used within WishlistProvider");
  }
  return ctx;
}

/** Safe for ProductCard when provider may be absent (falls back to local-only UX). */
export function useWishlistOptional() {
  return useContext(WishlistContext);
}
