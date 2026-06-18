import React, { Suspense, useMemo, useState } from "react";
import ScreenErrorBoundary from "../components/ui/ScreenErrorBoundary";
import {
  HomePageSkeleton,
  ListCardsSkeleton,
  ProductPageSkeleton,
  ShopCatalogSkeleton,
} from "../components/loading";

const FALLBACK_BY_SCREEN = {
  ShopScreen: ShopCatalogSkeleton,
  ProductScreen: ProductPageSkeleton,
  CartScreen: ListCardsSkeleton,
  CheckoutScreen: ListCardsSkeleton,
  MyOrdersScreen: ListCardsSkeleton,
  ProfileScreen: ListCardsSkeleton,
  AdminDashboardScreen: ListCardsSkeleton,
  AdminProductsScreen: ListCardsSkeleton,
  AdminOrdersScreen: ListCardsSkeleton,
  AdminAnalyticsScreen: ListCardsSkeleton,
};

function DefaultFallback() {
  return <HomePageSkeleton />;
}

/**
 * Route-level code splitting with skeleton fallback + error boundary.
 * @param {() => Promise<{ default: React.ComponentType }>} importFn
 * @param {{ screenName?: string, Fallback?: React.ComponentType }} [options]
 */
export function createLazyScreen(importFn, { screenName = "Page", Fallback } = {}) {
  const LazyComponent = React.lazy(importFn);
  const Skeleton = Fallback || FALLBACK_BY_SCREEN[screenName] || DefaultFallback;

  return function LazyScreenRoute(props) {
    const [retryKey, setRetryKey] = useState(0);
    const boundaryKey = useMemo(() => `${screenName}-${retryKey}`, [retryKey]);

    return (
      <ScreenErrorBoundary
        key={boundaryKey}
        screenName={screenName}
        onRetry={() => setRetryKey((k) => k + 1)}
      >
        <Suspense fallback={<Skeleton />}>
          <LazyComponent {...props} />
        </Suspense>
      </ScreenErrorBoundary>
    );
  };
}
