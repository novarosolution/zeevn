/**
 * After `expo export --platform web`, GitHub Pages still runs Jekyll unless a
 * `.nojekyll` file exists at the site root. Without it, folders like `_expo`
 * are not published correctly and the web bundle never loads.
 *
 * @see https://github.com/expo/expo/issues/34066
 */
const fs = require("fs");
const path = require("path");

const root = path.join(__dirname, "..");
const dist = path.join(root, "dist");
const marker = path.join(dist, ".nojekyll");

function copySeoAssets(destRoot) {
  const srcDir = path.join(root, "assets", "seo");
  const destDir = path.join(destRoot, "assets", "seo");
  if (!fs.existsSync(srcDir)) return;
  fs.mkdirSync(destDir, { recursive: true });
  for (const name of fs.readdirSync(srcDir)) {
    if (!name.endsWith(".png")) continue;
    fs.copyFileSync(path.join(srcDir, name), path.join(destDir, name));
  }
}

copySeoAssets(path.join(root, "public"));

if (!fs.existsSync(dist)) {
  console.warn("[post-export-web] dist/ not found — run expo export first.");
  process.exit(0);
}

fs.writeFileSync(marker, "");
console.log("[post-export-web] wrote dist/.nojekyll (GitHub Pages + _expo)");

const swSrc = path.join(__dirname, "..", "public", "sw.js");
const swDest = path.join(dist, "sw.js");
if (fs.existsSync(swSrc)) {
  fs.copyFileSync(swSrc, swDest);
  console.log("[post-export-web] copied public/sw.js → dist/sw.js");
}

if (fs.existsSync(dist)) {
  copySeoAssets(dist);
  console.log("[post-export-web] copied assets/seo → dist/assets/seo");
}
