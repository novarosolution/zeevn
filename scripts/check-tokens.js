#!/usr/bin/env node
/**
 * CI-ready token drift report.
 * Flags hex colors, off-scale spacing in margin/padding, shadowOpacity, and fontWeight.
 *
 * Exit 0 with warnings printed (baseline mode). Set TOKEN_CHECK_STRICT=1 to exit 1 on violations.
 */

const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const SRC = path.join(ROOT, "src");
const STRICT = process.env.TOKEN_CHECK_STRICT === "1";

const SPACING_SCALE = new Set([0, 4, 8, 12, 16, 20, 24, 32, 40, 56, 72, 96]);
const ALLOWED_SHADOW_OPACITY = new Set([0.04, 0.06, 0.1]);
const ALLOWED_SHADOW_RADIUS = new Set([2, 24, 32]);
const ALLOWED_ELEVATION = new Set([1, 4, 8]);
const ALLOWED_FONT_WEIGHTS = new Set(["400", "500", "600", "700"]);
const FONT_WEIGHT_NUMBERS = new Set([400, 500, 600, 700]);
const ALLOWED_BOX_SHADOWS = new Set([
  "0 1px 2px rgba(14,23,41,0.04)",
  "0 8px 24px rgba(14,23,41,0.06)",
  "0 12px 32px rgba(14,23,41,0.10)",
]);

const SCAN_DIRS = [SRC];
const SKIP_DIRS = new Set(["node_modules", "__tests__", "dist", ".expo"]);
const EXT = new Set([".js", ".jsx", ".ts", ".tsx"]);

const SKIP_FILES = new Set([
  path.join(SRC, "theme", "tokens.js"),
  path.join(SRC, "theme", "customerAlchemy.js"),
  path.join(SRC, "styles", "designSystem.js"),
]);

const REQUIRED_PALETTE_HEX = new Set([
  "#FAFAF7",
  "#FFFFFF",
  "#F4F2EC",
  "#0E1729",
  "#14203A",
  "#0E0E0E",
  "#4A4A4A",
  "#5C5C5C",
  "#757575",
  "#E8E6E1",
  "#C8A97E",
  "#8A6F45",
  "#B23A3A",
  "#2E7D5B",
  "#B17B27",
]);

const REQUIRED_PALETTE_RGBA = new Set([
  "rgba(255,255,255,0.72)",
  "rgba(255,255,255,0.46)",
  "rgba(14,23,41,0.06)",
  "rgba(255,255,255,0.08)",
  "rgba(200,169,126,0.16)",
]);

const MARGIN_PADDING_PROPS = [
  "margin",
  "marginTop",
  "marginRight",
  "marginBottom",
  "marginLeft",
  "marginHorizontal",
  "marginVertical",
  "padding",
  "paddingTop",
  "paddingRight",
  "paddingBottom",
  "paddingLeft",
  "paddingHorizontal",
  "paddingVertical",
  "gap",
  "rowGap",
  "columnGap",
];

function getAllowedPalette() {
  return {
    hex: REQUIRED_PALETTE_HEX,
    rgba: REQUIRED_PALETTE_RGBA,
  };
}

function walk(dir, files = []) {
  if (!fs.existsSync(dir)) return files;
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    if (SKIP_DIRS.has(ent.name)) continue;
    const full = path.join(dir, ent.name);
    if (ent.isDirectory()) walk(full, files);
    else if (EXT.has(path.extname(ent.name))) files.push(full);
  }
  return files;
}

function lineOf(content, index) {
  return content.slice(0, index).split("\n").length;
}

function normalizeHex(h) {
  const u = h.toUpperCase();
  if (u.length === 4) {
    return `#${u[1]}${u[1]}${u[2]}${u[2]}${u[3]}${u[3]}`;
  }
  return u;
}

function checkHex(content, file, palette, violations) {
  const hexRe = /#[0-9A-Fa-f]{3,8}\b/g;
  let m;
  while ((m = hexRe.exec(content)) !== null) {
    const raw = m[0];
    const norm = normalizeHex(raw);
    if (palette.hex.has(norm) || palette.hex.has(raw.toUpperCase())) continue;
    violations.push({
      type: "hex",
      file,
      line: lineOf(content, m.index),
      value: raw,
      message: `Off-palette hex ${raw}`,
    });
  }
}

