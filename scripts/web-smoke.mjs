#!/usr/bin/env node
/**
 * Web smoke: route load + no offline banner + no fatal page errors.
 * Usage: npm run export:web && npm run web:smoke
 * Env: WEB_SMOKE_BASE_URL (default http://127.0.0.1:8080) — serve dist with: npx serve -s dist -l 8080
 */
import { chromium } from "playwright";

const base = (process.env.WEB_SMOKE_BASE_URL || "http://127.0.0.1:8080").replace(/\/$/, "");

const ROUTES = [
  "/",
  "/shop",
  "/search",
  "/cart",
  "/login",
  "/register",
  "/about",
  "/contact",
  "/faq",
  "/blog",
  "/privacy",
  "/product/6a024a8cc7cf3aae1a2050f8",
];

async function waitForApp(page) {
  await page.waitForFunction(
    () => {
      const root = document.querySelector("#root");
      return Boolean(root && root.innerText && root.innerText.trim().length > 20);
    },
    { timeout: 45000 }
  );
}

async function main() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const failures = [];

  for (const path of ROUTES) {
    const url = `${base}${path}`;
    process.stdout.write(`[web:smoke] ${path} … `);
    const page = await context.newPage();
    const pageErrors = [];
    page.on("pageerror", (e) => pageErrors.push(e.message));

    try {
      await page.goto(url, { waitUntil: "domcontentloaded", timeout: 60000 });
      await waitForApp(page);
      await page.waitForTimeout(800);
      const offline = await page.locator("text=You're offline").count();
      const fatal = pageErrors.filter((m) =>
        /Cannot read properties|undefined is not|TypeError:|Failed to fetch dynamically imported module/i.test(m)
      );
      if (offline > 0 || fatal.length) {
        failures.push({ path, offline, fatal: fatal.slice(0, 2) });
        console.log("FAIL");
      } else {
        console.log("OK");
      }
    } catch (err) {
      failures.push({ path, error: String(err.message || err).slice(0, 200) });
      console.log("ERROR");
    } finally {
      await page.close();
    }
  }

  await browser.close();

  if (failures.length) {
    console.error("\n[web:smoke] failures:\n", JSON.stringify(failures, null, 2));
    process.exit(1);
  }
  console.log(`\n[web:smoke] All ${ROUTES.length} routes passed at ${base}`);
}

main().catch((err) => {
  console.error("[web:smoke]", err);
  process.exit(2);
});
