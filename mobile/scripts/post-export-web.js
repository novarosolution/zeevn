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

const SITE_URL = String(process.env.EXPO_PUBLIC_SITE_URL || "https://www.zeevan.app").replace(
  /\/+$/,
  ""
);

/** Packaging portrait WebP (720px wide, 1672/941). */
const LCP_PORTRAIT_WIDTH = 720;
const LCP_PORTRAIT_HEIGHT = 1278;
/** Wide 21:9 hero WebP (960px wide, 821/1915). */
const LCP_WIDE_WIDTH = 960;
const LCP_WIDE_HEIGHT = 412;

function injectAfterViewport(html, tags) {
  const block = tags.filter(Boolean).join("\n");
  if (!block) return html;
  const viewport = html.match(/<meta[^>]+name="viewport"[^>]*>/i);
  if (viewport) {
    return html.replace(viewport[0], `${viewport[0]}\n${block}`);
  }
  return html.replace("<head>", `<head>\n${block}`);
}

function stripSourceMaps(distRoot) {
  let removed = 0;
  walkFiles(distRoot, (name) => name.endsWith(".map"), []).forEach((file) => {
    fs.unlinkSync(file);
    removed += 1;
  });
  if (removed) {
    console.log(`[post-export-web] removed ${removed} source map file(s)`);
  }
}

