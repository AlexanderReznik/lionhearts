import { describe, it, expect } from 'vitest';
import { teams, teamSlug } from '../src/data/teams';

describe('teamSlug', () => {
  it('kebab-cases the team name', () => {
    expect(teamSlug({ name: 'London Lionhearts' })).toBe('london-lionhearts');
    expect(teamSlug({ name: 'Alpha' })).toBe('alpha');
  });

  // Each slug is both a photo filename and the /fixtures#<slug> anchor the
  // team cards link to, so two teams sharing one would break a deep link.
  it('is unique across all teams', () => {
    const slugs = teams.map(teamSlug);
    expect(new Set(slugs).size).toBe(slugs.length);
  });
});
