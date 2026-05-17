import { useEffect, useState } from "react";
import { getProducts } from "../services/productService";
import { filterProductsByQuery } from "../utils/filterProductsByQuery";
import { HOME_CATALOG_ALL, matchesShelfProduct } from "../utils/shelfMatch";

const MAX_SUGGESTIONS = 8;

/**
 * Debounced client-side product matches for header search (uses warm getProducts cache).
 */
export function useDebouncedSearchProducts(query, delayMs = 200) {
  const [matches, setMatches] = useState([]);

  useEffect(() => {
    const term = String(query || "").trim();
    let cancelled = false;
    const handle = setTimeout(() => {
      (async () => {
        if (!term) {
          if (!cancelled) setMatches([]);
          return;
        }
        try {
          const data = await getProducts();
          if (cancelled) return;
          const catalog = Array.isArray(data)
            ? data.filter((p) => matchesShelfProduct(p, HOME_CATALOG_ALL))
            : [];
          setMatches(filterProductsByQuery(catalog, term).slice(0, MAX_SUGGESTIONS));
        } catch {
          if (!cancelled) setMatches([]);
        }
      })();
    }, delayMs);
    return () => {
      cancelled = true;
      clearTimeout(handle);
    };
  }, [query, delayMs]);

  return matches;
}
