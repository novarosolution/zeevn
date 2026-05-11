import React, { useEffect, useRef } from "react";
import { Platform, StyleSheet, View } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import useReducedMotion from "../../hooks/useReducedMotion";

/**
 * Web-only screen-level focus transition. Wrap your screen content in this
 * component to get a 320ms fade + 12px slide-up whenever the screen is
 * focused (e.g. via navigation). The first focus is skipped to avoid a
 * cold-load flash.
 *
 * On native or under reduced-motion this is a transparent passthrough.
 */
export default function PageTransition({ children, style, distance = 12, duration = 320 }) {
  const reducedMotion = useReducedMotion();
  const ref = useRef(null);
  const firstFocusRef = useRef(true);

  useFocusEffect(
    React.useCallback(() => {
      if (Platform.OS !== "web" || reducedMotion) return undefined;
      const node = ref.current;
      if (!node || typeof node.style === "undefined") return undefined;

      if (firstFocusRef.current) {
        firstFocusRef.current = false;
        return undefined;
      }
      const prevTransition = node.style.transition;
      node.style.transition = "none";
      node.style.opacity = "0";
      node.style.transform = `translateY(${distance}px)`;
      const raf = globalThis.requestAnimationFrame?.(() => {
        node.style.transition = `opacity ${duration}ms cubic-bezier(0.22, 1, 0.36, 1), transform ${duration}ms cubic-bezier(0.22, 1, 0.36, 1)`;
        node.style.opacity = "1";
        node.style.transform = "translateY(0)";
      });
      return () => {
        if (raf != null && typeof globalThis.cancelAnimationFrame === "function") {
          globalThis.cancelAnimationFrame(raf);
        }
        node.style.transition = prevTransition || "";
      };
    }, [distance, duration, reducedMotion]),
  );

  useEffect(() => {
    if (Platform.OS !== "web") return;
    const node = ref.current;
    if (!node || typeof node.style === "undefined") return;
    if (reducedMotion) {
      node.style.opacity = "1";
      node.style.transform = "translateY(0)";
    }
  }, [reducedMotion]);

  if (Platform.OS !== "web") {
    return <View style={[styles.fill, style]}>{children}</View>;
  }
  return (
    <View ref={ref} style={[styles.fill, style]}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  fill: {
    flex: 1,
    width: "100%",
    minHeight: 0,
  },
});