function checkRgba(content, file, palette, violations) {
  const rgbaRe = /rgba?\(\s*\d+[^)]*\)/gi;
  let m;
  while ((m = rgbaRe.exec(content)) !== null) {
    const compact = m[0].replace(/\s+/g, "");
    if (palette.rgba.has(compact)) continue;
    violations.push({
      type: "rgba",
      file,
      line: lineOf(content, m.index),
      value: m[0],
      message: `Off-palette rgba ${m[0].slice(0, 48)}`,
    });
  }
}

function extractNumeric(val) {
  if (typeof val === "number") return val;
  const s = String(val).trim();
  if (/^\d+(\.\d+)?$/.test(s)) return Number(s);
  return null;
}

function checkSpacingProps(content, file, violations) {
  for (const prop of MARGIN_PADDING_PROPS) {
    const re = new RegExp(
      `${prop}\\s*:\\s*([^,\\n}]+)`,
      "g"
    );
    let m;
    while ((m = re.exec(content)) !== null) {
      const raw = m[1].trim();
      if (
        raw.includes("SPACING") ||
        raw.includes("spacing.") ||
        raw.includes("S.") ||
        raw.includes("StyleSheet.hairline") ||
        raw.includes("hairlineWidth") ||
        raw.includes("%") ||
        raw.includes("inset") ||
        raw.includes("safeArea") ||
        raw.includes("Platform.") ||
        raw.includes("?") ||
        raw.includes("get") ||
        raw.includes("token") ||
        raw.includes("semantic") ||
        raw.includes("layout") ||
        raw.includes("icon.") ||
        raw.includes("TYPE.") ||
        raw.includes("RADII") ||
        raw.includes("radius")
      ) {
        continue;
      }

      const parts = raw.split(/[+\-*/]/).map((p) => p.trim());
      for (const part of parts) {
        const n = extractNumeric(part);
        if (n == null) continue;
        if (!SPACING_SCALE.has(n)) {
          violations.push({
            type: "spacing",
            file,
            line: lineOf(content, m.index),
            value: `${prop}: ${raw}`,
            message: `Off-scale spacing ${prop}=${raw} (allowed: ${[...SPACING_SCALE].join(", ")})`,
          });
        }
      }
    }
  }
}

function checkShadowOpacity(content, file, violations) {
  const re = /shadowOpacity\s*:\s*([0-9.]+)/g;
  let m;
  while ((m = re.exec(content)) !== null) {
    const v = parseFloat(m[1]);
    const rounded = Math.round(v * 100) / 100;
    if (!ALLOWED_SHADOW_OPACITY.has(rounded) && !ALLOWED_SHADOW_OPACITY.has(v)) {
      violations.push({
        type: "shadowOpacity",
        file,
        line: lineOf(content, m.index),
        value: m[1],
        message: `shadowOpacity ${m[1]} not in {0.04, 0.06, 0.10} (+ legacy theme helpers)`,
      });
    }
  }
}

function checkShadowValues(content, file, violations) {
  const boxShadowRe = /boxShadow\s*:\s*["']([^"']+)["']/g;
  let m;
  while ((m = boxShadowRe.exec(content)) !== null) {
    const compact = m[1].replace(/\s+/g, " ").trim();
    if (compact === "none") continue;
    if (ALLOWED_BOX_SHADOWS.has(compact)) continue;
    if (
      compact.includes("SHADOWS.") ||
      compact.includes("getShadow") ||
      compact.includes("shadow")
    ) {
      continue;
    }
    violations.push({
      type: "boxShadow",
      file,
      line: lineOf(content, m.index),
      value: m[1],
      message: `boxShadow "${m[1]}" not from SHADOWS`,
    });
  }

  const shadowRadiusRe = /shadowRadius\s*:\s*([0-9.]+)/g;
  while ((m = shadowRadiusRe.exec(content)) !== null) {
    const v = Number(m[1]);
    if (ALLOWED_SHADOW_RADIUS.has(v)) continue;
    violations.push({
      type: "shadowRadius",
      file,
      line: lineOf(content, m.index),
      value: m[1],
      message: `shadowRadius ${m[1]} not from SHADOWS`,
    });
  }

  const elevationRe = /elevation\s*:\s*([0-9.]+)/g;
  while ((m = elevationRe.exec(content)) !== null) {
    const v = Number(m[1]);
    if (ALLOWED_ELEVATION.has(v)) continue;
    violations.push({
      type: "elevation",
      file,
      line: lineOf(content, m.index),
      value: m[1],
      message: `elevation ${m[1]} not from SHADOWS`,
    });
  }
}

