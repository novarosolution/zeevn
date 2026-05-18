import { cartLineKey, cartLineTotal, productToCartLine } from "../productCart";

describe("productCart", () => {
  const baseProduct = {
    id: "p1",
    name: "Ghee",
    price: 499,
    variants: [
      { label: "500g", price: 499 },
      { label: "1kg", price: 899 },
    ],
  };

  test("productToCartLine returns base for no-variant product", () => {
    const plain = { id: "p2", name: "Honey", price: 299, variants: [] };
    const line = productToCartLine(plain);
    expect(line.variantLabel).toBe("");
    expect(line.price).toBe(299);
    expect(line.name).toBe("Honey");
  });

  test("productToCartLine selects correct variant when label matches", () => {
    const line = productToCartLine(baseProduct, "1kg");
    expect(line.variantLabel).toBe("1kg");
    expect(line.price).toBe(899);
    expect(line.name).toBe("Ghee — 1kg");
  });

  test("productToCartLine falls back to first variant on missing label", () => {
    const line = productToCartLine(baseProduct, "2kg");
    expect(line.variantLabel).toBe("500g");
    expect(line.price).toBe(499);
  });

  test("productToCartLine uses first variant when label omitted", () => {
    const line = productToCartLine(baseProduct);
    expect(line.variantLabel).toBe("500g");
    expect(line.price).toBe(499);
  });

  test("cartLineKey distinguishes variants", () => {
    expect(cartLineKey({ id: "p1", variantLabel: "500g" })).toBe("p1::500g");
    expect(cartLineKey({ id: "p1", variantLabel: "1kg" })).toBe("p1::1kg");
  });

  test("cartLineTotal is quantity-aware", () => {
    const line = productToCartLine(baseProduct, "500g");
    expect(cartLineTotal(line, 2)).toBe(998);
    expect(cartLineTotal(line, 1)).toBe(499);
    expect(cartLineTotal({ price: 10.5 }, 3)).toBe(31.5);
  });
});
