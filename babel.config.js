module.exports = function (api) {
  api.cache(true);
  return {
    presets: ["babel-preset-expo"],
    plugins: [
      [
        "@tamagui/babel-plugin",
        {
          components: ["tamagui"],
          config: "./tamagui.config.ts",
          logTimings: true,
          disableExtraction: process.env.NODE_ENV === "development",
        },
      ],
      "transform-inline-environment-variables",
      // Reanimated 4 uses the worklets plugin. Must remain LAST.
      "react-native-worklets/plugin",
    ],
  };
};
