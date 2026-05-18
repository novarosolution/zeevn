import fs from "node:fs/promises";
import path from "node:path";
import { chromium } from "playwright";

const BASE_URL = process.env.HOME_CAPTURE_URL || "http://127.0.0.1:8081";
const OUT_DIR = path.resolve(process.cwd(), "docs/images/home-redesign-2026-05");

async function ensureDir(dir) {
  await fs.mkdir(dir, { recursive: true });
}

async function captureIphoneShots(page) {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(BASE_URL, { waitUntil: "networkidle" });
  await page.waitForTimeout(1200);
  await page.screenshot({ path: path.join(OUT_DIR, "iphone-top.png") });

  const middleY = await page.evaluate(() => {
    const maxScroll = Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
    return Math.floor(maxScroll / 2);
  });
  await page.evaluate((y) => window.scrollTo(0, y), middleY);
  await page.waitForTimeout(400);
  await page.screenshot({ path: path.join(OUT_DIR, "iphone-mid.png") });

  const bottomY = await page.evaluate(() =>
    Math.max(0, document.documentElement.scrollHeight - window.innerHeight)
  );
  await page.evaluate((y) => window.scrollTo(0, y), bottomY);
  await page.waitForTimeout(400);
  await page.screenshot({ path: path.join(OUT_DIR, "iphone-bottom.png") });
}

async function captureSingleViewport(page, name, width, height) {
  await page.setViewportSize({ width, height });
  await page.goto(BASE_URL, { waitUntil: "networkidle" });
  await page.waitForTimeout(1000);
  await page.screenshot({ path: path.join(OUT_DIR, name) });
}

async function main() {
  await ensureDir(OUT_DIR);
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  await captureIphoneShots(page);
  await captureSingleViewport(page, "tablet.png", 768, 1024);
  await captureSingleViewport(page, "desktop.png", 1280, 800);
  await browser.close();
  process.stdout.write(`Saved screenshots in ${OUT_DIR}\n`);
}

main().catch((error) => {
  process.stderr.write(`${error?.stack || error}\n`);
  process.exit(1);
});
