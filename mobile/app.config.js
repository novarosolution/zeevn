/* eslint-env node */
/**
 * Extends app.json (location copy for delivery + live share).
 * Do not add `react-native-maps` as an Expo config plugin — it is not a valid plugin and breaks config/export.
 * Configure Google Maps API keys via native projects after `expo prebuild`, or see Expo docs for maps + env.
 */
const { expo } = require("./app.json");

module.exports = {
  expo: {
    ...expo,
    extra: {
      ...(expo.extra || {}),
      eas: {
        projectId: "f5017187-2f56-48d7-a1f2-741be2d8383b",
      },
      apiUrl: process.env.EXPO_PUBLIC_API_URL,
      googleOAuthWebClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
      googleOAuthIosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID,
      googleOAuthAndroidClientId: process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID,
      googleOAuthClientId: process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID,
      appleOAuthClientId: process.env.EXPO_PUBLIC_APPLE_CLIENT_ID,
    },
    ios: {
      ...expo.ios,
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
      image: "./assets/splash-icon.png",
      resizeMode: "contain",
      backgroundColor: "#FAF8F4",
      dark: {
        image: "./assets/splash-icon.png",
        backgroundColor: "#151210",
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
          image: "./assets/splash-icon.png",
          resizeMode: "contain",
          backgroundColor: "#F7F2E8",
          dark: {
            image: "./assets/splash-icon.png",
            backgroundColor: "#1A1714",
          },
        },
      ],
      [
        "@howincodes/expo-dynamic-app-icon",
        {
          light: {
            ios: "./assets/app-icon-light.png",
            android: {
              foregroundImage: "./assets/app-icon-light.png",
              backgroundColor: "#FAF8F4",
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
