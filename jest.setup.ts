process.env.EXPO_OS = process.env.EXPO_OS ?? "android";
process.env.EXPO_PUBLIC_FIREBASE_API_KEY = process.env.EXPO_PUBLIC_FIREBASE_API_KEY ?? "test-api-key";
process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN = process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN ?? "test.firebaseapp.com";
process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID = process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID ?? "test-project";
process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET = process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET ?? "test.appspot.com";
process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID = process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ?? "123456789";
process.env.EXPO_PUBLIC_FIREBASE_APP_ID = process.env.EXPO_PUBLIC_FIREBASE_APP_ID ?? "1:123456789:web:abcdef";

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

jest.mock("@react-native-async-storage/async-storage", () =>
  require("@react-native-async-storage/async-storage/jest/async-storage-mock")
);

jest.mock("lucide-react-native", () => {
  const React = require("react");
  const { View } = require("react-native");
  const Icon = (props: Record<string, unknown>) => React.createElement(View, props);
  return new Proxy(
    { __esModule: true },
    { get: (_target: unknown, property: string) => (property === "__esModule" ? true : Icon) },
  );
});

jest.mock("@dr.pogodin/react-native-sms-listener", () => ({
  __esModule: true,
  default: {
    addListener: jest.fn(() => ({
      remove: jest.fn(),
    })),
  },
}));

jest.mock("firebase/app", () => ({
  __esModule: true,
  getApp: jest.fn(),
  getApps: jest.fn(() => [{ name: "[DEFAULT]" }]),
  initializeApp: jest.fn(),
}));

jest.mock("firebase/auth", () => ({
  __esModule: true,
  getAuth: jest.fn(() => ({ currentUser: null })),
  getReactNativePersistence: jest.fn(),
  initializeAuth: jest.fn(() => ({ currentUser: null })),
}));

jest.mock("firebase/firestore", () => ({
  __esModule: true,
  collection: jest.fn(),
  doc: jest.fn((_db?: unknown, ...parts: unknown[]) => ({ id: "mock-doc-id", path: parts.join("/") })),
  getDoc: jest.fn().mockResolvedValue({ exists: () => false, data: () => ({}) }),
  setDoc: jest.fn().mockResolvedValue(undefined),
  getDocs: jest.fn().mockResolvedValue({ docs: [] }),
  onSnapshot: jest.fn(() => jest.fn()),
  writeBatch: jest.fn(() => ({
    set: jest.fn(),
    commit: jest.fn().mockResolvedValue(undefined),
  })),
}));

