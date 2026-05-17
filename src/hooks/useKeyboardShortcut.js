import { useEffect, useRef } from "react";
import { Platform } from "react-native";

/**
 * Web-only: invoke `onPress` when Cmd+K (macOS) or Ctrl+K (Windows/Linux) is pressed.
 */
export default function useKeyboardShortcut(key, onPress, options = {}) {
  const { enabled = true } = options;
  const handlerRef = useRef(onPress);
  handlerRef.current = onPress;

  useEffect(() => {
    if (Platform.OS !== "web" || !enabled) return undefined;
    if (typeof document === "undefined") return undefined;
    const k = String(key || "").toLowerCase();
    const onKeyDown = (event) => {
      if (!event || event.defaultPrevented) return;
      const matchKey = String(event.key || "").toLowerCase() === k;
      if (!(event.metaKey || event.ctrlKey) || !matchKey) return;
      const tag = event.target?.tagName?.toUpperCase?.() || "";
      if (tag === "INPUT" || tag === "TEXTAREA" || event.target?.isContentEditable) {
        return;
      }
      event.preventDefault();
      if (typeof handlerRef.current === "function") handlerRef.current(event);
    };
    document.addEventListener("keydown", onKeyDown, true);
    return () => document.removeEventListener("keydown", onKeyDown, true);
  }, [enabled, key]);
}
