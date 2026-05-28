/**
 * Copies Inter + Playfair TTF from @expo-google-fonts into public/fonts,
 * then emits matching WOFF2 for web preload / @font-face (ttf2woff2).
 */
const fs = require("fs");
const path = require("path");
const ttf2woff2 = require("ttf2woff2").default;

const root = path.join(__dirname, "..");
const outDir = path.join(root, "public", "fonts");

const FONT_FILES = [
  ["@expo-google-fonts/inter/400Regular/Inter_400Regular.ttf", "Inter-400"],
  ["@expo-google-fonts/inter/500Medium/Inter_500Medium.ttf", "Inter-500"],
  ["@expo-google-fonts/inter/600SemiBold/Inter_600SemiBold.ttf", "Inter-600"],
  ["@expo-google-fonts/inter/700Bold/Inter_700Bold.ttf", "Inter-700"],
  ["@expo-google-fonts/inter/800ExtraBold/Inter_800ExtraBold.ttf", "Inter-800"],
  [
    "@expo-google-fonts/playfair-display/600SemiBold/PlayfairDisplay_600SemiBold.ttf",
    "PlayfairDisplay-600",
  ],
  [
    "@expo-google-fonts/playfair-display/700Bold/PlayfairDisplay_700Bold.ttf",
    "PlayfairDisplay-700",
  ],
  [
    "@expo-google-fonts/playfair-display/400Regular_Italic/PlayfairDisplay_400Regular_Italic.ttf",
    "PlayfairDisplay-400Italic",
  ],
];

function writeWoff2(ttfPath, woff2Path) {
  const input = fs.readFileSync(ttfPath);
  const output = ttf2woff2(input);
  fs.writeFileSync(woff2Path, output);
}

function main() {
  fs.mkdirSync(outDir, { recursive: true });
  for (const [pkgPath, baseName] of FONT_FILES) {
    const src = path.join(root, "node_modules", pkgPath);
    if (!fs.existsSync(src)) {
      console.warn("[copy-fonts] missing", pkgPath);
      continue;
    }
    const ttfDest = path.join(outDir, `${baseName}.ttf`);
    const woff2Dest = path.join(outDir, `${baseName}.woff2`);
    fs.copyFileSync(src, ttfDest);
    writeWoff2(src, woff2Dest);
    const woff2Size = fs.statSync(woff2Dest).size;
    if (!woff2Size) {
      throw new Error(`[copy-fonts] empty woff2 for ${baseName}`);
    }
    console.log("[copy-fonts]", `${baseName}.ttf`, `${baseName}.woff2 (${woff2Size} bytes)`);
  }
}

main();
