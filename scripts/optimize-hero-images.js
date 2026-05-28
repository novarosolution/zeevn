/**
 * Generates WebP hero assets for LCP (run: node scripts/optimize-hero-images.js).
 */
const fs = require("fs");
const path = require("path");

const root = path.join(__dirname, "..");
const srcImage = path.join(
  root,
  "web img",
  "ChatGPT Image May 11, 2026, 08_04_26 PM.png"
);
const outDir = path.join(root, "public", "assets", "hero");

const WIDTHS = [640, 960, 1280, 1920];

async function main() {
  let sharp;
  try {
    sharp = require("sharp");
  } catch {
    console.error("[optimize-hero] Install sharp: npm install sharp --save-dev");
    process.exit(1);
  }
  if (!fs.existsSync(srcImage)) {
    console.warn("[optimize-hero] Source image missing:", srcImage);
    process.exit(0);
  }
  fs.mkdirSync(outDir, { recursive: true });
  const meta = await sharp(srcImage).metadata();
  const aspect = meta.width && meta.height ? meta.height / meta.width : 1537 / 1023;

  for (const w of WIDTHS) {
    const h = Math.round(w * aspect);
    const base = `hero-${w}`;
    await sharp(srcImage)
      .resize(w, h, { fit: "cover", withoutEnlargement: true })
      .webp({ quality: 82, effort: 4 })
      .toFile(path.join(outDir, `${base}.webp`));
    console.log(`[optimize-hero] wrote ${base}.webp (${w}x${h})`);
  }

  await sharp(srcImage)
    .resize(1280, Math.round(1280 * aspect), { fit: "cover" })
    .webp({ quality: 82 })
    .toFile(path.join(outDir, "hero-lcp.webp"));
  console.log("[optimize-hero] wrote hero-lcp.webp (default LCP candidate)");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
