import React, { createContext, useCallback, useContext, useMemo, useState } from "react";
import CartDrawer from "../components/cart/CartDrawer";

const CartDrawerContext = createContext(null);

export function CartDrawerProvider({ children, navigationRef }) {
  const [open, setOpen] = useState(false);
  const openCartDrawer = useCallback(() => setOpen(true), []);
  const closeCartDrawer = useCallback(() => setOpen(false), []);

  const value = useMemo(
    () => ({
      openCartDrawer,
      closeCartDrawer,
      cartDrawerOpen: open,
    }),
    [closeCartDrawer, open, openCartDrawer]
  );

  return (
    <CartDrawerContext.Provider value={value}>
      {children}
      <CartDrawer visible={open} onClose={closeCartDrawer} navigationRef={navigationRef} />
    </CartDrawerContext.Provider>
  );
}

export function useCartDrawer() {
  const ctx = useContext(CartDrawerContext);
  if (!ctx) {
    return {
      openCartDrawer: () => {},
      closeCartDrawer: () => {},
      cartDrawerOpen: false,
    };
  }
  return ctx;
}
