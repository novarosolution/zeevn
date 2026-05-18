// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require("eslint/config");
const expoConfig = require("eslint-config-expo/flat");
const reactNativeA11y = require("eslint-plugin-react-native-a11y");

const PREMIUM_SHIM_MESSAGE =
  "Deprecated: import from components/ui (e.g. Button, Input, Card) or @/components/ui instead of Premium* shims.";

module.exports = defineConfig([
  expoConfig,
  {
    ignores: [
      "dist/*",
      ".tmp-*",
      "dist-export-check/**",
      "dist-export-web-check/**",
    ],
  },
  {
    files: ["**/*.{js,jsx,ts,tsx}"],
    rules: {
      "no-restricted-imports": [
        "warn",
        {
          paths: [
            {
              name: "./PremiumButton",
              message: PREMIUM_SHIM_MESSAGE,
            },
            {
              name: "./PremiumInput",
              message: PREMIUM_SHIM_MESSAGE,
            },
            {
              name: "./PremiumCard",
              message: PREMIUM_SHIM_MESSAGE,
            },
            {
              name: "./PremiumEmptyState",
              message: PREMIUM_SHIM_MESSAGE,
            },
            {
              name: "./PremiumSectionHeader",
              message: PREMIUM_SHIM_MESSAGE,
            },
            {
              name: "./PremiumErrorBanner",
              message: PREMIUM_SHIM_MESSAGE,
            },
            {
              name: "./PremiumChip",
              message: PREMIUM_SHIM_MESSAGE,
            },
            {
              name: "./PremiumLoader",
              message: PREMIUM_SHIM_MESSAGE,
            },
            {
              name: "./PremiumStatCard",
              message: PREMIUM_SHIM_MESSAGE,
            },
            {
              name: "./PremiumStickyBar",
              message: PREMIUM_SHIM_MESSAGE,
            },
            {
              name: "./PremiumSwitch",
              message: PREMIUM_SHIM_MESSAGE,
            },
            {
              name: "./PremiumConfirmDialog",
              message: PREMIUM_SHIM_MESSAGE,
            },
          ],
          patterns: [
            {
              group: ["**/components/ui/Premium*"],
              message: PREMIUM_SHIM_MESSAGE,
            },
          ],
        },
      ],
    },
  },
  {
    files: ["src/components/ui/Premium*.js"],
    rules: {
      "no-restricted-imports": "off",
    },
  },
  {
    files: ["src/**/*.{js,jsx,ts,tsx}"],
    plugins: {
      "react-native-a11y": reactNativeA11y,
    },
    rules: {
      ...reactNativeA11y.configs.basic.rules,
      "react-native-a11y/has-accessibility-hint": "off",
      "react-native-a11y/has-valid-accessibility-descriptors": "warn",
      "react-native-a11y/has-valid-accessibility-role": "warn",
      "react-native-a11y/has-valid-accessibility-state": "warn",
      "react-native-a11y/has-valid-accessibility-value": "warn",
      "react-native-a11y/has-valid-important-for-accessibility": "warn",
      "react-native-a11y/no-nested-touchables": "error",
    },
  },
]);
