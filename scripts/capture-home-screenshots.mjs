import fs from "node:fs/promises";
import path from "node:path";
import { chromium } from "playwright";

const BASE_URL = process.env.HOME_CAPTURE_URL || "http://127.0.0.1:8081";
const DATE_STAMP = new Date().toISOString().slice(0, 10);
const OUT_DIR = path.resolve(process.cwd(), "docs/home-redesign-screenshots", DATE_STAMP);

async function ensureDir(dir) {
  await fs.mkdir(dir, { recursive: true });
}

async function captureTopMidBottom(page, prefix, width, height) {
  await page.setViewportSize({ width, height });
  await page.goto(BASE_URL, { waitUntil: "networkidle" });
  await page.waitForTimeout(1000);
  await page.screenshot({ path: path.join(OUT_DIR, `${prefix}-top.png`) });
  const middleY = await page.evaluate(() => {
    const maxScroll = Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
    return Math.floor(maxScroll / 2);
  });
  await page.evaluate((y) => window.scrollTo(0, y), middleY);
  await page.waitForTimeout(400);
  await page.screenshot({ path: path.join(OUT_DIR, `${prefix}-mid.png`) });
  const bottomY = await page.evaluate(() => {
    return Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
  });
  await page.evaluate((y) => window.scrollTo(0, y), bottomY);
  await page.waitForTimeout(400);
  await page.screenshot({ path: path.join(OUT_DIR, `${prefix}-bottom.png`) });
}

async function main() {
  await ensureDir(OUT_DIR);
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  await captureTopMidBottom(page, "iphone-14", 390, 844);
  await captureTopMidBottom(page, "ipad", 768, 1024);
  await captureTopMidBottom(page, "desktop", 1280, 800);
  await browser.close();
  process.stdout.write(`Saved screenshots in ${OUT_DIR}\n`);
}

main().catch((error) => {
  process.stderr.write(`${error?.stack || error}\n`);
  process.exit(1);
});
