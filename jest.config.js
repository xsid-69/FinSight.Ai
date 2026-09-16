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
  },
  testPathIgnorePatterns: ["/node_modules/", "/helpers/"],
};
