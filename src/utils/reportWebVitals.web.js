import { onCLS, onFCP, onINP, onLCP, onTTFB } from "web-vitals";
import { captureMessage } from "../observability/sentry";

function sendMetric(metric) {
  const payload = {
    name: metric.name,
    value: metric.value,
    rating: metric.rating,
    id: metric.id,
    navigationType: metric.navigationType,
    path: typeof window !== "undefined" ? window.location.pathname : "",
    ts: Date.now(),
  };

  if (__DEV__) {
    console.info("[web-vitals]", payload.name, Math.round(payload.value), payload.rating, payload.path);
  }

  const endpoint = process.env.EXPO_PUBLIC_WEB_VITALS_ENDPOINT;
  if (endpoint && typeof fetch !== "undefined") {
    void fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      keepalive: true,
    }).catch(() => {});
  }

  if (metric.rating === "poor") {
    captureMessage(`web_vitals_${metric.name}`, "warning", {
      tags: { kind: "web-vitals", metric: metric.name, rating: metric.rating },
      extra: payload,
    });
  }
}

export function initWebVitalsReporting() {
  if (typeof window === "undefined") return;
  onCLS(sendMetric);
  onINP(sendMetric);
  onLCP(sendMetric);
  onFCP(sendMetric);
  onTTFB(sendMetric);
}
