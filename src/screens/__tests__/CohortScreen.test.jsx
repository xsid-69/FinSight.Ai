import React from "react";
import { act, cleanup, fireEvent, render, waitFor } from "@testing-library/react-native";
import * as Haptics from "expo-haptics";

import { CohortScreen } from "../CohortScreen";
import { BottomTabDock } from "../../navigation/BottomTabNavigator";

const mockUseAuth = jest.fn();
const mockSubscribeToPrivateTransactions = jest.fn();

jest.mock("react-native-reanimated", () => {
  const React = require("react");
  const { View } = require("react-native");
  return {
    __esModule: true,
    default: {
      View: ({ children, ...props }) =>
        React.createElement(View, props, children),
      createAnimatedComponent: (Component) => Component,
    },
    useSharedValue: (initialValue) => ({ value: initialValue }),
    useAnimatedStyle: (updater) => updater(),
    useEvent: (callback) => callback,
  };
});

jest.mock("../../screens/HomeScreen", () => ({
  HomeScreen: () => {
    const { View, Text } = require("react-native");
    return <View testID="mock-home-screen"><Text>Home</Text></View>;
  },
}));

jest.mock("../../screens/AIScreen", () => ({
  AIScreen: () => {
    const { View, Text } = require("react-native");
    return <View testID="mock-ai-screen"><Text>AI</Text></View>;
  },
}));

jest.mock("../../context/AuthContext", () => ({
  useAuth: () => mockUseAuth(),
}));

jest.mock("../../services/transactionService", () => ({
  subscribeToPrivateTransactions: (...args) =>
    mockSubscribeToPrivateTransactions(...args),
}));

jest.mock("expo-haptics", () => ({
  ImpactFeedbackStyle: { Light: "Light" },
  selectionAsync: jest.fn(),
  impactAsync: jest.fn(),
}));

jest.mock("expo-status-bar", () => ({
  StatusBar: () => null,
}));

jest.mock("react-native-safe-area-context", () => ({
  SafeAreaView: ({ children, ...props }) => {
    const { View } = require("react-native");
    return <View {...props}>{children}</View>;
  },
  useSafeAreaInsets: () => ({ top: 47, left: 0, right: 0, bottom: 24 }),
}));

jest.mock("moti", () => {
  const React = require("react");
  const { View } = require("react-native");
  return {
    MotiView: ({ children, ...props }) =>
      React.createElement(View, props, children),
  };
});

jest.mock("../../hooks/useReducedMotion", () => ({
  useReducedMotion: () => true,
}));

jest.mock("../../components/finsight/FinSightShell", () => {
  const React = require("react");
  const { View, Text } = require("react-native");
  return {
    FinSightShell: ({ children, subtitle }) =>
      React.createElement(
        View,
        { testID: "fin-sight-shell" },
        subtitle ? React.createElement(Text, { testID: "shell-subtitle" }, subtitle) : null,
        children,
      ),
  };
});

jest.mock("lucide-react-native", () => {
  const React = require("react");
  const { View } = require("react-native");
  const Icon = (props) => React.createElement(View, props);
  return new Proxy(
    { __esModule: true },
    { get: (_target, property) => (property === "__esModule" ? true : Icon) },
  );
});

