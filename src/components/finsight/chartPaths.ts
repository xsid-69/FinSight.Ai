export interface Pt {
  x: number;
  y: number;
}

/** Catmull-Rom → cubic Bézier smoothing for a premium curved line. */
export function smoothPath(points: Pt[], tension = 0.5): string {
  if (points.length === 0) return "";
  if (points.length === 1) return `M ${points[0].x} ${points[0].y}`;

  let d = `M ${points[0].x} ${points[0].y}`;
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i - 1] ?? points[i];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[i + 2] ?? p2;

    const cp1x = p1.x + ((p2.x - p0.x) / 6) * tension * 2;
    const cp1y = p1.y + ((p2.y - p0.y) / 6) * tension * 2;
    const cp2x = p2.x - ((p3.x - p1.x) / 6) * tension * 2;
    const cp2y = p2.y - ((p3.y - p1.y) / 6) * tension * 2;

    d += ` C ${cp1x} ${cp1y} ${cp2x} ${cp2y} ${p2.x} ${p2.y}`;
  }
  return d;
}

/** Closed area path from a top line down to a baseline y. */
export function areaPath(points: Pt[], baselineY: number, tension = 0.5): string {
  if (points.length === 0) return "";
  const line = smoothPath(points, tension);
  const last = points[points.length - 1];
  const first = points[0];
  return `${line} L ${last.x} ${baselineY} L ${first.x} ${baselineY} Z`;
}

/** Band path: forward along `upper`, back along reversed `lower`. */
export function bandPath(upper: Pt[], lower: Pt[], tension = 0.5): string {
  if (upper.length === 0 || lower.length === 0) return "";
  const top = smoothPath(upper, tension);
  const rev = [...lower].reverse();
  let bottom = ` L ${rev[0].x} ${rev[0].y}`;
  for (let i = 0; i < rev.length - 1; i++) {
    const p0 = rev[i - 1] ?? rev[i];
    const p1 = rev[i];
    const p2 = rev[i + 1];
    const p3 = rev[i + 2] ?? p2;
    const cp1x = p1.x + ((p2.x - p0.x) / 6) * tension * 2;
    const cp1y = p1.y + ((p2.y - p0.y) / 6) * tension * 2;
    const cp2x = p2.x - ((p3.x - p1.x) / 6) * tension * 2;
    const cp2y = p2.y - ((p3.y - p1.y) / 6) * tension * 2;
    bottom += ` C ${cp1x} ${cp1y} ${cp2x} ${cp2y} ${p2.x} ${p2.y}`;
  }
  return `${top}${bottom} Z`;
}
