const { getDefaultConfig } = require("expo/metro-config");

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// Tamagui: allow .mjs / .cjs resolution used by @tamagui packages.
config.resolver.sourceExts = [
  ...config.resolver.sourceExts,
  "mjs",
  "cjs",
];

// Limit worker pool to prevent Node 24 V8 zone allocation exhaust on Windows
config.maxWorkers = 2;

config.resolver.extraNodeModules = {
  ...config.resolver.extraNodeModules,
  buffer: require.resolve("buffer/"),
  crypto: require.resolve("./src/services/cryptoShim.js"),
  "create-hash": require.resolve("create-hash/browser"),
  "create-hmac": require.resolve("create-hmac/browser"),
  "browserify-cipher": require.resolve("browserify-cipher/browser"),
  pbkdf2: require.resolve("pbkdf2/browser"),
  stream: require.resolve("stream-browserify"),
  vm: require.resolve("vm-browserify"),
  events: require.resolve("events/"),
  string_decoder: require.resolve("string_decoder/"),
  timers: require.resolve("timers-browserify"),
  path: require.resolve("path-browserify"),
};

module.exports = config;
