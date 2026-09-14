import React from "react";
import { act, cleanup, fireEvent, render, waitFor } from "@testing-library/react-native";

const mockUseAuth = jest.fn();
const mockImportCsvStatement = jest.fn();
const mockUsePreventRemove = jest.fn();

jest.mock("@react-navigation/native", () => ({
  usePreventRemove: (...args: unknown[]) => mockUsePreventRemove(...args),
}));

jest.mock("tamagui", () => {
  const React = require("react");
  const ReactNative = require("react-native");
  const normalizeViewProps = (props: Record<string, unknown>) => ({
    ...props,
    accessible:
      props.accessible ?? Boolean(props.accessibilityRole || props.accessibilityLabel || props.onPress),
  });
  const MockView = React.forwardRef((props: Record<string, unknown>, ref: React.Ref<unknown>) =>
    React.createElement(ReactNative.View, { ...normalizeViewProps(props), ref }, props.children),
  );
  const MockText = React.forwardRef((props: Record<string, unknown>, ref: React.Ref<unknown>) =>
    React.createElement(ReactNative.Text, { ...props, ref }, props.children),
  );
  return {
    __esModule: true,
    View: MockView,
    XStack: MockView,
    YStack: MockView,
    Text: MockText,
    ScrollView: ReactNative.ScrollView,
  };
});

jest.mock("moti", () => {
  const React = require("react");
  const { View } = require("react-native");
  return {
    MotiView: ({ children, ...props }: { children?: React.ReactNode }) =>
      React.createElement(View, props, children),
  };
});

jest.mock("react-native-safe-area-context", () => ({
  useSafeAreaInsets: () => ({ top: 0, right: 0, bottom: 24, left: 0 }),
}));

jest.mock("@tamagui/lucide-icons", () => {
  const React = require("react");
  const { View } = require("react-native");
  const Icon = (props: Record<string, unknown>) => React.createElement(View, props);
  return new Proxy(
    { __esModule: true },
    { get: (_target, property) => (property === "__esModule" ? true : Icon) },
  );
});

jest.mock("../../components/finsight", () => {
  const React = require("react");
  const { Pressable, Text, View } = require("react-native");
  return {
    FinSightShell: ({ children, title }: { children?: React.ReactNode; title?: string }) =>
      React.createElement(View, null, React.createElement(Text, null, title), children),
    Card: ({ children }: { children?: React.ReactNode }) => React.createElement(View, null, children),
    StatementUploadCard: ({
      onUpload,
      busy,
      errorMessage,
    }: {
      onUpload?: () => void;
      busy?: boolean;
      errorMessage?: string | null;
    }) =>
      React.createElement(
        View,
        null,
        React.createElement(
          Pressable,
          {
            accessibilityRole: "button",
            accessibilityLabel: busy
              ? "Importing bank statement"
              : errorMessage
                ? "Retry CSV statement import"
                : "Choose CSV bank statement",
            accessibilityState: { busy: Boolean(busy), disabled: Boolean(busy) },
            onPress: busy ? undefined : onUpload,
          },
          React.createElement(Text, null, busy ? "Importing securely…" : "Choose CSV statement"),
        ),
        errorMessage
          ? React.createElement(
              View,
              { accessible: true, accessibilityRole: "alert" },
              React.createElement(Text, null, errorMessage),
            )
          : null,
      ),
  };
});

jest.mock("../../context/AuthContext", () => ({
  useAuth: () => mockUseAuth(),
}));

jest.mock("../../services/csvService", () => ({
  importCsvStatement: (...args: unknown[]) => mockImportCsvStatement(...args),
}));

jest.mock("../../hooks/useReducedMotion", () => ({
  useReducedMotion: () => true,
}));

import { StatementAnalyzerScreen } from "../StatementAnalyzerScreen";

const SUCCESS_RESULT = {
  canceled: false,
  fileName: "march-statement.csv",
  statementId: "stmt_0123456789abcdef",
  statementDisplayName: "March statement",
  importedCount: 12,
  savedCount: 12,
  debitCount: 7,
  creditCount: 5,
  skippedCount: 2,
  batchCount: 1,
  diagnostics: [],
  cloudSync: {
    status: "synced",
    requestedCount: 12,
    savedCount: 12,
    pendingCount: 0,
    message: "All sanitized transactions were saved to Firestore.",
  },
};

async function press(element: any) {
  await act(async () => {
    fireEvent.press(element);
    await Promise.resolve();
  });
}

beforeEach(() => {
  cleanup();
  jest.clearAllMocks();
  mockImportCsvStatement.mockReset();
  mockUseAuth.mockReturnValue({ user: { uid: "firebase-user-1" } });
});

