import { describe, it, expect, vi, afterEach } from 'vitest';
import {
  parseHomeAway,
  parseScore,
  formatFixtureDate,
  formatFixtureTime,
  formatMatchResult,
  parseSetScores,
  resolveMatchResult,
  fetchTeamFixtures,
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

  it('throws a descriptive error when the `debug` payload is missing', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({ ok: true, json: async () => ({}) } as Response);

    const { fetchTeamFixtures } = await import('../src/lib/volleyzone');
    await expect(fetchTeamFixtures('209508', '3881', '298568', 'lva')).rejects.toThrow(/debug/);
  });

  it('throws when the `debug` payload is not valid JSON', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ debug: 'not json' }) } as Response);

    const { fetchTeamFixtures } = await import('../src/lib/volleyzone');
    await expect(fetchTeamFixtures('209508', '3881', '298568', 'lva')).rejects.toThrow(/valid JSON/);
  });

  it('throws when the fixtures array is absent', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ debug: JSON.stringify({ data: {} }) }),
    } as Response);

    const { fetchTeamFixtures } = await import('../src/lib/volleyzone');
    await expect(fetchTeamFixtures('209508', '3881', '298568', 'lva')).rejects.toThrow(/data\.fixtures/);
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

describe('fetchAllFixtures — cup merge', () => {
  const realFetch = globalThis.fetch;

  afterEach(() => {
    globalThis.fetch = realFetch;
    vi.restoreAllMocks();
  });

  const makeResponse = (fixtures: Record<string, unknown>[]) => ({
    ok: true,
    json: async () => ({ debug: JSON.stringify({ data: { fixtures } }) }),
  });

  const match = (homeTeam: string, awayTeam: string, fixtureId = '1') => ({
    fixtureId, fixtureDate: 1746277200, fixtureStatus: 'fixture',
    homeTeam, awayTeam, homeScore: ';', awayScore: ';',
    homeResult: '', awayResult: '', venue: 'Gym',
  });

  const cups = [
    { compId: '217919', seasonId: '4013', userId: '279580', segment: 'nvl', label: 'Cup' },
  ] as import('../src/data/teams').CupCompetition[];

  const leoTeam = [
    { name: 'London Lionhearts', gender: "Men's", division: 'NVL Division 2 South',
      volleyzoneTeamName: 'London Lionhearts',
      compId: '216372', seasonId: '4013', volleyzoneUserId: '279580', volleyzoneSegment: 'nvl' },
  ] as import('../src/data/teams').Team[];

  it('appends a cup match in which the team is the away side', async () => {
    globalThis.fetch = vi.fn()
      .mockResolvedValueOnce(makeResponse([match('London Lionhearts', 'Kent Invicta')]))
      .mockResolvedValueOnce(makeResponse([match('Black Country', 'London Lionhearts', '2')]));

    const { fetchAllFixtures } = await import('../src/lib/volleyzone');
    const result = await fetchAllFixtures(leoTeam, cups);

    expect(result['London Lionhearts'].matches).toHaveLength(2);
    expect(result['London Lionhearts'].matches[1].awayTeam).toBe('London Lionhearts');
  });

  it('tags cup matches with the competition label and leaves league matches untagged', async () => {
    globalThis.fetch = vi.fn()
      .mockResolvedValueOnce(makeResponse([match('London Lionhearts', 'Kent Invicta')]))
      .mockResolvedValueOnce(makeResponse([match('Black Country', 'London Lionhearts', '2')]));

    const { fetchAllFixtures } = await import('../src/lib/volleyzone');
    const result = await fetchAllFixtures(leoTeam, cups);

    const [league, cup] = result['London Lionhearts'].matches;
    expect(league.competitionLabel).toBeUndefined();
    expect(cup.competitionLabel).toBe('Cup');
  });

  it('ignores cup matches belonging to other clubs', async () => {
    globalThis.fetch = vi.fn()
      .mockResolvedValueOnce(makeResponse([match('London Lionhearts', 'Kent Invicta')]))
      .mockResolvedValueOnce(makeResponse([match('Black Country', 'Malory Eagles', '2')]));

    const { fetchAllFixtures } = await import('../src/lib/volleyzone');
    const result = await fetchAllFixtures(leoTeam, cups);

    expect(result['London Lionhearts'].matches).toHaveLength(1);
  });

  it('matches team names exactly, not by substring', async () => {
    const teamsData = [
      { name: 'Vinarius', gender: "Women's", division: 'NVL Super League',
        volleyzoneTeamName: 'Lionhearts Vinarius',
        compId: '216377', seasonId: '4013', volleyzoneUserId: '279580', volleyzoneSegment: 'nvl' },
    ] as import('../src/data/teams').Team[];

    globalThis.fetch = vi.fn()
      .mockResolvedValueOnce(makeResponse([match('Lionhearts Vinarius', 'London Giants')]))
      .mockResolvedValueOnce(makeResponse([match('Lionhearts Vinarius Development', 'Malory Eagles', '2')]));

    const { fetchAllFixtures } = await import('../src/lib/volleyzone');
    const result = await fetchAllFixtures(teamsData, cups);

    expect(result['Vinarius'].matches).toHaveLength(1);
  });

  it('keeps league matches and error:false when a cup fetch fails', async () => {
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    globalThis.fetch = vi.fn()
      .mockResolvedValueOnce(makeResponse([match('London Lionhearts', 'Kent Invicta')]))
      .mockResolvedValueOnce({ ok: false, status: 500 } as Response);

    const { fetchAllFixtures } = await import('../src/lib/volleyzone');
    const result = await fetchAllFixtures(leoTeam, cups);

    expect(result['London Lionhearts'].error).toBe(false);
    expect(result['London Lionhearts'].matches).toHaveLength(1);
  });

  it('fetches each cup competition once regardless of team count', async () => {
    const twoTeams = [
      ...leoTeam,
      { name: 'Vinarius', gender: "Women's", division: 'NVL Super League',
        volleyzoneTeamName: 'Lionhearts Vinarius',
        compId: '216377', seasonId: '4013', volleyzoneUserId: '279580', volleyzoneSegment: 'nvl' },
    ] as import('../src/data/teams').Team[];

    globalThis.fetch = vi.fn().mockResolvedValue(makeResponse([]));

    const { fetchAllFixtures } = await import('../src/lib/volleyzone');
    await fetchAllFixtures(twoTeams, cups);

    // 2 league fetches + 1 cup fetch, not 1 cup fetch per team
    expect(globalThis.fetch).toHaveBeenCalledTimes(3);
  });

  it('leaves a team whose league fetch failed in its unavailable state', async () => {
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    globalThis.fetch = vi.fn()
      .mockResolvedValueOnce({ ok: false, status: 500 } as Response)
      .mockResolvedValueOnce(makeResponse([match('Black Country', 'London Lionhearts', '2')]));

    const { fetchAllFixtures } = await import('../src/lib/volleyzone');
    const result = await fetchAllFixtures(leoTeam, cups);

    expect(result['London Lionhearts'].error).toBe(true);
    expect(result['London Lionhearts'].matches).toEqual([]);
  });

  it('skips cup fetches entirely when no team declares a Volleyzone name', async () => {
    const unnamed = [
      { name: 'Alpha', gender: "Men's", division: 'LVA Premier League',
        compId: '219574', seasonId: '4015', volleyzoneUserId: '298568', volleyzoneSegment: 'lva' },
    ] as import('../src/data/teams').Team[];

    globalThis.fetch = vi.fn().mockResolvedValue(makeResponse([]));

    const { fetchAllFixtures } = await import('../src/lib/volleyzone');
    await fetchAllFixtures(unnamed, cups);

    expect(globalThis.fetch).toHaveBeenCalledTimes(1);
  });
});

