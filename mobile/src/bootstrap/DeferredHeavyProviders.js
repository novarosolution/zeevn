import React, { useEffect, useState } from "react";
import { AuthProvider } from "../context/AuthContext";
import { CartProvider } from "../context/CartContext";
import { LiveSocketProvider } from "../context/LiveSocketContext";
import { OrderCelebrationProvider } from "../context/OrderCelebrationContext";
import { ApiHealthProvider } from "../context/ApiHealthContext";
import BackendOfflineBanner from "../components/BackendOfflineBanner";
import { deferAfterFirstPaint } from "../utils/deferAfterFirstPaint";
import { scheduleCatalogPrefetch } from "../utils/prefetchCatalog";
import { navigationRef } from "../navigation/navigationRef";

/**
 * Defer health checks, sockets, and celebration overlays until after first paint.
 * Auth + cart stay immediate so shopping works while the API warms up.
 */
export default function DeferredHeavyProviders({ children }) {
  const [heavyReady, setHeavyReady] = useState(false);

  useEffect(() => {
    const cancelDeferred = deferAfterFirstPaint(() => setHeavyReady(true), { timeoutMs: 1200 });
    const cancelPrefetch = scheduleCatalogPrefetch({ timeoutMs: 900 });
    return () => {
      cancelDeferred();
      cancelPrefetch();
    };
  }, []);

  return (
    <AuthProvider>
      <CartProvider>
        {heavyReady ? (
          <ApiHealthProvider>
            <LiveSocketProvider>
              <OrderCelebrationProvider navigationRef={navigationRef}>
                <BackendOfflineBanner />
                {children}
              </OrderCelebrationProvider>
            </LiveSocketProvider>
          </ApiHealthProvider>
        ) : (
          children
        )}
      </CartProvider>
    </AuthProvider>
  );
}
