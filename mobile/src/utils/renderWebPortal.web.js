import { createPortal } from "react-dom";

/** Mount overlays on `document.body` so parent `overflow` cannot clip fixed menus. */
export function renderWebPortal(children) {
  if (typeof document === "undefined" || !document.body) {
    return children;
  }
  return createPortal(children, document.body);
}
