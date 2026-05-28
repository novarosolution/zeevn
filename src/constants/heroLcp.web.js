/** Intrinsic dimensions of the shared marketing hero (1023×1537 source). */
export const HERO_INTRINSIC_WIDTH = 1023;
export const HERO_INTRINSIC_HEIGHT = 1537;
export const HERO_ASPECT_RATIO = HERO_INTRINSIC_HEIGHT / HERO_INTRINSIC_WIDTH;

/** Public URLs after `expo export` / dev server (served from /public). */
const LOCAL_DEV_HOSTS = new Set(["localhost", "127.0.0.1"]);
const isLocalHost =
  typeof window !== "undefined" &&
  typeof window.location?.hostname === "string" &&
  LOCAL_DEV_HOSTS.has(window.location.hostname);

/** Unsplash fallback only in Expo dev — production/static export always uses self-hosted WebP. */
const useDevHeroFallback = typeof __DEV__ !== "undefined" && __DEV__ && isLocalHost;

const DEV_HERO_FALLBACK_SRC =
  "https://images.unsplash.com/photo-1498049794561-7780e7231661?auto=format&fit=crop&w=1920&q=80";

export const HERO_LCP_SRC = useDevHeroFallback ? DEV_HERO_FALLBACK_SRC : "/assets/hero/hero-lcp.webp";
export const HERO_LCP_FALLBACK_SRC = useDevHeroFallback ? DEV_HERO_FALLBACK_SRC : "/assets/hero/hero-lcp.png";
export const HERO_SRCSET = useDevHeroFallback
  ? ""
  : [
      "/assets/hero/hero-640.webp 640w",
      "/assets/hero/hero-960.webp 960w",
      "/assets/hero/hero-1280.webp 1280w",
      "/assets/hero/hero-1920.webp 1920w",
    ].join(", ");
export const HERO_FALLBACK_SRCSET = useDevHeroFallback
  ? ""
  : [
      "/assets/hero/hero-640.png 640w",
      "/assets/hero/hero-960.png 960w",
      "/assets/hero/hero-1280.png 1280w",
      "/assets/hero/hero-1920.png 1920w",
    ].join(", ");
