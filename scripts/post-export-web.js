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
  const srcDirs = [
    path.join(root, "public", "seo"),
    path.join(root, "assets", "seo"),
  ];
  for (const destSub of ["seo", "assets/seo"]) {
    const destDir = path.join(destRoot, destSub);
    fs.mkdirSync(destDir, { recursive: true });
    for (const srcDir of srcDirs) {
      if (!fs.existsSync(srcDir)) continue;
      for (const name of fs.readdirSync(srcDir)) {
        if (!name.endsWith(".png")) continue;
        fs.copyFileSync(path.join(srcDir, name), path.join(destDir, name));
      }
    }
  }
}

copySeoAssets(path.join(root, "public"));

function copyPublicDir(subPath) {
  const src = path.join(root, "public", subPath);
  const dest = path.join(dist, subPath);
  if (!fs.existsSync(src)) return;
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  if (fs.statSync(src).isDirectory()) {
    fs.mkdirSync(dest, { recursive: true });
    for (const name of fs.readdirSync(src)) {
      const from = path.join(src, name);
      const to = path.join(dest, name);
      if (fs.statSync(from).isDirectory()) {
        fs.cpSync(from, to, { recursive: true });
      } else {
        fs.copyFileSync(from, to);
      }
    }
  } else {
    fs.copyFileSync(src, dest);
  }
}

function optimizeIndexHtml() {
  const indexPath = path.join(dist, "index.html");
  if (!fs.existsSync(indexPath)) return;
  let html = fs.readFileSync(indexPath, "utf8");

  html = html.replace(
    /<link rel="preload" href="\/_expo\/static\/css\/leaflet[^"]+" as="style">/g,
    ""
  );
  html = html.replace(
    /<link rel="stylesheet" href="(\/_expo\/static\/css\/leaflet[^"]+)">/g,
    `<link rel="stylesheet" href="$1" media="print" onload="this.media='all'">`
  );

  const preloadTags = [
    '<link rel="preload" as="image" href="/assets/hero/hero-960.webp" imagesrcset="/assets/hero/hero-640.webp 640w, /assets/hero/hero-960.webp 960w, /assets/hero/hero-1280.webp 1280w, /assets/hero/hero-1920.webp 1920w" imagesizes="100vw" fetchpriority="high">',
    '<link rel="preload" as="font" type="font/woff2" href="/fonts/Inter-400.woff2" crossorigin>',
    '<link rel="preload" as="font" type="font/woff2" href="/fonts/Inter-500.woff2" crossorigin>',
    '<link rel="preload" as="font" type="font/woff2" href="/fonts/PlayfairDisplay-600.woff2" crossorigin>',
  ].join("");

  if (!html.includes('href="/assets/hero/hero-960.webp"')) {
    html = html.replace("</head>", `${preloadTags}</head>`);
  }

  fs.writeFileSync(indexPath, html, "utf8");
  console.log("[post-export-web] optimized dist/index.html preload + non-blocking CSS");
}

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
  copyPublicDir("assets/hero");
  copyPublicDir("fonts");
  optimizeIndexHtml();

  const indexPath = path.join(dist, "index.html");
  const notFoundPath = path.join(dist, "404.html");
  if (fs.existsSync(indexPath)) {
    fs.copyFileSync(indexPath, notFoundPath);
    console.log("[post-export-web] copied index.html → 404.html (SPA deep links on GitHub Pages)");
  }

  console.log("[post-export-web] copied seo, assets/seo, assets/hero, fonts → dist/");
}
