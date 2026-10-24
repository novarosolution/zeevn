/**
 * Native launch-screen images from the 4K gold Z mark — same drawing the boot screen shows.
 * Run: `npm run splash:generate`
 */
/* global __dirname */
const fs = require("fs");
const path = require("path");
const sharp = require("sharp");

const root = path.join(__dirname, "..");
const assetsDir = path.join(root, "assets");
const iosDir = path.join(root, "ios/KankreG/Images.xcassets/SplashScreenLogo.imageset");
const androidRes = path.join(root, "android/app/src/main/res");

const IOS_CANVAS_PT = 240;
const ANDROID_PX = 1024;
const DENSITIES = ["mdpi", "hdpi", "xhdpi", "xxhdpi", "xxxhdpi"];

async function writePng(src, px, file) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  await sharp(src).resize(px, px, { kernel: "lanczos3", fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } }).png({ compressionLevel: 9 }).toFile(file);
  console.log("Wrote", path.relative(root, file));
}

async function main() {
  const mark = path.join(assetsDir, "app-icon-z-mark.png");
  const lightIcon = path.join(assetsDir, "app-icon-light.png");
  const darkIcon = path.join(assetsDir, "app-icon-dark.png");
  const src = fs.existsSync(mark) ? mark : lightIcon;

  await writePng(src, ANDROID_PX, path.join(assetsDir, "splash-mark.png"));
  await writePng(src, ANDROID_PX, path.join(assetsDir, "splash-mark-dark.png"));

  for (const scale of [1, 2, 3]) {
    const suffix = scale === 1 ? "" : `@${scale}x`;
    await writePng(src, IOS_CANVAS_PT * scale, path.join(iosDir, `image${suffix}.png`));
    await writePng(src, IOS_CANVAS_PT * scale, path.join(iosDir, `dark_image${suffix}.png`));
  }

  for (const density of DENSITIES) {
    await writePng(src, ANDROID_PX, path.join(androidRes, `drawable-${density}`, "splashscreen_logo.png"));
    await writePng(src, ANDROID_PX, path.join(androidRes, `drawable-night-${density}`, "splashscreen_logo.png"));
  }

  void darkIcon;
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