describe("CohortScreen (Feature 04: Cohort Financial Mirror)", () => {
  let mockUnsubscribe;

  beforeEach(() => {
    jest.clearAllMocks();
    mockUnsubscribe = jest.fn();
    mockUseAuth.mockReturnValue({
      user: { uid: "user_test_123", email: "student@nagpur.edu" },
    });
    mockSubscribeToPrivateTransactions.mockImplementation(() => {
      return mockUnsubscribe;
    });
  });

  afterEach(() => {
    cleanup();
  });

  test("renders the complete Cohort Financial Mirror screen structure", async () => {
    const { getByText, getByTestId, queryByText } = await render(<CohortScreen />);

    // Feature number should not be displayed (clean, minimal header)
    expect(queryByText("FEATURE 04")).toBeNull();

    // Screen title and subtitle
    expect(getByText("Cohort Financial Mirror")).toBeTruthy();
    expect(getByText("Anonymized peer benchmarks & saving targets")).toBeTruthy();

    // Cohort selector default pill
    expect(getByText("College Students (Nagpur)")).toBeTruthy();

    // Hero Percentile Card
    expect(getByTestId("cohort-hero-card")).toBeTruthy();
    expect(getByText("FINANCIAL MIRROR RANK")).toBeTruthy();
    expect(getByTestId("cohort-percentile-number")).toBeTruthy();
    expect(getByTestId("cohort-stance-badge")).toBeTruthy();

    // Where you stand tier bar
    expect(getByTestId("cohort-tier-bar-card")).toBeTruthy();
    expect(getByText("WHERE YOU STAND")).toBeTruthy();

    // Strict 4-Category breakdown grid
    expect(getByTestId("cohort-category-grid")).toBeTruthy();
    expect(getByTestId("category-card-FOOD")).toBeTruthy();
    expect(getByTestId("category-card-SHOPPING")).toBeTruthy();
    expect(getByTestId("category-card-TRAVEL")).toBeTruthy();
    expect(getByTestId("category-card-ENTERTAINMENT")).toBeTruthy();

    // Strategies card
    expect(getByTestId("cohort-strategies-card")).toBeTruthy();
    expect(getByText("STRATEGIES TO IMPROVE YOUR RANK")).toBeTruthy();
  });

  test("displays the four core categories with user spend vs peer median vs top savers", async () => {
    const { getByText, getByTestId } = await render(<CohortScreen />);

    // Check category titles
    expect(getByText("Food & Dining")).toBeTruthy();
    expect(getByText("Shopping")).toBeTruthy();
    expect(getByText("Travel & Transport")).toBeTruthy();
    expect(getByText("Entertainment")).toBeTruthy();

    // Food category should show peer median ₹3,800 and top 10% ₹2,100 for Nagpur
    expect(getByTestId("category-card-FOOD")).toBeTruthy();
    expect(getByText("₹3,800")).toBeTruthy();
    expect(getByText("₹2,100")).toBeTruthy();
  });

  test("opens cohort selector modal and allows switching demographics with haptics", async () => {
    const { getByTestId, getByText } = await render(<CohortScreen />);

    const trigger = getByTestId("cohort-selector-trigger");
    await act(async () => {
      fireEvent.press(trigger);
    });

    expect(Haptics.selectionAsync).toHaveBeenCalledTimes(1);

    // Modal should show available cohorts
    const proOption = await waitFor(() =>
      getByTestId("cohort-option-entry_professionals"),
    );
    expect(proOption).toBeTruthy();

    await act(async () => {
      fireEvent.press(proOption);
    });
    expect(Haptics.selectionAsync).toHaveBeenCalledTimes(2);

    // Should now display the switched cohort
    await waitFor(() => {
      expect(getByText("Young Professionals (Tier-2 Metro)")).toBeTruthy();
    });
  });

  test("dynamically aggregates real Firestore transactions when received", async () => {
    let capturedCallback;
    mockSubscribeToPrivateTransactions.mockImplementation((userId, onData) => {
      capturedCallback = onData;
      return mockUnsubscribe;
    });

    const screen = await render(<CohortScreen />);

    // Initially demo banner is present
    expect(screen.queryByTestId("cohort-demo-banner")).toBeTruthy();

    // Emit live Firestore debit transactions
    await act(async () => {
      capturedCallback({
        transactions: [
          { id: "tx1", type: "DEBIT", amount: 4200, category: "FOOD", date: "2026-08-01" },
          { id: "tx2", type: "DEBIT", amount: 1500, category: "SHOPPING", date: "2026-08-02" },
          { id: "tx3", type: "DEBIT", amount: 1000, category: "TRANSPORTATION", date: "2026-08-03" },
          { id: "tx4", type: "DEBIT", amount: 800, category: "ENTERTAINMENT", date: "2026-08-04" },
        ],
        ignoredCount: 0,
      });
    });

    // Demo banner should disappear since real transactions are loaded
    await waitFor(() => {
      expect(screen.queryByTestId("cohort-demo-banner")).toBeNull();
      // Total spend = 4200 + 1500 + 1000 + 800 = 7500
      expect(screen.getByText("₹7,500")).toBeTruthy();
    });
  });

  test("unsubscribes from Firestore transaction stream on unmount", async () => {
    let screen;
    await act(async () => {
      screen = await render(<CohortScreen />);
    });
    expect(mockSubscribeToPrivateTransactions).toHaveBeenCalled();
    await act(async () => {
      screen.unmount();
    });
    expect(mockUnsubscribe).toHaveBeenCalledTimes(1);
  });

  test("strictly limits Top Savers Leaderboard to Top 5 items and does not render dummy sandbox", async () => {
    const screen = await render(<CohortScreen />);

    // Dummy sandbox chips must be removed
    expect(screen.queryByTestId("cohort-persona-sandbox")).toBeNull();

    // Switch to Top Savers tab
    const leaderboardTab = screen.getByRole("button", { name: "Top Savers Leaderboard View" });
    await act(async () => {
      fireEvent.press(leaderboardTab);
    });

    // Top 5 leaderboard container must exist and have at most 5 items
    const list = screen.getByTestId("cohort-top5-list");
    expect(list.props.children.length).toBeLessThanOrEqual(5);
  });

  test("dynamically places the actual user inside the Top 5 Leaderboard when spend qualifies", async () => {
    let capturedCallback;
    mockSubscribeToPrivateTransactions.mockImplementation((userId, onData) => {
      capturedCallback = onData;
      return mockUnsubscribe;
    });

    const screen = await render(<CohortScreen />);

    // Emit very low discretionary spend transactions (e.g. ₹1,800 total, beating rank 1 Aarav's ₹2,150)
    await act(async () => {
      capturedCallback({
        transactions: [
          { id: "tx1", type: "DEBIT", amount: 1000, category: "FOOD", date: "2026-08-01" },
          { id: "tx2", type: "DEBIT", amount: 300, category: "SHOPPING", date: "2026-08-02" },
          { id: "tx3", type: "DEBIT", amount: 300, category: "TRANSPORTATION", date: "2026-08-03" },
          { id: "tx4", type: "DEBIT", amount: 200, category: "ENTERTAINMENT", date: "2026-08-04" },
        ],
        ignoredCount: 0,
      });
    });

    // Switch to Top Savers tab
    const leaderboardTab = screen.getByRole("button", { name: "Top Savers Leaderboard View" });
    await act(async () => {
      fireEvent.press(leaderboardTab);
    });

    // Verify the actual user is dynamically inserted into the Top 5 Leaderboard with "YOU" badge
    await waitFor(() => {
      expect(screen.getByTestId("cohort-ranker-current-user")).toBeTruthy();
      expect(screen.getByText("YOU")).toBeTruthy();
      expect(screen.getByText("🏆 You are in the Top 5!")).toBeTruthy();
    });
  });

  test("opens compare link modal to share link and compare with friends", async () => {
    const screen = await render(<CohortScreen />);

    // Switch to Top Savers tab
    const leaderboardTab = screen.getByRole("button", { name: "Top Savers Leaderboard View" });
    await act(async () => {
      fireEvent.press(leaderboardTab);
    });

    // Tap the Compare Link button in the header
    const shareBtn = screen.getByTestId("cohort-share-link-btn");
    await act(async () => {
      fireEvent.press(shareBtn);
    });

    // Verify modal opened
    expect(screen.getByTestId("compare-link-modal-content")).toBeTruthy();
    expect(screen.getByText("FinSight Compare Link")).toBeTruthy();
    expect(screen.getByText("Share Link with Friends")).toBeTruthy();

    // Switch to Compare a Friend tab
    const friendTab = screen.getByRole("button", { name: "Compare with a Friend Tab" });
    await act(async () => {
      fireEvent.press(friendTab);
    });

    // Tap sample friend invite
    const friendChip = screen.getByTestId("sample-friend-friend_riya");
    await act(async () => {
      fireEvent.press(friendChip);
    });

    // Compare modal should launch with Riya Patel
    await waitFor(() => {
      expect(screen.getByTestId("comparison-modal-content")).toBeTruthy();
      expect(screen.getByText("Riya Patel")).toBeTruthy();
    });
  });

  test("opens head-to-head comparison ranking modal when compare button is pressed", async () => {
    const screen = await render(<CohortScreen />);

    // Switch to Top Savers tab
    const leaderboardTab = screen.getByRole("button", { name: "Top Savers Leaderboard View" });
    await act(async () => {
      fireEvent.press(leaderboardTab);
    });

    // Verify leaderboard peers rendered
    expect(screen.getByText("Top Savers in Nagpur Students")).toBeTruthy();
    expect(screen.getByText("Aarav Sharma")).toBeTruthy();

    // Press compare button for rank 1 peer
    const compareBtn = screen.getByTestId("compare-btn-rank_1");
    await act(async () => {
      fireEvent.press(compareBtn);
    });

    // Comparison modal should be open
    expect(Haptics.impactAsync).toHaveBeenCalled();
    expect(screen.getByTestId("comparison-modal-content")).toBeTruthy();
    expect(screen.getByText("Financial Mirror Battle")).toBeTruthy();
    expect(screen.getByText("HEAD-TO-HEAD RANKING")).toBeTruthy();
    expect(screen.getByText("4-CATEGORY HEAD-TO-HEAD")).toBeTruthy();

    // Cheer peer inside comparison modal
    const cheerBtn = screen.getByRole("button", { name: "Cheer for Aarav Sharma" });
    await act(async () => {
      fireEvent.press(cheerBtn);
    });
    expect(screen.getByText("Cheered with FinSight 👏")).toBeTruthy();

    // Close comparison modal
    const doneBtn = screen.getByText("Done Comparing");
    await act(async () => {
      fireEvent.press(doneBtn);
    });
    expect(screen.queryByTestId("comparison-modal-content")).toBeNull();
  });
});

