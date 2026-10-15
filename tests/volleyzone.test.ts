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
  parseMatchesHtml,
} from '../src/lib/volleyzone';
import type { Match } from '../src/lib/volleyzone';
import fixturesSample from '../src/lib/__fixtures__/volleyzone-fixtures.json';
import resultsSample from '../src/lib/__fixtures__/volleyzone-results.json';

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

interface BlockSpec {
  home: string;
  away: string;
  id?: string;
  date?: string;
  time?: string;
  venue?: string;
  score?: [number, number];
  sets?: [number, number][];
}

// Mirrors the markup of Volleyzone's fixtures/results AJAX responses, trimmed
// to the parts the parser reads.
function block(s: BlockSpec, kind: 'FixContents' | 'resultContents' = s.score ? 'resultContents' : 'FixContents'): string {
  const id = s.id ?? '1';
  const date = s.date ?? 'Sat 07th November 2026';
  const middle = s.score
    ? `<div style="padding-bottom:10px;">${s.time ?? '19:00'}<br>Match Start: 19:10<br></div>
       <span>${s.score[0]}</span>
       <span>${s.score[1]}</span>`
    : `${s.time ?? '19:00'}<br>M2S 4`;
  const sets = s.sets
    ? `<ul class="list-centered_bottom">${s.sets.map(([h, a]) => `<li class="text-center"><span>${h}</span>
       <span>${a}</span></li>`).join('')}</ul>`
    : '';
  return `<div class="col-12 mb-4 ${kind}" data-home-team="${s.home}" data-away-team="${s.away}" data-TeamName="${s.home} : ${s.away}" data-Date="${date}">
    <div class="flag-box"><ul class="list-unstyled">
      <li class="text-center"><a href="https://competitions.volleyzone.co.uk/wp-single-team-details?fixture_id=${id}&team_id=1&season_id=4015&team=home" target="_blank">${s.home}</a></li>
      <li class="text-center">${middle}</li>
      <li class="text-center"><a href="javascript:void(0)" target="_blank">${s.away}</a></li>
    </ul>${sets}
    <span class="sub-text d-block text-center"><span>Some Division</span><span>Venue: ${s.venue ?? 'Gym'}</span></span>
    </div></div>`;
}

type CompMock = { fixtures?: BlockSpec[]; results?: BlockSpec[] } | 'fail';

// Routes each Volleyzone POST by action and competition, so tests don't depend
// on the order in which the fixtures/results/cup requests are issued.
function mockVolleyzone(byComp: Record<string, CompMock>) {
  globalThis.fetch = vi.fn(async (url: string, init: RequestInit) => {
    const action = new URL(url).searchParams.get('action');
    const body = init.body as URLSearchParams;
    const comp = byComp[body.get('fix_compID') ?? body.get('res_compID') ?? ''] ?? {};
    if (comp === 'fail') return { ok: false, status: 500 } as Response;
    const payload = action === 'fetch_results_by_competition'
      ? { Compresults: (comp.results ?? []).map(b => block(b, 'resultContents')).join(''), teams: '', dates: '' }
      : { fixtures: (comp.fixtures ?? []).map(b => block(b, 'FixContents')).join(''), teams: '', dates: '' };
    return { ok: true, json: async () => payload } as Response;
  }) as unknown as typeof fetch;
}

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
    mockVolleyzone({
      '209508': { fixtures: [{ home: 'Lionhearts Alpha', away: 'Rivals' }] },
      '209510': { fixtures: [{ home: 'Lionhearts Predators', away: 'Rivals' }] },
    });

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
    mockVolleyzone({ '209508': 'fail' });

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

