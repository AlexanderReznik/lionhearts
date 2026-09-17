import { describe, it, expect } from 'vitest';
import { PHASES, lawConstraintsFor } from '../../src/lib/judge';

describe('lawConstraintsFor', () => {
  it('keeps only the positional rules a referee actually calls', () => {
    for (const phase of PHASES) {
      const kinds = new Set(lawConstraintsFor(phase).map(c => c.kind));
      expect(kinds).toEqual(new Set(['depthOrder', 'lateralOrder', 'inCourt', 'separation']));
    }
  });

  it('drops our club receive system, which is convention and not law', () => {
    for (const phase of PHASES) {
      const kinds = lawConstraintsFor(phase).map(c => c.kind);
      expect(kinds).not.toContain('depthBand');
      expect(kinds).not.toContain('spread');
      expect(kinds).not.toContain('nearNet');
      expect(kinds).not.toContain('nearPoint');
    }
  });

  it('keeps all six depth and lateral orderings', () => {
    const cs = lawConstraintsFor(0);
    expect(cs.filter(c => c.kind === 'depthOrder')).toHaveLength(3);
    expect(cs.filter(c => c.kind === 'lateralOrder')).toHaveLength(4);
  });
});

import { faultIn, samePair } from '../../src/lib/judge';
import { WITNESSES } from '../fixtures/rotation-witnesses';
import type { Placement } from '../../src/lib/rotation';

describe('faultIn', () => {
  it('returns null for a legal formation', () => {
    for (const phase of PHASES) {
      expect(faultIn(WITNESSES[phase], phase)).toBeNull();
    }
  });

  it('names the overlapping pair when a back-row player creeps in front', () => {
    // Rotation 1: P5 must be level with or behind P4.
    const p: Placement = { ...WITNESSES[0], 5: { x: 1.06, y: 0.2 } };
    const fault = faultIn(p, 0);
    expect(fault).not.toBeNull();
    expect(samePair(fault!.pair, [4, 5])).toBe(true);
    expect(fault!.message).toContain('further from the net');
  });

  it('treats exactly level as legal, per 7.4.3.1', () => {
    const p: Placement = { ...WITNESSES[0], 5: { x: 1.06, y: WITNESSES[0][4].y } };
    expect(faultIn(p, 0)).toBeNull();
  });
});

describe('samePair', () => {
  it('ignores the order the two players were tapped in', () => {
    expect(samePair([4, 5], [5, 4])).toBe(true);
    expect(samePair([4, 5], [4, 6])).toBe(false);
  });
});
