import { describe, it, expect } from 'vitest';
import {
  parseHomeAway,
  parseScore,
  formatFixtureDate,
  formatFixtureTime,
  formatMatchResult,
} from '../src/lib/volleyzone';
import type { Match } from '../src/lib/volleyzone';

const BASE_MATCH: Match = {
  fixtureId: '1',
  fixtureDate: 0,
  fixtureStatus: 'result',
  homeTeam: 'Lionhearts Vinarius',
  awayTeam: 'Worcester Wolves',
  homeScore: '3;',
  awayScore: '0;',
  homeResult: 'win',
  awayResult: 'lose',
  venue: 'Mulberry Academy Shoreditch',
  metaData: { scores: { home: {}, away: {} } },
};

describe('parseHomeAway', () => {
  it('returns Home when homeTeam includes Lionhearts', () => {
    expect(parseHomeAway(BASE_MATCH)).toBe('Home');
  });

  it('returns Away when awayTeam includes Lionhearts', () => {
    const m = { ...BASE_MATCH, homeTeam: 'Worcester Wolves', awayTeam: 'Lionhearts Alpha' };
    expect(parseHomeAway(m)).toBe('Away');
  });
});

describe('parseScore', () => {
  it('strips trailing semicolons and parses integers', () => {
    expect(parseScore('3;', '0;')).toEqual({ home: 3, away: 0 });
  });

  it('handles scores without trailing semicolons', () => {
    expect(parseScore('1', '3')).toEqual({ home: 1, away: 3 });
  });
});

describe('formatFixtureDate', () => {
  it('formats a Unix timestamp as "3 May"', () => {
    // 2026-05-03T12:00:00Z — noon UTC, unambiguously 3 May in Europe/London
    const ts = Math.floor(new Date('2026-05-03T12:00:00Z').getTime() / 1000);
    expect(formatFixtureDate(ts)).toBe('3 May');
  });

  it('formats a single-digit day without leading zero', () => {
    const ts = Math.floor(new Date('2026-01-07T12:00:00Z').getTime() / 1000);
    expect(formatFixtureDate(ts)).toBe('7 Jan');
  });
});

describe('formatFixtureTime', () => {
  it('returns HH:MM for a non-midnight UTC timestamp', () => {
    // 2026-05-03T14:00:00Z
    const ts = Math.floor(new Date('2026-05-03T14:00:00Z').getTime() / 1000);
    expect(formatFixtureTime(ts)).toBe('14:00');
  });

  it('returns null for a midnight UTC timestamp (time TBD)', () => {
    const ts = Math.floor(new Date('2026-05-03T00:00:00Z').getTime() / 1000);
    expect(formatFixtureTime(ts)).toBeNull();
  });

  it('pads single-digit hours', () => {
    const ts = Math.floor(new Date('2026-05-03T09:30:00Z').getTime() / 1000);
    expect(formatFixtureTime(ts)).toBe('09:30');
  });
});

describe('formatMatchResult', () => {
  it('returns W score when Lionhearts are home and won', () => {
    // home W 3–0
    expect(formatMatchResult(BASE_MATCH, 'Home')).toBe('W 3–0');
  });

  it('returns L score when Lionhearts are home and lost', () => {
    const m = { ...BASE_MATCH, homeScore: '1;', awayScore: '3;', homeResult: 'lose' as const, awayResult: 'win' as const };
    expect(formatMatchResult(m, 'Home')).toBe('L 1–3');
  });

  it('returns W score from away perspective (our sets first)', () => {
    // Lionhearts away, homeTeam scored 0, awayTeam (us) scored 3
    const m = { ...BASE_MATCH, homeScore: '0;', awayScore: '3;', homeResult: 'lose' as const, awayResult: 'win' as const };
    expect(formatMatchResult(m, 'Away')).toBe('W 3–0');
  });

  it('returns L score from away perspective', () => {
    // Lionhearts away, lost 1–3
    const m = { ...BASE_MATCH, homeScore: '3;', awayScore: '1;', homeResult: 'win' as const, awayResult: 'lose' as const };
    expect(formatMatchResult(m, 'Away')).toBe('L 1–3');
  });
});
