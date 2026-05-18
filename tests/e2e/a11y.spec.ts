import { test } from "@playwright/test";
import { assertNoSeriousAxeViolations } from "./helpers/axe";
import { ensureE2EProductId } from "./helpers/api";

const CRITICAL_ROUTES = [
  { path: "/", name: "home", waitFor: "#main-content, [nativeid='main-content']" },
  { path: "/shop", name: "shop", waitFor: "#main-content" },
  { path: "/login", name: "login", waitFor: "#auth-main-content, [nativeid='auth-main-content']" },
  { path: "/cart", name: "cart", waitFor: "#main-content" },
  { path: "/register", name: "register", waitFor: "#auth-main-content" },
];

test.describe("Accessibility (axe)", () => {
  let productId: string | null = null;

  test.beforeAll(async () => {
    try {
      productId = await ensureE2EProductId();
    } catch {
      productId = null;
    }
  });

  for (const route of CRITICAL_ROUTES) {
    test(`${route.name} (${route.path}) has no serious/critical axe violations`, async ({ page }) => {
      await page.goto(route.path, { waitUntil: "domcontentloaded" });
      await assertNoSeriousAxeViolations(page, {
        waitFor: route.waitFor,
        exclude: [
          "[nativeid='home-hero']",
          ".skipPress",
        ],
      });
    });
  }

  test(`product PDP has no serious/critical axe violations`, async ({ page }) => {
    test.skip(!productId, "Requires E2E API + seed product");
    await page.goto(`/product/${productId}`, { waitUntil: "domcontentloaded" });
    await assertNoSeriousAxeViolations(page, { waitFor: "#main-content" });
  });
});
