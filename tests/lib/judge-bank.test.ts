import { describe, it, expect } from 'vitest';
import { JUDGE } from '../../src/data/judge';
import { faultIn, lawConstraintsFor, tightestMargin } from '../../src/lib/judge';
import { ALL_SLOTS, COURT_M, MIN_SEPARATION, validate, type Phase } from '../../src/lib/rotation';
import { SQUAD } from '../../src/data/squad';
import { ROTATIONS } from '../../src/data/rotations';

describe('the judge bank', () => {
  it('has consecutive ids and the same length as the rotation bank, so both roll over together', () => {
    expect(JUDGE.length).toBe(ROTATIONS.length);
    JUDGE.forEach((d, i) => expect(d.id).toBe(i));
  });

  it('gives every day six calls, one per rotation of a full cycle', () => {
    for (const d of JUDGE) {
      expect(d.formations).toHaveLength(6);
    }
  });

  it('puts between two and four illegal formations in every day', () => {
    for (const d of JUDGE) {
      const illegal = d.formations.filter((p, i) =>
        faultIn(p, ((d.startPhase + i) % 6) as Phase) !== null).length;
      expect(illegal).toBeGreaterThanOrEqual(2);
      expect(illegal).toBeLessThanOrEqual(4);
    }
  });

  it('never ships a formation with players overlapping bodies or off the court', () => {
    for (const d of JUDGE) {
      for (const [i, p] of d.formations.entries()) {
        const phase = ((d.startPhase + i) % 6) as Phase;
        const broken = validate(p, lawConstraintsFor(phase))
          .filter(v => v.kind === 'separation' || v.kind === 'inCourt');
        expect(broken).toEqual([]);
        for (const s of ALL_SLOTS) {
          expect(p[s].x).toBeGreaterThanOrEqual(0);
          expect(p[s].x).toBeLessThanOrEqual(COURT_M);
          expect(p[s].y).toBeGreaterThanOrEqual(0);
          expect(p[s].y).toBeLessThanOrEqual(COURT_M);
        }
      }
    }
  });

  it('names real squad members, with a real libero', () => {
    const numbers = new Set(SQUAD.map(m => m.number));
    const liberos = new Set(SQUAD.filter(m => m.role === 'L').map(m => m.number));
    for (const d of JUDGE) {
      expect(d.start).toHaveLength(6);
      for (const n of d.start) expect(numbers.has(n)).toBe(true);
      expect(liberos.has(d.libero)).toBe(true);
    }
  });

  it('keeps every illegal call visible and every legal call tight, by the actual margin', () => {
    // 0.3m is the design floor for a fault; 0.25m allows for the bank's 2dp
    // rounding. Legal formations are squeezed to 0.05m-0.3m so they can't be
    // told from illegal ones by eye; 0.35m gives the same rounding slack.
    for (const d of JUDGE) {
      for (const [i, p] of d.formations.entries()) {
        const phase = ((d.startPhase + i) % 6) as Phase;
        const fault = faultIn(p, phase);
        const margin = tightestMargin(p, phase);
        expect(margin).not.toBeNull();
        if (fault) {
          expect(margin!.metres).toBeLessThan(0);
          expect(Math.abs(margin!.metres)).toBeGreaterThan(0.25);
        } else {
          expect(margin!.metres).toBeGreaterThanOrEqual(0);
          expect(margin!.metres).toBeLessThanOrEqual(0.35);
        }
      }
    }
  });
});
