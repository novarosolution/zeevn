const PREMIUM_SHIM_MESSAGE =
  "Deprecated: import from components/ui (e.g. Button, Input, Card) or @/components/ui instead of Premium* shims.";

module.exports = {
  root: true,
  extends: ["expo", "plugin:react-native-a11y/basic"],
  env: {
    es2022: true,
    browser: true,
    node: true,
    jest: true,
  },
  ignorePatterns: ["dist/*", ".tmp-*", "dist-export-check/**", "dist-export-web-check/**"],
  overrides: [
    {
      files: ["**/*.{js,jsx,ts,tsx}"],
      rules: {
        "no-restricted-imports": [
          "warn",
          {
            paths: [
              { name: "./PremiumButton", message: PREMIUM_SHIM_MESSAGE },
              { name: "./PremiumInput", message: PREMIUM_SHIM_MESSAGE },
              { name: "./PremiumCard", message: PREMIUM_SHIM_MESSAGE },
              { name: "./PremiumEmptyState", message: PREMIUM_SHIM_MESSAGE },
              { name: "./PremiumSectionHeader", message: PREMIUM_SHIM_MESSAGE },
              { name: "./PremiumErrorBanner", message: PREMIUM_SHIM_MESSAGE },
              { name: "./PremiumChip", message: PREMIUM_SHIM_MESSAGE },
              { name: "./PremiumLoader", message: PREMIUM_SHIM_MESSAGE },
              { name: "./PremiumStatCard", message: PREMIUM_SHIM_MESSAGE },
              { name: "./PremiumStickyBar", message: PREMIUM_SHIM_MESSAGE },
              { name: "./PremiumSwitch", message: PREMIUM_SHIM_MESSAGE },
              { name: "./PremiumConfirmDialog", message: PREMIUM_SHIM_MESSAGE },
            ],
            patterns: [{ group: ["**/components/ui/Premium*"], message: PREMIUM_SHIM_MESSAGE }],
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
      rules: {
        "react-native-a11y/has-accessibility-hint": "off",
        "react-native-a11y/has-valid-accessibility-descriptors": "warn",
        "react-native-a11y/has-valid-accessibility-role": "warn",
        "react-native-a11y/has-valid-accessibility-state": "warn",
        "react-native-a11y/has-valid-accessibility-value": "warn",
        "react-native-a11y/has-valid-important-for-accessibility": "warn",
        "react-native-a11y/no-nested-touchables": "error",
      },
    },
  ],
};
