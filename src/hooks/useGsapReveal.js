import { useCallback, useEffect, useRef } from "react";
import { Platform } from "react-native";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

const PRESETS = {
  "fade-up": {
    from: { y: 28 },
    to: { y: 0, duration: 0.58, ease: "power2.out" },
  },
  "fade-in": {
    from: { y: 8 },
    to: { y: 0, duration: 0.5, ease: "power2.out" },
  },
  "scale-in": {
    from: { scale: 0.96, y: 18 },
    to: { scale: 1, y: 0, duration: 0.6, ease: "power3.out" },
  },
  "slide-right": {
    from: { x: -24 },
    to: { x: 0, duration: 0.5, ease: "power2.out" },
  },
};

if (Platform.OS === "web") {
  gsap.registerPlugin(ScrollTrigger);
}

/**
 * Web-only ScrollTrigger reveal helper. Returns `{ ref }` to attach to a View.
 * On native it's a no-op so callers can render the View unconditionally.
 *
 *   const { ref } = useGsapReveal({ preset: "fade-up", start: "top 88%" });
 *   <View ref={ref} ... />
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
} = {}) {
  const ref = useRef(null);
  const setRef = useCallback((node) => {
    ref.current = node;
  }, []);

  useEffect(() => {
    if (Platform.OS !== "web" || disabled || reducedMotion) {
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

    const settings = PRESETS[preset] || PRESETS["fade-up"];
    if (target.style) {
      target.style.opacity = "1";
      target.style.transform = "";
    }
    const tween = gsap.fromTo(target, settings.from, {
      ...settings.to,
      delay,
      scrollTrigger: {
        trigger: target,
        start,
        end,
        scrub,
        toggleActions,
      },
    });

    return () => {
      if (tween && tween.scrollTrigger && typeof tween.scrollTrigger.kill === "function") {
        tween.scrollTrigger.kill();
      }
      if (typeof tween.kill === "function") {
        tween.kill();
      }
    };
  }, [preset, start, end, scrub, toggleActions, delay, disabled, reducedMotion]);

  return { ref: setRef };
}
