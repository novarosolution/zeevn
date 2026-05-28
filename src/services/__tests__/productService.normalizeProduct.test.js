import { normalizeProduct } from "../normalizeProduct";

describe("normalizeProduct", () => {
  test("maps _id to id", () => {
    const p = normalizeProduct({ _id: "abc123", name: "Test", price: 10 });
    expect(p.id).toBe("abc123");
  });

  test("stringifies and trims badgeText and lifestyleImage", () => {
    const p = normalizeProduct({
      id: "1",
      name: "X",
      price: 1,
      badgeText: "  Sale  ",
      lifestyleImage: " https://cdn/x.jpg ",
    });
    expect(p.badgeText).toBe("Sale");
    expect(p.lifestyleImage).toBe("https://cdn/x.jpg");
  });

  test("parses variants, USPs, and processSteps", () => {
    const p = normalizeProduct({
      id: "1",
      name: "X",
      price: 100,
      variants: [{ label: " Small ", price: "120" }, { label: "", price: 5 }],
      usps: [{ title: "Pure", description: "Farm fresh", icon: "" }],
      processSteps: [" Step 1 ", "", "Step 2"],
    });
    expect(p.variants).toEqual([{ label: "Small", price: 120 }]);
    expect(p.usps).toHaveLength(1);
    expect(p.usps[0].title).toBe("Pure");
    expect(p.processSteps).toEqual(["Step 1", "Step 2"]);
  });

  test("richProductPage is strict boolean", () => {
    expect(normalizeProduct({ id: "1", name: "A", price: 1, richProductPage: true }).richProductPage).toBe(
      true
    );
    expect(normalizeProduct({ id: "1", name: "A", price: 1, richProductPage: 1 }).richProductPage).toBe(
      false
    );
    expect(normalizeProduct({ id: "1", name: "A", price: 1 }).richProductPage).toBe(false);
  });
});
