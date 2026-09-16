module.exports = function (api) {
  const isJestCaller = api.caller((caller) => caller?.name === "babel-jest");
  const isTest = isJestCaller
    || process.env.NODE_ENV === "test"
    || process.env.BABEL_ENV === "test"
    || process.env.JEST_WORKER_ID !== undefined;

  return {
    presets: ["babel-preset-expo"],
    plugins: [
      [
        "@tamagui/babel-plugin",
        {
          components: ["tamagui"],
          config: "./tamagui.config.ts",
          logTimings: !isTest && process.env.NODE_ENV !== "test",
          disable: isTest || process.env.NODE_ENV === "test",
          disableExtraction: process.env.NODE_ENV === "development",
        },
      ],
      [
        "transform-inline-environment-variables",
        { exclude: ["EXPO_OS"] },
      ],
      // Reanimated 4 uses the worklets plugin. Must remain LAST.
      "react-native-worklets/plugin",
    ],
  };
};
