import { useEffect, useRef } from "react";
import { BackHandler, Platform } from "react-native";

const FOCUSABLE =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

function getFocusableElements(root) {
  if (!root || typeof root.querySelectorAll !== "function") return [];
  return Array.from(root.querySelectorAll(FOCUSABLE)).filter(
    (el) => el.offsetParent !== null || el.getClientRects().length > 0
  );
}

/**
 * Modal a11y: ESC/back to close, focus trap (web), restore focus to trigger on close.
 */
export default function useModalA11y({ visible, onClose, triggerRef, containerRef }) {
  const wasVisible = useRef(false);
  const previousFocusRef = useRef(null);

  useEffect(() => {
    if (!visible) {
      if (wasVisible.current && triggerRef?.current?.focus) {
        try {
          triggerRef.current.focus();
        } catch {
          /* noop */
        }
      } else if (wasVisible.current && previousFocusRef.current?.focus) {
        try {
          previousFocusRef.current.focus();
        } catch {
          /* noop */
        }
      }
      wasVisible.current = false;
      return undefined;
    }
    wasVisible.current = true;

    if (Platform.OS === "web" && typeof document !== "undefined") {
      const prevOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      previousFocusRef.current = document.activeElement;
      const root = containerRef?.current;
      const focusables = getFocusableElements(root);
      const first = focusables[0];
      if (first?.focus) {
        requestAnimationFrame(() => {
          try {
            first.focus();
          } catch {
            /* noop */
          }
        });
      }

      const onKey = (e) => {
        if (e.key === "Escape") {
          onClose?.();
          return;
        }
        if (e.key !== "Tab" || !root) return;
        const items = getFocusableElements(root);
        if (!items.length) return;
        const firstEl = items[0];
        const lastEl = items[items.length - 1];
        if (e.shiftKey && document.activeElement === firstEl) {
          e.preventDefault();
          lastEl.focus();
        } else if (!e.shiftKey && document.activeElement === lastEl) {
          e.preventDefault();
          firstEl.focus();
        }
      };
      window.addEventListener("keydown", onKey);
      return () => {
        window.removeEventListener("keydown", onKey);
        document.body.style.overflow = prevOverflow;
      };
    }

    if (Platform.OS === "android") {
      const sub = BackHandler.addEventListener("hardwareBackPress", () => {
        onClose?.();
        return true;
      });
      return () => sub.remove();
    }

    return undefined;
  }, [containerRef, onClose, triggerRef, visible]);
}
