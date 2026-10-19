/* eslint-env node */
/**
 * Extends app.json (location copy for delivery + live share).
 * Do not add `react-native-maps` as an Expo config plugin — it is not a valid plugin and breaks config/export.
 * Configure Google Maps API keys via native projects after `expo prebuild`, or see Expo docs for maps + env.
 */
const { expo } = require("./app.json");

/** Hosted API on Render — https://zeevn-i760.onrender.com */
const PRODUCTION_API_URL = "https://zeevn-i760.onrender.com";
const PRODUCTION_SITE_URL = "https://zeevan.shop";

const isProductionBundle =
  process.env.NODE_ENV === "production" ||
  process.env.EAS_BUILD === "true" ||
  process.env.EAS_BUILD_PROFILE === "production";

module.exports = {
  expo: {
    ...expo,
    extra: {
      ...(expo.extra || {}),
      eas: {
        projectId: "f5017187-2f56-48d7-a1f2-741be2d8383b",
      },
      apiUrl:
        process.env.EXPO_PUBLIC_API_URL ||
        (isProductionBundle ? PRODUCTION_API_URL : undefined),
      siteUrl:
        process.env.EXPO_PUBLIC_SITE_URL ||
        (isProductionBundle ? PRODUCTION_SITE_URL : "https://www.zeevan.app"),
      googleOAuthWebClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
      googleOAuthIosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID,
      googleOAuthAndroidClientId: process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID,
      googleOAuthClientId: process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID,
      appleOAuthClientId: process.env.EXPO_PUBLIC_APPLE_CLIENT_ID,
    },
    ios: {
      ...expo.ios,
      // Native projects still use this id; display name / icons are Zeevan.
      bundleIdentifier: "com.novarosolution.kankreg",
      usesAppleSignIn: true,
      infoPlist: {
        ...expo.ios?.infoPlist,
        NSLocationWhenInUseUsageDescription:
          "Zeevan uses your location for delivery addresses and optional live location sharing while you deliver orders.",
      },
    },
    android: {
      ...expo.android,
      package: "com.novarosolution.kankreg",
    },
    splash: {
      image: "./assets/splash-mark.png",
      resizeMode: "contain",
      backgroundColor: "#FFFFFF",
      dark: {
        image: "./assets/splash-mark-dark.png",
        backgroundColor: "#1A1714",
      },
    },
    icon: "./assets/app-icon-light.png",
    plugins: [
      ...(expo.plugins || []),
      "expo-dev-client",
      "expo-web-browser",
      [
        "expo-splash-screen",
        {
          image: "./assets/splash-mark.png",
          resizeMode: "contain",
          backgroundColor: "#FFFFFF",
          dark: {
            image: "./assets/splash-mark-dark.png",
            backgroundColor: "#1A1714",
          },
          ios: { imageWidth: 240 },
          android: { imageWidth: 288 },
        },
      ],
      [
        "@howincodes/expo-dynamic-app-icon",
        {
          light: {
            ios: "./assets/app-icon-light.png",
            android: {
              foregroundImage: "./assets/app-icon-light.png",
              backgroundColor: "#FFFFFF",
            },
          },
          dark: {
            ios: "./assets/app-icon-dark.png",
            android: {
              foregroundImage: "./assets/app-icon-dark.png",
              backgroundColor: "#1A1714",
            },
          },
        },
      ],
    ],
  },
};
