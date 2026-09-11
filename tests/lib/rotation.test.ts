import { describe, it, expect } from 'vitest';
import {
  LINEUP_CYCLE, BACK_ROW, isFrontRow, roleAt, liberoSlot, onCourtRole,
  setterSlot, middleSlot, oppositeSlot, passerSlots, type Phase, type Slot,
} from '../../src/lib/rotation';

const PHASES: Phase[] = [0, 1, 2, 3, 4, 5];

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
