process.env.EXPO_OS = "android";
process.env.NODE_ENV = "test";

const { run } = require("jest");

run([
  "--runInBand",
  "--watch=false",
  "--runTestsByPath",
  "src/screens/home/__tests__/preservation.property.test.ts",
  "src/screens/home/__tests__/preservation.interaction.test.tsx",
]);
