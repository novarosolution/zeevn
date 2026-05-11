/* eslint-env node */
/**
 * Extends the base Expo config from `app.json` for deploy-time tweaks.
 * Do not add `react-native-maps` as an Expo config plugin — it is not a valid
 * plugin and breaks config/export.
 * Configure Google Maps API keys via native projects after `expo prebuild`, or
 * see Expo docs for maps + env.
 */
module.exports = ({ config }) => ({
  ...config,
  ios: {
    ...config.ios,
    infoPlist: {
      ...config.ios?.infoPlist,
      NSLocationWhenInUseUsageDescription:
        "Zeevan uses your location for delivery addresses and optional live location sharing while you deliver orders.",
    },
  },
});
