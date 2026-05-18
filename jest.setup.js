import "@testing-library/jest-native/extend-expect";

jest.mock("@react-native-async-storage/async-storage", () =>
  require("@react-native-async-storage/async-storage/jest/async-storage-mock")
);

jest.mock("expo-constants", () => ({
  expoConfig: { extra: { publicConfig: {} }, version: "1.0.0" },
  manifest2: { extra: { publicConfig: {} } },
}));

jest.mock("./src/observability/sentry", () => ({
  initSentry: jest.fn(),
  setSentryRoute: jest.fn(),
  setSentryUser: jest.fn(),
  clearSentryUser: jest.fn(),
  captureException: jest.fn(),
  captureMessage: jest.fn(),
  captureNetworkFailure: jest.fn(),
  captureSlowRender: jest.fn(),
  wrapWithSentry: (c) => c,
  Sentry: {},
}));
