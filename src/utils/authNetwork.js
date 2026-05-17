import NetInfo from "@react-native-community/netinfo";

/** True when device appears offline — skip auth API calls. */
export async function isDeviceOffline() {
  try {
    const state = await NetInfo.fetch();
    return state.isConnected === false || state.isInternetReachable === false;
  } catch {
    return false;
  }
}
