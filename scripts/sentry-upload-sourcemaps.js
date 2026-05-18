#!/usr/bin/env node
/**
 * Upload Expo web source maps to Sentry after `npm run export:web`.
 * Requires: SENTRY_AUTH_TOKEN, SENTRY_ORG, SENTRY_PROJECT, EXPO_PUBLIC_SENTRY_DSN
 */
const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

const dist = path.join(__dirname, "..", "dist");
const version = process.env.EXPO_PUBLIC_APP_VERSION || "1.0.0";
const release = process.env.SENTRY_RELEASE || `zeevan@${version}`;

function main() {
  if (!process.env.SENTRY_AUTH_TOKEN) {
    console.log("[sentry] SENTRY_AUTH_TOKEN not set — skipping source map upload.");
    process.exit(0);
  }
  if (!fs.existsSync(dist)) {
    console.error("[sentry] dist/ not found. Run npm run export:web first.");
    process.exit(1);
  }

  const cli = "npx @sentry/cli";
  execSync(`${cli} releases new ${release}`, { stdio: "inherit" });
  execSync(`${cli} releases files ${release} upload-sourcemaps ${dist} --rewrite`, {
    stdio: "inherit",
  });
  execSync(`${cli} releases finalize ${release}`, { stdio: "inherit" });
  console.log(`[sentry] Uploaded source maps for release ${release}`);
}

main();