function checkFontWeight(content, file, violations) {
  const re = /fontWeight\s*:\s*['"]?(\w+|\d+)['"]?/g;
  let m;
  while ((m = re.exec(content)) !== null) {
    const v = m[1];
    if (ALLOWED_FONT_WEIGHTS.has(v)) continue;
    const n = Number(v);
    if (!Number.isNaN(n) && FONT_WEIGHT_NUMBERS.has(n)) continue;
    violations.push({
      type: "fontWeight",
      file,
      line: lineOf(content, m.index),
      value: v,
      message: `fontWeight "${v}" not in 400/500/600/700`,
    });
  }
}

function rel(file) {
  return path.relative(ROOT, file);
}

function main() {
  const palette = getAllowedPalette();
  const files = SCAN_DIRS.flatMap((d) => walk(d));
  const violations = [];

  for (const file of files) {
    if (SKIP_FILES.has(file)) continue;
    const content = fs.readFileSync(file, "utf8");
    checkHex(content, file, palette, violations);
    checkRgba(content, file, palette, violations);
    checkSpacingProps(content, file, violations);
    checkShadowOpacity(content, file, violations);
    checkShadowValues(content, file, violations);
    checkFontWeight(content, file, violations);
  }

  const byType = {};
  for (const v of violations) {
    byType[v.type] = (byType[v.type] || 0) + 1;
  }

  const ts = new Date().toISOString();
  console.log("═".repeat(60));
  console.log("  Zeevan token check — baseline report");
  console.log(`  ${ts}`);
  console.log(`  Scanned ${files.length} files under src/`);
  console.log(`  Palette: ${palette.hex.size} hex + ${palette.rgba.size} rgba (locked)`);
  console.log("═".repeat(60));

  if (violations.length === 0) {
    console.log("\n✓ No violations detected.\n");
    process.exit(0);
  }

  const grouped = {};
  for (const v of violations) {
    if (!grouped[v.type]) grouped[v.type] = [];
    grouped[v.type].push(v);
  }

  console.log(`\n⚠ Total violations: ${violations.length}\n`);
  for (const [type, count] of Object.entries(byType).sort((a, b) => b[1] - a[1])) {
    console.log(`  ${type}: ${count}`);
  }
  console.log("");

  const SAMPLE_PER_TYPE = 8;
  for (const type of Object.keys(grouped).sort()) {
    console.log(`── ${type} (${grouped[type].length}) ──`);
    const sample = grouped[type].slice(0, SAMPLE_PER_TYPE);
    for (const v of sample) {
      console.log(`  ${rel(v.file)}:${v.line}  ${v.message}`);
    }
    if (grouped[type].length > SAMPLE_PER_TYPE) {
      console.log(`  … and ${grouped[type].length - SAMPLE_PER_TYPE} more`);
    }
    console.log("");
  }

  const baselinePath = path.join(ROOT, "docs", "token-violations-baseline.txt");
  const baselineBody = violations
    .map((v) => `${rel(v.file)}:${v.line} [${v.type}] ${v.message}`)
    .join("\n");
  fs.mkdirSync(path.dirname(baselinePath), { recursive: true });
  fs.writeFileSync(
    baselinePath,
    [
      "Zeevan token baseline violations",
      `Generated: ${ts}`,
      `Total: ${violations.length}`,
      "",
      baselineBody,
      "",
    ].join("\n"),
    "utf8"
  );

  console.log(`Baseline report written: ${rel(baselinePath)}`);
  console.log("Fix gradually: use useTheme() → { c, S, R, SH, T } and theme/tokens.js.");
  console.log("Set TOKEN_CHECK_STRICT=1 to fail CI when ready.\n");

  process.exit(STRICT ? 1 : 0);
}

main();
