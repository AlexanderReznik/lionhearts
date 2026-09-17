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

import { faultIn, samePair, tightestMargin } from '../../src/lib/judge';
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

describe('tightestMargin', () => {
  it('is non-negative for every legal witness formation', () => {
    for (const phase of PHASES) {
      const margin = tightestMargin(WITNESSES[phase], phase);
      expect(margin).not.toBeNull();
      expect(margin!.metres).toBeGreaterThanOrEqual(0);
    }
  });

  it('reports exactly 0 for a depth pair set exactly level', () => {
    const p: Placement = { ...WITNESSES[0], 5: { x: 1.06, y: WITNESSES[0][4].y } };
    const margin = tightestMargin(p, 0);
    expect(margin).not.toBeNull();
    expect(margin!.kind).toBe('depthOrder');
    expect(samePair(margin!.pair, [4, 5])).toBe(true);
    expect(margin!.metres).toBe(0);
  });

  it('reports a negative margin naming the pair for a known depth fault', () => {
    const p: Placement = { ...WITNESSES[0], 5: { x: 1.06, y: 0.2 } };
    const margin = tightestMargin(p, 0);
    expect(margin).not.toBeNull();
    expect(margin!.kind).toBe('depthOrder');
    expect(samePair(margin!.pair, [4, 5])).toBe(true);
    expect(margin!.metres).toBeLessThan(0);
  });

  it('picks the smallest signed margin, not the smallest absolute one', () => {
    // Rotation 1, WITNESSES[0]: P5 breaks the 4/5 depth pair by -0.6m (a
    // genuine fault), while P3 is nudged to sit only 0.01m left of P2 (tight
    // but still legal). The signed minimum is -0.6 (pair [4,5]); a buggy
    // abs-min implementation would instead return the smaller-magnitude
    // +0.01 (pair [3,2]), so this distinguishes the two.
    const p: Placement = {
      ...WITNESSES[0],
      5: { x: 1.06, y: 0.2 },
      3: { x: WITNESSES[0][2].x - 0.01, y: WITNESSES[0][3].y },
    };
    const margin = tightestMargin(p, 0);
    expect(margin).not.toBeNull();
    expect(margin!.kind).toBe('depthOrder');
    expect(samePair(margin!.pair, [4, 5])).toBe(true);
    expect(margin!.metres).toBeCloseTo(-0.6, 5);
  });
});

import { judgeCall } from '../../src/lib/judge';

describe('judgeCall', () => {
  const legal = WITNESSES[0];
  const illegal: Placement = { ...WITNESSES[0], 5: { x: 1.06, y: 0.2 } };

  it('legal called legal is correct', () => {
    const v = judgeCall({ placement: legal, phase: 0, calledLegal: true, tapped: null });
    expect(v.outcome).toBe('correct');
    expect(v.truth).toBeNull();
  });

  it('illegal called legal is wrong, and still names the pair so the player learns', () => {
    const v = judgeCall({ placement: illegal, phase: 0, calledLegal: true, tapped: null });
    expect(v.outcome).toBe('wrong');
    expect(samePair(v.truth!.pair, [4, 5])).toBe(true);
  });

  it('legal called illegal is wrong', () => {
    const v = judgeCall({ placement: legal, phase: 0, calledLegal: false, tapped: [4, 5] });
    expect(v.outcome).toBe('wrong');
    expect(v.truth).toBeNull();
  });

  it('illegal called illegal with the right pair is correct', () => {
    const v = judgeCall({ placement: illegal, phase: 0, calledLegal: false, tapped: [5, 4] });
    expect(v.outcome).toBe('correct');
  });

  it('illegal called illegal with the wrong pair is partial', () => {
    const v = judgeCall({ placement: illegal, phase: 0, calledLegal: false, tapped: [2, 3] });
    expect(v.outcome).toBe('partial');
    expect(samePair(v.truth!.pair, [4, 5])).toBe(true);
  });

  it('illegal called illegal naming no pair is partial: confirmed illegal, credit withheld', () => {
    const v = judgeCall({ placement: illegal, phase: 0, calledLegal: false, tapped: null });
    expect(v.outcome).toBe('partial');
    expect(samePair(v.truth!.pair, [4, 5])).toBe(true);
  });
});
