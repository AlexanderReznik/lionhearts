import { teams, CUP_COMPETITIONS } from '../data/teams';
import type { Team, CupCompetition } from '../data/teams';

const ENDPOINT = 'https://competitions.volleyzone.co.uk/wp-admin/admin-ajax.php';

export interface Match {
  fixtureId: string;
  fixtureDate: number;
  fixtureStatus: 'result' | 'fixture' | 'postponed';
  homeTeam: string;
  awayTeam: string;
  // Volleyzone sends null for both until a result is published.
  homeScore: string | null;
  awayScore: string | null;
  homeResult: 'win' | 'lose' | 'draw' | '';
  awayResult: 'win' | 'lose' | 'draw' | '';
  venue: string;
  metaData: { scores: { home: Record<string, string>; away: Record<string, string> } };
  /** Set only on knockout matches; absent for league fixtures. */
  competitionLabel?: string;
}

export interface TeamFixtures {
  teamName: string;
  matches: Match[];
  error: boolean;
}

export function parseHomeAway(match: Pick<Match, 'homeTeam'>, teamName?: string): 'Home' | 'Away' {
  // Exact identity whenever the caller knows it. The substring fallback cannot
  // tell two Lionhearts teams apart, which a cup draw can put on the same court.
  if (teamName) return match.homeTeam === teamName ? 'Home' : 'Away';
  return match.homeTeam.includes('Lionhearts') ? 'Home' : 'Away';
}

export function parseScore(
  homeScore: string | null,
  awayScore: string | null,
): { home: number; away: number } {
  return {
    home: parseInt((homeScore ?? '').replace(';', ''), 10) || 0,
    away: parseInt((awayScore ?? '').replace(';', ''), 10) || 0,
  };
}

export function formatFixtureDate(timestamp: number): string {
  return new Date(timestamp * 1000).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    timeZone: 'Europe/London',
  });
}

export function formatFixtureTime(timestamp: number): string | null {
  const dt = new Date(timestamp * 1000);
  // Volleyzone uses midnight UTC as "time TBD" sentinel
  if (dt.getUTCHours() === 0 && dt.getUTCMinutes() === 0) return null;
  return dt.toLocaleTimeString('en-GB', {
    hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'Europe/London',
  });
}

export function formatMatchResult(match: Match, perspective: 'Home' | 'Away'): string {
  const { home, away } = parseScore(match.homeScore, match.awayScore);
  if (perspective === 'Home') {
    const label = match.homeResult === 'win' ? 'W' : match.homeResult === 'lose' ? 'L' : 'D';
    return `${label} ${home}–${away}`;
  } else {
    const label = match.awayResult === 'win' ? 'W' : match.awayResult === 'lose' ? 'L' : 'D';
    return `${label} ${away}–${home}`;
  }
}

export interface SetScore {
  home: number;
  away: number;
}

export function parseSetScores(metaData: Match['metaData'] | undefined): SetScore[] {
  const home = metaData?.scores?.home ?? {};
  const away = metaData?.scores?.away ?? {};
  const sets: SetScore[] = [];
  for (let i = 1; i <= 5; i++) {
    const h = home[i] ?? '';
    const a = away[i] ?? '';
    if (h === '' && a === '') continue;
    sets.push({ home: parseInt(h, 10) || 0, away: parseInt(a, 10) || 0 });
  }
  return sets;
}

/**
 * LVA incomplete-match rule. Volleyzone's admin-entered set count already
 * decides who won any finished or 2+-point-led set (it sometimes counts a
 * 21–20 set the lead test would drop), but it reports every level set count as
 * a draw. The league breaks that tie on total points, unfinished set included:
 * 2+ ahead wins, otherwise it stays a draw.
 */
export function resolveMatchResult(match: Match): Match {
  if (match.fixtureStatus !== 'result' || match.homeResult !== 'draw') return match;
  const { home, away } = parseScore(match.homeScore, match.awayScore);
  if (home !== away) return match;
  const sets = parseSetScores(match.metaData);
  const margin = sets.reduce((sum, s) => sum + s.home - s.away, 0);
  if (Math.abs(margin) < 2) return match;
  return {
    ...match,
    homeResult: margin > 0 ? 'win' : 'lose',
    awayResult: margin > 0 ? 'lose' : 'win',
  };
}

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July',
  'August', 'September', 'October', 'November', 'December'];

const ENTITIES: Record<string, string> = {
  amp: '&', quot: '"', apos: "'", lt: '<', gt: '>', nbsp: ' ',
  lsquo: '\u2018', rsquo: '\u2019', ldquo: '\u201c', rdquo: '\u201d', ndash: '\u2013', mdash: '\u2014',
  aacute: '\u00e1', eacute: '\u00e9', iacute: '\u00ed', oacute: '\u00f3', uacute: '\u00fa',
  auml: '\u00e4', euml: '\u00eb', ouml: '\u00f6', uuml: '\u00fc', ccedil: '\u00e7', ntilde: '\u00f1',
};

