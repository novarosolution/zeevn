/**
 * Injected on ProductScreen (web) for print / Save as PDF.
 */
export const PRODUCT_PRINT_STYLE_ID = "zeevan-pdp-print";

export const PRODUCT_PRINT_CSS = `
@media print {
  nav,
  footer,
  [data-print-hide="true"],
  [aria-label*="bottom"],
  [class*="BottomNav"],
  [class*="MobileStickyDock"],
  [class*="GalleryScrollFab"],
  [class*="WebAppHeader"] {
    display: none !important;
  }
  body {
    background: #fff !important;
  }
  [data-print-pdp="true"] {
    max-width: 100% !important;
    padding: 0 !important;
  }
  [data-print-pdp="true"] img {
    max-width: 100% !important;
    page-break-inside: avoid;
  }
}
`;

export function injectProductPrintStyles() {
  if (typeof document === "undefined") return () => {};
  let el = document.getElementById(PRODUCT_PRINT_STYLE_ID);
  if (!el) {
    el = document.createElement("style");
    el.id = PRODUCT_PRINT_STYLE_ID;
    el.textContent = PRODUCT_PRINT_CSS;
    document.head.appendChild(el);
  }
  return () => {
    document.getElementById(PRODUCT_PRINT_STYLE_ID)?.remove();
  };
}
