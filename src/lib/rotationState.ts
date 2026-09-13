import type { Vec2 } from './rotation';
import { SITE_URL } from '../data/club';

/** Day zero of the game, as a London day number. */
export const EPOCH_DAY = 20_709; // 2026-09-13

export interface SavedGame {
  id: number;
  startedAt: number | null;
  attempts: number;
  solved: boolean;
  elapsedMs: number | null;
  placement: Record<string, Vec2> | null;
}

export interface SavedProgress {
  streak: number;
  lastSolvedId: number | null;
  game: SavedGame | null;
}

const EMPTY: SavedProgress = { streak: 0, lastSolvedId: null, game: null };

/** Days since the Unix epoch in Europe/London, so the puzzle turns over at local midnight. */
export function londonDayNumber(now: Date): number {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Europe/London', year: 'numeric', month: '2-digit', day: '2-digit',
  }).format(now);
  const [y, m, d] = parts.split('-').map(Number);
  return Math.floor(Date.UTC(y, m - 1, d) / 86_400_000);
}

export function puzzleIndexFor(now: Date, bankLength: number): number {
  const offset = londonDayNumber(now) - EPOCH_DAY;
  return ((offset % bankLength) + bankLength) % bankLength;
}

export function loadProgress(raw: string | null): SavedProgress {
  if (!raw) return EMPTY;
  try {
    const parsed: unknown = JSON.parse(raw);
    if (typeof parsed !== 'object' || parsed === null) return EMPTY;
    const p = parsed as Partial<SavedProgress>;
    if (typeof p.streak !== 'number') return EMPTY;
    return {
      streak: p.streak,
      lastSolvedId: typeof p.lastSolvedId === 'number' ? p.lastSolvedId : null,
      game: p.game && typeof p.game.id === 'number' ? p.game : null,
    };
  } catch {
    return EMPTY;
  }
}

/** Drops an in-progress game once the puzzle has rolled over; an unfinished one never counts. */
export function forToday(progress: SavedProgress, id: number): SavedProgress {
  return progress.game?.id === id ? progress : { ...progress, game: null };
}

export function recordSolved(
  progress: SavedProgress, id: number, attempts: number, elapsedMs: number,
): SavedProgress {
  const streak = progress.lastSolvedId === id
    ? progress.streak
    : progress.lastSolvedId === id - 1 ? progress.streak + 1 : 1;
  return {
    streak,
    lastSolvedId: id,
    game: { id, startedAt: null, attempts, solved: true, elapsedMs, placement: null },
  };
}

const clock = (ms: number) => {
  const total = Math.round(ms / 1000);
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, '0')}`;
};

export function shareText(
  { id, attempts, elapsedMs, streak }: { id: number; attempts: number; elapsedMs: number; streak: number },
): string {
  const tries = `${attempts} attempt${attempts === 1 ? '' : 's'} `;
  return `Lionhearts Rotation #${id}\n`
    + `✅ ${tries}· ${clock(elapsedMs)}\n`
    + `🔥 streak ${streak}\n`
    + `${SITE_URL}/game`;
}
