import { Platform } from "react-native";
import * as Device from "expo-device";
import Constants from "expo-constants";
import { isRunningInExpoGo } from "expo";
import { registerMyPushToken } from "./userService";

function getProjectId() {
  return (
    Constants?.expoConfig?.extra?.eas?.projectId ||
    Constants?.easConfig?.projectId ||
    null
  );
}

function getNotificationsModule() {
  if (isRunningInExpoGo()) {
    return null;
  }
  try {
    return require("expo-notifications");
  } catch {
    return null;
  }
}

export async function registerForPushNotifications(token) {
  if (!token || Platform.OS === "web" || !Device.isDevice) {
    return { enabled: false };
  }

  // Expo Go / non-standalone Android environments do not support remote push reliably.
  // Skip registration to avoid runtime errors and noisy logs.
  const isUnsupportedEnv =
    isRunningInExpoGo() ||
    (Platform.OS === "android" &&
      (Constants?.appOwnership === "expo" ||
        Constants?.executionEnvironment === "storeClient" ||
        Constants?.appOwnership !== "standalone"));
  if (isUnsupportedEnv) {
    return { enabled: false, reason: "expo-go-android-not-supported" };
  }

  const Notifications = getNotificationsModule();
  if (!Notifications) {
    return { enabled: false, reason: "notifications-module-unavailable" };
  }

  const { status: currentStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = currentStatus;
  if (currentStatus !== "granted") {
    const permissionResult = await Notifications.requestPermissionsAsync();
    finalStatus = permissionResult.status;
  }
  if (finalStatus !== "granted") {
    return { enabled: false };
  }

  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("default", {
      name: "default",
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: "#D4AF37",
    });
  }

  const projectId = getProjectId();
  const pushTokenData = await Notifications.getExpoPushTokenAsync(
    projectId ? { projectId } : undefined
  );
  const expoPushToken = pushTokenData?.data;
  if (!expoPushToken) {
    return { enabled: false };
  }

  await registerMyPushToken(token, expoPushToken);
  return { enabled: true, expoPushToken };
}
