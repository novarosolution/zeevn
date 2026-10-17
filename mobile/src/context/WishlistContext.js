import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

const STORAGE_KEY = "@zeevan_wishlist_v1";

const noop = () => {};
const EMPTY_VALUE = {
  ids: [],
  count: 0,
  hydrated: true,
  has: () => false,
  toggle: noop,
  remove: noop,
};

const WishlistContext = createContext(EMPTY_VALUE);

/**
 * On-device wishlist (product ids only — details are always read fresh from the catalog).
 * Newest saved first.
 */
export function WishlistProvider({ children }) {
  const [ids, setIds] = useState([]);
  const [hydrated, setHydrated] = useState(false);
  const idsRef = useRef([]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        const parsed = raw ? JSON.parse(raw) : [];
        if (!cancelled && Array.isArray(parsed)) {
          const clean = parsed.map((v) => String(v)).filter(Boolean);
          idsRef.current = clean;
          setIds(clean);
        }
      } catch {
        // start empty
      } finally {
        if (!cancelled) setHydrated(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const persist = useCallback((next) => {
    idsRef.current = next;
    setIds(next);
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next)).catch(() => {});
  }, []);

  const toggle = useCallback(
    (productId) => {
      const id = String(productId || "");
      if (!id) return false;
      const current = idsRef.current;
      const exists = current.includes(id);
      persist(exists ? current.filter((v) => v !== id) : [id, ...current]);
      return !exists;
    },
    [persist]
  );

  const remove = useCallback(
    (productId) => {
      const id = String(productId || "");
      persist(idsRef.current.filter((v) => v !== id));
    },
    [persist]
  );

  const idSet = useMemo(() => new Set(ids), [ids]);
  const has = useCallback((productId) => idSet.has(String(productId || "")), [idSet]);

  const value = useMemo(
    () => ({ ids, count: ids.length, hydrated, has, toggle, remove }),
    [ids, hydrated, has, toggle, remove]
  );

  return <WishlistContext.Provider value={value}>{children}</WishlistContext.Provider>;
}

export function useWishlist() {
  return useContext(WishlistContext);
}
