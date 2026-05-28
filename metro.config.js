const { getDefaultConfig } = require("expo/metro-config");
const fs = require("fs");
const http = require("http");
const https = require("https");
const path = require("path");

const config = getDefaultConfig(__dirname);
const PUBLIC_ROOT = path.join(__dirname, "public");

const PUBLIC_MIME = {
  ".png": "image/png",
  ".webp": "image/webp",
  ".woff2": "font/woff2",
  ".ttf": "font/ttf",
  ".ico": "image/x-icon",
  ".webmanifest": "application/manifest+json",
  ".js": "application/javascript",
};

/** Serve /public at URL root before Metro's /assets/* bundler (fixes /assets/seo/* ENOENT). */
function servePublicStatic(req, res, next) {
  if (req.method !== "GET" && req.method !== "HEAD") {
    return next();
  }

  const pathname = (req.url || "").split("?")[0];
  if (!pathname || pathname === "/") {
    return next();
  }

  const relativePath = pathname.replace(/^\/+/, "");
  const filePath = path.join(PUBLIC_ROOT, relativePath);
  if (!filePath.startsWith(PUBLIC_ROOT)) {
    return next();
  }

  let stat;
  try {
    stat = fs.statSync(filePath);
  } catch {
    return next();
  }
  if (!stat.isFile()) {
    return next();
  }

  const ext = path.extname(filePath).toLowerCase();
  res.setHeader("Content-Type", PUBLIC_MIME[ext] || "application/octet-stream");
  if (req.method === "HEAD") {
    res.statusCode = 200;
    res.end();
    return;
  }
  fs.createReadStream(filePath).pipe(res);
}

config.transformer = {
  ...config.transformer,
  babelTransformerPath: require.resolve("react-native-svg-transformer"),
};
config.resolver = {
  ...config.resolver,
  assetExts: config.resolver.assetExts.filter((ext) => ext !== "svg"),
  sourceExts: [...config.resolver.sourceExts, "svg"],
};

/** Proxy /api/* → backend in dev so the web app avoids cross-origin fetches to :5001. */
function createDevApiProxy() {
  const target = new URL(process.env.EXPO_PUBLIC_API_PROXY_TARGET || "http://127.0.0.1:5001");
  const transport = target.protocol === "https:" ? https : http;

  return function devApiProxy(req, res, next) {
    const rawUrl = req.url || "";
    if (!rawUrl.startsWith("/api")) {
      return next();
    }

    let path = rawUrl.slice(4) || "/";
    if (!path.startsWith("/")) path = `/${path}`;

    const headers = { ...req.headers, host: target.host };
    delete headers.origin;
    delete headers.referer;

    const proxyReq = transport.request(
      {
        hostname: target.hostname,
        port: target.port || (target.protocol === "https:" ? 443 : 80),
        path,
        method: req.method,
        headers,
      },
      (proxyRes) => {
        res.writeHead(proxyRes.statusCode || 502, proxyRes.headers);
        proxyRes.pipe(res);
      }
    );

    proxyReq.on("error", () => {
      if (res.headersSent) return;
      res.statusCode = 502;
      res.setHeader("Content-Type", "application/json");
      res.end(
        JSON.stringify({
          error: "API unreachable",
          hint: "Run npm run api:dev — port 5001 must be the Express API, not a static file server.",
        })
      );
    });

    req.pipe(proxyReq);
  };
}

config.server = {
  ...config.server,
  enhanceMiddleware: (middleware) => {
    const proxy = createDevApiProxy();
    return (req, res, next) => {
      servePublicStatic(req, res, () => {
        proxy(req, res, () => middleware(req, res, next));
      });
    };
  },
};

module.exports = config;
