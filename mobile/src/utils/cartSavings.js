/**
 * What a bag saves against the printed price (MRP), plus a coupon if one is applied.
 * Lines without an MRP above their price contribute nothing, so the number is never invented.
 */

const toNumber = (value) => {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
};

/** @returns {{ mrpTotal:number, payTotal:number, mrpSavings:number, couponSavings:number, total:number, percent:number }} */
export function computeCartSavings(cartItems, { couponDiscount = 0 } = {}) {
  let mrpTotal = 0;
  let payTotal = 0;
  (Array.isArray(cartItems) ? cartItems : []).forEach((item) => {
    const qty = Math.max(0, Math.floor(toNumber(item?.quantity)));
    if (!qty) return;
    const price = Math.max(0, toNumber(item?.price));
    const mrp = toNumber(item?.mrp);
    // Variant lines carry the variant price; an MRP is only comparable when it is above that price.
    const list = mrp > price ? mrp : price;
    mrpTotal += list * qty;
    payTotal += price * qty;
  });
  const mrpSavings = Math.max(0, mrpTotal - payTotal);
  const couponSavings = Math.max(0, toNumber(couponDiscount));
  const total = mrpSavings + couponSavings;
  const percent = mrpTotal > 0 ? Math.round((total / mrpTotal) * 100) : 0;
  return { mrpTotal, payTotal, mrpSavings, couponSavings, total, percent };
}
