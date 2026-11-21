import { describe, it, expect } from 'vitest';
import { fairyLights } from '../../src/lib/fairyLights';

type Pt = { x: number; y: number };

// Samples an "M … Q … T …" path the way SVG renders it: T reflects the
// previous control point about the current point.
function sampleWire(d: string): Pt[] {
  const tokens = d.match(/[MQT]|-?\d*\.?\d+/g) ?? [];
  const pts: Pt[] = [];
  let cur: Pt = { x: 0, y: 0 };
  let ctrl: Pt | null = null;
  let i = 0;
  const num = () => Number(tokens[i++]);
  while (i < tokens.length) {
    const cmd = tokens[i++];
    if (cmd === 'M') {
      cur = { x: num(), y: num() };
      ctrl = null;
      continue;
    }
    const c: Pt = cmd === 'Q'
      ? { x: num(), y: num() }
      : ctrl ? { x: 2 * cur.x - ctrl.x, y: 2 * cur.y - ctrl.y } : cur;
    const end: Pt = { x: num(), y: num() };
    for (let k = 0; k <= 40; k++) {
      const t = k / 40;
      const a = (1 - t) ** 2, b = 2 * t * (1 - t), e = t ** 2;
      pts.push({ x: a * cur.x + b * c.x + e * end.x, y: a * cur.y + b * c.y + e * end.y });
    }
    ctrl = c;
    cur = end;
  }
  return pts;
}

function wireYAt(pts: Pt[], x: number): number {
  return pts.reduce((best, p) => (Math.abs(p.x - x) < Math.abs(best.x - x) ? p : best)).y;
}

describe('fairyLights', () => {
  const lights = fairyLights(3000, 26, 15);
  const wire = sampleWire(lights.wire);

  it('hangs every bulb on the wire', () => {
    const offWire = lights.bulbs.filter((b) => Math.abs(wireYAt(wire, b.cx) - lights.hangY) > 1);
    expect(offWire.map((b) => b.cx)).toEqual([]);
  });

  it('keeps the whole wire inside the strip', () => {
    const outside = wire.filter((p) => p.y < 0 || p.y > lights.height);
    expect(outside).toEqual([]);
  });

  it('runs the wire past the last bulb', () => {
    const lastBulb = lights.bulbs[lights.bulbs.length - 1].cx;
    expect(Math.max(...wire.map((p) => p.x))).toBeGreaterThanOrEqual(lastBulb);
  });

  it('gives each colour all four twinkle phases', () => {
    for (const colour of ['blue', 'red', 'green', 'white'] as const) {
      const delays = new Set(lights.bulbs.filter((b) => b.colour === colour).map((b) => b.delay));
      expect([...delays].sort()).toEqual([0, 1, 2, 3]);
    }
  });
});
