import NetInfo from "@react-native-community/netinfo";

/**
 * Web: do not run NetInfo reachability probes (they hit /api/health and lie about "offline").
 * Connectivity banner uses navigator.onLine only — see OfflineBanner.js.
 */
export function configureNetInfo() {
  NetInfo.configure({
    reachabilityShouldRun: () => false,
    useNativeReachability: false,
  });
}
