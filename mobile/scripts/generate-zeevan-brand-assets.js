/**
 * Generate Zeevan brand PNGs — wordmark, app icon, favicon.
 * Run: node scripts/generate-zeevan-brand-assets.js
 */
const fs = require("fs");
const path = require("path");
const sharp = require("sharp");

const root = path.join(__dirname, "..");
const assetsDir = path.join(root, "assets");

function wordmarkSvg({ width = 1024, height = 320, fill = "#151210", subfill = "#244424" } = {}) {
  return Buffer.from(`<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
  <text x="0" y="${Math.round(height * 0.78)}" font-family="Georgia, 'Times New Roman', serif" font-size="${Math.round(height * 0.72)}" font-weight="700" fill="${fill}">Zeevan</text>
  <text x="2" y="${height - 8}" font-family="Arial, Helvetica, sans-serif" font-size="${Math.round(height * 0.11)}" font-weight="600" letter-spacing="3" fill="${subfill}">GHEE · TEL · MASALA · HONEY</text>
</svg>`);
}

function iconSvg({ size = 1024, dark = false } = {}) {
  const bg = dark ? "#151210" : "#FAF8F4";
  const green = dark ? "#788844" : "#244424";
  const gold = "#DCAC74";
  const text = dark ? "#FAF8F4" : "#151210";
  return Buffer.from(`<svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
  <rect width="${size}" height="${size}" rx="${Math.round(size * 0.22)}" fill="${bg}"/>
  <circle cx="${size / 2}" cy="${size / 2}" r="${Math.round(size * 0.36)}" fill="${green}" opacity="0.12"/>
  <text x="50%" y="54%" text-anchor="middle" dominant-baseline="middle" font-family="Georgia, serif" font-size="${Math.round(size * 0.34)}" font-weight="700" fill="${text}">Z</text>
  <rect x="${Math.round(size * 0.18)}" y="${Math.round(size * 0.82)}" width="${Math.round(size * 0.64)}" height="${Math.round(size * 0.028)}" rx="4" fill="${gold}"/>
</svg>`);
}

async function writeWordmark(name, width, height, opts = {}) {
  const out = path.join(assetsDir, name);
  await sharp(wordmarkSvg({ width, height, ...opts })).png().toFile(out);
  console.log("Wrote", name);
}

async function writeIcon(name, size, dark = false) {
  const out = path.join(assetsDir, name);
  await sharp(iconSvg({ size, dark })).png().toFile(out);
  console.log("Wrote", name);
}

async function main() {
  fs.mkdirSync(assetsDir, { recursive: true });
  await writeWordmark("zeevan-brand.png", 1024, 320);
  await writeWordmark("zeevan-brand-light.png", 1024, 320, { fill: "#FAF8F4", subfill: "#DCAC74" });
  await writeWordmark("zeevan-logo.png", 512, 512, { fill: "#244424", subfill: "#788844" });
  await writeIcon("app-icon-light.png", 1024, false);
  await writeIcon("app-icon-dark.png", 1024, true);
  await writeIcon("icon.png", 1024, false);
  await writeIcon("adaptive-icon.png", 1024, false);
  await writeIcon("favicon.png", 192, false);
  await writeIcon("splash-icon.png", 420, false);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
