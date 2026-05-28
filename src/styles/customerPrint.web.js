/**
 * Shared print rules for customer web (PDP spec sheet, order invoice).
 */
export const CUSTOMER_PRINT_STYLE_ID = "zeevan-customer-print";

export const CUSTOMER_PRINT_CSS = `
@media print {
  nav,
  footer,
  [data-print-hide="true"],
  [aria-label*="bottom"],
  [class*="BottomNav"],
  [class*="MobileStickyDock"],
  [class*="GalleryScrollFab"],
  [class*="WebAppHeader"],
  [class*="AppFooter"] {
    display: none !important;
  }
  body {
    background: #fff !important;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }
  [data-print-pdp="true"],
  [data-print-invoice="true"] {
    max-width: 100% !important;
    padding: 0 !important;
  }
  [data-print-pdp="true"] img,
  [data-print-invoice="true"] img {
    max-width: 100% !important;
    page-break-inside: avoid;
  }
  [data-print-invoice="true"] [data-print-actions="true"] {
    display: none !important;
  }
}
`;

export function injectCustomerPrintStyles() {
  if (typeof document === "undefined") return () => {};
  let el = document.getElementById(CUSTOMER_PRINT_STYLE_ID);
  if (!el) {
    el = document.createElement("style");
    el.id = CUSTOMER_PRINT_STYLE_ID;
    el.textContent = CUSTOMER_PRINT_CSS;
    document.head.appendChild(el);
  }
  return () => {
    document.getElementById(CUSTOMER_PRINT_STYLE_ID)?.remove();
  };
}
