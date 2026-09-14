import React from "react";
import { Text } from "react-native";
import { act, render } from "@testing-library/react-native";
import fc from "fast-check";

import {
  HOME_PAGER_TABS,
  HomePagerCoordinatorController,
  HomePagerCoordinatorProvider,
  homeIndexToTab,
  homeTabToIndex,
  isMainTab,
  type HomePagerAnimationRequest,
  type HomePagerCoordinatorValue,
  type HomePagerRequestSource,
  useHomePagerCoordinator,
} from "../HomePagerCoordinator";
import type { MainTab } from "../../../components/finsight/HeaderNavigation";

const sourceArbitrary = fc.constantFrom<HomePagerRequestSource>(
  "header",
  "dock",
  "in-page",
  "swipe",
  "external-route",
  "android-back",
);

function createHarness(initialTab: MainTab = "Overview") {
  const controller = new HomePagerCoordinatorController(initialTab);
  const requests: HomePagerAnimationRequest[] = [];
  const commits: MainTab[] = [];
  let visibleTab = initialTab;
  let routeTab = initialTab;
  let accessibilityTab = initialTab;

  const unregister = controller.registerPager({
    onRequest: (request) => requests.push(request),
    onCommit: ({ target }) => {
      visibleTab = target;
      routeTab = target;
      accessibilityTab = target;
      commits.push(target);
    },
  });

  return {
    controller,
    requests,
    commits,
    unregister,
    observed: () => ({ visibleTab, routeTab, accessibilityTab }),
  };
}

describe("HomePagerCoordinator tab conversion", () => {
  test("converts all canonical tabs and rejects invalid values and indices", () => {
    HOME_PAGER_TABS.forEach((tab, index) => {
      expect(isMainTab(tab)).toBe(true);
      expect(homeTabToIndex(tab)).toBe(index);
      expect(homeIndexToTab(index)).toBe(tab);
    });

    expect(isMainTab("Activity")).toBe(false);
    expect(isMainTab(undefined)).toBe(false);
    expect(homeIndexToTab(-1)).toBeNull();
    expect(homeIndexToTab(1.5)).toBeNull();
    expect(homeIndexToTab(3)).toBeNull();
  });

  test("falls back to Overview when constructed with an invalid initial tab", () => {
    const controller = new HomePagerCoordinatorController("invalid");
    expect(controller.getSnapshot()).toEqual({
      committedTab: "Overview",
      committedIndex: 0,
      pendingRequest: null,
    });
  });
});

