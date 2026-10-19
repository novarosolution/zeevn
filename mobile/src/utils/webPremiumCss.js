import { Platform } from "react-native";
import { WP } from "../theme/webPremium";
import { injectWebCssOnce } from "./injectWebCssOnce";

const CSS_ID = "zeevan-web-premium-v2";

/**
 * Shared interaction CSS for the website Home: button sheen + lift, frosted glass, card/tile hover, hero progress.
 * Components opt in with `className="zv-btn"` / `zv-glass` etc.; motion-safe via prefers-reduced-motion.
 */
export function ensureWebPremiumCss() {
  if (Platform.OS !== "web") return;
  injectWebCssOnce(
    CSS_ID,
    `
.zv-btn {
  position: relative;
  overflow: hidden;
  cursor: pointer;
  transition: transform 0.35s ${WP.ease}, box-shadow 0.35s ${WP.ease}, background-image 0.3s ease, background-color 0.3s ease, border-color 0.3s ease, color 0.3s ease;
}
.zv-btn::after {
  content: "";
  position: absolute;
  top: -10%;
  bottom: -10%;
  left: 0;
  width: 42%;
  background: linear-gradient(105deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.34) 50%, rgba(255,255,255,0) 100%);
  transform: translateX(-160%) skewX(-18deg);
  transition: transform 0.85s ${WP.ease};
  pointer-events: none;
}
.zv-btn:hover { transform: translateY(-2px); }
.zv-btn:hover::after { transform: translateX(420%) skewX(-18deg); }
.zv-btn:active { transform: translateY(0) scale(0.985); }
.zv-btn:focus-visible { outline: 2px solid ${WP.gold.base}; outline-offset: 3px; }

.zv-glass {
  background: rgba(255, 255, 255, 0.22) !important;
  border: 1px solid rgba(255, 255, 255, 0.38);
  box-shadow: 0 8px 28px -14px rgba(14, 16, 10, 0.35), inset 0 1px 0 rgba(255, 255, 255, 0.45);
  -webkit-backdrop-filter: blur(14px) saturate(1.25);
  backdrop-filter: blur(14px) saturate(1.25);
  transition: transform 0.3s ${WP.ease}, background-color 0.25s ease, border-color 0.25s ease, box-shadow 0.3s ease;
}
.zv-glass:hover {
  transform: translateY(-1px);
  background: rgba(255, 255, 255, 0.3) !important;
  border-color: rgba(255, 255, 255, 0.5);
}
.zv-glass-dark {
  background: rgba(14, 16, 10, 0.38) !important;
  border: 1px solid rgba(255, 255, 255, 0.14);
  box-shadow: 0 10px 30px -14px rgba(0, 0, 0, 0.45), inset 0 1px 0 rgba(255, 255, 255, 0.12);
  -webkit-backdrop-filter: blur(16px) saturate(1.2);
  backdrop-filter: blur(16px) saturate(1.2);
}

.zv-chrome-glass {
  background: rgba(250, 246, 236, 0.72) !important;
  -webkit-backdrop-filter: blur(18px) saturate(1.2);
  backdrop-filter: blur(18px) saturate(1.2);
  border-bottom: 1px solid rgba(31, 92, 71, 0.1);
}
.zv-chrome-glass-dark {
  background: rgba(20, 17, 15, 0.72) !important;
  -webkit-backdrop-filter: blur(18px) saturate(1.15);
  backdrop-filter: blur(18px) saturate(1.15);
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
}

.zv-tile { transition: transform 0.5s ${WP.ease}, box-shadow 0.5s ease, border-color 0.3s ease; }
.zv-tile:hover { transform: translateY(-6px); box-shadow: ${WP.shadow.lift}; }
.zv-tile-img { transition: transform 1.2s ${WP.ease}; }
.zv-tile:hover .zv-tile-img { transform: scale(1.08); }
.zv-tile-arrow { transition: transform 0.4s ${WP.ease}, background-color 0.3s ease; }
.zv-tile:hover .zv-tile-arrow { transform: translateX(4px); }

.zv-link { transition: color 0.2s ease, opacity 0.2s ease; cursor: pointer; }
.zv-link:hover { opacity: 0.8; }
.zv-link-arrow { transition: transform 0.35s ${WP.ease}; }
.zv-link:hover .zv-link-arrow { transform: translateX(4px); }

@keyframes zv-hero-fill { from { transform: scaleX(0); } to { transform: scaleX(1); } }
.zv-hero-fill { transform-origin: left center; animation: zv-hero-fill 6.5s linear forwards; }
.zv-hero-fill[data-paused="1"] { animation-play-state: paused; }

@media (prefers-reduced-motion: reduce) {
  .zv-btn, .zv-btn::after, .zv-glass, .zv-tile, .zv-tile-img, .zv-tile-arrow, .zv-link, .zv-link-arrow { transition: none !important; }
  .zv-btn:hover, .zv-glass:hover, .zv-tile:hover { transform: none; }
  .zv-tile:hover .zv-tile-img { transform: none; }
  .zv-hero-fill { animation: none; transform: scaleX(1); }
}
`
  );
}
