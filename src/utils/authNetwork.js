import { Platform } from "react-native";
import NetInfo from "@react-native-community/netinfo";
import { isBrowserOnline, isNetworkOffline } from "./networkReachability";

/** True when device appears offline — skip auth API calls. */
export async function isDeviceOffline() {
  if (Platform.OS === "web") {
    return !isBrowserOnline();
  }
  try {
    const state = await NetInfo.fetch();
    return isNetworkOffline(state);
  } catch {
    return false;
  }
}
