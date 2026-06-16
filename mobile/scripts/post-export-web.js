/**
 * After `expo export --platform web`, GitHub Pages still runs Jekyll unless a
 * `.nojekyll` file exists at the site root. Without it, folders like `_expo`
 * are not published correctly and the web bundle never loads.
 *
 * Also injects Lighthouse-friendly head tags and LCP preload into `index.html`.
 *
 * @see https://github.com/expo/expo/issues/34066
 */
const fs = require("fs");
const path = require("path");

const dist = path.join(__dirname, "..", "dist");
const marker = path.join(dist, ".nojekyll");
const indexHtml = path.join(dist, "index.html");

function walkFiles(dir, matcher, results = []) {
  if (!fs.existsSync(dir)) return results;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walkFiles(full, matcher, results);
    } else if (matcher(entry.name, full)) {
      results.push(full);
    }
  }
  return results;
}

function toPublicAssetPath(distRoot, absolutePath) {
  const rel = path.relative(distRoot, absolutePath).split(path.sep).join("/");
  return `/${rel}`;
}

if (!fs.existsSync(dist)) {
  console.warn("[post-export-web] dist/ not found — run expo export first.");
  process.exit(0);
}

fs.writeFileSync(marker, "");
console.log("[post-export-web] wrote dist/.nojekyll (GitHub Pages + _expo)");

if (fs.existsSync(indexHtml)) {
  let html = fs.readFileSync(indexHtml, "utf8");

  // Remove render-blocking Leaflet CSS from home (maps lazy-load their own chunk).
  html = html.replace(/<link[^>]+leafletWeb[^>]*>\s*/gi, "");

  const headInject = [
    '<meta name="description" content="Zeevan — premium A2 ghee and artisan pantry goods, delivered fresh to your door." />',
    '<meta name="theme-color" content="#FAF8F4" />',
    '<meta name="color-scheme" content="light dark" />',
  ];

  headInject.forEach((tag) => {
    const name = tag.match(/name="([^"]+)"/)?.[1];
    if (name && html.includes(`name="${name}"`)) return;
    html = html.replace("</head>", `  ${tag}\n</head>`);
  });

  const heroCandidates = walkFiles(path.join(dist, "assets"), (name) =>
    name.includes("hero-slide-kankreg-phone-hero-web-840") && name.endsWith(".webp")
  );
  if (heroCandidates.length) {
    const heroHref = toPublicAssetPath(dist, heroCandidates[0]);
    const preloadTag = `<link rel="preload" as="image" href="${heroHref}" fetchpriority="high" />`;
    if (!html.includes("hero-slide-kankreg-phone-hero-web-840")) {
      html = html.replace("</head>", `  ${preloadTag}\n</head>`);
      console.log("[post-export-web] injected LCP hero preload:", heroHref);
    }
    const shellTag = [
      "<style id=\"kankreg-lcp-shell-style\">",
      "#kankreg-lcp-shell{position:fixed;top:110px;left:0;width:100%;height:clamp(420px,62vw,720px);object-fit:cover;object-position:center;display:block;background:#1a1410;z-index:0;pointer-events:none;}",
      "#root{position:relative;z-index:1;background:transparent;}",
      "</style>",
      `<img id="kankreg-lcp-shell" src="${heroHref}" alt="Zeevan premium A2 ghee" fetchpriority="high" decoding="async" width="840" height="1070" />`,
    ].join("");
    html = html.replace(
      /<style id="kankreg-lcp-shell-style">[\s\S]*?<\/style>\s*<img id="kankreg-lcp-shell"[^>]*>\s*/gi,
      ""
    );
    html = html.replace("<div id=\"root\"></div>", `${shellTag}\n    <div id="root"></div>`);
    console.log("[post-export-web] injected LCP hero shell image");
  }

  if (!html.includes('lang="en"')) {
    html = html.replace("<html", '<html lang="en"');
  }

  fs.writeFileSync(indexHtml, html);
  console.log("[post-export-web] injected meta tags into dist/index.html");

  // SPA fallback — direct /shop, /about, etc. on static hosts (GitHub Pages, serve).
  const spaFallback = path.join(dist, "404.html");
  fs.copyFileSync(indexHtml, spaFallback);
  console.log("[post-export-web] wrote dist/404.html for client-side routing");
}
