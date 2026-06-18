import React from "react";
import { createLazyScreen } from "./createLazyScreen";

/**
 * Metro web dev breaks React.lazy(() => import()) after HMR.
 * Dev: sync require. Production: async route chunk (smaller phone web bundle).
 */
export function createLazyScreenDevSafe(devRequire, importFn, options = {}) {
  if (typeof __DEV__ !== "undefined" && __DEV__) {
    let EagerComponent = null;
    return function DevEagerScreenRoute(props) {
      if (!EagerComponent) {
        EagerComponent = devRequire();
      }
      return <EagerComponent {...props} />;
    };
  }
  return createLazyScreen(importFn, options);
}