function decodeEntities(text: string): string {
  return text.replace(/&(#x[\da-f]+|#\d+|\w+);/gi, (whole, code: string) => {
    if (code[0] !== '#') return ENTITIES[code] ?? whole;
    const hex = code[1] === 'x' || code[1] === 'X';
    return String.fromCodePoint(parseInt(code.slice(hex ? 2 : 1), hex ? 16 : 10));
  });
}

function londonToUnix(year: number, month: number, day: number, hour: number, minute: number): number {
  const asUtc = Date.UTC(year, month, day, hour, minute);
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat('en-GB', {
      timeZone: 'Europe/London', hourCycle: 'h23',
      year: 'numeric', month: 'numeric', day: 'numeric', hour: 'numeric', minute: 'numeric',
    }).formatToParts(asUtc).map(p => [p.type, Number(p.value)]),
  );
  const londonAsUtc = Date.UTC(parts.year, parts.month - 1, parts.day, parts.hour, parts.minute);
  return (asUtc - (londonAsUtc - asUtc)) / 1000;
}

/**
 * Volleyzone's fixtures/results AJAX responses are server-rendered HTML, one
 * `col-12 mb-4` block per match. Volleyzone renders "time TBD" as 00:00 and some
 * results carry no time at all; both map to the midnight-UTC sentinel that
 * formatFixtureTime() reads as TBD. The HTML has no W/L/D, so it is derived from
 * the set count (resolveMatchResult() then applies the LVA points tiebreak).
 */
export function parseMatchesHtml(html: string, status: 'fixture' | 'result'): Match[] {
  const blocks = html.split(/<div class="col-12 mb-4 /).slice(1);
  const matches: Match[] = [];
  // A block that can't be read is warned and dropped; if none can, the markup
  // has changed and the team must show its "unavailable" state, not an empty season.
  const skip = (block: string, reason: string) => {
    const label = block.match(/data-TeamName="([^"]*)"/)?.[1] ?? block.slice(0, 80);
    console.warn(`[volleyzone] Skipped ${status} block (${reason}): ${decodeEntities(label)}`);
  };

  for (const block of blocks) {
    const attr = (name: string) => block.match(new RegExp(`${name}="([^"]*)"`))?.[1];
    const homeTeam = attr('data-home-team');
    const awayTeam = attr('data-away-team');
    const date = attr('data-Date')?.match(/(\d{1,2})(?:st|nd|rd|th)\s+(\w+)\s+(\d{4})/);
    const fixtureId = block.match(/fixture_id=(\d+)/)?.[1] ?? attr('data-fid');
    if (!homeTeam || !awayTeam || !date || !fixtureId || !MONTHS.includes(date[2])) {
      skip(block, 'unreadable');
      continue;
    }

    const middle = block.match(/<li class="text-center">[^]*?<\/li>\s*<li class="text-center">([^]*?)<\/li>/)?.[1] ?? '';
    const [, hh, mm] = middle.match(/(\d{1,2}):(\d{2})/) ?? [];
    const [day, month, year] = [Number(date[1]), MONTHS.indexOf(date[2]), Number(date[3])];
    const fixtureDate = hh && !(hh === '00' && mm === '00')
      ? londonToUnix(year, month, day, Number(hh), Number(mm))
      : Date.UTC(year, month, day) / 1000;

    const match: Match = {
      fixtureId,
      fixtureDate,
      fixtureStatus: status,
      homeTeam: decodeEntities(homeTeam),
      awayTeam: decodeEntities(awayTeam),
      homeScore: null,
      awayScore: null,
      homeResult: '',
      awayResult: '',
      venue: decodeEntities(block.match(/<span>Venue:\s*([^<]*?)\s*<\/span>/)?.[1] ?? ''),
      metaData: { scores: { home: {}, away: {} } },
    };

    if (status === 'result') {
      const score = middle.match(/<span>(\d+)<\/span>\s*<span>(\d+)<\/span>/);
      if (!score) {
        skip(block, 'no score');
        continue;
      }
      const [home, away] = [Number(score[1]), Number(score[2])];
      match.homeScore = score[1];
      match.awayScore = score[2];
      match.homeResult = home > away ? 'win' : home < away ? 'lose' : 'draw';
      match.awayResult = home > away ? 'lose' : home < away ? 'win' : 'draw';
      const setList = block.match(/<ul class="list-centered_bottom">([^]*?)<\/ul>/)?.[1] ?? '';
      [...setList.matchAll(/<span>(\d+)<\/span>\s*<span>(\d+)<\/span>/g)].forEach(([, h, a], i) => {
        match.metaData.scores.home[i + 1] = h;
        match.metaData.scores.away[i + 1] = a;
      });
    }
    matches.push(match);
  }

  if (blocks.length > 0 && matches.length === 0) {
    throw new Error(`Volleyzone markup changed: none of ${blocks.length} match blocks could be parsed`);
  }
  return matches;
}

