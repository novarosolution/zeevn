/** Intrinsic dimensions of the shared marketing hero (1023×1537 source). */
export const HERO_INTRINSIC_WIDTH = 1023;
export const HERO_INTRINSIC_HEIGHT = 1537;
export const HERO_ASPECT_RATIO = HERO_INTRINSIC_HEIGHT / HERO_INTRINSIC_WIDTH;

/** Public URLs after `expo export` / dev server (served from /public). */
export const HERO_LCP_SRC = "/assets/hero/hero-lcp.webp";
export const HERO_SRCSET = [
  "/assets/hero/hero-640.webp 640w",
  "/assets/hero/hero-960.webp 960w",
  "/assets/hero/hero-1280.webp 1280w",
  "/assets/hero/hero-1920.webp 1920w",
].join(", ");
