// Pure geometry helpers for drag-and-drop hit-testing.
// Kept free of React/Reanimated so they are easy to reason about and test.

export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface ZoneFrame extends Rect {
  zoneId: string;
}

export interface Point {
  x: number;
  y: number;
}

export function pointInRect(p: Point, r: Rect): boolean {
  return (
    p.x >= r.x && p.x <= r.x + r.width && p.y >= r.y && p.y <= r.y + r.height
  );
}

/** Squared distance from a point to the center of a rect (for nearest fallback). */
function distanceToCenterSq(p: Point, r: Rect): number {
  const cx = r.x + r.width / 2;
  const cy = r.y + r.height / 2;
  const dx = p.x - cx;
  const dy = p.y - cy;
  return dx * dx + dy * dy;
}

/**
 * Find which zone a point falls into. If it is inside a zone, return that zone.
 * Otherwise fall back to the vertically-nearest zone (so a drop just above/below
 * the board still lands somewhere sensible).
 */
export function findZoneAtPoint(
  p: Point,
  zones: ZoneFrame[]
): string | null {
  if (zones.length === 0) return null;
  for (const z of zones) {
    if (pointInRect(p, z)) return z.zoneId;
  }
  let best: ZoneFrame | null = null;
  let bestDist = Infinity;
  for (const z of zones) {
    const d = distanceToCenterSq(p, z);
    if (d < bestDist) {
      bestDist = d;
      best = z;
    }
  }
  return best ? best.zoneId : null;
}

/**
 * Given the absolute x-centers of the items currently in a target lane (in
 * order) and a drop x, return the insertion index. Items wrap, so we use both
 * x and y of each slot center to find the closest slot, then decide whether to
 * insert before or after it based on horizontal position.
 */
export function insertionIndexFromPoint(
  p: Point,
  slotCenters: Point[]
): number {
  if (slotCenters.length === 0) return 0;
  // Find the nearest slot center by 2D distance.
  let nearest = 0;
  let nearestDist = Infinity;
  for (let i = 0; i < slotCenters.length; i++) {
    const dx = p.x - slotCenters[i].x;
    const dy = p.y - slotCenters[i].y;
    const d = dx * dx + dy * dy;
    if (d < nearestDist) {
      nearestDist = d;
      nearest = i;
    }
  }
  // Insert before the nearest slot if dropped on its left half, else after.
  return p.x < slotCenters[nearest].x ? nearest : nearest + 1;
}
