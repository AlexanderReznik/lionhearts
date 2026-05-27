// src/lib/volleyzone.ts
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
    home: parseInt(homeScore.replace(';', ''), 10),
    away: parseInt(awayScore.replace(';', ''), 10),
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
    const label = match.homeResult === 'win' ? 'W' : 'L';
    return `${label} ${home}–${away}`;
  } else {
    const label = match.awayResult === 'win' ? 'W' : 'L';
    return `${label} ${away}–${home}`;
  }
}
