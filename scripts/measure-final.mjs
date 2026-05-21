#!/usr/bin/env node
/**
 * Final perf snapshot: Lighthouse desktop + mobile (home), bundle top chunks.
 * Prereq: dist/ served at LHCI_BASE_URL (default http://127.0.0.1:8080).
 */
import { execSync, spawnSync } from "child_process";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import zlib from "zlib";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const dist = path.join(root, "dist");
const perfDir = path.join(root, "docs", "perf");
const base = (process.env.LHCI_BASE_URL || "http://127.0.0.1:8080").replace(/\/$/, "");
const url = `${base}/`;

function gzipSize(filePath) {
  const buf = fs.readFileSync(filePath);
  return zlib.gzipSync(buf).length;
}

function analyzeBundle() {
  const jsDir = path.join(dist, "_expo", "static", "js", "web");
  if (!fs.existsSync(jsDir)) return { chunks: [], totalGzip: 0 };
  const chunks = fs
    .readdirSync(jsDir)
    .filter((f) => f.endsWith(".js"))
    .map((name) => {
      const fp = path.join(jsDir, name);
      const raw = fs.statSync(fp).size;
      const gzip = gzipSize(fp);
      return { name, raw, gzip };
    })
    .sort((a, b) => b.gzip - a.gzip);
  const totalGzip = chunks.reduce((s, c) => s + c.gzip, 0);
  return { chunks, totalGzip, entry: chunks[0]?.name };
}

function runLighthouse(preset) {
  const out = path.join(perfDir, `lighthouse-final-${preset}.json`);
  const formFactor = preset === "mobile" ? "--form-factor=mobile --screenEmulation.mobile" : "--preset=desktop";
  const puppeteerScript = path.join(root, "scripts", "lhci-puppeteer.js");
  const cmd = `npx lighthouse "${url}" ${formFactor} --quiet --chrome-flags="--headless=new --no-sandbox" --output=json --output-path="${out}" --puppeteer-script="${puppeteerScript}"`;
  try {
    execSync(cmd, { stdio: "inherit", timeout: 180000 });
  } catch {
    /* lighthouse may exit non-zero with warnings */
  }
  if (!fs.existsSync(out)) return null;
  const report = JSON.parse(fs.readFileSync(out, "utf8"));
  const perf = Math.round((report.categories?.performance?.score ?? 0) * 100);
  const a11y = Math.round((report.categories?.accessibility?.score ?? 0) * 100);
  const lcp = report.audits?.["largest-contentful-paint"]?.numericValue;
  const fcp = report.audits?.["first-contentful-paint"]?.numericValue;
  const cls = report.audits?.["cumulative-layout-shift"]?.numericValue;
  const tbt = report.audits?.["total-blocking-time"]?.numericValue;
  return { preset, perf, a11y, lcp, fcp, cls, tbt, reportPath: path.relative(root, out) };
}

function loadPrevious() {
  const p = path.join(perfDir, "summary.json");
  if (!fs.existsSync(p)) return null;
  try {
    return JSON.parse(fs.readFileSync(p, "utf8"));
  } catch {
    return null;
  }
}

async function main() {
  if (!fs.existsSync(path.join(dist, "index.html"))) {
    console.error("[measure-final] dist/ missing — run npm run export:web first");
    process.exit(1);
  }

  fs.mkdirSync(perfDir, { recursive: true });

  console.log("[measure-final] Lighthouse desktop…");
  const desktop = runLighthouse("desktop");
  console.log("[measure-final] Lighthouse mobile…");
  const mobile = runLighthouse("mobile");

  const bundle = analyzeBundle();
  const entryGzip = bundle.chunks[0]?.gzip ?? bundle.totalGzip;
  const previous = loadPrevious();

  const summary = {
    measuredAt: new Date().toISOString(),
    url,
    previous: previous?.after || previous?.before || null,
    lighthouse: { desktop, mobile },
    bundle: {
      totalGzipBytes: bundle.totalGzip,
      entryGzipBytes: entryGzip,
      entryFile: bundle.entry,
      topChunks: bundle.chunks.slice(0, 12).map((c) => ({
        name: c.name,
        gzipKb: Math.round(c.gzip / 1024),
        rawKb: Math.round(c.raw / 1024),
      })),
    },
    targets: {
      mobilePerfMin: 75,
      desktopPerfMin: 85,
    },
    pass: {
      mobilePerf: (mobile?.perf ?? 0) >= 75,
      desktopPerf: (desktop?.perf ?? 0) >= 85,
    },
  };

  const outPath = path.join(perfDir, "final-summary.json");
  fs.writeFileSync(outPath, JSON.stringify(summary, null, 2));

  const top10Path = path.join(perfDir, "top10-final.txt");
  fs.writeFileSync(
    top10Path,
    bundle.chunks
      .slice(0, 10)
      .map((c) => `${c.gzip}\t${c.name}`)
      .join("\n") + "\n"
  );

  console.log("\n=== Final Lighthouse ===");
  if (desktop) console.log(`Desktop perf: ${desktop.perf} (target ≥85) · a11y ${desktop.a11y} · LCP ${Math.round(desktop.lcp)}ms`);
  if (mobile) console.log(`Mobile  perf: ${mobile.perf} (target ≥75) · a11y ${mobile.a11y} · LCP ${Math.round(mobile.lcp)}ms`);
  console.log(`\nBundle gzip entry: ${Math.round(entryGzip / 1024)} KB · all chunks: ${Math.round(bundle.totalGzip / 1024)} KB (${bundle.entry})`);
  console.log(`Written: docs/perf/final-summary.json`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
