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
