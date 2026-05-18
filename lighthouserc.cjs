const fs = require("fs");

function resolveChromePath() {
  const candidates = [
    process.env.CHROME_PATH,
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    "/Applications/Google Chrome Canary.app/Contents/MacOS/Google Chrome Canary",
    "/usr/bin/google-chrome",
    "/usr/bin/google-chrome-stable",
    "/snap/bin/chromium",
    "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
    "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
  ].filter(Boolean);

  const found = candidates.find((candidate) => {
    try {
      return fs.existsSync(candidate);
    } catch {
      return false;
    }
  });

  return found || undefined;
}

/** @type {import('@lhci/cli').LHCI.ServerCommand.Options} */
module.exports = {
  ci: {
    collect: {
      puppeteerScript: "./scripts/lhci-puppeteer.js",
      url: [
        process.env.LHCI_BASE_URL ? `${process.env.LHCI_BASE_URL.replace(/\/$/, "")}/` : "http://127.0.0.1:8080/",
        process.env.LHCI_BASE_URL ? `${process.env.LHCI_BASE_URL.replace(/\/$/, "")}/shop` : "http://127.0.0.1:8080/shop",
        process.env.LHCI_BASE_URL ? `${process.env.LHCI_BASE_URL.replace(/\/$/, "")}/login` : "http://127.0.0.1:8080/login",
        process.env.LHCI_BASE_URL ? `${process.env.LHCI_BASE_URL.replace(/\/$/, "")}/cart` : "http://127.0.0.1:8080/cart",
      ],
      numberOfRuns: 3,
      settings: {
        preset: "desktop",
        chromeFlags: "--headless=new --no-sandbox",
        chromePath: resolveChromePath(),
      },
    },
    assert: {
      assertions: {
        "categories:performance": ["error", { minScore: 0.75 }],
        "categories:accessibility": ["warn", { minScore: 0.9 }],
        "largest-contentful-paint": ["error", { maxNumericValue: 2500 }],
        "cumulative-layout-shift": ["error", { maxNumericValue: 0.1 }],
        "total-blocking-time": ["warn", { maxNumericValue: 350 }],
        "interactive": ["warn", { maxNumericValue: 4500 }],
      },
    },
    upload: {
      target: "temporary-public-storage",
    },
  },
};
