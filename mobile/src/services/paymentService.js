import { Linking, Platform } from "react-native";
import { apiPost } from "./apiClient";
import { RAZORPAY_PAY_URL } from "../content/appContent";

/**
 * Razorpay payment service (client-side).
 *
 * - Server-only logic (creating Razorpay orders, signature verification,
 *   webhooks) lives in the backend's razorpayService.
 * - This file owns:
 *     1. Calling our backend `/orders/:id/verify-payment` & `/cancel-pending`.
 *     2. Lazy-loading the Razorpay Checkout JS on web.
 *     3. Opening Razorpay Checkout (Web SDK / native module / fallback link).
 */

/**
 * Public Razorpay key id, exposed to the client via Expo's
 * `EXPO_PUBLIC_*` envs. Server-issued order responses also include this on
 * `razorpayKeyId`, which takes precedence (so deploys don't have to keep
 * client/server keys in sync).
 */
export function getPublicRazorpayKeyId() {
  return String(process.env.EXPO_PUBLIC_RAZORPAY_KEY_ID || "").trim();
}

/** POST /orders/:id/verify-payment — finalises a Razorpay order on success. */
export function verifyOrderPayment(_token, orderId, payload) {
  return apiPost(`/orders/${orderId}/verify-payment`, payload);
}

/** POST /orders/:id/cancel-pending — abandons an unpaid Razorpay order. */
export function cancelPendingOrder(_token, orderId) {
  return apiPost(`/orders/${orderId}/cancel-pending`, {});
}

const RAZORPAY_CHECKOUT_SCRIPT_URL = "https://checkout.razorpay.com/v1/checkout.js";
let razorpayScriptPromise = null;

/**
 * Lazy-loads the Razorpay Checkout web SDK once. Returns when `window.Razorpay`
 * is available. On non-web platforms this resolves immediately.
 */
export function loadRazorpayWebSdk() {
  if (Platform.OS !== "web" || typeof document === "undefined") {
    return Promise.resolve(null);
  }
  if (typeof window !== "undefined" && window.Razorpay) {
    return Promise.resolve(window.Razorpay);
  }
  if (razorpayScriptPromise) return razorpayScriptPromise;

  razorpayScriptPromise = new Promise((resolve, reject) => {
    const existing = document.querySelector(`script[src="${RAZORPAY_CHECKOUT_SCRIPT_URL}"]`);
    if (existing) {
      existing.addEventListener("load", () => resolve(window.Razorpay));
      existing.addEventListener("error", () => reject(new Error("Razorpay script failed to load.")));
      if (typeof window !== "undefined" && window.Razorpay) resolve(window.Razorpay);
      return;
    }
    const script = document.createElement("script");
    script.src = RAZORPAY_CHECKOUT_SCRIPT_URL;
    script.async = true;
    script.onload = () => resolve(window?.Razorpay || null);
    script.onerror = () => {
      razorpayScriptPromise = null;
      reject(new Error("Razorpay script failed to load."));
    };
    document.head.appendChild(script);
  });
  return razorpayScriptPromise;
}

/**
 * Opportunistically loads the optional native module. Returns `null` if the
 * Expo client doesn't include `react-native-razorpay` (e.g. Expo Go or a build
 * without the dev client). Callers fall back to a hosted page in that case.
 */
function getNativeRazorpay() {
  if (Platform.OS === "web") return null;
  try {
    const mod = require("react-native-razorpay");
    return mod?.default || mod || null;
  } catch {
    return null;
  }
}

function buildCheckoutOptions({ order, razorpayKeyId, user, themeColor }) {
  const amountInPaise = Math.round(Number(order?.totalPrice || 0) * 100);
  return {
    key: razorpayKeyId,
    amount: amountInPaise,
    currency: "INR",
    name: "Zeevan",
    description: `Order ${String(order?._id || "").slice(-8).toUpperCase()}`,
    order_id: order?.razorpay?.orderId || "",
    prefill: {
      name: user?.name || order?.shippingAddress?.fullName || "",
      email: user?.email || "",
      contact: user?.phone || order?.shippingAddress?.phone || "",
    },
    notes: {
      orderId: String(order?._id || ""),
    },
    theme: {
      color: themeColor || "#C9A23A",
    },
  };
}

/**
 * Opens Razorpay Checkout for the given order. Resolves with
 * `{ status: "success" | "dismissed" | "fallback", payload? }`:
 *   - success: payload contains razorpay_order_id/payment_id/signature.
 *   - dismissed: user closed the modal or payment failed; caller can show
 *     the "resume" UI in My Orders.
 *   - fallback: native module missing — we opened the hosted razorpay.me link
 *     instead. Caller asks the user to confirm with a UTR / refresh later.
 */
export async function openRazorpayCheckout({ order, razorpayKeyId, user, themeColor }) {
  if (!order?.razorpay?.orderId) {
    throw new Error("Missing Razorpay order id on the server response.");
  }
  if (!razorpayKeyId) {
    throw new Error("Missing Razorpay key id (set EXPO_PUBLIC_RAZORPAY_KEY_ID).");
  }

  if (Platform.OS === "web") {
    const Razorpay = await loadRazorpayWebSdk();
    if (!Razorpay) {
      throw new Error("Razorpay SDK is unavailable in this browser.");
    }
    return new Promise((resolve, reject) => {
      const options = buildCheckoutOptions({ order, razorpayKeyId, user, themeColor });
      let resolved = false;
      const rzp = new Razorpay({
        ...options,
        handler: (response) => {
          resolved = true;
          resolve({ status: "success", payload: response });
        },
        modal: {
          ondismiss: () => {
            if (!resolved) resolve({ status: "dismissed" });
          },
        },
      });
      rzp.on("payment.failed", () => {
        if (!resolved) resolve({ status: "dismissed" });
      });
      try {
        rzp.open();
      } catch (err) {
        reject(err instanceof Error ? err : new Error(String(err)));
      }
    });
  }

  const Native = getNativeRazorpay();
  if (Native?.open) {
    try {
      const payload = await Native.open(
        buildCheckoutOptions({ order, razorpayKeyId, user, themeColor })
      );
      return { status: "success", payload };
    } catch (err) {
      const code = err?.code || err?.error?.code;
      if (code === "PAYMENT_CANCELLED" || code === "BAD_REQUEST_ERROR" || code === 0) {
        return { status: "dismissed" };
      }
      return { status: "dismissed", error: err?.description || err?.message };
    }
  }

  const fallbackUrl = String(RAZORPAY_PAY_URL || "").trim();
  if (fallbackUrl) {
    try {
      await Linking.openURL(fallbackUrl);
    } catch {
      // Non-fatal — caller surfaces the message.
    }
  }
  return { status: "fallback" };
}
