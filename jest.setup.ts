process.env.EXPO_OS = process.env.EXPO_OS ?? "android";

const originalConsoleWarn = console.warn.bind(console);
console.warn = (...args: unknown[]) => {
  const message = args[0];
  if (
    typeof message === "string" &&
    message.includes("The global process.env.EXPO_OS is not defined")
  ) {
    return;
  }
  originalConsoleWarn(...args);
};

require("react-native-gesture-handler/jestSetup");

jest.mock("react-native-reanimated", () => {
  const Reanimated = jest.requireActual("react-native-reanimated/mock");
  Reanimated.default.call = () => undefined;
  return Reanimated;
});

jest.mock("react-native-worklets", () => ({
  createSerializable: (value: unknown) => value,
  runOnUI: (worklet: (...args: unknown[]) => unknown) => worklet,
  scheduleOnRN: <Args extends unknown[]>(
    callback: (...args: Args) => unknown,
    ...args: Args
  ) => callback(...args),
}));
