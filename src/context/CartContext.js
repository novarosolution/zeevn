import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "./AuthContext";
import { fetchMyCart, replaceMyCart } from "../services/userService";
import { cartLineKey } from "../utils/productCart";

const CartContext = createContext(undefined);

export function CartProvider({ children }) {
  const { isAuthenticated, token } = useAuth();
  const [cartItems, setCartItems] = useState([]);
  const [isCartSyncing, setIsCartSyncing] = useState(false);
  const isHydratingRef = useRef(false);
  const syncTimerRef = useRef(null);

  const addToCart = useCallback((product) => {
    setCartItems((currentItems) => {
      const key = cartLineKey(product);
      const existingItem = currentItems.find((item) => cartLineKey(item) === key);

      if (existingItem) {
        return currentItems.map((item) =>
          cartLineKey(item) === key ? { ...item, quantity: item.quantity + 1 } : item
        );
      }

      return [...currentItems, { ...product, quantity: 1 }];
    });
  }, []);

  /**
   * @param {string} productId
   * @param {string} [variantLabel] If omitted, removes one unit from the first cart line with this product (e.g. home list).
   */
  const removeFromCart = useCallback((productId, variantLabel) => {
    setCartItems((currentItems) => {
      if (variantLabel === undefined) {
        const idx = currentItems.findIndex((item) => item.id === productId);
        if (idx < 0) return currentItems;
        const item = currentItems[idx];
        if (item.quantity <= 1) {
          return currentItems.filter((_, i) => i !== idx);
        }
        return currentItems.map((it, i) =>
          i === idx ? { ...it, quantity: it.quantity - 1 } : it
        );
      }

      const key = cartLineKey({ id: productId, variantLabel });
      const existingItem = currentItems.find((item) => cartLineKey(item) === key);

      if (!existingItem) {
        return currentItems;
      }

      if (existingItem.quantity === 1) {
        return currentItems.filter((item) => cartLineKey(item) !== key);
      }

      return currentItems.map((item) =>
        cartLineKey(item) === key ? { ...item, quantity: item.quantity - 1 } : item
      );
    });
  }, []);

  /** Removes the line entirely (e.g. cart “Remove”). */
  const removeLineFromCart = useCallback((productId, variantLabel = "") => {
    const key = cartLineKey({ id: productId, variantLabel });
    setCartItems((currentItems) => currentItems.filter((item) => cartLineKey(item) !== key));
  }, []);

  const clearCart = useCallback(() => {
    setCartItems([]);
  }, []);

  const quantityByProductId = useMemo(() => {
    const map = new Map();
    cartItems.forEach((item) => {
      const id = String(item.id || "");
      map.set(id, (map.get(id) || 0) + Number(item.quantity || 0));
    });
    return map;
  }, [cartItems]);

  const quantityByLineKey = useMemo(() => {
    const map = new Map();
    cartItems.forEach((item) => {
      map.set(cartLineKey(item), Number(item.quantity || 0));
    });
    return map;
  }, [cartItems]);

  /**
   * @param {string} productId
   * @param {string} [variantLabel] If omitted, sums quantity across all variants of this product.
   */
  const getItemQuantity = useCallback((productId, variantLabel) => {
    if (variantLabel === undefined) {
      return quantityByProductId.get(String(productId || "")) || 0;
    }
    const key = cartLineKey({ id: productId, variantLabel });
    return quantityByLineKey.get(key) || 0;
  }, [quantityByProductId, quantityByLineKey]);

  const totalAmount = useMemo(() => {
    return cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  }, [cartItems]);

  const totalItems = useMemo(() => {
    return cartItems.reduce((sum, item) => sum + item.quantity, 0);
  }, [cartItems]);

  useEffect(() => {
    let isMounted = true;

    async function hydrateCart() {
      if (!isAuthenticated || !token) {
        setCartItems([]);
        setIsCartSyncing(false);
        isHydratingRef.current = false;
        return;
      }
      try {
        setIsCartSyncing(true);
        isHydratingRef.current = true;
        const serverItems = await fetchMyCart(token);
        if (isMounted) {
          setCartItems(serverItems);
        }
      } catch {
        // Continue with local state if server load fails.
      } finally {
        if (isMounted) {
          setIsCartSyncing(false);
        }
        isHydratingRef.current = false;
      }
    }

    hydrateCart();
    return () => {
      isMounted = false;
    };
  }, [isAuthenticated, token]);

  useEffect(() => {
    if (!isAuthenticated || !token || isHydratingRef.current) {
      return;
    }

    if (syncTimerRef.current) {
      clearTimeout(syncTimerRef.current);
    }
    syncTimerRef.current = setTimeout(() => {
      replaceMyCart(token, cartItems).catch(() => {
        // Ignore sync error; user can continue using cart offline.
      });
    }, 300);

    return () => {
      if (syncTimerRef.current) {
        clearTimeout(syncTimerRef.current);
      }
    };
  }, [cartItems, isAuthenticated, token]);

  const refreshCartFromServer = useCallback(async () => {
    if (!isAuthenticated || !token) {
      setCartItems([]);
      return [];
    }
    try {
      setIsCartSyncing(true);
      const serverItems = await fetchMyCart(token);
      setCartItems(serverItems);
      return serverItems;
    } finally {
      setIsCartSyncing(false);
    }
  }, [isAuthenticated, token]);

  const value = useMemo(
    () => ({
      cartItems,
      totalAmount,
      totalItems,
      isCartSyncing,
      addToCart,
      removeFromCart,
      removeLineFromCart,
      clearCart,
      getItemQuantity,
      refreshCartFromServer,
    }),
    [
      cartItems,
      totalAmount,
      totalItems,
      isCartSyncing,
      addToCart,
      removeFromCart,
      removeLineFromCart,
      clearCart,
      getItemQuantity,
      refreshCartFromServer,
    ]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);

  if (!context) {
    throw new Error("useCart must be used inside a CartProvider");
  }

  return context;
}
