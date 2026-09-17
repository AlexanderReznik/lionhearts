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
