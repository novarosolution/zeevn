#!/usr/bin/env node
/**
 * WCAG AA contrast audit for semantic palette pairs (light + dark).
 * Exit 0 when all required pairs pass; exit 1 on failure.
 */

/** Mirror of src/theme/tokens.js COLORS / COLORS_DARK (no RN import). */
const COLORS = {
  bg: "#FAFAF7",
  surface: "#FFFFFF",
  surfaceAlt: "#F4F2EC",
  bgDeep: "#0E1729",
  ink: "#0E0E0E",
  inkSoft: "#4A4A4A",
  inkMuted: "#757575",
  inkInverse: "#FFFFFF",
  inkInverseSoft: "rgba(255,255,255,0.72)",
  accent: "#C8A97E",
  accentOnLight: "#8A6F45",
  sale: "#B23A3A",
  success: "#2E7D5B",
};

const COLORS_DARK = {
  bg: COLORS.bgDeep,
  surface: "#14203A",
  bgDeep: COLORS.bgDeep,
  ink: COLORS.inkInverse,
  inkSoft: COLORS.inkInverseSoft,
  inkMuted: "rgba(255,255,255,0.58)",
  accent: COLORS.accent,
};

function parseColor(input) {
  const s = String(input || "").trim();
  if (s.startsWith("#")) {
    const hex = s.slice(1);
    const full =
      hex.length === 3
        ? hex
            .split("")
            .map((c) => c + c)
            .join("")
        : hex;
    const n = parseInt(full, 16);
    return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255, a: 1 };
  }
  const rgba = s.match(/^rgba?\(([^)]+)\)$/i);
  if (rgba) {
    const parts = rgba[1].split(",").map((p) => p.trim());
    const r = Number(parts[0]);
    const g = Number(parts[1]);
    const b = Number(parts[2]);
    const a = parts[3] != null ? Number(parts[3]) : 1;
    return { r, g, b, a };
  }
  throw new Error(`Unsupported color: ${s}`);
}

function luminance({ r, g, b }) {
  const srgb = [r, g, b].map((v) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * srgb[0] + 0.7152 * srgb[1] + 0.0722 * srgb[2];
}

function blend(fg, bg) {
  const a = fg.a ?? 1;
  return {
    r: Math.round(fg.r * a + bg.r * (1 - a)),
    g: Math.round(fg.g * a + bg.g * (1 - a)),
    b: Math.round(fg.b * a + bg.b * (1 - a)),
  };
}

function contrastRatio(fg, bg) {
  const fgRgb = fg.a != null && fg.a < 1 ? blend(fg, bg) : fg;
  const l1 = luminance(fgRgb);
  const l2 = luminance(bg);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

function checkPairs(label, palette, pairs) {
  const failures = [];
  for (const { fg, bg, min = 4.5, note } of pairs) {
    const ratio = contrastRatio(parseColor(palette[fg]), parseColor(palette[bg]));
    const ok = ratio >= min;
    const row = { label, pair: `${fg} on ${bg}`, ratio: Number(ratio.toFixed(2)), min, ok, note };
    if (!ok) failures.push(row);
    console.log(`${ok ? "✓" : "✗"} [${label}] ${row.pair}: ${row.ratio}:1 (min ${min})${note ? ` — ${note}` : ""}`);
  }
  return failures;
}

const lightPairs = [
  { fg: "ink", bg: "bg", note: "body on page bg" },
  { fg: "ink", bg: "surface", note: "headings on cards" },
  { fg: "inkSoft", bg: "surface", note: "secondary text" },
  { fg: "inkMuted", bg: "surface", min: 4.5, note: "captions" },
  { fg: "accentOnLight", bg: "surface", note: "brass links" },
  { fg: "inkInverse", bg: "bgDeep", note: "hero inverse text" },
  { fg: "inkInverseSoft", bg: "bgDeep", min: 4.5, note: "hero subline" },
  { fg: "sale", bg: "surface", note: "destructive labels" },
  { fg: "success", bg: "surface", note: "success badges" },
];

const darkPairs = [
  { fg: "ink", bg: "bg", note: "body on dark bg" },
  { fg: "inkSoft", bg: "surface", note: "secondary on dark surface" },
  { fg: "inkMuted", bg: "surface", note: "muted on dark surface" },
  { fg: "accent", bg: "bgDeep", note: "brass on navy" },
];

const failures = [
  ...checkPairs("light", COLORS, lightPairs),
  ...checkPairs("dark", COLORS_DARK, darkPairs),
];

if (failures.length) {
  console.error(`\nContrast audit failed: ${failures.length} pair(s) below threshold.`);
  process.exit(1);
}

console.log("\nContrast audit passed.");
