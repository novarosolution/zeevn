import { expect, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import type { Result } from "axe-core";

const BLOCKING_IMPACTS = new Set(["critical", "serious"]);

export type AxeScanOptions = {
  /** Wait for this selector before scanning (SPA hydration). */
  waitFor?: string;
  /** Exclude third-party or decorative regions. */
  exclude?: string[];
};

function formatViolations(violations: Result[]): string {
  if (!violations.length) return "No serious/critical violations.";
  return violations
    .map((v) => {
      const nodes = v.nodes
        .slice(0, 3)
        .map((n) => `  - ${n.target.join(" ")}: ${n.failureSummary?.replace(/\n/g, " ") || ""}`)
        .join("\n");
      return `[${v.impact}] ${v.id}: ${v.help}\n${nodes}`;
    })
    .join("\n\n");
}

/**
 * Runs axe on the current page and fails the test on serious/critical violations.
 */
export async function assertNoSeriousAxeViolations(page: Page, options: AxeScanOptions = {}) {
  if (options.waitFor) {
    await page.locator(options.waitFor).first().waitFor({ state: "visible", timeout: 45_000 }).catch(() => {});
  }
  await page.waitForTimeout(1500);

  let builder = new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "best-practice"]);

  const defaultExcludes = [".skipPress", "[data-testid='skip-to-main']"];
  for (const sel of [...defaultExcludes, ...(options.exclude || [])]) {
    builder = builder.exclude(sel);
  }

  const results = await builder.analyze();
  const blocking = results.violations.filter((v) => v.impact && BLOCKING_IMPACTS.has(v.impact));

  expect(blocking, formatViolations(blocking)).toEqual([]);
  return results;
}

export async function scanAxe(page: Page, options: AxeScanOptions = {}) {
  if (options.waitFor) {
    await page.locator(options.waitFor).first().waitFor({ state: "visible", timeout: 45_000 }).catch(() => {});
  }
  await page.waitForTimeout(1000);
  let builder = new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"]);
  const defaultExcludes = [".skipPress", "[data-testid='skip-to-main']"];
  for (const sel of [...defaultExcludes, ...(options.exclude || [])]) {
    builder = builder.exclude(sel);
  }
  return builder.analyze();
}
