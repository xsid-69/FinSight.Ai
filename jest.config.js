process.env.NODE_ENV = "test";
process.env.BABEL_ENV = "test";
process.env.EXPO_OS = process.env.EXPO_OS || "android";

module.exports = {
  preset: "jest-expo",
  setupFilesAfterEnv: ["<rootDir>/jest.setup.ts"],
  clearMocks: true,
  restoreMocks: true,
  moduleNameMapper: {
    "^react-native-gifted-charts$": "<rootDir>/jest.giftedChartsMock.js",
    "^lucide-react-native$": "<rootDir>/node_modules/lucide-react-native/dist/cjs/lucide-react-native.js",
  },
  testPathIgnorePatterns: ["/node_modules/", "/helpers/"],
};
