/**
 * Copies Inter + Playfair woff2 from @expo-google-fonts into public/fonts for self-host + preload.
 */
const fs = require("fs");
const path = require("path");

const root = path.join(__dirname, "..");
const outDir = path.join(root, "public", "fonts");

const FONT_FILES = [
  ["@expo-google-fonts/inter/400Regular/Inter_400Regular.ttf", "Inter-400.ttf"],
  ["@expo-google-fonts/inter/500Medium/Inter_500Medium.ttf", "Inter-500.ttf"],
  ["@expo-google-fonts/inter/600SemiBold/Inter_600SemiBold.ttf", "Inter-600.ttf"],
  ["@expo-google-fonts/inter/700Bold/Inter_700Bold.ttf", "Inter-700.ttf"],
  ["@expo-google-fonts/inter/800ExtraBold/Inter_800ExtraBold.ttf", "Inter-800.ttf"],
  ["@expo-google-fonts/playfair-display/600SemiBold/PlayfairDisplay_600SemiBold.ttf", "PlayfairDisplay-600.ttf"],
  ["@expo-google-fonts/playfair-display/700Bold/PlayfairDisplay_700Bold.ttf", "PlayfairDisplay-700.ttf"],
  [
    "@expo-google-fonts/playfair-display/400Regular_Italic/PlayfairDisplay_400Regular_Italic.ttf",
    "PlayfairDisplay-400Italic.ttf",
  ],
];

function main() {
  fs.mkdirSync(outDir, { recursive: true });
  for (const [pkgPath, outName] of FONT_FILES) {
    const src = path.join(root, "node_modules", pkgPath);
    if (!fs.existsSync(src)) {
      console.warn("[copy-fonts] missing", pkgPath);
      continue;
    }
    const dest = path.join(outDir, outName);
    fs.copyFileSync(src, dest);
    console.log("[copy-fonts]", outName);
  }
}

main();
