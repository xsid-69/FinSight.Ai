import React from "react";
import { fireEvent, render } from "@testing-library/react-native";
import * as Haptics from "expo-haptics";

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
  };
});

jest.mock("@tamagui/lucide-icons", () => {
  const React = require("react");
  const { View } = require("react-native");
  const Icon = (props: Record<string, unknown>) => React.createElement(View, props);
  return new Proxy(
    { __esModule: true },
    { get: (_target, property) => (property === "__esModule" ? true : Icon) },
  );
});

jest.mock("expo-haptics", () => ({
  ImpactFeedbackStyle: { Medium: "Medium" },
  impactAsync: jest.fn().mockResolvedValue(undefined),
}));

import { StatementUploadCard } from "../StatementUploadCard";

beforeEach(() => {
  jest.clearAllMocks();
});

describe("StatementUploadCard", () => {
  test("presents truthful local-parse/cloud-save copy and invokes the CSV picker action", async () => {
    const onUpload = jest.fn();
    const screen = await render(<StatementUploadCard onUpload={onUpload} />);
    const action = screen.getByRole("button", { name: "Choose CSV bank statement" });

    expect(screen.getByText(/finds the transaction table/i)).toBeTruthy();
    expect(screen.getByText(/privacy-safe import/i)).toBeTruthy();
    expect(screen.getByText(/original csv is never sent to firestore/i)).toBeTruthy();
    expect(action.props.accessibilityHint).toBe("Select one CSV file exported by your bank");
    expect(action.props.accessibilityState).toEqual({ busy: false, disabled: false });

    fireEvent.press(action);

    expect(onUpload).toHaveBeenCalledTimes(1);
    expect(Haptics.impactAsync).toHaveBeenCalledWith(Haptics.ImpactFeedbackStyle.Medium);
  });

  test("exposes a disabled busy state and blocks duplicate interaction", async () => {
    const onUpload = jest.fn();
    const screen = await render(<StatementUploadCard onUpload={onUpload} busy />);
    const action = screen.getByRole("button", { name: "Importing bank statement" });

    expect(action.props.accessibilityState).toEqual({ busy: true, disabled: true });
    expect(action.props.pointerEvents).toBe("none");
    expect(screen.getByText("Sanitizing and analyzing…")).toBeTruthy();

    fireEvent.press(action);

    expect(onUpload).not.toHaveBeenCalled();
    expect(Haptics.impactAsync).not.toHaveBeenCalled();
  });

  test("announces a retryable error and changes the action label", async () => {
    const screen = await render(
      <StatementUploadCard errorMessage="The CSV headers are unsupported." onUpload={jest.fn()} />,
    );

    expect(screen.getByRole("alert")).toBeTruthy();
    expect(screen.getByText("The CSV headers are unsupported.")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Retry CSV statement import" })).toBeTruthy();
  });
});
