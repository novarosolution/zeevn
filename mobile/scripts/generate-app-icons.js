/**
 * Build Zeevan launcher icons from `src/theme/zeevanMark.json` (same emblem as splash / BootSplash).
 * Replaces legacy Kankreg K+cow sources. Run: `npm run icons:generate`
 */
/* global __dirname, Buffer */
const fs = require("fs");
const path = require("path");
const sharp = require("sharp");
const mark = require("../src/theme/zeevanMark.json");

const root = path.join(__dirname, "..");
const assetsDir = path.join(root, "assets");
const iosAssets = path.join(root, "ios/KankreG/Images.xcassets");
const androidRes = path.join(root, "android/app/src/main/res");

const SIZE = 1024;
/** Safe inset so the mark sits inside Android adaptive / iOS mask. */
const PAD = 0.22;

const BACKGROUNDS = {
  light: { r: 255, g: 255, b: 255, alpha: 1 },
  dark: { r: 26, g: 23, b: 20, alpha: 1 },
};

const DENSITIES = {
  mdpi: 48,
  hdpi: 72,
  xhdpi: 96,
  xxhdpi: 144,
  xxxhdpi: 192,
};

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

function emblemSvg(mode, px, { pad = PAD, transparent = false } = {}) {
  const p = mark.palette[mode];
  const m = mark.margin;
  const span = mark.box + m * 2;
  const stops = (a, b, c) =>
    `<stop offset="0" stop-color="${a}"/><stop offset="0.5" stop-color="${b}"/><stop offset="1" stop-color="${c}"/>`;
  const { gold, leaf } = mark.gradients;
  const halo = mark.halo;
  const inset = span * pad;
  const view = `${-m - inset} ${-m - inset} ${span + inset * 2} ${span + inset * 2}`;
  const bg = transparent
    ? ""
    : mode === "dark"
      ? `<rect x="${-m - inset}" y="${-m - inset}" width="${span + inset * 2}" height="${span + inset * 2}" fill="#1A1714"/>`
      : `<rect x="${-m - inset}" y="${-m - inset}" width="${span + inset * 2}" height="${span + inset * 2}" fill="#FFFFFF"/>`;
  return `<svg width="${px}" height="${px}" viewBox="${view}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="gold" gradientUnits="userSpaceOnUse" x1="${gold.from[0]}" y1="${gold.from[1]}" x2="${gold.to[0]}" y2="${gold.to[1]}">${stops(p.top, p.mid, p.bot)}</linearGradient>
    <linearGradient id="leaf" gradientUnits="userSpaceOnUse" x1="${leaf.from[0]}" y1="${leaf.from[1]}" x2="${leaf.to[0]}" y2="${leaf.to[1]}">${stops(p.top, p.mid, p.bot)}</linearGradient>
    <radialGradient id="halo" gradientUnits="userSpaceOnUse" cx="${halo.cx}" cy="${halo.cy}" r="${halo.r}">
      <stop offset="0" stop-color="${p.mid}" stop-opacity="${halo.opacity[mode]}"/>
      <stop offset="1" stop-color="${p.mid}" stop-opacity="0"/>
    </radialGradient>
  </defs>
  ${bg}
  <circle cx="${halo.cx}" cy="${halo.cy}" r="${halo.r}" fill="url(#halo)"/>
  ${mark.layers.map(layerSvg).join("\n  ")}
</svg>`;
}

async function renderPng(mode, px, file, opts) {
  const render = Math.max(px, 1024) * 2;
  const svg = emblemSvg(mode, render, opts);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  await sharp(Buffer.from(svg)).resize(px, px, { kernel: "lanczos3" }).png({ compressionLevel: 9 }).toFile(file);
  console.log("Wrote", path.relative(root, file));
}

async function writeIosIcon(setName, filename, srcPath) {
  const dir = path.join(iosAssets, setName);
  fs.mkdirSync(dir, { recursive: true });
  const dest = path.join(dir, filename);
  await sharp(srcPath).resize(SIZE, SIZE).png().toFile(dest);
  console.log("Wrote", path.relative(root, dest));
}

