import { describe, it, expect } from 'vitest';
import { teamWordmarkSrc } from '../../src/lib/teamWordmark';

describe('teamWordmarkSrc', () => {
  it('maps a team name to its navy (base) wordmark path', () => {
    expect(teamWordmarkSrc('Vinarius')).toBe('/brand/teams/vinarius-base.svg');
  });

  it('maps the white variant when variant="white"', () => {
    expect(teamWordmarkSrc('Roar', 'white')).toBe('/brand/teams/roar.svg');
  });

  it('lowercases multi-style names consistently', () => {
    expect(teamWordmarkSrc('Predators')).toBe('/brand/teams/predators-base.svg');
  });
});
