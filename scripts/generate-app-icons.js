/**
 * Rasterize repo-root `SVG.svg` into Expo / web icon assets.
 * Run: `npm run icons:generate` (after editing the SVG).
 */
const fs = require("fs");
const path = require("path");
const sharp = require("sharp");

const root = path.join(__dirname, "..");
const svgPath = path.join(root, "SVG.svg");
const assetsDir = path.join(root, "assets");
const cream = { r: 255, g: 252, b: 248, alpha: 1 };

async function main() {
  if (!fs.existsSync(svgPath)) {
    console.error("Missing SVG.svg at project root.");
    process.exit(1);
  }
  if (!fs.existsSync(assetsDir)) fs.mkdirSync(assetsDir, { recursive: true });
  const buf = fs.readFileSync(svgPath);
  const base = sharp(buf).resize(1024, 1024, { fit: "contain", background: cream }).png();
  await base.toFile(path.join(assetsDir, "icon.png"));
  await base.toFile(path.join(assetsDir, "adaptive-icon.png"));
  await sharp(buf)
    .resize(48, 48, { fit: "contain", background: cream })
    .png()
    .toFile(path.join(assetsDir, "favicon.png"));
  console.log("Wrote assets/icon.png, assets/adaptive-icon.png, assets/favicon.png from SVG.svg");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