describe('parseMatchesHtml — real Volleyzone responses', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  const fixturesHtml: string = fixturesSample.fixtures;
  const resultsHtml: string = resultsSample.Compresults;

  it('reads every fixture block', () => {
    const matches = parseMatchesHtml(fixturesHtml, 'fixture');
    expect(matches).toHaveLength(25);
    expect(matches.every(m => m.fixtureStatus === 'fixture')).toBe(true);
  });

  it('maps an upcoming fixture onto the Match shape', () => {
    const [m] = parseMatchesHtml(fixturesHtml, 'fixture');
    expect(m).toEqual({
      fixtureId: '6871402',
      fixtureDate: Date.UTC(2026, 9, 17, 11, 30) / 1000,
      fixtureStatus: 'fixture',
      homeTeam: 'Exeter Storm',
      awayTeam: 'London Lionhearts',
      homeScore: null,
      awayScore: null,
      homeResult: '',
      awayResult: '',
      venue: 'Marjon Sport and Health Centre',
      metaData: { scores: { home: {}, away: {} } },
    });
  });

  it('reads the kick-off as London time on both sides of the clock change', () => {
    const matches = parseMatchesHtml(fixturesHtml, 'fixture');
    const byId = (id: string) => matches.find(m => m.fixtureId === id)!;
    expect(formatFixtureTime(byId('6871048').fixtureDate)).toBe('13:00');
    expect(formatFixtureTime(byId('6871155').fixtureDate)).toBe('13:45');
    expect(formatFixtureDate(byId('6871155').fixtureDate)).toBe('7 Nov');
  });

  it('treats a 00:00 kick-off as time TBD on the right date', () => {
    const m = parseMatchesHtml(fixturesHtml, 'fixture').find(x => x.fixtureId === '6871540')!;
    expect(formatFixtureTime(m.fixtureDate)).toBeNull();
    expect(formatFixtureDate(m.fixtureDate)).toBe('17 Jan');
  });

  it('reads a result with its set count and per-set scores', () => {
    const [m] = parseMatchesHtml(resultsHtml, 'result');
    expect(m.fixtureId).toBe('6995913');
    expect(m.fixtureStatus).toBe('result');
    expect(m.homeTeam).toBe('Inter Orcas');
    expect(m.awayTeam).toBe('Lionhearts Fury');
    expect(m.fixtureDate).toBe(Date.UTC(2026, 9, 14, 19, 0) / 1000);
    expect([m.homeScore, m.awayScore]).toEqual(['2', '2']);
    expect([m.homeResult, m.awayResult]).toEqual(['draw', 'draw']);
    expect(parseSetScores(m.metaData)).toEqual([
      { home: 15, away: 21 }, { home: 21, away: 17 }, { home: 21, away: 14 },
      { home: 13, away: 21 }, { home: 11, away: 11 },
    ]);
  });

  it('decodes HTML entities in team names', () => {
    const [m] = parseMatchesHtml(block({ home: 'Brighton &amp; Hove', away: 'SQUAD Women&#039;s 1' }), 'fixture');
    expect([m.homeTeam, m.awayTeam]).toEqual(['Brighton & Hove', "SQUAD Women's 1"]);
  });

  it('decodes hex and typographic entities', () => {
    const [m] = parseMatchesHtml(block({ home: 'St Mary&#x27;s', away: 'King&rsquo;s &ndash; Ren&eacute;e' }), 'fixture');
    expect([m.homeTeam, m.awayTeam]).toEqual(["St Mary's", 'King\u2019s \u2013 Ren\u00e9e']);
  });

  it('derives win/lose from the set count', () => {
    const [m] = parseMatchesHtml(block({ home: 'A', away: 'B', score: [1, 3] }), 'result');
    expect([m.homeResult, m.awayResult]).toEqual(['lose', 'win']);
  });

  it('dates a result with no listed time to the TBD sentinel', () => {
    const html = block({ home: 'A', away: 'B', score: [3, 0] }).replace(/<div style[^]*?<\/div>/, '');
    const [m] = parseMatchesHtml(html, 'result');
    expect(m.fixtureDate).toBe(Date.UTC(2026, 10, 7) / 1000);
  });

  it('warns about and skips a result block that carries no score', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const scoreless = block({ id: '2', home: 'C', away: 'D', score: [3, 0] }).replace(/<span>\d<\/span>/g, '');
    const html = block({ id: '1', home: 'A', away: 'B', score: [3, 0] }) + scoreless;

    expect(parseMatchesHtml(html, 'result').map(m => m.fixtureId)).toEqual(['1']);
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('C : D'));
  });

  it('warns about and skips a block it cannot read, keeping the rest', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const unreadable = block({ id: '2', home: 'C', away: 'D' }).replace('data-Date', 'data-When');
    const html = block({ id: '1', home: 'A', away: 'B' }) + unreadable;

    expect(parseMatchesHtml(html, 'fixture').map(m => m.fixtureId)).toEqual(['1']);
    expect(warn).toHaveBeenCalledTimes(1);
  });

  it('throws when no match block can be read (markup changed)', () => {
    const html = [block({ id: '1', home: 'A', away: 'B' }), block({ id: '2', home: 'C', away: 'D' })]
      .join('').replaceAll('data-Date', 'data-When');
    expect(() => parseMatchesHtml(html, 'fixture')).toThrow(/none of 2 match blocks/);
  });

  it('throws when no result carries a readable score (score markup changed)', () => {
    const html = block({ home: 'A', away: 'B', score: [3, 0] }).replace(/<span>(\d)<\/span>/g, '<b>$1</b>');
    expect(() => parseMatchesHtml(html, 'result')).toThrow(/none of 1 match blocks/);
  });

  it('returns [] for the "not available" placeholder', () => {
    expect(parseMatchesHtml('<div class="not available">No upcoming fixtures</div>', 'fixture')).toEqual([]);
  });
});

