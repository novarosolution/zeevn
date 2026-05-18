/**
 * Writes axe JSON summaries per route (for docs/a11y.md before/after tables).
 * Usage: node scripts/axe-report.js [baseUrl]
 */
const fs = require("fs");
const path = require("path");
const { chromium } = require("playwright");
const { AxeBuilder } = require("@axe-core/playwright");

const baseURL = process.argv[2] || process.env.E2E_BASE_URL || "http://127.0.0.1:8081";
const routes = ["/", "/shop", "/login", "/cart", "/register"];

async function scan(page, url) {
  await page.goto(url, { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(2500);
  return new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"]).analyze();
}

function summarize(results) {
  const byImpact = { critical: 0, serious: 0, moderate: 0, minor: 0 };
  for (const v of results.violations) {
    byImpact[v.impact] = (byImpact[v.impact] || 0) + 1;
  }
  return {
    url: results.url,
    violationCount: results.violations.length,
    byImpact,
    violations: results.violations.map((v) => ({
      id: v.id,
      impact: v.impact,
      help: v.help,
      nodes: v.nodes.length,
      samples: v.nodes.slice(0, 3).map((n) => ({
        target: n.target,
        html: (n.html || "").slice(0, 200),
        summary: n.failureSummary?.replace(/\n/g, " ") || "",
      })),
    })),
  };
}

(async () => {
  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();
  const out = {};
  for (const route of routes) {
    const url = `${baseURL.replace(/\/$/, "")}${route}`;
    try {
      const results = await scan(page, url);
      out[route] = summarize(results);
      console.log(route, out[route].byImpact);
    } catch (e) {
      out[route] = { error: String(e) };
      console.error(route, e.message);
    }
  }
  await browser.close();
  const dest = path.join(__dirname, "..", "tests", "e2e", "reports", "axe-summary.json");
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.writeFileSync(dest, JSON.stringify({ generatedAt: new Date().toISOString(), baseURL, routes: out }, null, 2));
  console.log("Wrote", dest);
})();
