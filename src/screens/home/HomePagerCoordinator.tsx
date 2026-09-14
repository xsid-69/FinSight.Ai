import React, {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useRef,
  useSyncExternalStore,
} from "react";

import type { MainTab } from "../../components/finsight/HeaderNavigation";
import type { HomePageIndex } from "./homePagerMath";

export const HOME_PAGER_TABS = ["Overview", "Transactions", "Insights"] as const satisfies readonly MainTab[];

export type HomePagerRequestSource =
  | "header"
  | "dock"
  | "in-page"
  | "swipe"
  | "external-route"
  | "android-back";

export interface HomePagerRequest {
  readonly token: number;
  readonly target: MainTab;
  readonly targetIndex: HomePageIndex;
  readonly source: HomePagerRequestSource;
  readonly hapticHandled: boolean;
}

export interface HomePagerAnimationRequest extends HomePagerRequest {
  readonly complete: (finished: boolean) => HomePagerCompletionResult;
}

export interface HomePagerCommit extends HomePagerRequest {}

export interface HomePagerRegistration {
  /** Starts or retargets visual settlement from the pager's current progress. */
  readonly onRequest: (request: HomePagerAnimationRequest) => void;
  /** Commits settled React, route-param, and accessibility state in one callback. */
  readonly onCommit: (commit: HomePagerCommit) => void;
}

export interface HomePagerCoordinatorSnapshot {
  readonly committedTab: MainTab;
  readonly committedIndex: HomePageIndex;
  readonly pendingRequest: HomePagerRequest | null;
}

export type HomePagerCompletionResult = "committed" | "canceled" | "stale";

export function isMainTab(value: unknown): value is MainTab {
  return typeof value === "string" && HOME_PAGER_TABS.includes(value as MainTab);
}

export function homeTabToIndex(tab: MainTab): HomePageIndex {
  return HOME_PAGER_TABS.indexOf(tab) as HomePageIndex;
}

export function homeIndexToTab(index: number): MainTab | null {
  if (!Number.isInteger(index) || index < 0 || index >= HOME_PAGER_TABS.length) return null;
  return HOME_PAGER_TABS[index] ?? null;
}

export class HomePagerCoordinatorController {
  private snapshot: HomePagerCoordinatorSnapshot;
  private readonly listeners = new Set<() => void>();
  private nextToken = 0;
  private nextRegistrationId = 0;
  private registration: { id: number; adapter: HomePagerRegistration } | null = null;
  private deliveredRegistrationId: number | null = null;

  constructor(initialTab: unknown = "Overview") {
    const committedTab = isMainTab(initialTab) ? initialTab : "Overview";
    this.snapshot = {
      committedTab,
      committedIndex: homeTabToIndex(committedTab),
      pendingRequest: null,
    };
  }

  readonly getSnapshot = (): HomePagerCoordinatorSnapshot => this.snapshot;

  readonly subscribe = (listener: () => void): (() => void) => {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  };

  readonly registerPager = (adapter: HomePagerRegistration): (() => void) => {
    const registration = { id: ++this.nextRegistrationId, adapter };
    this.registration = registration;
    this.deliverPendingRequest(registration);

    return () => {
      if (this.registration?.id !== registration.id) return;
      this.registration = null;
      if (this.deliveredRegistrationId === registration.id) {
        this.deliveredRegistrationId = null;
      }
    };
  };

  readonly requestPage = (
    target: unknown,
    source: HomePagerRequestSource,
    hapticHandled = false,
  ): HomePagerRequest | null => {
    if (!isMainTab(target)) return null;

    const { committedTab, pendingRequest } = this.snapshot;
    const effectiveTarget = pendingRequest?.target ?? committedTab;
    if (target === effectiveTarget) return null;

    const request: HomePagerRequest = {
      token: ++this.nextToken,
      target,
      targetIndex: homeTabToIndex(target),
      source,
      hapticHandled,
    };

    this.deliveredRegistrationId = null;
    this.updateSnapshot({ ...this.snapshot, pendingRequest: request });
    if (this.registration) this.deliverPendingRequest(this.registration);
    return request;
  };

  readonly requestExternalPage = (
    routeTab: unknown,
    isHomeFocused: boolean,
  ): HomePagerRequest | null => {
    if (!isHomeFocused || !isMainTab(routeTab)) return null;
    return this.requestPage(routeTab, "external-route", false);
  };

  private deliverPendingRequest(registration: {
    id: number;
    adapter: HomePagerRegistration;
  }): void {
    const request = this.snapshot.pendingRequest;
    if (!request) return;

    this.deliveredRegistrationId = registration.id;
    registration.adapter.onRequest({
      ...request,
      complete: (finished) => this.completeRequest(request.token, registration.id, finished),
    });
  }

  private completeRequest(
    token: number,
    registrationId: number,
    finished: boolean,
  ): HomePagerCompletionResult {
    const request = this.snapshot.pendingRequest;
    const registration = this.registration;
    if (
      !request
      || request.token !== token
      || !registration
      || registration.id !== registrationId
      || this.deliveredRegistrationId !== registrationId
    ) {
      return "stale";
    }

    if (!finished) {
      this.deliveredRegistrationId = null;
      this.updateSnapshot({ ...this.snapshot, pendingRequest: null });
      return "canceled";
    }

    const commit: HomePagerCommit = { ...request };
    registration.adapter.onCommit(commit);
    this.deliveredRegistrationId = null;
    this.updateSnapshot({
      committedTab: request.target,
      committedIndex: request.targetIndex,
      pendingRequest: null,
    });
    return "committed";
  }

  private updateSnapshot(snapshot: HomePagerCoordinatorSnapshot): void {
    this.snapshot = snapshot;
    this.listeners.forEach((listener) => listener());
  }
}

export interface HomePagerCoordinatorValue extends HomePagerCoordinatorSnapshot {
  readonly requestPage: HomePagerCoordinatorController["requestPage"];
  readonly requestExternalPage: HomePagerCoordinatorController["requestExternalPage"];
  readonly registerPager: HomePagerCoordinatorController["registerPager"];
}

const HomePagerCoordinatorContext = createContext<HomePagerCoordinatorValue | null>(null);

export function HomePagerCoordinatorProvider({
  children,
  initialTab = "Overview",
}: {
  children: ReactNode;
  initialTab?: MainTab;
}) {
  const controllerRef = useRef<HomePagerCoordinatorController | null>(null);
  if (!controllerRef.current) {
    controllerRef.current = new HomePagerCoordinatorController(initialTab);
  }
  const controller = controllerRef.current;
  const snapshot = useSyncExternalStore(
    controller.subscribe,
    controller.getSnapshot,
    controller.getSnapshot,
  );

  const requestPage = useCallback(controller.requestPage, [controller]);
  const requestExternalPage = useCallback(controller.requestExternalPage, [controller]);
  const registerPager = useCallback(controller.registerPager, [controller]);

  return (
    <HomePagerCoordinatorContext.Provider
      value={{
        ...snapshot,
        requestPage,
        requestExternalPage,
        registerPager,
      }}
    >
      {children}
    </HomePagerCoordinatorContext.Provider>
  );
}

export function useOptionalHomePagerCoordinator(): HomePagerCoordinatorValue | null {
  return useContext(HomePagerCoordinatorContext);
}

export function useHomePagerCoordinator(): HomePagerCoordinatorValue {
  const context = useContext(HomePagerCoordinatorContext);
  if (!context) {
    throw new Error("useHomePagerCoordinator must be used within HomePagerCoordinatorProvider");
  }
  return context;
}