describe("BottomTabDock integration with CohortScreen", () => {
  function mockDockProps(activeRoute = "Home") {
    return {
      state: {
        index: activeRoute === "CohortScreen" ? 2 : activeRoute === "AI" ? 1 : 0,
        routes: [
          { key: "Home-key", name: "Home" },
          { key: "AI-key", name: "AI" },
          { key: "CohortScreen-key", name: "CohortScreen" },
        ],
      },
      descriptors: {
        "Home-key": { options: { title: "Overview", tabBarLabel: "Overview" } },
        "AI-key": { options: { title: "AI", tabBarLabel: "AI" } },
        "CohortScreen-key": { options: { title: "Ranking", tabBarLabel: "Ranking" } },
      },
      navigation: {
        emit: jest.fn(() => ({ defaultPrevented: false })),
        navigate: jest.fn(),
      },
    };
  }

  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  test("renders the BottomTabDock with the CohortScreen on the far right as Ranking", async () => {
    const props = mockDockProps();
    const { getByTestId, getByText } = await render(<BottomTabDock {...props} />);

    // Verify all 3 tabs are rendered
    expect(getByTestId("tab-button-Home")).toBeTruthy();
    expect(getByTestId("tab-button-AI")).toBeTruthy();
    expect(getByTestId("tab-button-CohortScreen")).toBeTruthy();

    // The far right tab label is "Ranking"
    expect(getByText("Ranking")).toBeTruthy();
  });

  test("pressing the Ranking tab triggers tactile haptic feedback and navigation", async () => {
    const props = mockDockProps("Home");
    const { getByTestId } = await render(<BottomTabDock {...props} />);

    const rankingTab = getByTestId("tab-button-CohortScreen");
    fireEvent.press(rankingTab);

    expect(Haptics.selectionAsync).toHaveBeenCalledTimes(1);
    expect(props.navigation.navigate).toHaveBeenCalledWith("CohortScreen");
  });
});
