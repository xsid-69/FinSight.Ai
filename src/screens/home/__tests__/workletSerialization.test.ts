import {
  clampFinite,
  clampPageIndex,
  clampPageProgress,
  clampProgressToAdjacent,
  directDragProgress,
  fallbackHeadingCenters,
  finiteOr,
  headingProximity,
  interpolateHeadingCenter,
  interpolatePageValue,
  isFiniteNumber,
  isValidHeadingCenters,
  projectRelease,
  resolveHeadingCenters,
  settleTarget,
  trackXForProgress,
  type HeadingCenters,
} from "../homePagerMath";

interface WorkletMetadata {
  readonly __closure?: Record<string, unknown>;
  readonly __initData?: { readonly code?: string };
  readonly __pluginVersion?: string;
  readonly __workletHash?: number;
}

type CallableWorklet = ((...args: never[]) => unknown) & WorkletMetadata;

const installedWorkletsVersion = (require("react-native-worklets/package.json") as {
  readonly version: string;
}).version;
const { transformFileSync } = require("@babel/core") as typeof import("@babel/core");

function metadataOf(worklet: Function): WorkletMetadata {
  return worklet as CallableWorklet;
}

function transformedWorkletCodes(file: string): string[] {
  const transformed = transformFileSync(file, {
    babelrc: false,
    configFile: false,
    filename: file,
    plugins: ["react-native-worklets/plugin"],
    presets: ["babel-preset-expo"],
  });
  const output = transformed?.code;
  if (!output) throw new Error(`Expected Babel output for ${file}`);

  return [...output.matchAll(/_init_data=\{code:("(?:\\.|[^"\\])*")/g)].map((match) =>
    JSON.parse(match[1]) as string,
  );
}

function executeSerializedWorklet(worklet: Function, args: readonly unknown[]): unknown {
  const metadata = metadataOf(worklet);
  const code = metadata.__initData?.code;
  if (!code) throw new Error(`Missing transformed worklet code for ${worklet.name}`);

  const serialized = new Function(`return (${code});`)() as (...values: unknown[]) => unknown;
  return Reflect.apply(serialized, { __closure: metadata.__closure ?? {} }, args);
}

describe("Expo Go Worklets 0.10.1 serialization regressions", () => {
  const centers = [52, 182, 312] as HeadingCenters;
  const cases: ReadonlyArray<{
    readonly name: string;
    readonly worklet: Function;
    readonly args: readonly unknown[];
  }> = [
    { name: "isFiniteNumber", worklet: isFiniteNumber, args: [1] },
    { name: "finiteOr", worklet: finiteOr, args: [1, 0] },
    { name: "clampFinite", worklet: clampFinite, args: [0.5, 0, 2, 0] },
    { name: "clampPageIndex", worklet: clampPageIndex, args: [1] },
    { name: "clampPageProgress", worklet: clampPageProgress, args: [0.3] },
    { name: "clampProgressToAdjacent", worklet: clampProgressToAdjacent, args: [1, 1.3] },
    { name: "directDragProgress", worklet: directDragProgress, args: [0, -117, 390] },
    { name: "projectRelease", worklet: projectRelease, args: [1, 70, 1200, 390] },
    { name: "settleTarget", worklet: settleTarget, args: [1, 70, 1200, 390] },
    { name: "trackXForProgress", worklet: trackXForProgress, args: [0.3, 390] },
    { name: "headingProximity", worklet: headingProximity, args: [0.3, 0] },
    { name: "isValidHeadingCenters", worklet: isValidHeadingCenters, args: [centers] },
    { name: "fallbackHeadingCenters", worklet: fallbackHeadingCenters, args: [390, 12] },
    { name: "resolveHeadingCenters", worklet: resolveHeadingCenters, args: [centers, 390, 0] },
    { name: "interpolatePageValue", worklet: interpolatePageValue, args: [0.3, centers] },
    {
      name: "interpolateHeadingCenter",
      worklet: interpolateHeadingCenter,
      args: [0.3, centers, 390, 0],
    },
  ];

  test("pure pager and heading worklets serialize without module-scope closures", () => {
    expect(installedWorkletsVersion).toBe("0.10.1");

    for (const sample of cases) {
      const metadata = metadataOf(sample.worklet);
      expect(metadata.__pluginVersion).toBe(installedWorkletsVersion);
      expect(metadata.__workletHash).toEqual(expect.any(Number));
      expect(metadata.__closure ?? {}).toEqual({});
      expect(() => executeSerializedWorklet(sample.worklet, sample.args)).not.toThrow();
    }
  });

  test("transformed UI entry points contain no unavailable pager, curve, or spring globals", () => {
    const files = [
      "src/screens/home/homePagerMath.ts",
      "src/screens/home/HomePager.tsx",
      "src/components/finsight/HeaderNavigation.tsx",
      "src/components/banking/CurvedContentSurface.tsx",
    ] as const;
    const workletCode = files.flatMap(transformedWorkletCodes);
    const unavailableBindings = [
      "MIN_PAGE_INDEX",
      "MAX_PAGE_INDEX",
      "MAX_INDEX_DELTA",
      "DISTANCE_COMMIT_RATIO",
      "PROJECTED_COMMIT_RATIO",
      "VELOCITY_PROJECTION_SECONDS",
      "SPRING_CONFIG",
      "CORNER",
      "BUMP_HALF",
      "SHOULDER",
      "PEAK",
    ] as const;

    expect(workletCode.length).toBeGreaterThan(20);
    for (const binding of unavailableBindings) {
      expect(workletCode.every((code) => !code.includes(binding))).toBe(true);
    }
    expect(workletCode.every((code) => !code.includes(".every("))).toBe(true);
  });

  test("transformed content-curve builders execute from init data with empty closures", () => {
    const curveCodes = transformedWorkletCodes(
      "src/components/banking/CurvedContentSurface.tsx",
    ).filter((code) =>
      code.includes("clampX_CurvedContentSurface")
      || code.includes("buildTopBorderPath_CurvedContentSurface")
      || code.includes("buildClosedFillPath_CurvedContentSurface"),
    );

    expect(curveCodes).toHaveLength(3);
    for (const code of curveCodes) {
      expect(code).not.toContain("this.__closure");
      const serialized = new Function(`return (${code});`)() as (
        width: number,
        x: number,
      ) => unknown;
      expect(() => Reflect.apply(serialized, { __closure: {} }, [390, 195])).not.toThrow();
    }
  });
});
