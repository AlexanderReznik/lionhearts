import { describe, it, expect } from 'vitest';
import { scatterPositions, scatterInCircle, repulse } from '../../src/lib/flagField';

describe('scatterPositions', () => {
  it('returns exactly one position per flag', () => {
    expect(scatterPositions(27, 400, 300)).toHaveLength(27);
    expect(scatterPositions(1, 400, 300)).toHaveLength(1);
    expect(scatterPositions(0, 400, 300)).toHaveLength(0);
  });

  it('keeps every position inside the field bounds', () => {
    const w = 400;
    const h = 300;
    for (const p of scatterPositions(27, w, h)) {
      expect(p.x).toBeGreaterThanOrEqual(0);
      expect(p.x).toBeLessThanOrEqual(w);
      expect(p.y).toBeGreaterThanOrEqual(0);
      expect(p.y).toBeLessThanOrEqual(h);
    }
  });

  it('is deterministic — same inputs give identical output', () => {
    const a = scatterPositions(27, 400, 300);
    const b = scatterPositions(27, 400, 300);
    expect(a).toEqual(b);
  });

  it('spreads points apart — no clumping, no grid', () => {
    const w = 400;
    const h = 300;
    const count = 27;
    const pts = scatterPositions(count, w, h);
    // Nearest-neighbour distance for every point should beat what a plain
    // random dartboard would routinely produce. Blue-noise keeps points at
    // least a fraction of the ideal cell spacing apart.
    const ideal = Math.sqrt((w * h) / count);
    let minNN = Infinity;
    for (let i = 0; i < pts.length; i++) {
      let nn = Infinity;
      for (let j = 0; j < pts.length; j++) {
        if (i === j) continue;
        nn = Math.min(nn, Math.hypot(pts[i].x - pts[j].x, pts[i].y - pts[j].y));
      }
      minNN = Math.min(minNN, nn);
    }
    expect(minNN).toBeGreaterThan(ideal * 0.4);
  });

  it('does not align points into shared columns (not a grid)', () => {
    const xs = scatterPositions(27, 400, 300).map((p) => Math.round(p.x));
    const uniqueXs = new Set(xs);
    // A grid would collapse to a handful of column x-values; a scatter won't.
    expect(uniqueXs.size).toBeGreaterThan(20);
  });

  it('guarantees a minimum gap between every pair when minDist is given', () => {
    const minDist = 55;
    const pts = scatterPositions(27, 400, 300, 30, minDist);
    for (let i = 0; i < pts.length; i++) {
      for (let j = i + 1; j < pts.length; j++) {
        const d = Math.hypot(pts[i].x - pts[j].x, pts[i].y - pts[j].y);
        expect(d).toBeGreaterThanOrEqual(minDist - 0.5);
      }
    }
  });

  it('still keeps points in bounds after enforcing the gap', () => {
    const pts = scatterPositions(27, 400, 300, 30, 55);
    for (const p of pts) {
      expect(p.x).toBeGreaterThanOrEqual(0);
      expect(p.x).toBeLessThanOrEqual(400);
      expect(p.y).toBeGreaterThanOrEqual(0);
      expect(p.y).toBeLessThanOrEqual(300);
    }
  });
});

describe('scatterInCircle', () => {
  it('returns exactly one position per flag', () => {
    expect(scatterInCircle(27, 200)).toHaveLength(27);
    expect(scatterInCircle(0, 200)).toHaveLength(0);
  });

  it('keeps every point inside the circle', () => {
    const r = 200;
    for (const p of scatterInCircle(27, r)) {
      expect(Math.hypot(p.x, p.y)).toBeLessThanOrEqual(r + 1e-9);
    }
  });

  it('is deterministic — same inputs give identical output', () => {
    expect(scatterInCircle(27, 200)).toEqual(scatterInCircle(27, 200));
  });

  it('guarantees a minimum gap and stays inside the circle', () => {
    const r = 200;
    const minDist = 55;
    const pts = scatterInCircle(27, r, 30, minDist);
    for (let i = 0; i < pts.length; i++) {
      expect(Math.hypot(pts[i].x, pts[i].y)).toBeLessThanOrEqual(r + 1e-6);
      for (let j = i + 1; j < pts.length; j++) {
        const d = Math.hypot(pts[i].x - pts[j].x, pts[i].y - pts[j].y);
        expect(d).toBeGreaterThanOrEqual(minDist - 0.5);
      }
    }
  });

  it('spreads points apart — no clumping', () => {
    const r = 200;
    const count = 27;
    const pts = scatterInCircle(count, r);
    const ideal = Math.sqrt((Math.PI * r * r) / count);
    let minNN = Infinity;
    for (let i = 0; i < pts.length; i++) {
      let nn = Infinity;
      for (let j = 0; j < pts.length; j++) {
        if (i === j) continue;
        nn = Math.min(nn, Math.hypot(pts[i].x - pts[j].x, pts[i].y - pts[j].y));
      }
      minNN = Math.min(minNN, nn);
    }
    expect(minNN).toBeGreaterThan(ideal * 0.4);
  });
});

describe('repulse', () => {
  const home = { x: 100, y: 100 };

  it('returns no offset when the pointer is beyond the radius', () => {
    const off = repulse({ x: 100, y: 400 }, home, 80, 40); // 300px away, radius 80
    expect(off).toEqual({ dx: 0, dy: 0 });
  });

  it('pushes the flag directly away from the pointer', () => {
    // pointer to the left of home -> flag pushed right (+dx), no vertical component
    const off = repulse({ x: 60, y: 100 }, home, 100, 40);
    expect(off.dx).toBeGreaterThan(0);
    expect(off.dy).toBeCloseTo(0, 5);
  });

  it('pushes harder the closer the pointer is (falloff)', () => {
    const near = repulse({ x: 90, y: 100 }, home, 100, 40); // 10px away
    const far = repulse({ x: 40, y: 100 }, home, 100, 40); //  60px away
    expect(Math.abs(near.dx)).toBeGreaterThan(Math.abs(far.dx));
  });

  it('returns no offset (no NaN) when the pointer sits exactly on the flag', () => {
    const off = repulse({ x: 100, y: 100 }, home, 100, 40);
    expect(off.dx).toBe(0);
    expect(off.dy).toBe(0);
  });
});
