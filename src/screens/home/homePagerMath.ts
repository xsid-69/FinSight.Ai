export const HOME_PAGE_COUNT = 3 as const;
export const MIN_PAGE_INDEX = 0 as const;
export const MAX_PAGE_INDEX = HOME_PAGE_COUNT - 1;

export const DISTANCE_COMMIT_RATIO = 0.33;
export const PROJECTED_COMMIT_RATIO = 0.5;
export const VELOCITY_PROJECTION_SECONDS = 0.18;
export const MAX_INDEX_DELTA = 1 as const;

export type HomePageIndex = 0 | 1 | 2;
export type HeadingCenters = readonly [number, number, number];

export interface ProjectedRelease {
  startIndex: HomePageIndex;
  dragPages: number;
  velocityPagesPerSecond: number;
  projectedPages: number;
  distanceCommit: boolean;
  projectedCommit: boolean;
}

export function isFiniteNumber(value: unknown): value is number {
  "worklet";
  return typeof value === "number" && Number.isFinite(value);
}

export function finiteOr(value: number, fallback: number): number {
  "worklet";
  if (typeof value === "number" && Number.isFinite(value)) return value;
  return typeof fallback === "number" && Number.isFinite(fallback) ? fallback : 0;
}

export function clampFinite(
  value: number,
  minimum: number,
  maximum: number,
  fallback = minimum,
): number {
  "worklet";
  const safeMinimum = Number.isFinite(minimum) ? minimum : 0;
  const finiteMaximum = Number.isFinite(maximum) ? maximum : safeMinimum;
  const safeMaximum = Math.max(safeMinimum, finiteMaximum);
  const finiteFallback = Number.isFinite(fallback) ? fallback : safeMinimum;
  const safeFallback = Math.min(safeMaximum, Math.max(safeMinimum, finiteFallback));

  if (!Number.isFinite(value)) return safeFallback;
  return Math.min(safeMaximum, Math.max(safeMinimum, value));
}

export function clampPageIndex(index: number): HomePageIndex {
  "worklet";
  if (!Number.isFinite(index)) return 0;
  return Math.min(2, Math.max(0, Math.round(index))) as HomePageIndex;
}

export function clampPageProgress(progress: number, fallback = 0): number {
  "worklet";
  const safeFallback = Number.isFinite(fallback)
    ? Math.min(2, Math.max(0, fallback))
    : 0;
  if (!Number.isFinite(progress)) return safeFallback;
  return Math.min(2, Math.max(0, progress));
}

export function clampProgressToAdjacent(startIndex: number, progress: number): number {
  "worklet";
  const start = Number.isFinite(startIndex)
    ? Math.min(2, Math.max(0, Math.round(startIndex)))
    : 0;
  const minimum = Math.max(0, start - 1);
  const maximum = Math.min(2, start + 1);
  if (!Number.isFinite(progress)) return start;
  return Math.min(maximum, Math.max(minimum, progress));
}

export function directDragProgress(
  startIndex: number,
  translationX: number,
  pageWidth: number,
): number {
  "worklet";
  const start = Number.isFinite(startIndex)
    ? Math.min(2, Math.max(0, Math.round(startIndex)))
    : 0;
  if (!Number.isFinite(pageWidth) || pageWidth <= 0 || !Number.isFinite(translationX)) {
    return start;
  }

  const rawDragPages = -translationX / pageWidth;
  let dragPages = rawDragPages;
  if (!Number.isFinite(rawDragPages)) {
    if (Number.isNaN(rawDragPages) || translationX === 0) {
      dragPages = 0;
    } else {
      dragPages = translationX > 0 ? -Number.MAX_VALUE : Number.MAX_VALUE;
    }
  }

  const rawProgress = start + dragPages;
  let progress = rawProgress;
  if (!Number.isFinite(rawProgress)) {
    if (Number.isNaN(rawProgress)) {
      progress = Math.abs(start) >= Math.abs(dragPages) ? start : dragPages;
    } else {
      progress = rawProgress < 0 ? -Number.MAX_VALUE : Number.MAX_VALUE;
    }
  }

  const minimum = Math.max(0, start - 1);
  const maximum = Math.min(2, start + 1);
  return Math.min(maximum, Math.max(minimum, progress));
}

