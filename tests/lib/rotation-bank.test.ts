import { describe, it, expect } from 'vitest';
import { SQUAD } from '../../src/data/squad';
import { ROTATIONS } from '../../src/data/rotations';
import { LINEUP_CYCLE, roleAt, type Slot } from '../../src/lib/rotation';

const roleOf = (n: number) => SQUAD.find(m => m.number === n)?.role;

describe('squad', () => {
  it('is fourteen players with unique numbers', () => {
    expect(SQUAD).toHaveLength(14);
    expect(new Set(SQUAD.map(m => m.number)).size).toBe(14);
  });

  it('carries a full 5-1 bench', () => {
    const count = (r: string) => SQUAD.filter(m => m.role === r).length;
    expect([count('S'), count('OPP'), count('OH'), count('MB'), count('L')]).toEqual([2, 2, 4, 4, 2]);
  });
});

describe('puzzle bank', () => {
  it('covers at least two years', () => {
    expect(ROTATIONS.length).toBeGreaterThanOrEqual(730);
  });

  it('numbers puzzles consecutively from zero', () => {
    ROTATIONS.forEach((p, i) => expect(p.id).toBe(i));
  });

  it('casts every slot with a squad member of the right role', () => {
    for (const p of ROTATIONS) {
      expect(p.start).toHaveLength(6);
      ([1, 2, 3, 4, 5, 6] as Slot[]).forEach(slot => {
        expect(roleOf(p.start[slot - 1])).toBe(roleAt(slot, 0));
      });
      expect(roleOf(p.libero)).toBe('L');
      expect(new Set(p.start).size).toBe(6);
    }
  });

  it('shuffles rotations so each block of six covers all of them', () => {
    for (let i = 0; i + 6 <= ROTATIONS.length; i += 6) {
      const block = ROTATIONS.slice(i, i + 6).map(p => p.phase).sort();
      expect(block).toEqual([0, 1, 2, 3, 4, 5]);
    }
  });

  it('never repeats a rotation back to back', () => {
    for (let i = 1; i < ROTATIONS.length; i++) {
      expect(ROTATIONS[i].phase).not.toBe(ROTATIONS[i - 1].phase);
    }
  });
});
