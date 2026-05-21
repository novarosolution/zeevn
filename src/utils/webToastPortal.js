import { Platform } from "react-native";
import { WEB_Z_INDEX } from "../theme/web";

let toastRoot = null;

/** Top-level DOM host so fixed toasts escape auth/layout stacking contexts. */
export function getWebToastPortalRoot() {
  if (Platform.OS !== "web" || typeof document === "undefined") return null;

  if (toastRoot?.isConnected) return toastRoot;

  toastRoot = document.getElementById("zeevan-toast-root");
  if (!toastRoot) {
    toastRoot = document.createElement("div");
    toastRoot.id = "zeevan-toast-root";
    Object.assign(toastRoot.style, {
      position: "fixed",
      inset: "0",
      zIndex: String(WEB_Z_INDEX.toast),
      pointerEvents: "none",
      transform: "translateZ(0)",
      willChange: "transform",
    });
    document.body.appendChild(toastRoot);
  }

  return toastRoot;
}
