import { deferAfterFirstPaint } from "./deferAfterFirstPaint";
import { warmApiEndpoints } from "../services/apiEndpointBalancer";
import { prefetchCatalogData } from "../services/productService";

/** Boot-time warmup — defer until after first paint so UI stays responsive. */
export function scheduleCatalogPrefetch({ timeoutMs = 1800 } = {}) {
  return deferAfterFirstPaint(() => {
    warmApiEndpoints().catch(() => {});
    prefetchCatalogData().catch(() => {});
  }, { timeoutMs });
}