describe("StatementAnalyzerScreen CSV import flow", () => {
  test("treats picker cancellation as a quiet return to the ready state", async () => {
    mockImportCsvStatement.mockResolvedValue({
      canceled: true,
      importedCount: 0,
      savedCount: 0,
      debitCount: 0,
      creditCount: 0,
      skippedCount: 0,
    });
    const screen = await render(<StatementAnalyzerScreen />);

    await press(screen.getByRole("button", { name: "Choose CSV bank statement" }));

    await waitFor(() => expect(mockImportCsvStatement).toHaveBeenCalledWith("firebase-user-1"));
    await waitFor(() =>
      expect(screen.getByRole("button", { name: "Choose CSV bank statement" })).toBeTruthy(),
    );
    expect(screen.queryByText("Statement analyzed")).toBeNull();
    expect(screen.queryByRole("alert")).toBeNull();
  });

  test("exposes busy accessibility state and prevents duplicate imports", async () => {
    let resolveImport: ((result: typeof SUCCESS_RESULT) => void) | undefined;
    mockImportCsvStatement.mockReturnValue(
      new Promise((resolve) => {
        resolveImport = resolve;
      }),
    );
    const screen = await render(<StatementAnalyzerScreen />);
    const originalAction = screen.getByRole("button", { name: "Choose CSV bank statement" });

    await press(originalAction);

    await waitFor(() => {
      const busyAction = screen.getByRole("button", { name: "Importing bank statement" });
      expect(busyAction.props.accessibilityState).toEqual({ busy: true, disabled: true });
    });

    await press(originalAction);
    expect(mockImportCsvStatement).toHaveBeenCalledTimes(1);

    await act(async () => {
      resolveImport?.(SUCCESS_RESULT);
      await Promise.resolve();
    });
    await waitFor(() => expect(screen.getByText("Statement analyzed")).toBeTruthy());
  });

  test("shows real imported counts and returns analysis and transactions to scoped Insights views", async () => {
    mockImportCsvStatement.mockResolvedValue(SUCCESS_RESULT);
    const navigation = { popTo: jest.fn(), goBack: jest.fn() };
    const screen = await render(<StatementAnalyzerScreen navigation={navigation} />);

    await press(screen.getByRole("button", { name: "Choose CSV bank statement" }));

    await waitFor(() => expect(screen.getByText("Statement analyzed")).toBeTruthy());
    expect(screen.getByText("march-statement.csv")).toBeTruthy();
    expect(screen.getByText("12")).toBeTruthy();
    expect(screen.getByText("7")).toBeTruthy();
    expect(screen.getByText("5")).toBeTruthy();
    expect(screen.getByText("2 invalid or summary rows were skipped.")).toBeTruthy();

    await press(screen.getByRole("button", { name: "View saved analysis in Insights" }));
    expect(navigation.popTo).toHaveBeenNthCalledWith(1, "Main", {
      screen: "Home",
      params: {
        tab: "Insights",
        insightsView: "analysis",
        statementId: "stmt_0123456789abcdef",
      },
    });

    await press(screen.getByRole("button", { name: "View statement transactions in Insights" }));
    expect(navigation.popTo).toHaveBeenNthCalledWith(2, "Main", {
      screen: "Home",
      params: {
        tab: "Insights",
        insightsView: "transactions",
        statementId: "stmt_0123456789abcdef",
      },
    });

    await press(screen.getByRole("button", { name: "Import another CSV statement" }));
    await waitFor(() =>
      expect(screen.getByRole("button", { name: "Choose CSV bank statement" })).toBeTruthy(),
    );
  });

  test("surfaces parser errors and offers a successful retry", async () => {
    mockImportCsvStatement
      .mockRejectedValueOnce(new Error("This statement format is not supported. Missing credit column."))
      .mockResolvedValueOnce(SUCCESS_RESULT);
    const screen = await render(<StatementAnalyzerScreen />);

    await press(screen.getByRole("button", { name: "Choose CSV bank statement" }));

    await waitFor(() =>
      expect(screen.getByText("This statement format is not supported. Missing credit column.")).toBeTruthy(),
    );
    expect(screen.getByRole("alert")).toBeTruthy();

    await press(screen.getByRole("button", { name: "Retry CSV statement import" }));

    await waitFor(() => expect(screen.getByText("Statement analyzed")).toBeTruthy());
    expect(mockImportCsvStatement).toHaveBeenCalledTimes(2);
  });

  test("keeps local analysis visible when cloud sync is unavailable", async () => {
    mockImportCsvStatement.mockResolvedValue({
      ...SUCCESS_RESULT,
      savedCount: 0,
      cloudSync: {
        status: "unavailable",
        requestedCount: 12,
        savedCount: 0,
        pendingCount: 12,
        message: "Your file was accepted and analyzed locally. Cloud sync is unavailable right now, but the insights below are ready.",
      },
    });
    const screen = await render(<StatementAnalyzerScreen />);

    await press(screen.getByRole("button", { name: "Choose CSV bank statement" }));

    await waitFor(() => expect(screen.getByText("Statement analyzed")).toBeTruthy());
    expect(screen.getByRole("alert", { name: "Cloud sync status" })).toBeTruthy();
    expect(screen.getByText(/file was accepted and analyzed locally/i)).toBeTruthy();
    expect(screen.queryByRole("button", { name: "View statement transactions in Insights" })).toBeNull();
    expect(screen.queryByRole("button", { name: "View saved analysis in Insights" })).toBeNull();
  });

  test("blocks unauthenticated imports with a clear retry surface", async () => {
    mockUseAuth.mockReturnValue({ user: null });
    const screen = await render(<StatementAnalyzerScreen />);

    await press(screen.getByRole("button", { name: "Choose CSV bank statement" }));

    await waitFor(() => expect(screen.getByText("Sign in before importing a bank statement.")).toBeTruthy());
    expect(mockImportCsvStatement).not.toHaveBeenCalled();
  });
});
