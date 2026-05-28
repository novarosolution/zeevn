let gsapPromise;

function afterFirstPaint() {
  return new Promise((resolve) => {
    if (typeof window === "undefined") {
      resolve();
      return;
    }
    const schedule = window.requestIdleCallback
      ? () => window.requestIdleCallback(() => resolve(), { timeout: 1200 })
      : () => window.setTimeout(resolve, 0);
    schedule();
  });
}

/** Load GSAP on-demand so home first paint isn't blocked by animation libs. */
export function loadGsap() {
  if (!gsapPromise) {
    gsapPromise = (async () => {
      await afterFirstPaint();
      if (typeof __DEV__ !== "undefined" && __DEV__) {
        const gsapModule = require("gsap");
        const gsap = gsapModule.default || gsapModule;
        const { ScrollTrigger } = require("gsap/ScrollTrigger");
        if (gsap?.registerPlugin && ScrollTrigger) {
          gsap.registerPlugin(ScrollTrigger);
        }
        return gsap || null;
      }
      const [{ default: gsap }, { ScrollTrigger }] = await Promise.all([
        import("gsap"),
        import("gsap/ScrollTrigger"),
      ]);
      if (gsap?.registerPlugin && ScrollTrigger) {
        gsap.registerPlugin(ScrollTrigger);
      }
      return gsap || null;
    })();
  }
  return gsapPromise;
}
