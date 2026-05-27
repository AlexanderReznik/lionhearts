import { describe, it, expect, vi, afterEach } from 'vitest';
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

  it('returns 0 for empty or unparseable score strings', () => {
    expect(parseScore('', '')).toEqual({ home: 0, away: 0 });
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
  it('returns HH:MM in London time (winter — GMT = UTC)', () => {
    // 2026-01-03T14:00:00Z — winter, GMT = UTC, London = 14:00
    const ts = Math.floor(new Date('2026-01-03T14:00:00Z').getTime() / 1000);
    expect(formatFixtureTime(ts)).toBe('14:00');
  });

  it('returns null for a midnight UTC timestamp (time TBD sentinel)', () => {
    const ts = Math.floor(new Date('2026-01-03T00:00:00Z').getTime() / 1000);
    expect(formatFixtureTime(ts)).toBeNull();
  });

  it('converts UTC to BST in summer (UTC+1)', () => {
    // 2026-05-03T13:00:00Z — BST, London = 14:00
    const ts = Math.floor(new Date('2026-05-03T13:00:00Z').getTime() / 1000);
    expect(formatFixtureTime(ts)).toBe('14:00');
  });

  it('pads single-digit hours', () => {
    const ts = Math.floor(new Date('2026-01-03T09:30:00Z').getTime() / 1000);
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

  it('returns D score for a draw', () => {
    const m = { ...BASE_MATCH, homeScore: '2;', awayScore: '2;', homeResult: 'draw' as const, awayResult: 'draw' as const };
    expect(formatMatchResult(m, 'Home')).toBe('D 2–2');
    expect(formatMatchResult(m, 'Away')).toBe('D 2–2');
  });
});

describe('fetchAllFixtures', () => {
  const realFetch = globalThis.fetch;

  afterEach(() => {
    globalThis.fetch = realFetch;
  });

  it('returns a map keyed by team name with successful fetches', async () => {
    const makeResponse = (teamName: string) => {
      const fixture = {
        fixtureId: '1', fixtureDate: 1746277200, fixtureStatus: 'fixture',
        homeTeam: teamName, awayTeam: 'Rivals', homeScore: ';', awayScore: ';',
        homeResult: '', awayResult: '', venue: 'Gym',
      };
      return { ok: true, json: async () => ({ debug: JSON.stringify({ data: { fixtures: [fixture] } }) }) };
    };

    globalThis.fetch = vi.fn()
      .mockResolvedValueOnce(makeResponse('Lionhearts Alpha'))
      .mockResolvedValueOnce(makeResponse('Lionhearts Predators'));

    const { fetchAllFixtures } = await import('../src/lib/volleyzone');
    const fakeTeams = [
      { name: 'Alpha', gender: "Men's", division: 'LVA Premier League',
        compId: '209508', seasonId: '3881', volleyzoneUserId: '298568', volleyzoneSegment: 'lva' },
      { name: 'Predators', gender: "Men's", division: 'LVA Division 1',
        compId: '209510', seasonId: '3881', volleyzoneUserId: '298568', volleyzoneSegment: 'lva' },
    ] as import('../src/data/teams').Team[];

    const result = await fetchAllFixtures(fakeTeams);

    expect(result['Alpha'].error).toBe(false);
    expect(result['Alpha'].matches).toHaveLength(1);
    expect(result['Predators'].error).toBe(false);
  });

  it('marks a team as error when its fetch fails', async () => {
    globalThis.fetch = vi.fn()
      .mockResolvedValueOnce({ ok: false, status: 500 } as Response);

    vi.spyOn(console, 'warn').mockImplementation(() => {});

    const { fetchAllFixtures } = await import('../src/lib/volleyzone');
    const fakeTeams = [
      { name: 'Alpha', gender: "Men's", division: 'LVA Premier League',
        compId: '209508', seasonId: '3881', volleyzoneUserId: '298568', volleyzoneSegment: 'lva' },
    ] as import('../src/data/teams').Team[];

    const result = await fetchAllFixtures(fakeTeams);

    expect(result['Alpha'].error).toBe(true);
    expect(result['Alpha'].matches).toEqual([]);
  });

  it('skips teams without compId', async () => {
    globalThis.fetch = vi.fn();

    const { fetchAllFixtures } = await import('../src/lib/volleyzone');
    const fakeTeams = [
      { name: 'NoId', gender: "Men's", division: 'LVA Division 1' },
    ] as import('../src/data/teams').Team[];

    const result = await fetchAllFixtures(fakeTeams);

    expect(globalThis.fetch).not.toHaveBeenCalled();
    expect(result['NoId']).toBeUndefined();
  });
});

describe('fetchTeamFixtures', () => {
  const realFetch = globalThis.fetch;

  afterEach(() => {
    globalThis.fetch = realFetch;
  });

  it('parses the double-encoded response and returns fixtures array', async () => {
    const fixture: Partial<Match> = {
      fixtureId: '99',
      fixtureDate: 1746277200,
      fixtureStatus: 'fixture',
      homeTeam: 'Lionhearts Alpha',
      awayTeam: 'Rival FC',
      homeScore: ';',
      awayScore: ';',
      homeResult: '',
      awayResult: '',
      venue: 'Some Gym',
    };
    const inner = { data: { fixtures: [fixture] } };
    const outer = { debug: JSON.stringify(inner) };

    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => outer,
    } as Response);

    const { fetchTeamFixtures } = await import('../src/lib/volleyzone');
    const result = await fetchTeamFixtures('209508', '3881', '298568', 'lva');

    expect(result).toHaveLength(1);
    expect(result[0].fixtureId).toBe('99');
    expect(result[0].homeTeam).toBe('Lionhearts Alpha');
  });

  it('throws when the response is not ok', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({ ok: false, status: 500 } as Response);

    const { fetchTeamFixtures } = await import('../src/lib/volleyzone');
    await expect(fetchTeamFixtures('209508', '3881', '298568', 'lva')).rejects.toThrow('500');
  });

  it('sends correct POST params and headers', async () => {
    const inner = { data: { fixtures: [] } };
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ debug: JSON.stringify(inner) }),
    } as Response);

    const { fetchTeamFixtures } = await import('../src/lib/volleyzone');
    await fetchTeamFixtures('209502', '3881', '298568', 'lva');

    const [url, init] = (globalThis.fetch as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(url).toContain('fetch_fixture_by_competition');
    expect(init.method).toBe('POST');
    expect(init.headers['X-Requested-With']).toBe('XMLHttpRequest');
    const body = init.body as URLSearchParams;
    expect(body.get('fix_compID')).toBe('209502');
    expect(body.get('seasonidgrp')).toBe('3881');
    expect(body.get('pageTitle')).toBe('Fixture and Results');
    expect(body.get('userId')).toBe('298568');
    expect(body.get('lastSegment')).toBe('lva');
  });
});
