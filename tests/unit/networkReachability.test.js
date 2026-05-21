import { isBrowserOnline, isNetworkOffline } from "../../src/utils/networkReachability";

describe("isNetworkOffline", () => {
  const originalPlatform = jest.requireActual("react-native").Platform;

  afterEach(() => {
    Object.defineProperty(originalPlatform, "OS", { value: originalPlatform.OS, configurable: true });
  });

  it("web: stays online when NetInfo reachability is false but browser is online", () => {
    Object.defineProperty(originalPlatform, "OS", { value: "web", configurable: true });
    const prev = global.navigator;
    global.navigator = { onLine: true };
    const online = { isConnected: true, isInternetReachable: false };
    expect(isNetworkOffline(online)).toBe(false);
    global.navigator = prev;
  });

  it("web: stays online when NetInfo reports disconnected but browser is online", () => {
    Object.defineProperty(originalPlatform, "OS", { value: "web", configurable: true });
    const prev = global.navigator;
    global.navigator = { onLine: true };
    expect(isNetworkOffline({ isConnected: false, isInternetReachable: false })).toBe(false);
    global.navigator = prev;
  });

  it("web: offline when browser reports offline", () => {
    Object.defineProperty(originalPlatform, "OS", { value: "web", configurable: true });
    const prev = global.navigator;
    global.navigator = { onLine: false };
    expect(isNetworkOffline({ isConnected: true, isInternetReachable: true })).toBe(true);
    global.navigator = prev;
  });

  it("native: offline only when isConnected is false (not reachability probe)", () => {
    Object.defineProperty(originalPlatform, "OS", { value: "ios", configurable: true });
    expect(isNetworkOffline({ isConnected: true, isInternetReachable: false })).toBe(false);
    expect(isNetworkOffline({ isConnected: false, isInternetReachable: true })).toBe(true);
  });

  it("isBrowserOnline reflects navigator.onLine", () => {
    const prev = global.navigator;
    global.navigator = { onLine: true };
    expect(isBrowserOnline()).toBe(true);
    global.navigator = { onLine: false };
    expect(isBrowserOnline()).toBe(false);
    global.navigator = prev;
  });

  it("web: ignores NetInfo disconnected when browser is online", () => {
    Object.defineProperty(originalPlatform, "OS", { value: "web", configurable: true });
    const prev = global.navigator;
    global.navigator = { onLine: true };
    expect(isNetworkOffline({ isConnected: false, isInternetReachable: false })).toBe(false);
    global.navigator = prev;
  });
});