describe("HomePagerCoordinator request and commit contract", () => {
  test("preserves request source and haptic ownership without committing early", () => {
    const harness = createHarness();

    const request = harness.controller.requestPage("Transactions", "dock", true);

    expect(request).toMatchObject({
      token: 1,
      target: "Transactions",
      targetIndex: 1,
      source: "dock",
      hapticHandled: true,
    });
    expect(harness.controller.getSnapshot().committedTab).toBe("Overview");
    expect(harness.observed()).toEqual({
      visibleTab: "Overview",
      routeTab: "Overview",
      accessibilityTab: "Overview",
    });

    expect(harness.requests[0].complete(true)).toBe("committed");
    expect(harness.controller.getSnapshot()).toEqual({
      committedTab: "Transactions",
      committedIndex: 1,
      pendingRequest: null,
    });
    expect(harness.observed()).toEqual({
      visibleTab: "Transactions",
      routeTab: "Transactions",
      accessibilityTab: "Transactions",
    });
  });

  test("treats same-target header requests as no-ops", () => {
    const harness = createHarness("Insights");

    expect(harness.controller.requestPage("Insights", "header", true)).toBeNull();
    expect(harness.requests).toHaveLength(0);
    expect(harness.controller.getSnapshot().pendingRequest).toBeNull();
  });

  test("a different request retargets and makes the prior callback stale", () => {
    const harness = createHarness();

    harness.controller.requestPage("Transactions", "header", true);
    const firstRequest = harness.requests[0];
    harness.controller.requestPage("Insights", "dock", true);
    const latestRequest = harness.requests[1];

    expect(latestRequest.token).toBeGreaterThan(firstRequest.token);
    expect(firstRequest.complete(true)).toBe("stale");
    expect(harness.commits).toEqual([]);
    expect(latestRequest.complete(true)).toBe("committed");
    expect(harness.commits).toEqual(["Insights"]);
  });

  test("canceled settlement leaves visible, route, accessibility, and committed state unchanged", () => {
    const harness = createHarness("Transactions");

    harness.controller.requestPage("Insights", "swipe", false);
    expect(harness.requests[0].complete(false)).toBe("canceled");

    expect(harness.controller.getSnapshot()).toEqual({
      committedTab: "Transactions",
      committedIndex: 1,
      pendingRequest: null,
    });
    expect(harness.observed()).toEqual({
      visibleTab: "Transactions",
      routeTab: "Transactions",
      accessibilityTab: "Transactions",
    });
  });

  test("an unmounted pager cannot commit and the pending request is delivered to its replacement", () => {
    const controller = new HomePagerCoordinatorController();
    const firstRequests: HomePagerAnimationRequest[] = [];
    const unregister = controller.registerPager({
      onRequest: (request) => firstRequests.push(request),
      onCommit: jest.fn(),
    });

    controller.requestPage("Insights", "dock", true);
    unregister();
    expect(firstRequests[0].complete(true)).toBe("stale");

    const replacementRequests: HomePagerAnimationRequest[] = [];
    const replacementCommit = jest.fn();
    controller.registerPager({
      onRequest: (request) => replacementRequests.push(request),
      onCommit: replacementCommit,
    });

    expect(replacementRequests).toHaveLength(1);
    expect(replacementRequests[0].token).toBe(firstRequests[0].token);
    expect(replacementRequests[0].complete(true)).toBe("committed");
    expect(replacementCommit).toHaveBeenCalledWith(
      expect.objectContaining({ target: "Insights", targetIndex: 2 }),
    );
  });

  test("external params request only valid tabs while Home is focused", () => {
    const harness = createHarness();

    expect(harness.controller.requestExternalPage("Insights", false)).toBeNull();
    expect(harness.controller.requestExternalPage("invalid", true)).toBeNull();
    expect(harness.requests).toHaveLength(0);

    expect(harness.controller.requestExternalPage("Insights", true)).toMatchObject({
      target: "Insights",
      source: "external-route",
    });
    expect(harness.requests).toHaveLength(1);
    expect(harness.controller.requestExternalPage("Insights", true)).toBeNull();
  });

  test("publishes coordinator selection only after the pager commit callback", () => {
    const harness = createHarness();
    const publishedStates: Array<{ committedTab: MainTab; visibleTab: MainTab }> = [];
    harness.controller.subscribe(() => {
      const pending = harness.controller.getSnapshot().pendingRequest;
      if (!pending) {
        publishedStates.push({
          committedTab: harness.controller.getSnapshot().committedTab,
          visibleTab: harness.observed().visibleTab,
        });
      }
    });

    harness.controller.requestPage("Transactions", "in-page", false);
    harness.requests[0].complete(true);

    expect(publishedStates).toEqual([
      { committedTab: "Transactions", visibleTab: "Transactions" },
    ]);
  });

  test("generated completion orderings allow only the latest successful request to commit", () => {
    // **Validates: Requirements 2.1, 2.2, 3.3, 3.5, 3.8, 3.9, 3.10**
    fc.assert(
      fc.property(
        fc.constantFrom<MainTab>(...HOME_PAGER_TABS),
        fc.array(
          fc.record({
            target: fc.constantFrom<MainTab>(...HOME_PAGER_TABS),
            source: sourceArbitrary,
            hapticHandled: fc.boolean(),
          }),
          { minLength: 1, maxLength: 30 },
        ),
        fc.boolean(),
        (initialTab, generatedRequests, latestFinishes) => {
          const harness = createHarness(initialTab);

          generatedRequests.forEach(({ target, source, hapticHandled }) => {
            harness.controller.requestPage(target, source, hapticHandled);
          });

          const actualRequests = harness.requests;
          if (actualRequests.length === 0) {
            expect(harness.controller.getSnapshot().committedTab).toBe(initialTab);
            expect(harness.commits).toEqual([]);
            return;
          }

          actualRequests.slice(0, -1).reverse().forEach((request) => {
            expect(request.complete(true)).toBe("stale");
          });

          const latest = actualRequests.at(-1)!;
          const expectedTab = latestFinishes ? latest.target : initialTab;
          expect(latest.complete(latestFinishes)).toBe(
            latestFinishes ? "committed" : "canceled",
          );
          expect(harness.controller.getSnapshot().committedTab).toBe(expectedTab);
          expect(harness.observed()).toEqual({
            visibleTab: expectedTab,
            routeTab: expectedTab,
            accessibilityTab: expectedTab,
          });
          expect(harness.commits).toEqual(latestFinishes ? [latest.target] : []);
        },
      ),
      { numRuns: 200 },
    );
  });
});

describe("HomePagerCoordinatorProvider", () => {
  test("exposes committed state and stable request methods to descendants", async () => {
    let coordinator: HomePagerCoordinatorValue | null = null;

    function Probe() {
      coordinator = useHomePagerCoordinator();
      return <Text>{coordinator.committedTab}</Text>;
    }

    const screen = await render(
      <HomePagerCoordinatorProvider initialTab="Transactions">
        <Probe />
      </HomePagerCoordinatorProvider>,
    );

    expect(screen.getByText("Transactions")).toBeTruthy();

    const requests: HomePagerAnimationRequest[] = [];
    await act(async () => {
      coordinator!.registerPager({
        onRequest: (request) => requests.push(request),
        onCommit: jest.fn(),
      });
      coordinator!.requestPage("Insights", "header", true);
    });
    expect(screen.getByText("Transactions")).toBeTruthy();

    await act(async () => {
      requests[0].complete(true);
    });
    expect(screen.getByText("Insights")).toBeTruthy();
  });
});


describe("Property 2 preservation request phases", () => {
  // **Validates: Requirements 3.5, 3.9**
  test("activation-owned haptic metadata survives retargeting while stale and canceled work cannot commit", () => {
    const harness = createHarness("Overview");

    harness.controller.requestPage("Transactions", "header", true);
    harness.controller.requestPage("Insights", "dock", true);

    expect(harness.requests.map(({ source, hapticHandled }) => ({ source, hapticHandled }))).toEqual([
      { source: "header", hapticHandled: true },
      { source: "dock", hapticHandled: true },
    ]);
    expect(harness.requests[0].complete(true)).toBe("stale");
    expect(harness.requests[1].complete(false)).toBe("canceled");
    expect(harness.commits).toEqual([]);
    expect(harness.observed()).toEqual({
      visibleTab: "Overview",
      routeTab: "Overview",
      accessibilityTab: "Overview",
    });
  });
});
