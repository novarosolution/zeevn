import { buildLoginParams, navigateAfterAuth } from "../authNavigation";

describe("authNavigation", () => {
  test("buildLoginParams includes returnTo and sessionExpired", () => {
    const params = buildLoginParams({
      returnTo: { name: "Cart" },
      sessionExpired: true,
      email: "a@b.com",
    });
    expect(params.returnTo).toEqual({ name: "Cart" });
    expect(params.sessionExpired).toBe(true);
    expect(params.email).toBe("a@b.com");
  });

  test("navigateAfterAuth honors returnTo", () => {
    const navigation = { replace: jest.fn(), goBack: jest.fn(), navigate: jest.fn(), getState: jest.fn() };
    navigateAfterAuth(navigation, {
      params: { returnTo: { name: "Product", params: { productId: "abc" } } },
    });
    expect(navigation.replace).toHaveBeenCalledWith("Product", { productId: "abc" });
  });

  test("navigateAfterAuth decodes JSON returnTo string", () => {
    const navigation = { replace: jest.fn(), goBack: jest.fn(), navigate: jest.fn(), getState: jest.fn() };
    const encoded = encodeURIComponent(JSON.stringify({ name: "Cart" }));
    navigateAfterAuth(navigation, { params: { returnTo: encoded } });
    expect(navigation.replace).toHaveBeenCalledWith("Cart", {});
  });
});
