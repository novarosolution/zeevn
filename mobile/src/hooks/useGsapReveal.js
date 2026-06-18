import { useCallback, useEffect, useRef } from "react";
import { Platform } from "react-native";
import { HOME_SCREEN_UI } from "../content/appContent";
import { getGsap, getScrollTrigger } from "../utils/loadGsap";
import { scheduleScrollTriggerRefresh } from "../utils/scrollTriggerRefresh";

function isWebGsapRevealEnabled() {
  return Platform.OS !== "web" || HOME_SCREEN_UI.web?.enableHomeGsap === true;
}

const PRESETS = {
  "fade-up": {
    from: { y: 28, opacity: 0 },
    to: { y: 0, opacity: 1, duration: 0.58, ease: "power2.out" },
  },
  "fade-in": {
    from: { y: 8, opacity: 0 },
    to: { y: 0, opacity: 1, duration: 0.5, ease: "power2.out" },
  },
  "scale-in": {
    from: { scale: 0.96, y: 18, opacity: 0 },
    to: { scale: 1, y: 0, opacity: 1, duration: 0.6, ease: "power3.out" },
  },
  "slide-right": {
    from: { x: -32, opacity: 0 },
    to: { x: 0, opacity: 1, duration: 0.55, ease: "power2.out" },
  },
};

/** RN Web scrolls inside MotionScrollView — not the window. */
function findScrollParent(element) {
  if (typeof document === "undefined" || !element?.parentElement) return null;
  let parent = element.parentElement;
  while (parent && parent !== document.body && parent !== document.documentElement) {
    const style = getComputedStyle(parent);
    const overflowY = style.overflowY;
    const overflow = style.overflow;
    const scrollable =
      overflowY === "auto" ||
      overflowY === "scroll" ||
      overflow === "auto" ||
      overflow === "scroll";
    if (scrollable && parent.scrollHeight > parent.clientHeight + 1) {
      return parent;
    }
    parent = parent.parentElement;
  }
  return null;
}

function isElementInScrollView(target, scroller) {
  if (!target?.getBoundingClientRect) return false;
  const rect = target.getBoundingClientRect();
  if (scroller?.getBoundingClientRect) {
    const root = scroller.getBoundingClientRect();
    return rect.top < root.bottom && rect.bottom > root.top;
  }
  const vh = globalThis.innerHeight || document.documentElement.clientHeight || 0;
  return rect.top < vh && rect.bottom > 0;
}

/**
 * Web-only ScrollTrigger reveal helper. Returns `{ ref }` to attach to a View.
 * On native it's a no-op so callers can render the View unconditionally.
 */
export default function useGsapReveal({
  preset = "fade-up",
  start = "top 88%",
  end,
  scrub = false,
  toggleActions = "play none none reverse",
  delay = 0,
  disabled = false,
  reducedMotion = false,
  immediate = false,
} = {}) {
  const ref = useRef(null);
  const setRef = useCallback((node) => {
    ref.current = node;
  }, []);

  useEffect(() => {
    if (Platform.OS !== "web" || disabled || reducedMotion || !isWebGsapRevealEnabled()) {
      const target = ref.current;
      if (target && target.style) {
        target.style.opacity = "1";
        target.style.transform = "";
      }
      return undefined;
    }

    const target = ref.current;
    if (!target || typeof Element === "undefined" || !(target instanceof Element)) {
      return undefined;
    }

    let cancelled = false;
    let tween;
    let refreshId;
    let safetyId;

    const settings = PRESETS[preset] || PRESETS["fade-up"];

    (async () => {
      const gsap = await getGsap();
      await getScrollTrigger();
      if (cancelled || !gsap) return;

      gsap.set(target, settings.from);

      const revealNow = () => {
        gsap.to(target, { ...settings.to, delay, overwrite: "auto" });
      };

      if (immediate) {
        revealNow();
        return;
      }

      const scroller = findScrollParent(target);
      tween = gsap.fromTo(target, settings.from, {
        ...settings.to,
        delay,
        scrollTrigger: {
          trigger: target,
          scroller: scroller || undefined,
          start,
          end,
          scrub,
          toggleActions,
          once: true,
        },
      });

      refreshId = requestAnimationFrame(() => {
        scheduleScrollTriggerRefresh();
        if (isElementInScrollView(target, scroller)) {
          const opacity = Number(gsap.getProperty(target, "opacity"));
          if (!Number.isFinite(opacity) || opacity < 0.2) {
            revealNow();
          }
        }
      });

      safetyId = setTimeout(() => {
        const opacity = Number(gsap.getProperty(target, "opacity"));
        if (!Number.isFinite(opacity) || opacity < 0.85) {
          revealNow();
        }
      }, 1800);
    })();

    return () => {
      cancelled = true;
      if (refreshId != null) cancelAnimationFrame(refreshId);
      if (safetyId != null) clearTimeout(safetyId);
      if (tween?.scrollTrigger && typeof tween.scrollTrigger.kill === "function") {
        tween.scrollTrigger.kill();
      }
      tween?.kill?.();
    };
  }, [preset, start, end, scrub, toggleActions, delay, disabled, reducedMotion, immediate]);

  return { ref: setRef };
}
