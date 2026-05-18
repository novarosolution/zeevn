import { test, expect } from "@playwright/test";
import { ensureE2EProductId } from "./helpers/api";

type RouteCase = {
  path: string;
  header: RegExp | string;
};

const routes: RouteCase[] = [
  { path: "/", header: /pantry|zeevan|heritage|search/i },
  { path: "/shop", header: /pantry|zeevan|shop|not found|404/i },
  { path: "/login", header: /sign in/i },
  { path: "/cart", header: /bag|cart|sign in/i },
];

test.describe("Smoke E2E", () => {
  let productId: string;

  test.beforeAll(async () => {
    productId = await ensureE2EProductId();
  });

  for (const route of routes) {
    test(`${route.path} renders header within 3s`, async ({ page }) => {
      const consoleErrors: string[] = [];
      page.on("console", (msg) => {
        if (msg.type() === "error") {
          const text = msg.text();
          if (text.includes("favicon")) return;
          consoleErrors.push(text);
        }
      });
      page.on("pageerror", (err) => {
        consoleErrors.push(err.message);
      });

      await page.goto(route.path, { waitUntil: "domcontentloaded" });
      const chrome = page.getByRole("heading").or(page.getByRole("banner")).first();
      await expect(chrome).toBeVisible({ timeout: 3000 });

      if (typeof route.header === "string") {
        await expect(page.getByText(route.header)).toBeVisible({ timeout: 3000 });
      } else {
        await expect(page.getByText(route.header).first()).toBeVisible({ timeout: 3000 });
      }

      expect(consoleErrors, `console errors on ${route.path}:\n${consoleErrors.join("\n")}`).toEqual([]);
    });
  }

  test(`/product/:id renders PDP header within 3s`, async ({ page }) => {
    const consoleErrors: string[] = [];
    page.on("console", (msg) => {
      if (msg.type() === "error") consoleErrors.push(msg.text());
    });

    await page.goto(`/product/${productId}`);
    await expect(page.locator("body")).toBeVisible({ timeout: 3000 });
    await expect(page.getByRole("heading").first()).toBeVisible({ timeout: 3000 });
    expect(consoleErrors).toEqual([]);
  });
});