describe('fetchTeamFixtures', () => {
  const realFetch = globalThis.fetch;

  afterEach(() => {
    globalThis.fetch = realFetch;
    vi.restoreAllMocks();
  });

  it('merges upcoming fixtures and results', async () => {
    mockVolleyzone({
      '219585': {
        fixtures: [{ id: '2', home: 'Lionhearts Fury', away: 'EPIC' }],
        results: [{ id: '1', home: 'Inter Orcas', away: 'Lionhearts Fury', score: [0, 3] }],
      },
    });

    const result = await fetchTeamFixtures('219585', '4015', '298568', 'lva');

    expect(result.map(m => [m.fixtureId, m.fixtureStatus])).toEqual([['2', 'fixture'], ['1', 'result']]);
  });

  it('keeps only the result when a match is listed in both', async () => {
    mockVolleyzone({
      '219585': {
        fixtures: [{ id: '1', home: 'Lionhearts Fury', away: 'EPIC' }],
        results: [{ id: '1', home: 'Lionhearts Fury', away: 'EPIC', score: [3, 1] }],
      },
    });

    const result = await fetchTeamFixtures('219585', '4015', '298568', 'lva');

    expect(result).toHaveLength(1);
    expect(result[0].fixtureStatus).toBe('result');
  });

  it('keeps upcoming fixtures when only the results request fails', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const fixturesOnly = { fixtures: block({ home: 'Lionhearts Fury', away: 'EPIC' }), teams: '', dates: '' };
    globalThis.fetch = vi.fn(async (url: string) =>
      url.includes('fetch_results')
        ? ({ ok: false, status: 500 } as Response)
        : ({ ok: true, json: async () => fixturesOnly } as Response),
    ) as unknown as typeof fetch;

    const result = await fetchTeamFixtures('219585', '4015', '298568', 'lva');

    expect(result).toHaveLength(1);
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('results'), expect.anything());
  });

  it('throws when the fixtures request fails, even if results loaded', async () => {
    globalThis.fetch = vi.fn(async (url: string) =>
      url.includes('fetch_results')
        ? ({ ok: true, json: async () => ({ Compresults: '' }) } as Response)
        : ({ ok: false, status: 503 } as Response),
    ) as unknown as typeof fetch;

    await expect(fetchTeamFixtures('219585', '4015', '298568', 'lva')).rejects.toThrow('503');
  });

  it('throws when the response is not ok', async () => {
    mockVolleyzone({ '219585': 'fail' });
    await expect(fetchTeamFixtures('219585', '4015', '298568', 'lva')).rejects.toThrow('500');
  });

  it('throws a descriptive error when the fixtures HTML is missing', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({ ok: true, json: async () => ({}) } as Response);
    await expect(fetchTeamFixtures('219585', '4015', '298568', 'lva')).rejects.toThrow(/`fixtures`/);
  });

  it('throws when Volleyzone rejects the request parameters', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        fixtures: '<div class="not available">Please Select From the Fields Above.</div>',
        Compresults: '',
      }),
    } as Response);
    await expect(fetchTeamFixtures('219585', '4015', '298568', 'lva')).rejects.toThrow(/rejected/);
  });

  it('sends the fixtures and results POSTs with their own parameter names', async () => {
    mockVolleyzone({});
    await fetchTeamFixtures('209502', '3881', '298568', 'lva');

    const calls = (globalThis.fetch as unknown as ReturnType<typeof vi.fn>).mock.calls;
    const byAction = (a: string) => calls.find(([url]) => url.includes(`action=${a}`))!;

    const [, fixInit] = byAction('fetch_fixture_by_competition');
    expect(fixInit.method).toBe('POST');
    expect(fixInit.headers['X-Requested-With']).toBe('XMLHttpRequest');
    const fixBody = fixInit.body as URLSearchParams;
    expect(fixBody.get('fix_compID')).toBe('209502');
    expect(fixBody.get('seasonidgrp')).toBe('3881');
    expect(fixBody.get('pageTitle')).toBe('Fixture and Results');
    expect(fixBody.get('userId')).toBe('298568');
    expect(fixBody.get('lastSegment')).toBe('lva');

    const resBody = byAction('fetch_results_by_competition')[1].body as URLSearchParams;
    expect(resBody.get('res_compID')).toBe('209502');
    expect(resBody.get('seasonID')).toBe('3881');
    expect(resBody.get('userId')).toBe('298568');
    expect(resBody.get('lastSegment')).toBe('lva');
  });
});

