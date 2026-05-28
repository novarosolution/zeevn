/** @type {import('jest').Config} */
module.exports = {
  projects: [
    {
      displayName: "app",
      preset: "jest-expo",
      setupFilesAfterEnv: ["<rootDir>/jest.setup.js"],
      testMatch: ["<rootDir>/src/**/__tests__/**/*.test.js", "<rootDir>/tests/**/**/*.test.js"],
      moduleNameMapper: {
        "^@/(.*)$": "<rootDir>/src/$1",
      },
      transformIgnorePatterns: [
        "node_modules/(?!((jest-)?react-native|@react-native(-community)?)|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|react-native-reanimated)",
      ],
      collectCoverageFrom: [
        "src/utils/productCart.js",
        "src/utils/deepLink.js",
        "src/services/normalizeProduct.js",
        "src/context/AuthContext.js",
        "src/components/auth/authNavigation.js",
        "!src/**/__tests__/**",
      ],
      coverageThreshold: {
        "./src/utils/productCart.js": {
          branches: 55,
          functions: 100,
          lines: 100,
          statements: 100,
        },
        "./src/utils/deepLink.js": {
          branches: 75,
          functions: 100,
          lines: 85,
          statements: 75,
        },
        "./src/services/normalizeProduct.js": {
          branches: 55,
          functions: 50,
          lines: 80,
          statements: 80,
        },
        "src/context/AuthContext.js": {
          branches: 60,
          functions: 60,
          lines: 60,
          statements: 60,
        },
        "src/components/auth/authNavigation.js": {
          branches: 55,
          functions: 60,
          lines: 55,
          statements: 55,
        },
      },
    },
    {
      displayName: "backend",
      testEnvironment: "node",
      testMatch: ["<rootDir>/backend/**/__tests__/**/*.test.js"],
      collectCoverageFrom: [
        "backend/src/utils/coupon.js",
        "backend/src/controllers/orderController.js",
        "!backend/**/__tests__/**",
      ],
      coveragePathIgnorePatterns: [
        "backend/src/controllers/couponController.js",
      ],
      coverageThreshold: {
        "./backend/src/utils/coupon.js": {
          branches: 55,
          functions: 100,
          lines: 80,
          statements: 75,
        },
        "./backend/src/controllers/orderController.js": {
          branches: 15,
          functions: 30,
          lines: 22,
          statements: 22,
        },
      },
    },
  ],
  coverageDirectory: "<rootDir>/coverage",
  coverageReporters: ["text", "text-summary", "lcov", "html"],
  forceExit: true,
};
