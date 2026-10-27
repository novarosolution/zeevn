/**
 * Shop-floor words that should read the same everywhere a customer sees them. The catalogue and old orders still carry
 * the Gujarati/Hindi word "Tel" in product names ("Cold-Pressed Mustard Tel"); shoppers see "Oil".
 * Only the standalone word is touched, so "Hotel" or a phone `tel:` link are left alone.
 */
export function plainOilWord(text) {
  if (typeof text !== "string" || !text) return text;
  return text
    .replace(/\bTEL\b/g, "OIL")
    .replace(/\bTel\b/g, "Oil")
    .replace(/\btel\b/g, "oil")
    .replace(/તેલ/g, "Oil")
    .replace(/तेल/g, "Oil");
}

/**
 * Keeps a quantity and its unit together ("250 g", "1 L", "500 ml") with a non-breaking space, so a line wrap never
 * strands the unit alone on the next line ("Raw Forest Honey — 250 / g").
 */
export function tightUnits(text) {
  if (typeof text !== "string" || !text) return text;
  return text.replace(/(\d)\s+(kg|g|mg|ml|l|ltr|litre|liter|pcs|pc|pack|oz)\b/gi, "$1\u00A0$2");
}

/** A product name as a shopper reads it: the shop-floor word fixed, units kept together. */
export function plainProductName(text) {
  return tightUnits(plainOilWord(text));
}

/** An order from the API with "Tel" removed from the product names it shows. */
export function plainOilOrder(order) {
  if (!order || !Array.isArray(order.products)) return order;
  return {
    ...order,
    products: order.products.map((line) => (line && typeof line.name === "string" ? { ...line, name: plainProductName(line.name) } : line)),
  };
}

/**
 * Money the shop typed by hand ("Rs 50 off", "Rs. 1,499", "INR 499") reads with the ₹ sign the rest of the app uses.
 * Only a currency word directly followed by a number is touched.
 */
export function plainRupee(text) {
  if (typeof text !== "string" || !text) return text;
  return text.replace(/\b(?:Rs|INR)\.?\s*(?=\d)/gi, "\u20B9");
}

/** A copy of `row` with `plainRupee` applied to the listed text fields. */
export function plainRupeeFields(row, fields) {
  if (!row || typeof row !== "object") return row;
  const next = { ...row };
  fields.forEach((field) => {
    if (typeof next[field] === "string") next[field] = plainRupee(next[field]);
  });
  return next;
}

/** Applies `fix` to each row of an API list, whether it comes bare or wrapped as `{ [key]: [...] }`. */
export function mapApiList(data, key, fix) {
  if (Array.isArray(data)) return data.map(fix);
  if (data && Array.isArray(data[key])) return { ...data, [key]: data[key].map(fix) };
  return data;
}