describe('fetchAllFixtures — cup merge', () => {
  const realFetch = globalThis.fetch;

  afterEach(() => {
    globalThis.fetch = realFetch;
    vi.restoreAllMocks();
  });

  const leoLeague = { fixtures: [{ home: 'London Lionhearts', away: 'Kent Invicta' }] };
  const cupTie = (home: string, away: string) => ({ fixtures: [{ id: '2', home, away }] });

  const cups = [
    { compId: '217919', seasonId: '4013', userId: '279580', segment: 'nvl', label: 'Cup' },
  ] as import('../src/data/teams').CupCompetition[];

  const leoTeam = [
    { name: 'London Lionhearts', gender: "Men's", division: 'NVL Division 2 South',
      volleyzoneTeamName: 'London Lionhearts',
      compId: '216372', seasonId: '4013', volleyzoneUserId: '279580', volleyzoneSegment: 'nvl' },
  ] as import('../src/data/teams').Team[];

  it('appends a cup match in which the team is the away side', async () => {
    mockVolleyzone({ '216372': leoLeague, '217919': cupTie('Black Country', 'London Lionhearts') });

    const { fetchAllFixtures } = await import('../src/lib/volleyzone');
    const result = await fetchAllFixtures(leoTeam, cups);

    expect(result['London Lionhearts'].matches).toHaveLength(2);
    expect(result['London Lionhearts'].matches[1].awayTeam).toBe('London Lionhearts');
  });

  it('tags cup matches with the competition label and leaves league matches untagged', async () => {
    mockVolleyzone({ '216372': leoLeague, '217919': cupTie('Black Country', 'London Lionhearts') });

    const { fetchAllFixtures } = await import('../src/lib/volleyzone');
    const result = await fetchAllFixtures(leoTeam, cups);

    const [league, cup] = result['London Lionhearts'].matches;
    expect(league.competitionLabel).toBeUndefined();
    expect(cup.competitionLabel).toBe('Cup');
  });

  it('ignores cup matches belonging to other clubs', async () => {
    mockVolleyzone({ '216372': leoLeague, '217919': cupTie('Black Country', 'Malory Eagles') });

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

    mockVolleyzone({
      '216377': { fixtures: [{ home: 'Lionhearts Vinarius', away: 'London Giants' }] },
      '217919': cupTie('Lionhearts Vinarius Development', 'Malory Eagles'),
    });

    const { fetchAllFixtures } = await import('../src/lib/volleyzone');
    const result = await fetchAllFixtures(teamsData, cups);

    expect(result['Vinarius'].matches).toHaveLength(1);
  });

  it('keeps league matches and error:false when a cup fetch fails', async () => {
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    mockVolleyzone({ '216372': leoLeague, '217919': 'fail' });

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

    mockVolleyzone({});

    const { fetchAllFixtures } = await import('../src/lib/volleyzone');
    await fetchAllFixtures(twoTeams, cups);

    // 2 league comps + 1 cup comp, each a fixtures + results pair — not 1 cup per team
    expect(globalThis.fetch).toHaveBeenCalledTimes(6);
  });

  it('leaves a team whose league fetch failed in its unavailable state', async () => {
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    mockVolleyzone({ '216372': 'fail', '217919': cupTie('Black Country', 'London Lionhearts') });

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

    mockVolleyzone({});

    const { fetchAllFixtures } = await import('../src/lib/volleyzone');
    await fetchAllFixtures(unnamed, cups);

    expect(globalThis.fetch).toHaveBeenCalledTimes(2);
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

  const pointsDraw: BlockSpec = {
    home: 'Lionhearts Fury', away: 'Inter Orcas', score: [2, 2],
    sets: [[21, 14], [19, 21], [21, 20], [20, 22]],
  };
  const respond = () => mockVolleyzone({ '209503': { results: [pointsDraw] }, '216377': { results: [pointsDraw] } });

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

  it('turns the real Inter Orcas 2–2 into a Fury win on points', async () => {
    globalThis.fetch = vi.fn(async (url: string) => ({
      ok: true,
      json: async () => (url.includes('fetch_results') ? resultsSample : { fixtures: '' }),
    })) as unknown as typeof fetch;

    const [m] = await fetchTeamFixtures('219585', '4015', '298568', 'lva');

    expect(m.awayTeam).toBe('Lionhearts Fury');
    expect(m.awayResult).toBe('win');
  });
});