describe('parseScore — null handling', () => {
  it('treats null scores as 0 rather than throwing', () => {
    expect(parseScore(null, null)).toEqual({ home: 0, away: 0 });
  });

  it('handles one side null', () => {
    expect(parseScore('3;', null)).toEqual({ home: 3, away: 0 });
  });
});

describe('formatMatchResult — null scores', () => {
  it('renders a result row without throwing when scores are null', () => {
    const m = { ...BASE_MATCH, homeScore: null, awayScore: null } as Match;
    expect(formatMatchResult(m, 'Home')).toBe('W 0–0');
  });
});

describe('parseHomeAway — exact team identity', () => {
  it('returns Home when the team is the named home side', () => {
    const m = { ...BASE_MATCH, homeTeam: 'Lionhearts Cats', awayTeam: 'Phoenix Nova' };
    expect(parseHomeAway(m, 'Lionhearts Cats')).toBe('Home');
  });

  it('returns Away when the team is the named away side', () => {
    const m = { ...BASE_MATCH, homeTeam: 'Phoenix Nova', awayTeam: 'Lionhearts Cats' };
    expect(parseHomeAway(m, 'Lionhearts Cats')).toBe('Away');
  });

  it('resolves a Lionhearts-vs-Lionhearts tie from the perspective of each team', () => {
    const m = { ...BASE_MATCH, homeTeam: 'Lionhearts Fury', awayTeam: 'Lionhearts Cats' };
    expect(parseHomeAway(m, 'Lionhearts Fury')).toBe('Home');
    expect(parseHomeAway(m, 'Lionhearts Cats')).toBe('Away');
  });

  it('falls back to the substring guess when no team name is supplied', () => {
    const m = { ...BASE_MATCH, homeTeam: 'Lionhearts Fury', awayTeam: 'Phoenix Nova' };
    expect(parseHomeAway(m)).toBe('Home');
  });
});

const sets = (...pairs: [string, string][]): Match['metaData'] => {
  const home: Record<string, string> = { goals: '' };
  const away: Record<string, string> = { goals: '' };
  for (let i = 1; i <= 5; i++) {
    home[i] = pairs[i - 1]?.[0] ?? '';
    away[i] = pairs[i - 1]?.[1] ?? '';
  }
  return { scores: { home, away } };
};