async function postVolleyzone(action: string, params: Record<string, string>): Promise<Record<string, unknown>> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 30_000);

  let res: Response;
  try {
    res = await fetch(`${ENDPOINT}?action=${action}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'X-Requested-With': 'XMLHttpRequest',
        Origin: 'https://competitions.volleyzone.co.uk',
      },
      body: new URLSearchParams({ ...params, pageTitle: 'Fixture and Results' }),
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timeout);
  }

  if (!res.ok) throw new Error(`Volleyzone HTTP ${res.status}`);
  return (await res.json()) ?? {};
}

// Undocumented endpoints scraped as HTML: each step is validated and throws a
// descriptive error, which fetchAllFixtures() catches per team and degrades to
// an error state rather than failing the whole build.
function htmlField(payload: Record<string, unknown>, key: string): string {
  const html = payload[key];
  if (typeof html !== 'string') throw new Error(`Volleyzone response missing \`${key}\` HTML`);
  if (html.includes('Please Select From the Fields Above')) {
    throw new Error('Volleyzone rejected the request parameters');
  }
  return html;
}

export async function fetchTeamFixtures(
  compId: string,
  seasonId: string,
  userId: string,
  lastSegment: string,
): Promise<Match[]> {
  // The two actions name the same competition/season parameters differently.
  const [upcoming, played] = await Promise.allSettled([
    postVolleyzone('fetch_fixture_by_competition', { fix_compID: compId, seasonidgrp: seasonId, userId, lastSegment }),
    postVolleyzone('fetch_results_by_competition', { res_compID: compId, seasonID: seasonId, userId, lastSegment }),
  ]);

  // The fixtures list decides whether the team is "available"; a results
  // failure only costs the results, so it is warned rather than propagated.
  if (upcoming.status === 'rejected') throw upcoming.reason;
  const fixtures = parseMatchesHtml(htmlField(upcoming.value, 'fixtures'), 'fixture');

  let results: Match[] = [];
  try {
    if (played.status === 'rejected') throw played.reason;
    results = parseMatchesHtml(htmlField(played.value, 'Compresults'), 'result');
  } catch (err) {
    console.warn(`[volleyzone] Failed to fetch results for competition ${compId}:`, err);
  }
  const resultIds = new Set(results.map(m => m.fixtureId));

  const matches = fixtures.filter(m => !resultIds.has(m.fixtureId)).concat(results);
  return lastSegment === 'lva' ? matches.map(resolveMatchResult) : matches;
}

// Knockout comps are fetched whole and their matches claimed by exact team
// name, so a team picks up every round it reaches without a code change.
async function fetchCupMatches(cups: CupCompetition[]): Promise<Match[]> {
  const settled = await Promise.allSettled(
    cups.map(c => fetchTeamFixtures(c.compId, c.seasonId, c.userId, c.segment)),
  );

  return settled.flatMap((result, i) => {
    if (result.status === 'fulfilled') {
      return result.value.map(m => ({ ...m, competitionLabel: cups[i].label }));
    }
    // A cup that fails must not cost a team its league fixtures, so this is
    // warned and dropped rather than propagated.
    console.warn(`[volleyzone] Failed to fetch cup competition ${cups[i].compId}:`, result.reason);
    return [];
  });
}

export async function fetchAllFixtures(
  teamsData: Team[] = teams,
  cups: CupCompetition[] = CUP_COMPETITIONS,
): Promise<Record<string, TeamFixtures>> {
  // Local-dev escape hatch: SKIP_VOLLEYZONE=true in .env.local skips the (slow)
  // per-team Volleyzone fetches entirely. Returning an empty map makes each team
  // fall back to its "fixtures unavailable" state with zero network calls.
  if (import.meta.env.SKIP_VOLLEYZONE === 'true') {
    return {};
  }

  const eligible = teamsData.filter(
    t => t.compId && t.seasonId && t.volleyzoneUserId && t.volleyzoneSegment,
  );

  const [settled, cupMatches] = await Promise.all([
    Promise.allSettled(
      eligible.map(t => fetchTeamFixtures(t.compId!, t.seasonId!, t.volleyzoneUserId!, t.volleyzoneSegment!)),
    ),
    eligible.some(t => t.volleyzoneTeamName) ? fetchCupMatches(cups) : Promise.resolve<Match[]>([]),
  ]);

  const map: Record<string, TeamFixtures> = {};
  eligible.forEach((team, i) => {
    const result = settled[i];
    if (result.status === 'fulfilled') {
      map[team.name] = { teamName: team.name, matches: result.value, error: false };
    } else {
      console.warn(`[volleyzone] Failed to fetch fixtures for ${team.name}:`, result.reason);
      map[team.name] = { teamName: team.name, matches: [], error: true };
    }
  });

  for (const team of eligible) {
    const entry = map[team.name];
    // A team whose league fetch failed keeps its honest "unavailable" state —
    // showing a lone cup tie would read as the whole season.
    if (!team.volleyzoneTeamName || entry.error) continue;
    entry.matches = entry.matches.concat(
      cupMatches.filter(
        m => m.homeTeam === team.volleyzoneTeamName || m.awayTeam === team.volleyzoneTeamName,
      ),
    );
  }

  return map;
}
