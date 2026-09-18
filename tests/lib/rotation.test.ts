import { describe, it, expect } from 'vitest';
import {
  LINEUP_CYCLE, BACK_ROW, DEPTH_PAIRS, isFrontRow, roleAt, liberoSlot, onCourtRole,
  setterSlot, middleSlot, oppositeSlot, passerSlots, constraintsFor, PASS_BAND, type Phase, type Slot, type Constraint,
} from '../../src/lib/rotation';

const PHASES: Phase[] = [0, 1, 2, 3, 4, 5];

describe('DEPTH_PAIRS', () => {
  it('pins the rulebook correspondence (7.4.2.1), not the diagonals', () => {
    // Every other test exercises depth pairing only through the validator,
    // so a wrong pairing here would still be self-consistent and pass.
    expect(DEPTH_PAIRS).toEqual([[4, 5], [3, 6], [2, 1]]);
  });
});

describe('lineup cycle', () => {
  it('is the club 5-1 order', () => {
    expect(LINEUP_CYCLE).toEqual(['S', 'OH', 'MB', 'OPP', 'OH', 'MB']);
  });

  it('puts every diagonal pair three apart', () => {
    for (const [a, b] of [[0, 3], [1, 4], [2, 5]] as const) {
      const pair = [LINEUP_CYCLE[a], LINEUP_CYCLE[b]].sort().join('/');
      expect(['MB/MB', 'OH/OH', 'OPP/S']).toContain(pair);
    }
  });
});

describe('roleAt', () => {
  it('lays out rotation 1 as S OH MB OPP OH MB', () => {
    expect(([1, 2, 3, 4, 5, 6] as Slot[]).map(s => roleAt(s, 0)))
      .toEqual(['S', 'OH', 'MB', 'OPP', 'OH', 'MB']);
  });

  it('advances one step per rotation', () => {
    expect(([1, 2, 3, 4, 5, 6] as Slot[]).map(s => roleAt(s, 1)))
      .toEqual(['OH', 'MB', 'OPP', 'OH', 'MB', 'S']);
  });
});

describe('libero substitution', () => {
  it('always replaces a back-row middle', () => {
    for (const phase of PHASES) {
      const slot = liberoSlot(phase);
      expect(BACK_ROW).toContain(slot);
      expect(roleAt(slot, phase)).toBe('MB');
      expect(onCourtRole(slot, phase)).toBe('L');
    }
  });

  it('leaves exactly one middle on court, always front row', () => {
    for (const phase of PHASES) {
      const middles = ([1, 2, 3, 4, 5, 6] as Slot[]).filter(s => onCourtRole(s, phase) === 'MB');
      expect(middles).toHaveLength(1);
      expect(isFrontRow(middles[0])).toBe(true);
      expect(middleSlot(phase)).toBe(middles[0]);
    }
  });
});

describe('role slots', () => {
  it('keeps setter and opposite diagonal', () => {
    for (const phase of PHASES) {
      expect(Math.abs(setterSlot(phase) - oppositeSlot(phase))).toBe(3);
    }
  });

  it('has exactly three passers — the libero and both outsides', () => {
    for (const phase of PHASES) {
      const passers = passerSlots(phase);
      expect(passers).toHaveLength(3);
      expect(passers).toContain(liberoSlot(phase));
      expect(passers.map(s => onCourtRole(s, phase)).sort()).toEqual(['L', 'OH', 'OH']);
    }
  });
});

const kinds = (cs: Constraint[], kind: Constraint['kind']) => cs.filter(c => c.kind === kind);

describe('constraintsFor', () => {
  it('always carries the three depth and four lateral orderings', () => {
    for (const phase of PHASES) {
      const cs = constraintsFor(phase);
      expect(kinds(cs, 'depthOrder')).toHaveLength(3);
      expect(kinds(cs, 'lateralOrder')).toHaveLength(4);
      expect(kinds(cs, 'inCourt')).toHaveLength(1);
      expect(kinds(cs, 'separation')).toHaveLength(1);
    }
  });

  it('bands exactly the three passers', () => {
    for (const phase of PHASES) {
      const band = kinds(constraintsFor(phase), 'depthBand');
      expect(band).toHaveLength(1);
      const c = band[0] as Extract<Constraint, { kind: 'depthBand' }>;
      expect(c.slots.sort()).toEqual(passerSlots(phase).sort());
      expect([c.min, c.max]).toEqual([PASS_BAND.min, PASS_BAND.max]);
    }
  });

  it('holds the middle to the net in every rotation', () => {
    for (const phase of PHASES) {
      const net = kinds(constraintsFor(phase), 'nearNet');
      const middle = net.find(c => (c as { slot: Slot }).slot === middleSlot(phase));
      expect(middle).toBeDefined();
    }
  });

  it('only holds the opposite to the net when they are front row', () => {
    for (const phase of PHASES) {
      const net = kinds(constraintsFor(phase), 'nearNet');
      const opp = net.find(c => (c as { slot: Slot }).slot === oppositeSlot(phase));
      expect(Boolean(opp)).toBe(isFrontRow(oppositeSlot(phase)));
    }
  });

  it('pins the setter to their release point', () => {
    for (const phase of PHASES) {
      const near = kinds(constraintsFor(phase), 'nearPoint');
      expect(near).toHaveLength(1);
      expect((near[0] as { slot: Slot }).slot).toBe(setterSlot(phase));
    }
  });
});
