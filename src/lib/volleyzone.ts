// src/lib/volleyzone.ts
import { teams } from '../data/teams';
import type { Team } from '../data/teams';

const ENDPOINT =
  'https://competitions.volleyzone.co.uk/wp-admin/admin-ajax.php?action=fetch_fixture_by_competition';

export interface Match {
  fixtureId: string;
  fixtureDate: number;
  fixtureStatus: 'result' | 'fixture' | 'postponed';
  homeTeam: string;
  awayTeam: string;
  homeScore: string;
  awayScore: string;
  homeResult: 'win' | 'lose' | 'draw' | '';
  awayResult: 'win' | 'lose' | 'draw' | '';
  venue: string;
  metaData: { scores: { home: Record<string, string>; away: Record<string, string> } };
}

export interface TeamFixtures {
  teamName: string;
  matches: Match[];
  error: boolean;
}

export function parseHomeAway(match: Pick<Match, 'homeTeam'>): 'Home' | 'Away' {
  return match.homeTeam.includes('Lionhearts') ? 'Home' : 'Away';
}

export function parseScore(homeScore: string, awayScore: string): { home: number; away: number } {
  return {
    home: parseInt(homeScore.replace(';', ''), 10) || 0,
    away: parseInt(awayScore.replace(';', ''), 10) || 0,
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
  const h = dt.getUTCHours();
  const m = dt.getUTCMinutes();
  if (h === 0 && m === 0) return null;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
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

  const res = await fetch(ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'X-Requested-With': 'XMLHttpRequest',
      Origin: 'https://competitions.volleyzone.co.uk',
    },
    body,
  });

  if (!res.ok) throw new Error(`Volleyzone HTTP ${res.status}`);

  const outer = await res.json();
  const inner = JSON.parse(outer.debug) as { data: { fixtures: Match[] } };
  return inner.data.fixtures;
}

export async function fetchAllFixtures(teamsData: Team[] = teams): Promise<Record<string, TeamFixtures>> {
  const eligible = teamsData.filter(
    t => t.compId && t.seasonId && t.volleyzoneUserId && t.volleyzoneSegment,
  );

  const settled = await Promise.allSettled(
    eligible.map(t => fetchTeamFixtures(t.compId!, t.seasonId!, t.volleyzoneUserId!, t.volleyzoneSegment!)),
  );

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

  return map;
}