const incomplete = (homeScore: string, awayScore: string, ...pairs: [string, string][]): Match => ({
  ...BASE_MATCH,
  homeScore,
  awayScore,
  homeResult: '',
  awayResult: '',
  metaData: sets(...pairs),
});

describe('parseSetScores', () => {
  it('reads played sets and skips blank or missing ones', () => {
    const m = { ...BASE_MATCH, metaData: sets(['21', '16'], ['19', '21']) };
    delete m.metaData.scores.home['5'];
    expect(parseSetScores(m.metaData)).toEqual([
      { home: 21, away: 16 },
      { home: 19, away: 21 },
    ]);
  });

  it('returns [] when metaData carries no scores', () => {
    expect(parseSetScores(undefined)).toEqual([]);
  });
});

describe('resolveMatchResult (LVA incomplete-match rule)', () => {
  const tied = (...pairs: [string, string][]): Match => ({
    ...incomplete('2;', '2;', ...pairs), homeResult: 'draw', awayResult: 'draw',
  });

  it('leaves a decided match exactly as Volleyzone reported it', () => {
    const m = { ...BASE_MATCH, metaData: sets(['21', '16'], ['19', '21'], ['21', '19'], ['21', '16']) };
    expect(resolveMatchResult(m)).toBe(m);
  });

  it('trusts Volleyzone on an incomplete match with an unequal set count', () => {
    const m = { ...incomplete('2;', '1;', ['21', '18'], ['21', '18'], ['19', '21'], ['3', '20']), homeResult: 'win' as const, awayResult: 'lose' as const };
    expect(resolveMatchResult(m)).toBe(m);
  });

  it('leaves upcoming fixtures untouched', () => {
    const m = { ...incomplete('', ''), fixtureStatus: 'fixture' as const };
    expect(resolveMatchResult(m)).toBe(m);
  });

  it('never overrides a level set count Volleyzone already decided (e.g. a concession)', () => {
    const m = { ...incomplete('2;', '2;', ['21', '10'], ['19', '21']), homeResult: 'lose' as const, awayResult: 'win' as const };
    expect(resolveMatchResult(m)).toBe(m);
  });

  it('keeps a level set count with no set scores as a draw', () => {
    const m = tied();
    expect(resolveMatchResult(m)).toBe(m);
  });

  it('breaks a sets tie for the side 2+ ahead on total points', () => {
    // Londinium Bellatrix v Onyx Women, LVA W1B 2025-26: 81–77 on points, a win in the official table
    const r = resolveMatchResult(tied(['21', '14'], ['19', '21'], ['21', '20'], ['20', '22']));
    expect(r).toMatchObject({ homeScore: '2;', awayScore: '2;', homeResult: 'win', awayResult: 'lose' });
  });

  it('gives the tiebreak to the away side when it leads on points', () => {
    const r = resolveMatchResult(tied(['21', '19'], ['18', '21'], ['21', '19'], ['15', '21']));
    expect(formatMatchResult(r, 'Away')).toBe('W 2–2');
    expect(formatMatchResult(r, 'Home')).toBe('L 2–2');
  });

  it('counts points from the unfinished set', () => {
    // 82–82 over four sets; the unfinished 5th (5–3) is the only difference
    const r = resolveMatchResult(tied(['21', '19'], ['19', '21'], ['21', '19'], ['21', '23'], ['5', '3']));
    expect(r.homeResult).toBe('win');
  });

  it('stays a draw when the points margin is exactly 1', () => {
    const m = tied(['21', '19'], ['19', '21'], ['21', '19'], ['18', '20'], ['13', '12']);
    expect(formatMatchResult(resolveMatchResult(m), 'Home')).toBe('D 2–2');
  });

  it('stays a draw when points are level', () => {
    const m = tied(['21', '19'], ['19', '21'], ['21', '19'], ['19', '21']);
    expect(resolveMatchResult(m)).toBe(m);
  });
});

describe('fetchTeamFixtures — LVA incomplete-match rule', () => {
  const realFetch = globalThis.fetch;
  afterEach(() => {
    globalThis.fetch = realFetch;
  });

  const pointsDraw: Match = {
    ...BASE_MATCH, homeScore: '2;', awayScore: '2;', homeResult: 'draw', awayResult: 'draw',
    metaData: sets(['21', '14'], ['19', '21'], ['21', '20'], ['20', '22']),
  };
  const respond = () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ debug: JSON.stringify({ data: { fixtures: [pointsDraw] } }) }),
    } as Response);
  };

  it('resolves points-decided draws for LVA competitions', async () => {
    respond();
    const [m] = await fetchTeamFixtures('209503', '3881', '298568', 'lva');
    expect(m.homeResult).toBe('win');
  });

  it('leaves NVL competitions as Volleyzone reported them', async () => {
    respond();
    const [m] = await fetchTeamFixtures('216377', '4013', '279580', 'nvl');
    expect(m.homeResult).toBe('draw');
  });
});
