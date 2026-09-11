import { teams, CUP_COMPETITIONS } from '../data/teams';
import type { Team, CupCompetition } from '../data/teams';

const ENDPOINT =
  'https://competitions.volleyzone.co.uk/wp-admin/admin-ajax.php?action=fetch_fixture_by_competition';

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

export async function fetchTeamFixtures(
  compId: string,
  seasonId: string,
  userId: string,
  lastSegment: string,
): Promise<Match[]> {
  const body = new URLSearchParams({
    seasonidgrp: seasonId,
    fix_compID: compId,
    pageTitle: 'Fixture and Results',
    userId,
    lastSegment,
  });

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 30_000);

  let res: Response;
  try {
    res = await fetch(ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'X-Requested-With': 'XMLHttpRequest',
        Origin: 'https://competitions.volleyzone.co.uk',
      },
      body,
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timeout);
  }

  if (!res.ok) throw new Error(`Volleyzone HTTP ${res.status}`);

  // The endpoint double-encodes its payload: the outer JSON carries a `debug`
  // string that is itself JSON of shape { data: { fixtures: [...] } }. This is
  // undocumented and brittle, so validate each step and throw a descriptive
  // error — fetchAllFixtures() catches it per-team and degrades to an error
  // state rather than failing the whole build.
  const outer = await res.json();
  if (!outer || typeof outer.debug !== 'string') {
    throw new Error('Volleyzone response missing expected `debug` payload');
  }

  let inner: { data?: { fixtures?: Match[] } };
  try {
    inner = JSON.parse(outer.debug);
  } catch {
    throw new Error('Volleyzone `debug` payload was not valid JSON');
  }

  const fixtures = inner?.data?.fixtures;
  if (!Array.isArray(fixtures)) {
    throw new Error('Volleyzone response missing `data.fixtures` array');
  }
  return fixtures;
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
