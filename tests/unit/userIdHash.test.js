import { hashUserIdForTelemetrySync } from "../../src/observability/userIdHash";

describe("hashUserIdForTelemetrySync", () => {
  it("returns anonymous for empty input", () => {
    expect(hashUserIdForTelemetrySync(undefined)).toBe("anonymous");
    expect(hashUserIdForTelemetrySync(null)).toBe("anonymous");
    expect(hashUserIdForTelemetrySync("")).toBe("anonymous");
    expect(hashUserIdForTelemetrySync("   ")).toBe("anonymous");
  });

  it("returns stable hash for ids", () => {
    const a = hashUserIdForTelemetrySync("user-123");
    const b = hashUserIdForTelemetrySync("user-123");
    expect(a).toMatch(/^u_[0-9a-f]+$/);
    expect(a).toBe(b);
    expect(hashUserIdForTelemetrySync("other")).not.toBe(a);
  });
});
