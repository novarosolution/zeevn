import { useEffect, useRef } from "react";
import { Platform } from "react-native";

/** Web: invoke callback when Escape is pressed while `enabled`. */
export default function useEscapeKey(onEscape, enabled = true) {
  const handlerRef = useRef(onEscape);
  handlerRef.current = onEscape;

  useEffect(() => {
    if (Platform.OS !== "web" || !enabled) return undefined;
    if (typeof document === "undefined") return undefined;
    const onKeyDown = (event) => {
      if (event?.key !== "Escape" || event.defaultPrevented) return;
      handlerRef.current?.(event);
    };
    document.addEventListener("keydown", onKeyDown, true);
    return () => document.removeEventListener("keydown", onKeyDown, true);
  }, [enabled]);
}
