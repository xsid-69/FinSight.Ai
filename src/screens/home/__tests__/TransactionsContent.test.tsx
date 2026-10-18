import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react-native";
import { TransactionsContent } from "../TransactionsContent";

jest.mock("react-native-reanimated", () => {
  const React = require("react");
  const { View } = require("react-native");
  return {
    __esModule: true,
    default: {
      View: ({ children, ...props }: { children?: React.ReactNode }) =>
        React.createElement(View, props, children),
      createAnimatedComponent: (Component: unknown) => Component,
    },
    useSharedValue: (initialValue: number) => ({ value: initialValue }),
    useAnimatedStyle: (updater: () => Record<string, unknown>) => updater(),
    useEvent: (callback: (...args: unknown[]) => unknown) => callback,
  };
});

jest.mock("tamagui", () => {
  const React = require("react");
  const ReactNative = require("react-native");
  const normalizeViewProps = (props: Record<string, unknown>) => ({
    ...props,
    accessible:
      props.accessible ?? Boolean(props.accessibilityRole || props.accessibilityLabel || props.onPress),
  });
  const view = React.forwardRef((props: Record<string, unknown>, ref: React.Ref<unknown>) =>
    React.createElement(ReactNative.View, { ...normalizeViewProps(props), ref }),
  );
  const text = React.forwardRef((props: Record<string, unknown>, ref: React.Ref<unknown>) =>
    React.createElement(ReactNative.Text, { ...props, ref }),
  );
  const scrollView = React.forwardRef((props: Record<string, unknown>, ref: React.Ref<unknown>) =>
    React.createElement(ReactNative.ScrollView, {
      ...props,
      ref,
      testID: props.testID ?? "mock-scroll-view",
    }),
  );
  return {
    View: view,
    Text: text,
    XStack: view,
    YStack: view,
    ZStack: view,
    ScrollView: scrollView,
    AnimatePresence: ({ children }: { children?: React.ReactNode }) =>
      React.createElement(React.Fragment, null, children),
  };
});

jest.mock("../../../hooks/useReducedMotion", () => ({
  useReducedMotion: () => false,
}));



jest.mock("react-native-safe-area-context", () => ({
  useSafeAreaInsets: () => ({ top: 47, left: 0, right: 0, bottom: 34 }),
}));

jest.mock("@tamagui/lucide-icons", () => {
  const React = require("react");
  const { View } = require("react-native");
  const Icon = (props: Record<string, unknown>) => React.createElement(View, props);
  return new Proxy({ __esModule: true }, { get: (_target, property) => property === "__esModule" ? true : Icon });
});

jest.mock("moti", () => {
  const React = require("react");
  const { View } = require("react-native");
  return {
    MotiView: ({ children, ...props }: { children?: React.ReactNode }) =>
      React.createElement(View, props, children),
  };
});

jest.mock("expo-haptics", () => ({
  selectionAsync: jest.fn(),
  impactAsync: jest.fn(),
  notificationAsync: jest.fn(),
  ImpactFeedbackStyle: { Light: "light", Medium: "medium", Heavy: "heavy" },
  NotificationFeedbackType: { Success: "success", Warning: "warning", Error: "error" },
}));

describe("TransactionsContent interactive features", () => {
  const mockTransactions = [
    {
      id: "sms_1",
      date: "2026-09-26",
      amount: 69.5,
      type: "DEBIT" as const,
      merchant: "Zomato",
      sanitizedDescription: "Zomato",
      category: "FOOD",
      accountMask: "A/c XX4321",
      referenceNo: "112233445566",
      source: "SMS_AUTO_PARSE",
    },
    {
      id: "sms_2",
      date: "2026-09-26",
      amount: 1500,
      type: "CREDIT" as const,
      merchant: "Swiggy Refund",
      sanitizedDescription: "Swiggy Refund",
      category: "FOOD",
      accountMask: "A/c XX4321",
      referenceNo: "998877665544",
      source: "SMS_AUTO_PARSE",
    },
  ];

  test("renders header, settlement stream and Add button without clear button", async () => {
    const rendered = await render(
      <TransactionsContent
        transactions={mockTransactions as any}
        smsPermissionGranted={true}
      />
    );
    expect(rendered.getByText("Live Transactions")).toBeTruthy();
    expect(rendered.getByText("Settlement Stream")).toBeTruthy();
    expect(rendered.getByTestId("add-manual-tx-btn")).toBeTruthy();
    expect(rendered.queryByTestId("clear-all-sms-btn")).toBeNull();
  });

  test("opens Add Transaction modal when Add button is pressed", async () => {
    const view = await render(
      <TransactionsContent
        transactions={mockTransactions as any}
        smsPermissionGranted={true}
      />
    );

    fireEvent.press(view.getByTestId("add-manual-tx-btn"));
    const amountInput = await view.findByTestId("manual-tx-amount-input");
    expect(amountInput).toBeTruthy();
    expect(view.getByText("Add Transaction")).toBeTruthy();
    expect(view.getByText("Manually log missed payments or cash")).toBeTruthy();
    expect(view.getByTestId("manual-tx-merchant-input")).toBeTruthy();
    expect(view.getByTestId("manual-tx-submit-btn")).toBeTruthy();
  });

  test("submits manual transaction through onAddTransaction", async () => {
    const onAddTransaction = jest.fn().mockResolvedValue({});
    const view = await render(
      <TransactionsContent
        transactions={mockTransactions as any}
        smsPermissionGranted={true}
        onAddTransaction={onAddTransaction}
      />
    );

    fireEvent.press(view.getByTestId("add-manual-tx-btn"));
    const amountInput = await view.findByTestId("manual-tx-amount-input");
    const merchantInput = await view.findByTestId("manual-tx-merchant-input");
    fireEvent.changeText(amountInput, "149.00");
    fireEvent.changeText(merchantInput, "Starbucks Coffee");
    const submitBtn = await view.findByTestId("manual-tx-submit-btn");
    fireEvent.press(submitBtn);

    await waitFor(() => {
      expect(onAddTransaction).toHaveBeenCalledWith(
        expect.objectContaining({
          amount: 149,
          merchant: "Starbucks Coffee",
          type: "DEBIT",
        })
      );
    });
  });
});

