import { Platform } from "react-native";
import { onCLS, onFCP, onINP, onLCP, onTTFB } from "web-vitals";

const METRIC_NAMES = ["CLS", "LCP", "INP", "FCP", "TTFB"];

function sendToAnalytics(metric) {
  const body = {
    name: metric.name,
    value: metric.value,
    rating: metric.rating,
    id: metric.id,
    navigationType: metric.navigationType,
    path: typeof window !== "undefined" ? window.location.pathname : "",
  };

  if (typeof window !== "undefined" && typeof window.gtag === "function") {
    window.gtag("event", metric.name, {
      event_category: "Web Vitals",
      value: Math.round(metric.name === "CLS" ? metric.value * 1000 : metric.value),
      event_label: metric.id,
      non_interaction: true,
    });
  }

  if (process.env.NODE_ENV !== "production") {
    // eslint-disable-next-line no-console
    console.info("[web-vitals]", body);
  }

  const endpoint = process.env.EXPO_PUBLIC_WEB_VITALS_ENDPOINT;
  if (endpoint && typeof fetch === "function") {
    fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      keepalive: true,
    }).catch(() => {});
  }
}

/**
 * Registers Core Web Vitals reporters (web only). Safe to call once at app boot.
 */
export function initWebVitalsReporting() {
  if (Platform.OS !== "web" || typeof window === "undefined") return;

  try {
    onCLS(sendToAnalytics);
    onLCP(sendToAnalytics);
    onINP(sendToAnalytics);
    onFCP(sendToAnalytics);
    onTTFB(sendToAnalytics);
  } catch {
    // web-vitals unavailable in this bundle — skip silently
  }
}

export { METRIC_NAMES };
