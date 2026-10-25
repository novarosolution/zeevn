import { createNavigationContainerRef } from "@react-navigation/native";
import { BackHandler, Platform } from "react-native";

function isNativeAdminRoute(name) {
  return Platform.OS !== "web" && typeof name === "string" && name.startsWith("Admin");
}

export const navigationRef = createNavigationContainerRef();

const pendingActions = [];

function runOrQueue(action) {
  if (navigationRef.isReady()) {
    action();
    return true;
  }
  pendingActions.push(action);
  return false;
}

/** Navigate when the container is ready; queue until `flushPendingNavigationActions`. */
export function safeNavigate(name, params) {
  if (isNativeAdminRoute(name)) return false;
  return runOrQueue(() => {
    navigationRef.navigate(name, params);
  });
}

export function safeReset(state) {
  return runOrQueue(() => {
    navigationRef.reset(state);
  });
}

export function flushPendingNavigationActions() {
  if (!navigationRef.isReady()) return;
  while (pendingActions.length) {
    const action = pendingActions.shift();
    try {
      action();
    } catch (error) {
      console.error("[navigation] pending action failed:", error);
    }
  }
}

/**
 * Android hardware back: pop when there is history, otherwise return to Home
 * (or the admin desk). Only the true root screens may leave the app.
 */
export function handleAndroidHardwareBack() {
  if (!navigationRef.isReady()) return true;
  if (navigationRef.canGoBack()) {
    navigationRef.goBack();
    return true;
  }
  const name = navigationRef.getCurrentRoute()?.name;
  if (!name || name === "Home" || name === "FindLocation") return false;
  if (name.startsWith("Admin")) {
    if (name !== "AdminDashboard") {
      navigationRef.navigate("AdminDashboard");
      return true;
    }
    return false;
  }
  if (name === "DeliveryDashboard") return false;
  navigationRef.navigate("Home");
  return true;
}

export function subscribeAndroidHardwareBack() {
  if (Platform.OS !== "android") return () => {};
  const sub = BackHandler.addEventListener("hardwareBackPress", handleAndroidHardwareBack);
  return () => sub.remove();
}
