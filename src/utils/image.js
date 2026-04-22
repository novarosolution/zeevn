import { getApiBaseUrl } from "../services/apiBase";

function isLocalHost(hostname) {
  return hostname === "localhost" || hostname === "127.0.0.1" || hostname === "0.0.0.0";
}

function getDevHostFromApiBase() {
  try {
    return new URL(getApiBaseUrl()).hostname;
  } catch {
    return "";
  }
}

function unique(items) {
  return Array.from(new Set(items.filter(Boolean)));
}

function withHost(urlString, hostname) {
  try {
    const url = new URL(urlString);
    url.hostname = hostname;
    return url.toString();
  } catch {
    return urlString;
  }
}

function hostVariants(urlString) {
  try {
    const url = new URL(urlString);
    const currentHost = url.hostname;
    const devHost = getDevHostFromApiBase();
    const candidates = [urlString];
    if (isLocalHost(currentHost)) {
      if (devHost) candidates.push(withHost(urlString, devHost));
      candidates.push(withHost(urlString, "10.0.2.2"));
    } else if (devHost && currentHost !== devHost) {
      candidates.push(withHost(urlString, devHost));
    }
    // For non-local remote hosts, prefer HTTPS on Android/iOS.
    if (!isLocalHost(url.hostname) && url.protocol === "http:") {
      const httpsUrl = new URL(urlString);
      httpsUrl.protocol = "https:";
      candidates.unshift(httpsUrl.toString());
    }
    return unique(candidates);
  } catch {
    return [urlString];
  }
}

export function resolveImageUri(rawUri) {
  const uri = encodeURI(String(rawUri || "").trim());
  if (!uri) return "";
  if (uri.startsWith("data:image/")) return uri;

  const apiBase = getApiBaseUrl();
  if (uri.startsWith("/")) return `${apiBase}${uri}`;
  if (!/^https?:\/\//i.test(uri)) return `${apiBase}/${uri.replace(/^\/+/, "")}`;

  try {
    const url = new URL(uri);

    if (isLocalHost(url.hostname)) {
      const devHost = getDevHostFromApiBase();
      if (devHost) {
        url.hostname = devHost;
      }
      return url.toString();
    }

    return url.toString();
  } catch {
    return uri;
  }
}

export function getImageUriCandidates(rawUri) {
  const uri = encodeURI(String(rawUri || "").trim());
  if (!uri) return [];
  if (uri.startsWith("data:image/")) return [uri];

  const apiBase = getApiBaseUrl();
  if (uri.startsWith("/")) {
    return hostVariants(`${apiBase}${uri}`);
  }
  if (!/^https?:\/\//i.test(uri)) {
    return hostVariants(`${apiBase}/${uri.replace(/^\/+/, "")}`);
  }
  return hostVariants(resolveImageUri(uri));
}
