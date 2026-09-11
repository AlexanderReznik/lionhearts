import { describe, it, expect } from 'vitest';
import { validate, constraintsFor, SETTER_RADIUS, SETTER_TARGET, type Phase } from '../../src/lib/rotation';
import { WITNESSES } from '../fixtures/rotation-witnesses';

const PHASES: Phase[] = [0, 1, 2, 3, 4, 5];

describe('every rotation is solvable', () => {
  it.each(PHASES)('rotation %i has a legal formation', phase => {
    expect(validate(WITNESSES[phase], constraintsFor(phase))).toEqual([]);
  });

  it.each(PHASES)('rotation %i has a setter radius that is not vacuous', phase => {
    // A radius wide enough to cover the whole court would not constrain anything.
    expect(SETTER_RADIUS[phase]).toBeLessThan(Math.hypot(9, 9));
    expect(SETTER_RADIUS[phase]).toBeGreaterThan(0);
  });

  it.each(PHASES)('rotation %i keeps its witness setter inside the radius', phase => {
    const setter = Object.entries(WITNESSES[phase])
      .map(([slot, v]) => ({ slot: Number(slot), v }))
      .find(({ slot }) => constraintsFor(phase).some(
        c => c.kind === 'nearPoint' && c.slot === slot));
    expect(setter).toBeDefined();
    const d = Math.hypot(setter!.v.x - SETTER_TARGET.x, setter!.v.y - SETTER_TARGET.y);
    expect(d).toBeLessThanOrEqual(SETTER_RADIUS[phase]);
  });
});