async function writeAndroidLaunchers(fullIconPath, foregroundPath) {
  for (const [density, px] of Object.entries(DENSITIES)) {
    const dir = path.join(androidRes, `mipmap-${density}`);
    fs.mkdirSync(dir, { recursive: true });
    const full = await sharp(fullIconPath).resize(px, px).png().toBuffer();
    const fg = await sharp(foregroundPath).resize(px, px).png().toBuffer();
    await sharp(full).webp({ quality: 92 }).toFile(path.join(dir, "ic_launcher.webp"));
    await sharp(full).webp({ quality: 92 }).toFile(path.join(dir, "ic_launcher_round.webp"));
    await sharp(fg).webp({ quality: 92 }).toFile(path.join(dir, "ic_launcher_foreground.webp"));
    console.log("Wrote", `mipmap-${density}/ic_launcher*.webp`);
  }
}

async function main() {
  const lightPath = path.join(assetsDir, "app-icon-light.png");
  const darkPath = path.join(assetsDir, "app-icon-dark.png");
  const splashIcon = path.join(assetsDir, "splash-icon.png");
  const adaptive = path.join(assetsDir, "adaptive-icon.png");
  const icon = path.join(assetsDir, "icon.png");
  const favicon = path.join(assetsDir, "favicon.png");
  const fgLight = path.join(assetsDir, "app-icon-foreground-light.png");

  const zSource = path.join(assetsDir, "app-icon-z-source.png");
  if (fs.existsSync(zSource)) {
    await sharp(zSource).resize(SIZE, SIZE).png({ compressionLevel: 9 }).toFile(lightPath);
    const lightRaw = await sharp(lightPath).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
    const darkPx = Buffer.from(lightRaw.data);
    const fgPx = Buffer.from(lightRaw.data);
    for (let i = 0; i < darkPx.length; i += 4) {
      const r = darkPx[i];
      const g = darkPx[i + 1];
      const b = darkPx[i + 2];
      const max = Math.max(r, g, b);
      const min = Math.min(r, g, b);
      if (min > 200 && max - min < 60) {
        darkPx[i] = 26;
        darkPx[i + 1] = 23;
        darkPx[i + 2] = 20;
        darkPx[i + 3] = 255;
        fgPx[i + 3] = 0;
      }
    }
    await sharp(darkPx, { raw: lightRaw.info }).png({ compressionLevel: 9 }).toFile(darkPath);
    await sharp(fgPx, { raw: lightRaw.info }).png({ compressionLevel: 9 }).toFile(fgLight);
  } else {
    await renderPng("light", SIZE, lightPath, { pad: PAD });
    await renderPng("dark", SIZE, darkPath, { pad: PAD });
    await renderPng("light", SIZE, fgLight, { pad: 0.28, transparent: true });
  }
  await sharp(lightPath).png().toFile(splashIcon);
  await sharp(lightPath).png().toFile(adaptive);
  await sharp(lightPath).png().toFile(icon);
  await sharp(lightPath).resize(192, 192).png().toFile(favicon);
  console.log("Wrote splash-icon.png, adaptive-icon.png, icon.png, favicon.png");

  await writeIosIcon("AppIcon.appiconset", "App-Icon-1024x1024@1x.png", lightPath);
  await writeIosIcon("AppIcon-light.appiconset", "AppIcon-light-light-1024x1024@1x.png", lightPath);
  await writeIosIcon("AppIcon-dark.appiconset", "AppIcon-dark-light-1024x1024@1x.png", darkPath);

  await writeAndroidLaunchers(lightPath, fgLight);

  const colorsPath = path.join(androidRes, "values/colors.xml");
  if (fs.existsSync(colorsPath)) {
    let colors = fs.readFileSync(colorsPath, "utf8");
    colors = colors.replace(/#FFFCF8|#F7F2E8/g, (hex) => (hex === "#F7F2E8" ? "#FFFFFF" : "#FFFFFF"));
    colors = colors
      .replace(/<color name="iconBackground">[^<]+<\/color>/, '<color name="iconBackground">#FBF6EC</color>')
      .replace(/<color name="splashscreen_background">[^<]+<\/color>/, '<color name="splashscreen_background">#FBF6EC</color>');
    fs.writeFileSync(colorsPath, colors);
    console.log("Wrote", path.relative(root, colorsPath));
  }

  console.log("Done — Zeevan launcher icons installed.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
