import { STORE_PRODUCT } from "../content/storefrontContent";
import { formatINRWhole } from "./currency";

/**
 * What the shopper's own delivery area charges, in words, from the live `/delivery/check` answer — or `null` while the
 * area is unknown (the caller keeps the shop-wide text). The rule matches the server's: a fee of 0 means delivery is
 * always free there, `freeAbove` adds a free tier above that order value, and anything else is a flat fee.
 */
export function describeAreaDelivery(quote) {
  if (!quote || quote.serviceable !== true) return null;
  const copy = STORE_PRODUCT.delivery.area;
  const fee = Number(quote.fee) || 0;
  const freeAbove = Number(quote.freeAbove) || 0;
  if (fee <= 0) return { title: copy.freeTitle, body: copy.freeBody };
  if (freeAbove > 0) return { title: copy.freeAboveTitle(formatINRWhole(freeAbove)), body: copy.feeBody(formatINRWhole(fee)) };
  return { title: copy.flatTitle(formatINRWhole(fee)), body: copy.flatBody };
}
