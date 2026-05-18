import { useCallback, useEffect, useRef, useState } from "react";

export default function useHeroSlider(slides = [], { reducedMotion = false, autoplayMs = 6000 } = {}) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [sliderWidth, setSliderWidth] = useState(0);
  const sliderRef = useRef(null);
  const resumeTimerRef = useRef(null);

  const goTo = useCallback(
    (index, animated = !reducedMotion) => {
      if (!slides.length || sliderWidth <= 0) return;
      const next = Math.max(0, Math.min(index, slides.length - 1));
      sliderRef.current?.scrollTo?.({ x: next * sliderWidth, animated });
      setCurrentIndex(next);
    },
    [reducedMotion, sliderWidth, slides.length]
  );

  const advance = useCallback(() => {
    if (!slides.length) return;
    goTo((currentIndex + 1) % slides.length, true);
  }, [currentIndex, goTo, slides.length]);

  const prev = useCallback(() => {
    if (!slides.length) return;
    goTo((currentIndex - 1 + slides.length) % slides.length, true);
  }, [currentIndex, goTo, slides.length]);

  const next = useCallback(() => {
    advance();
  }, [advance]);

  const onUserInteraction = useCallback((active) => {
    if (resumeTimerRef.current) {
      clearTimeout(resumeTimerRef.current);
      resumeTimerRef.current = null;
    }
    if (active) {
      setPaused(true);
      return;
    }
    resumeTimerRef.current = setTimeout(() => {
      setPaused(false);
      resumeTimerRef.current = null;
    }, 4000);
  }, []);

  const onMomentumScrollEnd = useCallback(
    (event) => {
      const pageWidth = Number(event?.nativeEvent?.layoutMeasurement?.width || sliderWidth || 1);
      const offsetX = Number(event?.nativeEvent?.contentOffset?.x || 0);
      const nextIndex = Math.round(offsetX / pageWidth);
      setCurrentIndex(Math.max(0, Math.min(nextIndex, Math.max(0, slides.length - 1))));
      onUserInteraction(false);
    },
    [onUserInteraction, sliderWidth, slides.length]
  );

  useEffect(() => {
    if (reducedMotion || paused || slides.length < 2 || sliderWidth <= 0) return undefined;
    const timer = setInterval(() => {
      setCurrentIndex((prevIndex) => {
        const nextIndex = (prevIndex + 1) % slides.length;
        sliderRef.current?.scrollTo?.({ x: nextIndex * sliderWidth, animated: true });
        return nextIndex;
      });
    }, autoplayMs);
    return () => clearInterval(timer);
  }, [autoplayMs, paused, reducedMotion, sliderWidth, slides.length]);

  useEffect(
    () => () => {
      if (resumeTimerRef.current) clearTimeout(resumeTimerRef.current);
    },
    []
  );

  return {
    slides,
    currentIndex,
    paused,
    sliderRef,
    sliderWidth,
    setSliderWidth,
    setCurrentIndex,
    goTo,
    advance,
    prev,
    next,
    onUserInteraction,
    onMomentumScrollEnd,
  };
}