export function projectRelease(
  startIndex: number,
  translationX: number,
  velocityX: number,
  pageWidth: number,
): ProjectedRelease {
  "worklet";
  const start = (Number.isFinite(startIndex)
    ? Math.min(2, Math.max(0, Math.round(startIndex)))
    : 0) as HomePageIndex;
  if (
    !Number.isFinite(pageWidth)
    || pageWidth <= 0
    || !Number.isFinite(translationX)
    || !Number.isFinite(velocityX)
  ) {
    return {
      startIndex: start,
      dragPages: 0,
      velocityPagesPerSecond: 0,
      projectedPages: 0,
      distanceCommit: false,
      projectedCommit: false,
    };
  }

  const saturatedDivide = (numerator: number, denominator: number): number => {
    const quotient = numerator / denominator;
    if (Number.isFinite(quotient)) return quotient;
    if (Number.isNaN(quotient) || numerator === 0) return 0;
    return Math.sign(numerator) * Math.sign(denominator) < 0
      ? -Number.MAX_VALUE
      : Number.MAX_VALUE;
  };
  const saturatedMultiply = (left: number, right: number): number => {
    const product = left * right;
    if (Number.isFinite(product)) return product;
    if (Number.isNaN(product) || left === 0 || right === 0) return 0;
    return Math.sign(left) * Math.sign(right) < 0 ? -Number.MAX_VALUE : Number.MAX_VALUE;
  };
  const saturatedAdd = (left: number, right: number): number => {
    const sum = left + right;
    if (Number.isFinite(sum)) return sum;
    if (Number.isNaN(sum)) {
      if (Math.abs(left) === Math.abs(right) && Math.sign(left) !== Math.sign(right)) return 0;
      return Math.abs(left) >= Math.abs(right) ? left : right;
    }
    return sum < 0 ? -Number.MAX_VALUE : Number.MAX_VALUE;
  };

  const dragPages = saturatedDivide(-translationX, pageWidth);
  const velocityPagesPerSecond = saturatedDivide(-velocityX, pageWidth);
  const projectedPages = saturatedAdd(
    dragPages,
    saturatedMultiply(velocityPagesPerSecond, 0.18),
  );

  return {
    startIndex: start,
    dragPages,
    velocityPagesPerSecond,
    projectedPages,
    distanceCommit: Math.abs(dragPages) >= 0.33,
    projectedCommit: Math.abs(projectedPages) >= 0.5,
  };
}

export function settleTarget(
  startIndex: number,
  translationX: number,
  velocityX: number,
  pageWidth: number,
): HomePageIndex {
  "worklet";
  const start = Number.isFinite(startIndex)
    ? Math.min(2, Math.max(0, Math.round(startIndex)))
    : 0;
  if (
    !Number.isFinite(pageWidth)
    || pageWidth <= 0
    || !Number.isFinite(translationX)
    || !Number.isFinite(velocityX)
  ) {
    return start as HomePageIndex;
  }

  const saturatedDivide = (numerator: number, denominator: number): number => {
    const quotient = numerator / denominator;
    if (Number.isFinite(quotient)) return quotient;
    if (Number.isNaN(quotient) || numerator === 0) return 0;
    return Math.sign(numerator) * Math.sign(denominator) < 0
      ? -Number.MAX_VALUE
      : Number.MAX_VALUE;
  };
  const saturatedMultiply = (left: number, right: number): number => {
    const product = left * right;
    if (Number.isFinite(product)) return product;
    if (Number.isNaN(product) || left === 0 || right === 0) return 0;
    return Math.sign(left) * Math.sign(right) < 0 ? -Number.MAX_VALUE : Number.MAX_VALUE;
  };
  const saturatedAdd = (left: number, right: number): number => {
    const sum = left + right;
    if (Number.isFinite(sum)) return sum;
    if (Number.isNaN(sum)) {
      if (Math.abs(left) === Math.abs(right) && Math.sign(left) !== Math.sign(right)) return 0;
      return Math.abs(left) >= Math.abs(right) ? left : right;
    }
    return sum < 0 ? -Number.MAX_VALUE : Number.MAX_VALUE;
  };

  const dragPages = saturatedDivide(-translationX, pageWidth);
  const velocityPagesPerSecond = saturatedDivide(-velocityX, pageWidth);
  const projectedPages = saturatedAdd(
    dragPages,
    saturatedMultiply(velocityPagesPerSecond, 0.18),
  );
  const distanceCommit = Math.abs(dragPages) >= 0.33;
  const projectedCommit = Math.abs(projectedPages) >= 0.5;
  if (!distanceCommit && !projectedCommit) return start as HomePageIndex;

  const directionSource = projectedCommit ? projectedPages : dragPages;
  if (directionSource === 0) return start as HomePageIndex;
  return Math.min(2, Math.max(0, start + Math.sign(directionSource))) as HomePageIndex;
}

