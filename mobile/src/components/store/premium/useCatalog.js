import { useEffect, useState } from "react";
import { getProducts } from "../../../services/productService";

/** The cached product catalog for rails that need to match ids to products; `[]` until it loads or if it fails. */
export default function useCatalog() {
  const [products, setProducts] = useState([]);
  useEffect(() => {
    let alive = true;
    getProducts({ preferCache: true })
      .then((list) => {
        if (alive && Array.isArray(list)) setProducts(list);
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, []);
  return products;
}
