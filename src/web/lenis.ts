import Lenis from "@studio-freight/lenis";
import { setScrollY } from "../hooks/useScrollY";

type LenisHandle = {
  destroy: () => void;
};

let singletonHandle: LenisHandle | null = null;

function easing(t: number) {
  return 1 - Math.pow(1 - t, 3);
}

export function initLenis() {
  if (typeof window === "undefined") {
    return null;
  }
  const ua = String(window.navigator?.userAgent || "");
  if (/Android/i.test(ua)) {
    return null;
  }
  if (window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches) {
    return null;
  }
  if (singletonHandle) return singletonHandle;

  const lenis = new Lenis({
    duration: 1.0,
    smoothWheel: true,
    smoothTouch: false,
    easing,
  });

  let rafId = 0;
  const frame = (time: number) => {
    lenis.raf(time);
    rafId = window.requestAnimationFrame(frame);
  };
  rafId = window.requestAnimationFrame(frame);

  lenis.on("scroll", (event: { animatedScroll?: number; scroll?: number }) => {
    setScrollY(Number(event?.animatedScroll ?? event?.scroll ?? window.scrollY ?? 0));
  });

  setScrollY(window.scrollY || 0);

  singletonHandle = {
    destroy: () => {
      if (rafId) window.cancelAnimationFrame(rafId);
      lenis.destroy();
      singletonHandle = null;
    },
  };

  return singletonHandle;
}