export function trackXForProgress(pageProgress: number, pageWidth: number): number {
  "worklet";
  if (!Number.isFinite(pageWidth) || pageWidth <= 0) return 0;
  const progress = Number.isFinite(pageProgress)
    ? Math.min(2, Math.max(0, pageProgress))
    : 0;
  if (progress === 0) return 0;

  const product = -progress * pageWidth;
  if (Number.isFinite(product)) return product;
  if (Number.isNaN(product)) return 0;
  return product < 0 ? -Number.MAX_VALUE : Number.MAX_VALUE;
}

export function headingProximity(pageProgress: number, headingIndex: number): number {
  "worklet";
  if (!Number.isFinite(headingIndex)) return 0;
  const progress = Number.isFinite(pageProgress)
    ? Math.min(2, Math.max(0, pageProgress))
    : 0;
  const index = Math.min(2, Math.max(0, Math.round(headingIndex)));
  return 1 - Math.min(1, Math.max(0, Math.abs(progress - index)));
}

export function isValidHeadingCenters(
  centers: readonly number[] | null | undefined,
): centers is HeadingCenters {
  "worklet";
  return Boolean(
    centers
    && centers.length === 3
    && Number.isFinite(centers[0])
    && Number.isFinite(centers[1])
    && Number.isFinite(centers[2])
    && centers[0] < centers[1]
    && centers[1] < centers[2],
  );
}

export function fallbackHeadingCenters(containerWidth: number, rowOffset = 0): HeadingCenters {
  "worklet";
  const width = Number.isFinite(containerWidth) && containerWidth > 0 ? containerWidth : 0;
  const offset = Number.isFinite(rowOffset) ? rowOffset : 0;
  const saturatedAdd = (left: number, right: number): number => {
    const sum = left + right;
    if (Number.isFinite(sum)) return sum;
    if (Number.isNaN(sum)) {
      if (Math.abs(left) === Math.abs(right) && Math.sign(left) !== Math.sign(right)) return 0;
      return Math.abs(left) >= Math.abs(right) ? left : right;
    }
    return sum < 0 ? -Number.MAX_VALUE : Number.MAX_VALUE;
  };
  return [
    saturatedAdd(offset, width / 6),
    saturatedAdd(offset, width / 2),
    saturatedAdd(offset, width * (5 / 6)),
  ];
}

export function resolveHeadingCenters(
  measuredCenters: readonly number[] | null | undefined,
  containerWidth: number,
  rowOffset = 0,
): HeadingCenters {
  "worklet";
  const offset = Number.isFinite(rowOffset) ? rowOffset : 0;
  const saturatedAdd = (left: number, right: number): number => {
    const sum = left + right;
    if (Number.isFinite(sum)) return sum;
    if (Number.isNaN(sum)) {
      if (Math.abs(left) === Math.abs(right) && Math.sign(left) !== Math.sign(right)) return 0;
      return Math.abs(left) >= Math.abs(right) ? left : right;
    }
    return sum < 0 ? -Number.MAX_VALUE : Number.MAX_VALUE;
  };
  const valid = Boolean(
    measuredCenters
    && measuredCenters.length === 3
    && Number.isFinite(measuredCenters[0])
    && Number.isFinite(measuredCenters[1])
    && Number.isFinite(measuredCenters[2])
    && measuredCenters[0] < measuredCenters[1]
    && measuredCenters[1] < measuredCenters[2],
  );

  if (!valid || !measuredCenters) {
    const width = Number.isFinite(containerWidth) && containerWidth > 0 ? containerWidth : 0;
    return [
      saturatedAdd(offset, width / 6),
      saturatedAdd(offset, width / 2),
      saturatedAdd(offset, width * (5 / 6)),
    ];
  }

  return [
    saturatedAdd(measuredCenters[0], offset),
    saturatedAdd(measuredCenters[1], offset),
    saturatedAdd(measuredCenters[2], offset),
  ];
}

