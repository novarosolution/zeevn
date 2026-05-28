import * as Sentry from "@sentry/react-native";
import Constants from "expo-constants";
import { Platform } from "react-native";
import { hashUserIdForTelemetrySync } from "./userIdHash";

let initialized = false;
let currentRoute = "unknown";
let currentUserHash = "anonymous";

const appVersion =
  Constants.expoConfig?.version ||
  Constants.manifest?.version ||
  process.env.EXPO_PUBLIC_APP_VERSION ||
  "1.0.0";

export function initSentry() {
  const dsn = process.env.EXPO_PUBLIC_SENTRY_DSN || "";
  if (!dsn || initialized) return false;

  Sentry.init({
    dsn,
    environment: process.env.EXPO_PUBLIC_SENTRY_ENVIRONMENT || (__DEV__ ? "development" : "production"),
    release: `zeevan@${appVersion}`,
    dist: String(Constants.expoConfig?.ios?.buildNumber || Constants.expoConfig?.android?.versionCode || "1"),
    enableAutoSessionTracking: true,
    tracesSampleRate: __DEV__ ? 0 : 0.2,
    enableNativeFramesTracking: Platform.OS !== "web",
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
  Sentry.setTag("platform", Platform.OS);
  initialized = true;
  return true;
}

export function setSentryRoute(routeName) {
  currentRoute = routeName || "unknown";
  if (!initialized) return;
  Sentry.setTag("route", currentRoute);
  Sentry.addBreadcrumb({ category: "navigation", message: currentRoute, level: "info" });
}

export function setSentryUser(user) {
  const id = user?.id || user?._id || user?.email;
  if (!id) {
    clearSentryUser();
    return;
  }
  currentUserHash = hashUserIdForTelemetrySync(id);
  if (!initialized) return;
  Sentry.setUser({ id: currentUserHash });
  Sentry.setTag("userIdHash", currentUserHash);
}

export function clearSentryUser() {
  currentUserHash = "anonymous";
  if (!initialized) return;
  Sentry.setUser(null);
  Sentry.setTag("userIdHash", "anonymous");
}

export function captureException(error, context = {}) {
  if (!initialized) {
    if (__DEV__) console.warn("[sentry] captureException (no DSN):", error);
    return;
  }
  Sentry.withScope((scope) => {
    if (context.tags) scope.setTags(context.tags);
    if (context.extra) scope.setExtras(context.extra);
    if (context.level) scope.setLevel(context.level);
    Sentry.captureException(error);
  });
}

export function captureMessage(message, level = "info", context = {}) {
  if (!initialized) {
    if (__DEV__) console.info("[sentry] captureMessage (no DSN):", message);
    return;
  }
  Sentry.withScope((scope) => {
    if (context.tags) scope.setTags(context.tags);
    if (context.extra) scope.setExtras(context.extra);
    Sentry.captureMessage(message, level);
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
  return Sentry.wrap(Component);
}

export { Sentry };
