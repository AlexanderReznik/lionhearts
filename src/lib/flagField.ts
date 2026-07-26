/**
 * Pure geometry helpers for the community section's floating flag field.
 * Deterministic (no Math.random) so the layout is stable across reloads and
 * unit-testable; the DOM/animation glue lives in CommunitySection.astro.
 */

export interface Point {
  x: number;
  y: number;
}

export interface Offset {
  dx: number;
  dy: number;
}

/**
 * Deterministic pseudo-random value in [0, 1) from an integer seed.
 * Classic fract(sin(n) * k) hash — varied enough to read as scatter, fixed
 * per seed so the arrangement never shifts between loads.
 */
function hash(n: number): number {
  const s = Math.sin(n * 127.1) * 43758.5453;
  return s - Math.floor(s);
}

/**
 * Push any pair of points closer than `minDist` apart (in place), then pull each
 * back inside the field via `clampPoint`. A few iterations of this relaxation
 * turn best-candidate output into a guaranteed minimum spacing — two 44×32 chips
 * can't overlap once their centres are √(44²+32²) ≈ 55px apart. Deterministic.
 */
function separate(
  points: Point[],
  minDist: number,
  clampPoint: (p: Point) => void,
  iterations = 80,
): void {
  if (minDist <= 0) return;
  const min2 = minDist * minDist;
  for (let it = 0; it < iterations; it++) {
    let moved = false;
    for (let i = 0; i < points.length; i++) {
      for (let j = i + 1; j < points.length; j++) {
        const a = points[i];
        const b = points[j];
        const dx = b.x - a.x;
        const dy = b.y - a.y;
        const d2 = dx * dx + dy * dy;
        if (d2 >= min2) continue;
        if (d2 === 0) {
          // Coincident points — separate them deterministically along x.
          a.x -= minDist / 2;
          b.x += minDist / 2;
        } else {
          const d = Math.sqrt(d2);
          const push = (minDist - d) / 2;
          const ux = dx / d;
          const uy = dy / d;
          a.x -= ux * push;
          a.y -= uy * push;
          b.x += ux * push;
          b.y += uy * push;
        }
        moved = true;
      }
    }
    for (const p of points) clampPoint(p);
    if (!moved) break;
  }
}

/**
 * Scatter `count` flag centres across a `width` × `height` field using
 * Mitchell's best-candidate algorithm: for each flag, generate `candidates`
 * deterministic candidate points and keep the one farthest from everything
 * placed so far. The result is blue-noise — organic and random-looking with no
 * visible grid, yet self-spacing so flags don't clump. Deterministic (no
 * Math.random), so the layout is stable across reloads and unit-testable.
 *
 * Returns centre coordinates within [0, width] × [0, height].
 */
export function scatterPositions(
  count: number,
  width: number,
  height: number,
  candidates = 30,
  minDist = 0,
): Point[] {
  const points: Point[] = [];
  for (let i = 0; i < count; i++) {
    let best: Point | null = null;
    let bestDist = -1;
    for (let c = 0; c < candidates; c++) {
      const seed = i * 1000 + c;
      const cand: Point = {
        x: hash(seed * 2) * width,
        y: hash(seed * 2 + 1) * height,
      };
      let nearest = Infinity;
      for (const p of points) {
        const d = (p.x - cand.x) ** 2 + (p.y - cand.y) ** 2;
        if (d < nearest) nearest = d;
      }
      if (nearest > bestDist) {
        bestDist = nearest;
        best = cand;
      }
    }
    if (best) points.push(best);
  }
  separate(points, minDist, (p) => {
    p.x = Math.min(Math.max(p.x, 0), width);
    p.y = Math.min(Math.max(p.y, 0), height);
  });
  return points;
}

/**
 * Same best-candidate scatter as {@link scatterPositions}, but constrained to a
 * disc of the given `radius` centred on the origin. Candidates are drawn
 * uniformly across the disc (r = radius·√u so points don't bunch at the centre).
 * Returns centre coordinates in [-radius, radius] with x² + y² ≤ radius².
 */
export function scatterInCircle(
  count: number,
  radius: number,
  candidates = 30,
  minDist = 0,
): Point[] {
  const points: Point[] = [];
  for (let i = 0; i < count; i++) {
    let best: Point | null = null;
    let bestDist = -1;
    for (let c = 0; c < candidates; c++) {
      const seed = i * 1000 + c;
      const r = radius * Math.sqrt(hash(seed * 2));
      const theta = 2 * Math.PI * hash(seed * 2 + 1);
      const cand: Point = { x: r * Math.cos(theta), y: r * Math.sin(theta) };
      let nearest = Infinity;
      for (const p of points) {
        const d = (p.x - cand.x) ** 2 + (p.y - cand.y) ** 2;
        if (d < nearest) nearest = d;
      }
      if (nearest > bestDist) {
        bestDist = nearest;
        best = cand;
      }
    }
    if (best) points.push(best);
  }
  separate(points, minDist, (p) => {
    const d = Math.hypot(p.x, p.y);
    if (d > radius) {
      p.x = (p.x / d) * radius;
      p.y = (p.y / d) * radius;
    }
  });
  return points;
}

/**
 * Repulsion offset for a flag at `home` given the pointer position. Flags
 * within `radius` are pushed radially away from the pointer with linear
 * distance falloff (full `strength` at the pointer, zero at the edge). Flags
 * beyond the radius — or exactly under the pointer — get a zero offset.
 */
export function repulse(
  pointer: Point,
  home: Point,
  radius: number,
  strength: number,
): Offset {
  const dx = home.x - pointer.x;
  const dy = home.y - pointer.y;
  const dist = Math.hypot(dx, dy);
  if (dist === 0 || dist >= radius) return { dx: 0, dy: 0 };
  const falloff = (radius - dist) / radius;
  const magnitude = strength * falloff;
  return {
    dx: (dx / dist) * magnitude,
    dy: (dy / dist) * magnitude,
  };
}
