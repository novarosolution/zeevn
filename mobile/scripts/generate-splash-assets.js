/**
 * Build the native launch-screen images from the Zeevan emblem (`src/theme/zeevanMark.json`) — the same drawing the
 * animated boot screen uses, so the hand-off from the system splash to the app has no visible seam.
 * Run: `npm run splash:generate`
 *
 * Writes (light + dark, transparent background — the colour comes from the OS splash background):
 *  - assets/splash-mark.png, assets/splash-mark-dark.png      1024², the source `expo-splash-screen` reads on prebuild
 *  - ios/KankreG/Images.xcassets/SplashScreenLogo.imageset     image{,@2x,@3x}.png + dark_image{,@2x,@3x}.png (240 pt canvas)
 *  - android/app/src/main/res/drawable[-night]-*dpi/splashscreen_logo.png   1024²
 */
/* global __dirname, Buffer */
const fs = require("fs");
const path = require("path");
const sharp = require("sharp");
const mark = require("../src/theme/zeevanMark.json");

const root = path.join(__dirname, "..");
const assetsDir = path.join(root, "assets");
const iosDir = path.join(root, "ios/KankreG/Images.xcassets/SplashScreenLogo.imageset");
const androidRes = path.join(root, "android/app/src/main/res");

const IOS_CANVAS_PT = 240;
const ANDROID_PX = 1024;
const DENSITIES = ["mdpi", "hdpi", "xhdpi", "xxhdpi", "xxxhdpi"];

function paint(value) {
  return value === "gold" || value === "leaf" ? `url(#${value})` : value;
}

function layerSvg(layer) {
  const opacity = layer.opacity != null ? ` opacity="${layer.opacity}"` : "";
  const stroke = layer.stroke
    ? ` stroke="${paint(layer.stroke)}" stroke-width="${layer.width}"${layer.cap ? ` stroke-linecap="${layer.cap}"` : ""}`
    : "";
  const fill = layer.fill ? ` fill="${paint(layer.fill)}"` : ' fill="none"';
  if (layer.kind === "circle") {
    return `<circle cx="${layer.cx}" cy="${layer.cy}" r="${layer.r}"${fill}${stroke}${opacity}/>`;
  }
  return `<path d="${layer.d}"${fill}${stroke}${opacity}/>`;
}

function emblemSvg(mode, px) {
  const p = mark.palette[mode];
  const m = mark.margin;
  const span = mark.box + m * 2;
  const stops = (a, b, c) =>
    `<stop offset="0" stop-color="${a}"/><stop offset="0.5" stop-color="${b}"/><stop offset="1" stop-color="${c}"/>`;
  const { gold, leaf } = mark.gradients;
  const halo = mark.halo;
  return `<svg width="${px}" height="${px}" viewBox="${-m} ${-m} ${span} ${span}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="gold" gradientUnits="userSpaceOnUse" x1="${gold.from[0]}" y1="${gold.from[1]}" x2="${gold.to[0]}" y2="${gold.to[1]}">${stops(p.top, p.mid, p.bot)}</linearGradient>
    <linearGradient id="leaf" gradientUnits="userSpaceOnUse" x1="${leaf.from[0]}" y1="${leaf.from[1]}" x2="${leaf.to[0]}" y2="${leaf.to[1]}">${stops(p.top, p.mid, p.bot)}</linearGradient>
    <radialGradient id="halo" gradientUnits="userSpaceOnUse" cx="${halo.cx}" cy="${halo.cy}" r="${halo.r}">
      <stop offset="0" stop-color="${p.mid}" stop-opacity="${halo.opacity[mode]}"/>
      <stop offset="1" stop-color="${p.mid}" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <circle cx="${halo.cx}" cy="${halo.cy}" r="${halo.r}" fill="url(#halo)"/>
  ${mark.layers.map(layerSvg).join("\n  ")}
</svg>`;
}

async function writePng(mode, px, file) {
  // Render large, then downscale — keeps the thin inner ring crisp at 1x.
  const render = Math.max(px, 1024) * 2;
  const svg = emblemSvg(mode, render);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  await sharp(Buffer.from(svg)).resize(px, px, { kernel: "lanczos3" }).png({ compressionLevel: 9 }).toFile(file);
  console.log("Wrote", path.relative(root, file));
}

async function main() {
  for (const mode of ["light", "dark"]) {
    const dark = mode === "dark";
    await writePng(mode, ANDROID_PX, path.join(assetsDir, dark ? "splash-mark-dark.png" : "splash-mark.png"));

    for (const scale of [1, 2, 3]) {
      const name = `${dark ? "dark_" : ""}image${scale === 1 ? "" : `@${scale}x`}.png`;
      await writePng(mode, IOS_CANVAS_PT * scale, path.join(iosDir, name));
    }

    for (const density of DENSITIES) {
      const dir = dark ? `drawable-night-${density}` : `drawable-${density}`;
      await writePng(mode, ANDROID_PX, path.join(androidRes, dir, "splashscreen_logo.png"));
    }
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
