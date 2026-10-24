import { Asset } from "expo-asset";
import { Image, Platform } from "react-native";
import { optimizeDisplayImageUrl, resolveImageUri } from "./image";

function isLocalBundledUri(uri) {
  const value = String(uri || "");
  return (
    value.includes("unstable_path=") ||
    value.startsWith("/assets") ||
    value.includes("/assets/")
  );
}

function deliveryUri(uri) {
  if (!uri) return "";
  const normalized = resolveImageUri(uri) || uri;
  if (Platform.OS !== "web" || isLocalBundledUri(normalized)) return normalized;
  return optimizeDisplayImageUrl(normalized) || normalized;
}

function isBundledAsset(value) {
  return (
    value &&
    typeof value === "object" &&
    typeof value.uri === "string" &&
    value.uri.trim().length > 0
  );
}

/** Expo `require()` asset id, bundled asset object, or remote URL → expo-image source. */
export function resolveImageSource(value) {
  if (value == null || value === "") return null;
  if (typeof value === "number") {
    // Phone: keep the module id. Stringifying to Metro 127.0.0.1 / file://android_res fails.
    if (Platform.OS !== "web") return value;
    const asset = Image.resolveAssetSource(value);
    const uri = asset?.uri ? resolveImageUri(asset.uri) || asset.uri : "";
    if (!uri) return value;
    return {
      uri: deliveryUri(uri),
      ...(Number.isFinite(asset?.width) ? { width: asset.width } : {}),
      ...(Number.isFinite(asset?.height) ? { height: asset.height } : {}),
    };
  }
  if (isBundledAsset(value)) {
    return {
      uri: deliveryUri(resolveImageUri(value.uri) || value.uri),
      ...(Number.isFinite(value.width) ? { width: value.width } : {}),
      ...(Number.isFinite(value.height) ? { height: value.height } : {}),
    };
  }
  if (typeof value === "string") {
    const uri = resolveImageUri(value);
    return uri ? { uri: deliveryUri(uri) } : null;
  }
  return null;
}

/** Expo `require()` asset id or remote URL → string for <video> / players. */
export function resolveVideoUri(value) {
  if (value == null || value === "") return "";
  if (typeof value === "string") {
    const uri = resolveImageUri(value) || value;
    return uri;
  }
  if (isBundledAsset(value)) {
    return resolveImageUri(value.uri) || value.uri;
  }
  if (typeof value === "number") {
    const resolved = Image.resolveAssetSource(value);
    const uri = resolved?.uri || "";
    if (uri) return resolveImageUri(uri) || uri;
    try {
      const asset = Asset.fromModule(value);
      const fromAsset = asset.uri || asset.localUri || "";
      return fromAsset ? resolveImageUri(fromAsset) || fromAsset : "";
    } catch {
      return "";
    }
  }
  return "";
}

/** Normalize any media value → `expo-video` `VideoSource` (require id, uri string, or null). */
export function toVideoPlayerSource(value) {
  if (value == null || value === "") return null;
  if (typeof value === "number") return value;
  if (isBundledAsset(value)) return resolveImageUri(value.uri) || value.uri;
  if (typeof value === "string") {
    const uri = resolveImageUri(value);
    return uri || value;
  }
  return null;
}
