import {
  decodeReturnToString,
  encodeReturnToObject,
  parseLoginReturnToParam,
  stringifyLoginReturnToParam,
} from "../deepLink";

describe("deepLink returnTo", () => {
  const target = { name: "Cart", params: { checkout: true } };

  test("encoding an object yields a JSON string", () => {
    const encoded = encodeReturnToObject(target);
    expect(typeof encoded).toBe("string");
    expect(JSON.parse(encoded)).toEqual(target);
  });

  test("decoding handles legacy [object Object] strings", () => {
    expect(decodeReturnToString("[object Object]")).toBeNull();
    expect(parseLoginReturnToParam("[object Object]")).toBeUndefined();
  });

  test("special chars in returnTo round-trip safely", () => {
    const tricky = { name: "Product", params: { productId: "id/with?chars&foo=bar" } };
    const wire = stringifyLoginReturnToParam(tricky);
    const parsed = parseLoginReturnToParam(wire);
    expect(parsed).toEqual(tricky);
    expect(decodeReturnToString(wire)).toEqual(tricky);
  });

  test("parseLoginReturnToParam accepts object param from navigation", () => {
    expect(parseLoginReturnToParam(target)).toEqual(target);
  });
});