export function interpolatePageValue(pageProgress: number, values: HeadingCenters): number {
  "worklet";
  const progress = Number.isFinite(pageProgress)
    ? Math.min(2, Math.max(0, pageProgress))
    : 0;
  const safeValues: HeadingCenters = Number.isFinite(values[0])
    && Number.isFinite(values[1])
    && Number.isFinite(values[2])
    ? values
    : [0, 0, 0];
  const lowerIndex = Math.min(Math.floor(progress), 1) as 0 | 1;
  const fraction = progress - lowerIndex;
  const delta = safeValues[lowerIndex + 1] - safeValues[lowerIndex];
  const rawProduct = delta * fraction;
  const product = Number.isFinite(rawProduct)
    ? rawProduct
    : Number.isNaN(rawProduct) || delta === 0 || fraction === 0
      ? 0
      : Math.sign(delta) * Math.sign(fraction) < 0
        ? -Number.MAX_VALUE
        : Number.MAX_VALUE;
  const rawResult = safeValues[lowerIndex] + product;
  if (Number.isFinite(rawResult)) return rawResult;
  if (Number.isNaN(rawResult)) {
    if (
      Math.abs(safeValues[lowerIndex]) === Math.abs(product)
      && Math.sign(safeValues[lowerIndex]) !== Math.sign(product)
    ) {
      return 0;
    }
    return Math.abs(safeValues[lowerIndex]) >= Math.abs(product)
      ? safeValues[lowerIndex]
      : product;
  }
  return rawResult < 0 ? -Number.MAX_VALUE : Number.MAX_VALUE;
}

export function interpolateHeadingCenter(
  pageProgress: number,
  measuredCenters: readonly number[] | null | undefined,
  containerWidth: number,
  rowOffset = 0,
): number {
  "worklet";
  const offset = Number.isFinite(rowOffset) ? rowOffset : 0;
  const saturatedAdd = (left: number, right: number): number => {
    const sum = left + right;
    if (Number.isFinite(sum)) return sum;
    if (Number.isNaN(sum)) {
      if (Math.abs(left) === Math.abs(right) && Math.sign(left) !== Math.sign(right)) return 0;
      return Math.abs(left) >= Math.abs(right) ? left : right;
    }
    return sum < 0 ? -Number.MAX_VALUE : Number.MAX_VALUE;
  };
  const validCenters = Boolean(
    measuredCenters
    && measuredCenters.length === 3
    && Number.isFinite(measuredCenters[0])
    && Number.isFinite(measuredCenters[1])
    && Number.isFinite(measuredCenters[2])
    && measuredCenters[0] < measuredCenters[1]
    && measuredCenters[1] < measuredCenters[2],
  );
  const width = Number.isFinite(containerWidth) && containerWidth > 0 ? containerWidth : 0;
  const centers: HeadingCenters = validCenters && measuredCenters
    ? [
        saturatedAdd(measuredCenters[0], offset),
        saturatedAdd(measuredCenters[1], offset),
        saturatedAdd(measuredCenters[2], offset),
      ]
    : [
        saturatedAdd(offset, width / 6),
        saturatedAdd(offset, width / 2),
        saturatedAdd(offset, width * (5 / 6)),
      ];
  const progress = Number.isFinite(pageProgress)
    ? Math.min(2, Math.max(0, pageProgress))
    : 0;
  const lowerIndex = Math.min(Math.floor(progress), 1) as 0 | 1;
  const fraction = progress - lowerIndex;
  const delta = centers[lowerIndex + 1] - centers[lowerIndex];
  const rawProduct = delta * fraction;
  const product = Number.isFinite(rawProduct)
    ? rawProduct
    : Number.isNaN(rawProduct) || delta === 0 || fraction === 0
      ? 0
      : Math.sign(delta) * Math.sign(fraction) < 0
        ? -Number.MAX_VALUE
        : Number.MAX_VALUE;
  return saturatedAdd(centers[lowerIndex], product);
}