function stripSourceMapComments(html) {
  return html.replace(/\n\/\/# sourceMappingURL=.*$/gm, "");
}

const PUBLIC_ROUTES = [
  { loc: "/", changefreq: "daily", priority: "1.0" },
  { loc: "/shop", changefreq: "daily", priority: "0.9" },
  { loc: "/about", changefreq: "monthly", priority: "0.7" },
  { loc: "/privacy", changefreq: "yearly", priority: "0.3" },
  { loc: "/terms", changefreq: "yearly", priority: "0.3" },
];

function writeSitemap() {
  const urls = PUBLIC_ROUTES.map(
    (route) =>
      `  <url><loc>${SITE_URL}${route.loc}</loc><changefreq>${route.changefreq}</changefreq><priority>${route.priority}</priority></url>`
  ).join("\n");
  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`;
  fs.writeFileSync(path.join(dist, "sitemap.xml"), xml);
  console.log("[post-export-web] wrote dist/sitemap.xml");
}

function copyRobotsTxt() {
  const src = path.join(__dirname, "..", "public", "robots.txt");
  const dest = path.join(dist, "robots.txt");
  if (fs.existsSync(src)) {
    fs.copyFileSync(src, dest);
    console.log("[post-export-web] copied public/robots.txt");
  } else {
    fs.writeFileSync(
      dest,
      `User-agent: *\nAllow: /\nSitemap: ${SITE_URL}/sitemap.xml\n`
    );
    console.log("[post-export-web] wrote dist/robots.txt");
  }
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

stripSourceMaps(dist);

if (fs.existsSync(indexHtml)) {
  let html = fs.readFileSync(indexHtml, "utf8");
  html = stripSourceMapComments(html);

  // Remove render-blocking Leaflet CSS from home (maps lazy-load their own chunk).
  html = html.replace(/<link[^>]+leaflet[^>]*>\s*/gi, "");

  const headInject = [
    '<meta name="description" content="Zeevan — premium A2 bilona ghee, cold-pressed oils, masala &amp; Haldar honey. Shop artisan pantry staples with live delivery tracking." />',
    '<meta name="robots" content="index, follow, max-image-preview:large" />',
    '<meta name="theme-color" content="#FAF8F4" />',
    '<meta name="color-scheme" content="light dark" />',
    '<meta property="og:site_name" content="Zeevan" />',
    '<meta property="og:type" content="website" />',
    '<meta property="og:locale" content="en_IN" />',
    '<meta property="og:title" content="Zeevan — Premium A2 Ghee &amp; Artisan Pantry" />',
    '<meta property="og:description" content="Premium A2 ghee, tel, masala &amp; honey — delivered fresh to your door." />',
    '<meta property="og:url" content="' + SITE_URL + '/" />',
    '<meta name="twitter:card" content="summary_large_image" />',
    '<meta name="twitter:title" content="Zeevan — Premium A2 Ghee &amp; Artisan Pantry" />',
    '<link rel="canonical" href="' + SITE_URL + '/" />',
  ];

  headInject.forEach((tag) => {
    const name = tag.match(/name="([^"]+)"/)?.[1];
    const prop = tag.match(/property="([^"]+)"/)?.[1];
    const rel = tag.match(/rel="([^"]+)"/)?.[1];
    if (name && html.includes(`name="${name}"`)) return;
    if (prop && html.includes(`property="${prop}"`)) return;
    if (rel && html.includes(`rel="${rel}"`)) return;
    html = html.replace("</head>", `  ${tag}\n</head>`);
  });

  const heroCandidates = walkFiles(path.join(dist, "assets"), (name) =>
    (name.includes("zeevan-ghee-packaging-portrait") ||
      name.includes("zeevan-hero-web-21x9")) &&
    name.endsWith(".webp") &&
    (name.includes("-web-720.") || name.includes("-web-960.") || name.includes("-web-840.") || name.includes("-web-1200."))
  );
  const portraitHero = heroCandidates
    .filter((p) => p.includes("packaging-portrait"))
    .sort((a, b) => a.length - b.length)[0];
  const wideHero = heroCandidates
    .filter((p) => p.includes("hero-web-21x9"))
    .sort((a, b) => a.length - b.length)[0];
  const portraitHref = portraitHero ? toPublicAssetPath(dist, portraitHero) : "";
  const wideHref = wideHero ? toPublicAssetPath(dist, wideHero) : "";

  const earlyHead = [
    portraitHref
      ? `<link rel="preload" as="image" type="image/webp" href="${portraitHref}" fetchpriority="high" media="(max-width: 900px)" imagesizes="100vw" />`
      : "",
    wideHref
      ? `<link rel="preload" as="image" type="image/webp" href="${wideHref}" fetchpriority="high" media="(min-width: 901px)" imagesizes="100vw" />`
      : "",
  ];
  html = injectAfterViewport(html, earlyHead);

  const preloadTags = [];
  if (portraitHref) {
    preloadTags.push(
      `<link rel="preload" as="image" href="${portraitHref}" fetchpriority="high" media="(max-width: 900px)" />`
    );
  }
  if (wideHref) {
    preloadTags.push(
      `<link rel="preload" as="image" href="${wideHref}" fetchpriority="high" media="(min-width: 901px)" />`
    );
  }
  if (!preloadTags.length && heroCandidates.length) {
    preloadTags.push(
      `<link rel="preload" as="image" href="${toPublicAssetPath(dist, heroCandidates[0])}" fetchpriority="high" />`
    );
  }

  const ogImageHref = wideHref || portraitHref || "";
  if (ogImageHref && !html.includes('property="og:image"')) {
    const ogTags = [
      `<meta property="og:image" content="${SITE_URL}${ogImageHref}" />`,
      `<meta name="twitter:image" content="${SITE_URL}${ogImageHref}" />`,
    ];
    ogTags.forEach((tag) => {
      html = html.replace("</head>", `  ${tag}\n</head>`);
    });
  }

  preloadTags.forEach((tag) => {
    const href = tag.match(/href="([^"]+)"/)?.[1];
    if (href && !html.includes(`href="${href}"`)) {
      html = html.replace("</head>", `  ${tag}\n</head>`);
      console.log("[post-export-web] injected LCP hero preload:", href);
    }
  });

  if (portraitHref || wideHref) {
    const shellStyle = `<style id="kankreg-lcp-shell-style">#kankreg-lcp-shell-wrap{position:fixed;inset:0;z-index:9999;pointer-events:none;background:#FAF8F4;font-family:system-ui,-apple-system,sans-serif}#kankreg-lcp-shell{width:100%;height:100dvh;object-fit:contain;object-position:center top;display:block;pointer-events:none}</style>`;
    const portraitDims =
      portraitHref ? ` width="${LCP_PORTRAIT_WIDTH}" height="${LCP_PORTRAIT_HEIGHT}"` : "";
    const wideDims = wideHref ? ` width="${LCP_WIDE_WIDTH}" height="${LCP_WIDE_HEIGHT}"` : "";
    const shellPicture = [
      '<picture id="kankreg-lcp-shell-wrap">',
      portraitHref
        ? `  <source media="(max-width: 900px)" srcset="${portraitHref}" type="image/webp" />`
        : "",
      `  <img id="kankreg-lcp-shell" src="${wideHref || portraitHref}" alt="Zeevan premium A2 ghee"${wideHref ? wideDims : portraitDims} decoding="sync" fetchpriority="high" sizes="100vw" />`,
      "</picture>",
    ]
      .filter(Boolean)
      .join("\n");
    if (!html.includes("kankreg-lcp-shell")) {
      html = html.replace(/<body([^>]*)>/, `<body$1>\n${shellStyle}\n${shellPicture}`);
      console.log("[post-export-web] injected LCP shell");
    }
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

writeSitemap();
copyRobotsTxt();
