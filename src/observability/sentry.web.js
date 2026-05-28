import Constants from "expo-constants";
import { Platform } from "react-native";
import { hashUserIdForTelemetrySync } from "./userIdHash";

let initialized = false;
let currentRoute = "unknown";
let currentUserHash = "anonymous";
let sentryPromise = null;
let sentryApi = null;

const appVersion =
  Constants.expoConfig?.version ||
  Constants.manifest?.version ||
  process.env.EXPO_PUBLIC_APP_VERSION ||
  "1.0.0";

export function initSentry() {
  const dsn = process.env.EXPO_PUBLIC_SENTRY_DSN || "";
  if (!dsn || initialized) return false;
  if (!sentryPromise) {
    sentryPromise = import("@sentry/react").then((mod) => mod);
  }
  // Fire-and-forget to keep bootstrap sync and avoid loading Sentry on the critical path.
  sentryPromise
    .then((Sentry) => {
      if (initialized) return;
      sentryApi = Sentry;

      Sentry.init({
        dsn,
        environment: process.env.EXPO_PUBLIC_SENTRY_ENVIRONMENT || (__DEV__ ? "development" : "production"),
        release: `zeevan@${appVersion}`,
        integrations: [Sentry.browserTracingIntegration()],
        tracesSampleRate: __DEV__ ? 0 : 0.15,
        beforeSend(event) {
          event.tags = {
            ...event.tags,
            appVersion,
            platform: Platform.OS,
            route: currentRoute,
            userIdHash: currentUserHash,
          };
          return event;
        },
      });

      Sentry.setTag("appVersion", appVersion);
      Sentry.setTag("platform", "web");
      initialized = true;
    })
    .catch(() => {
      // Sentry remains optional.
    });
  return true;
}

export function setSentryRoute(routeName) {
  currentRoute = routeName || "unknown";
  if (!initialized || !sentryApi) return;
  sentryApi.setTag("route", currentRoute);
  sentryApi.addBreadcrumb({ category: "navigation", message: currentRoute, level: "info" });
}

export function setSentryUser(user) {
  const id = user?.id || user?._id || user?.email;
  if (!id) {
    clearSentryUser();
    return;
  }
  currentUserHash = hashUserIdForTelemetrySync(id);
  if (!initialized || !sentryApi) return;
  sentryApi.setUser({ id: currentUserHash });
  sentryApi.setTag("userIdHash", currentUserHash);
}

export function clearSentryUser() {
  currentUserHash = "anonymous";
  if (!initialized || !sentryApi) return;
  sentryApi.setUser(null);
  sentryApi.setTag("userIdHash", "anonymous");
}

export function captureException(error, context = {}) {
  if (!initialized || !sentryApi) {
    if (__DEV__) console.warn("[sentry] captureException (no DSN):", error);
    return;
  }
  sentryApi.withScope((scope) => {
    if (context.tags) scope.setTags(context.tags);
    if (context.extra) scope.setExtras(context.extra);
    if (context.level) scope.setLevel(context.level);
    sentryApi.captureException(error);
  });
}

export function captureMessage(message, level = "info", context = {}) {
  if (!initialized || !sentryApi) {
    if (__DEV__) console.info("[sentry] captureMessage (no DSN):", message);
    return;
  }
  sentryApi.withScope((scope) => {
    if (context.tags) scope.setTags(context.tags);
    if (context.extra) scope.setExtras(context.extra);
    sentryApi.captureMessage(message, level);
  });
}

export function captureNetworkFailure(meta = {}) {
  captureMessage("network_failure", "warning", {
    tags: { kind: "network" },
    extra: meta,
  });
}

export function captureSlowRender(componentName, durationMs) {
  if (durationMs < 400) return;
  captureMessage("slow_render", "warning", {
    tags: { kind: "performance", component: componentName },
    extra: { durationMs },
  });
}

export function wrapWithSentry(Component) {
  return Component;
}
