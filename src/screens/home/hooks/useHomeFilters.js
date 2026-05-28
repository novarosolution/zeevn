import { useCallback, useMemo, useState } from "react";
import { HOME_CATALOG_ALL, matchesShelfProduct } from "../../../utils/shelfMatch";

function matchesHomeShelf(product) {
  return matchesShelfProduct(product, HOME_CATALOG_ALL);
}

function sortByHomeOrder(a, b) {
  const orderA = Number.isFinite(Number(a?.homeOrder)) ? Number(a.homeOrder) : 0;
  const orderB = Number.isFinite(Number(b?.homeOrder)) ? Number(b.homeOrder) : 0;
  if (orderA !== orderB) return orderA - orderB;
  return String(a?.name || "").localeCompare(String(b?.name || ""));
}

function normalizePrimeKey(homeViewConfig) {
  return String(homeViewConfig?.primeSectionTitle || "Prime Products")
    .trim()
    .toLowerCase();
}

export default function useHomeFilters({ products = [], homeViewConfig = {} }) {
  const [query, setQuery] = useState("");
  const [sectionFilter, setSectionFilter] = useState(null);
  const [categoryFilter, setCategoryFilter] = useState(null);

  const primeKey = useMemo(() => normalizePrimeKey(homeViewConfig), [homeViewConfig?.primeSectionTitle]);

  const filteredProducts = useMemo(() => {
    const searchTerm = String(query || "").trim().toLowerCase();
    const categoryTerm = String(categoryFilter || "").trim().toLowerCase();
    return products.filter((product) => {
      if (!matchesHomeShelf(product) || product?.showOnHome === false) return false;
      const productName = String(product?.name || "").toLowerCase();
      const productDescription = String(product?.description || "").toLowerCase();
      const productCategory = String(product?.category || "").toLowerCase();
      const productType = String(product?.productType || "").toLowerCase();
      const matchesSearch =
        searchTerm.length === 0 || productName.includes(searchTerm) || productDescription.includes(searchTerm);
      const matchesCategory =
        categoryTerm.length === 0 || productCategory.includes(categoryTerm) || productType.includes(categoryTerm);
      return matchesSearch && matchesCategory;
    });
  }, [categoryFilter, products, query]);

  const groupedSections = useMemo(() => {
    const grouped = filteredProducts
      .slice()
      .sort(sortByHomeOrder)
      .reduce((acc, item) => {
        const key = String(item?.homeSection || "Prime Products").trim() || "Prime Products";
        if (!acc[key]) acc[key] = [];
        acc[key].push(item);
        return acc;
      }, {});
    return Object.entries(grouped)
      .map(([title, items]) => ({ title, items }))
      .sort((a, b) => a.title.localeCompare(b.title));
  }, [filteredProducts]);

  const primeProducts = useMemo(() => {
    const primeSection = groupedSections.find(
      (section) => String(section?.title || "").trim().toLowerCase() === primeKey
    );
    return Array.isArray(primeSection?.items) ? primeSection.items : [];
  }, [groupedSections, primeKey]);

  const showPrimeSection = useMemo(() => {
    const hasSearchQuery = String(query || "").trim().length > 0;
    if (hasSearchQuery) return false;
    if (homeViewConfig?.showPrimeSection === false) return false;
    return primeProducts.length > 0;
  }, [homeViewConfig?.showPrimeSection, primeProducts.length, query]);

  const primeSection = useMemo(() => {
    if (!showPrimeSection) return null;
    const configuredTitle = String(homeViewConfig?.primeSectionTitle || "Prime Products").trim() || "Prime Products";
    return {
      title: configuredTitle,
      items: primeProducts,
    };
  }, [homeViewConfig?.primeSectionTitle, primeProducts, showPrimeSection]);

  /** Catalog sections excluding Prime — Prime renders via HomePrimeProductsSection. */
  const sections = useMemo(() => {
    const withoutPrime = groupedSections.filter(
      (section) => String(section.title || "").trim().toLowerCase() !== primeKey
    );
    if (!sectionFilter) return withoutPrime;
    return withoutPrime.filter((section) => String(section.title || "").trim() === String(sectionFilter).trim());
  }, [groupedSections, primeKey, sectionFilter]);

  const clearFilters = useCallback(() => {
    setQuery("");
    setSectionFilter(null);
    setCategoryFilter(null);
  }, []);

  return {
    query,
    sectionFilter,
    categoryFilter,
    setQuery,
    setSectionFilter,
    setCategoryFilter,
    clearFilters,
    filteredProducts,
    showPrimeSection,
    primeSection,
    primeProducts,
    sections,
  };
}
