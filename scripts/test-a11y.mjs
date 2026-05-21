#!/usr/bin/env node
/**
 * Playwright + axe-core smoke for six customer routes.
 * Requires: dist/ served at A11Y_BASE_URL (default http://127.0.0.1:8080).
 */
import { chromium } from "playwright";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { createRequire } from "module";

const require = createRequire(import.meta.url);
const axeSource = fs.readFileSync(require.resolve("axe-core/axe.min.js"), "utf8");

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const base = (process.env.A11Y_BASE_URL || "http://127.0.0.1:8080").replace(/\/$/, "");

const ROUTES = [
  { path: "/", name: "Home" },
  { path: "/login", name: "Login" },
  { path: "/shop", name: "Shop" },
  { path: "/search", name: "Search" },
  { path: "/cart", name: "Cart" },
  { path: "/register", name: "Register" },
];

async function waitForApp(page) {
  await page.waitForFunction(
    () => {
      const rootEl = document.querySelector("#root");
      return Boolean(rootEl && rootEl.innerText && rootEl.innerText.trim().length > 20);
    },
    { timeout: 45000 }
  );
  await page.waitForTimeout(800);
}

async function runAxe(page) {
  await page.addScriptTag({ content: axeSource });
  return page.evaluate(async () => {
    // eslint-disable-next-line no-undef
    return axe.run(document, {
      runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "best-practice"] },
    });
  });
}

async function main() {
  if (!fs.existsSync(path.join(root, "dist", "index.html"))) {
    console.error("[test:a11y] dist/ missing — run: npm run export:web && npx serve -s dist -l 8080");
    process.exit(1);
  }

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 390, height: 844 } });

  const report = { base, routes: [], failures: [] };

  for (const route of ROUTES) {
    const url = `${base}${route.path}`;
    process.stdout.write(`[test:a11y] ${route.name} (${route.path})… `);
    const page = await context.newPage();
    try {
      await page.goto(url, { waitUntil: "domcontentloaded", timeout: 60000 });
      await waitForApp(page);
      const results = await runAxe(page);
      const violations = results.violations || [];
      const serious = violations.filter((v) => v.impact === "serious" || v.impact === "critical");
      report.routes.push({
        name: route.name,
        path: route.path,
        url,
        violationCount: violations.length,
        seriousCount: serious.length,
        violations: violations.map((v) => ({
          id: v.id,
          impact: v.impact,
          help: v.help,
          nodes: v.nodes?.length || 0,
        })),
      });
      if (serious.length) {
        report.failures.push({ route: route.path, serious });
        console.log(`FAIL (${serious.length} serious)`);
      } else {
        console.log(`OK (${violations.length} minor)`);
      }
    } catch (err) {
      report.failures.push({ route: route.path, error: String(err.message || err) });
      console.log(`ERROR ${err.message}`);
    } finally {
      await page.close();
    }
  }

  await browser.close();

  const outPath = path.join(root, "docs", "a11y-report.json");
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, JSON.stringify(report, null, 2));

  if (report.failures.length) {
    console.error(`\n[test:a11y] ${report.failures.length} route(s) failed. See ${outPath}`);
    process.exit(1);
  }
  console.log(`\n[test:a11y] All ${ROUTES.length} routes passed. Report: docs/a11y-report.json`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
