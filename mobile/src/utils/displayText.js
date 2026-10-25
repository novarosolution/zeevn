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

/** An order from the API with "Tel" removed from the product names it shows. */
export function plainOilOrder(order) {
  if (!order || !Array.isArray(order.products)) return order;
  return {
    ...order,
    products: order.products.map((line) => (line && typeof line.name === "string" ? { ...line, name: plainOilWord(line.name) } : line)),
  };
}
