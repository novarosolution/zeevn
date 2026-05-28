/**
 * ProductScreen (web) print / Save as PDF — uses shared customer print rules.
 */
import { injectCustomerPrintStyles } from "./customerPrint.web";

export function injectProductPrintStyles() {
  return injectCustomerPrintStyles();
}
