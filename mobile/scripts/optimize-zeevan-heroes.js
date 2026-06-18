/**
 * Generate web-optimized WebP heroes from `assets/zeevan-*.png`.
 * Targets ~70–120 KB per slide for fast LCP (720 mobile / 960 desktop).
 */
const fs = require("fs");
const path = require("path");

let sharp;
try {
  // eslint-disable-next-line global-require
  sharp = require("sharp");
} catch {
  sharp = null;
}

const assetsDir = path.join(__dirname, "..", "assets");

const PORTRAIT_WIDTH = 720;
const WIDE_WIDTH = 960;

/** PNG basename → max delivery width (portrait vs wide). */
const HERO_SOURCES = [
  { name: "zeevan-ghee-packaging-portrait.png", width: PORTRAIT_WIDTH, quality: 72 },
  { name: "zeevan-tel-portrait.png", width: PORTRAIT_WIDTH, quality: 72 },
  { name: "zeevan-masala-portrait.png", width: PORTRAIT_WIDTH, quality: 72 },
  { name: "zeevan-honey-portrait.png", width: PORTRAIT_WIDTH, quality: 72 },
  { name: "zeevan-hero-web-21x9.png", width: WIDE_WIDTH, quality: 74 },
  { name: "zeevan-hero-web-tel-21x9.png", width: WIDE_WIDTH, quality: 74 },
  { name: "zeevan-hero-web-masala-21x9.png", width: WIDE_WIDTH, quality: 74 },
  { name: "zeevan-hero-web-honey-21x9.png", width: WIDE_WIDTH, quality: 74 },
];

const COMMITTED_MARKERS = HERO_SOURCES.map(({ name, width }) => {
  const base = name.replace(/\.png$/i, "");
  return `${base}-web-${width}.webp`;
});

function hasCommittedOutputs() {
  return COMMITTED_MARKERS.every((name) => fs.existsSync(path.join(assetsDir, name)));
}

function isOutputFresh(inputPath, outputPath) {
  if (!fs.existsSync(outputPath)) return false;
  if (process.env.VERCEL || process.env.CI) return true;
  return fs.statSync(outputPath).mtimeMs >= fs.statSync(inputPath).mtimeMs;
}

async function toWebp(inputName, maxWidth, quality) {
  const input = path.join(assetsDir, inputName);
  const base = inputName.replace(/\.png$/i, "");
  const outputName = `${base}-web-${maxWidth}.webp`;
  const output = path.join(assetsDir, outputName);
  const previewName = `${base}-preview-48.webp`;
  const preview = path.join(assetsDir, previewName);

  if (!fs.existsSync(input)) {
    console.warn(`[zeevan-heroes] skip missing ${inputName}`);
    return;
  }

  if (isOutputFresh(input, output) && isOutputFresh(input, preview)) {
    console.log(`[zeevan-heroes] ${outputName} up to date`);
    return;
  }

  await sharp(input)
    .rotate()
    .resize(maxWidth, null, { withoutEnlargement: true, fit: "inside" })
    .webp({ quality, effort: 5, smartSubsample: true, nearLossless: false })
    .toFile(output);

  await sharp(input)
    .rotate()
    .resize(40, null, { withoutEnlargement: true, fit: "inside" })
    .webp({ quality: 38, effort: 4 })
    .toFile(preview);

  const before = fs.statSync(input).size;
  const after = fs.statSync(output).size;
  console.log(
    `[zeevan-heroes] ${outputName} — ${(before / 1024 / 1024).toFixed(2)} MB → ${(after / 1024).toFixed(0)} KB`
  );
}

async function main() {
  if (!sharp) {
    if (hasCommittedOutputs()) {
      console.warn("[zeevan-heroes] sharp unavailable — using committed WebP heroes.");
      return;
    }
    console.error("[zeevan-heroes] sharp required. Run: npm install --include=dev");
    process.exit(1);
  }

  for (const { name, width, quality } of HERO_SOURCES) {
    await toWebp(name, width, quality);
  }

  console.log("[zeevan-heroes] done.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
