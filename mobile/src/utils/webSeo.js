import { Platform } from "react-native";
import Constants from "expo-constants";
import { APP_DISPLAY_NAME, APP_TAGLINE } from "../constants/brand";

const DEFAULT_SITE_URL = "https://www.zeevan.app";
const DEFAULT_DESCRIPTION =
  "Zeevan — premium A2 bilona ghee, cold-pressed oils, masala & Haldar honey. Shop artisan pantry staples with live delivery tracking across India.";

const ROUTE_SEO = {
  Home: {
    title: `${APP_DISPLAY_NAME} — Premium A2 Ghee & Artisan Pantry`,
    description: DEFAULT_DESCRIPTION,
    path: "/",
  },
  Shop: {
    title: `Shop — ${APP_DISPLAY_NAME}`,
    description: "Browse A2 ghee, tel, masala, honey and pantry essentials. Filter by category and order fresh delivery.",
    path: "/shop",
  },
  About: {
    title: `About — ${APP_DISPLAY_NAME}`,
    description: "Our story — traditional bilona craft, honest labels, and farm-to-pantry quality from Zeevan.",
    path: "/about",
  },
  Product: {
    title: `Product — ${APP_DISPLAY_NAME}`,
    description: "Product details, nutrition, reviews and add to bag — premium pantry from Zeevan.",
    path: "/product",
  },
  Cart: {
    title: `Your bag — ${APP_DISPLAY_NAME}`,
    description: "Review items in your bag and proceed to checkout.",
    path: "/cart",
    noindex: true,
  },
  Checkout: {
    title: `Checkout — ${APP_DISPLAY_NAME}`,
    description: "Secure checkout for your Zeevan order.",
    path: "/checkout",
    noindex: true,
  },
  Login: {
    title: `Sign in — ${APP_DISPLAY_NAME}`,
    description: "Sign in to your Zeevan account.",
    path: "/login",
    noindex: true,
  },
  Register: {
    title: `Create account — ${APP_DISPLAY_NAME}`,
    description: "Create your Zeevan account.",
    path: "/register",
    noindex: true,
  },
  Profile: {
    title: `Account — ${APP_DISPLAY_NAME}`,
    description: "Manage your Zeevan profile and preferences.",
    path: "/profile",
    noindex: true,
  },
  MyOrders: {
    title: `Orders — ${APP_DISPLAY_NAME}`,
    description: "Track your Zeevan orders and delivery status.",
    path: "/orders",
    noindex: true,
  },
  Privacy: {
    title: `Privacy — ${APP_DISPLAY_NAME}`,
    description: "Zeevan privacy policy.",
    path: "/privacy",
  },
  Terms: {
    title: `Terms — ${APP_DISPLAY_NAME}`,
    description: "Zeevan terms of service.",
    path: "/terms",
  },
};

export function getWebSiteUrl() {
  const fromEnv = String(process.env.EXPO_PUBLIC_SITE_URL || "").trim().replace(/\/+$/, "");
  if (fromEnv) return fromEnv;
  if (Platform.OS === "web" && typeof window !== "undefined" && window.location?.origin) {
    return window.location.origin.replace(/\/+$/, "");
  }
  return DEFAULT_SITE_URL;
}

function upsertMeta(attr, key, content) {
  if (!content || typeof document === "undefined") return;
  let el = document.querySelector(`meta[${attr}="${key}"]`);
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute("content", content);
}

function upsertLink(rel, href) {
  if (!href || typeof document === "undefined") return;
  let el = document.querySelector(`link[rel="${rel}"]`);
  if (!el) {
    el = document.createElement("link");
    el.rel = rel;
    document.head.appendChild(el);
  }
  el.href = href;
}

function upsertJsonLd(id, data) {
  if (typeof document === "undefined" || !data) return;
  let el = document.getElementById(id);
  if (!el) {
    el = document.createElement("script");
    el.type = "application/ld+json";
    el.id = id;
    document.head.appendChild(el);
  }
  el.textContent = JSON.stringify(data);
}

export function injectWebSeoBootstrap() {
  if (Platform.OS !== "web" || typeof document === "undefined") return;

  const siteUrl = getWebSiteUrl();
  const html = document.documentElement;
  if (!html.getAttribute("lang")) html.setAttribute("lang", "en");

  upsertMeta("name", "description", DEFAULT_DESCRIPTION);
  upsertMeta("name", "robots", "index, follow, max-image-preview:large");
  upsertMeta("name", "application-name", APP_DISPLAY_NAME);
  upsertMeta("name", "theme-color", "#FAF8F4");
  upsertMeta("name", "color-scheme", "light dark");

  upsertMeta("property", "og:site_name", APP_DISPLAY_NAME);
  upsertMeta("property", "og:type", "website");
  upsertMeta("property", "og:locale", "en_IN");

  upsertMeta("name", "twitter:card", "summary_large_image");
  upsertMeta("name", "twitter:title", `${APP_DISPLAY_NAME} — ${APP_TAGLINE}`);

  upsertLink("canonical", `${siteUrl}/`);

  upsertJsonLd("zeevan-org-jsonld", {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: APP_DISPLAY_NAME,
    url: siteUrl,
    description: DEFAULT_DESCRIPTION,
    email: "support@zeevan.app",
  });

  upsertJsonLd("zeevan-store-jsonld", {
    "@context": "https://schema.org",
    "@type": "Store",
    name: APP_DISPLAY_NAME,
    url: siteUrl,
    description: DEFAULT_DESCRIPTION,
    priceRange: "₹₹",
  });
}

export function updateWebRouteSeo(routeName, { productName } = {}) {
  if (Platform.OS !== "web" || typeof document === "undefined") return;

  const siteUrl = getWebSiteUrl();
  const base = ROUTE_SEO[routeName] || ROUTE_SEO.Home;
  let title = base.title;
  let description = base.description;
  let path = base.path;

  if (routeName === "Product" && productName) {
    title = `${productName} — ${APP_DISPLAY_NAME}`;
    description = `Buy ${productName} from Zeevan. ${DEFAULT_DESCRIPTION}`;
  }

  document.title = title;
  upsertMeta("name", "description", description);
  upsertMeta("property", "og:title", title);
  upsertMeta("property", "og:description", description);
  upsertMeta("property", "og:url", `${siteUrl}${path}`);
  upsertMeta("name", "twitter:title", title);
  upsertMeta("name", "twitter:description", description);
  upsertLink("canonical", `${siteUrl}${path}`);

  const robots = base.noindex ? "noindex, nofollow" : "index, follow, max-image-preview:large";
  upsertMeta("name", "robots", robots);
}

/** Resolve expo web name for static export hints. */
export function getAppSeoName() {
  return Constants.expoConfig?.name || APP_DISPLAY_NAME;
}
