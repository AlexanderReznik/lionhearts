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

/**
 * Milliseconds until the next London day starts. London midnight drifts
 * relative to UTC across the BST/GMT boundary, so this brackets the answer
 * within a day-plus-DST-margin window and binary-searches to the second
 * rather than doing UTC arithmetic.
 */
export function msUntilNextLondonDay(now: Date): number {
  const today = londonDayNumber(now);
  let lo = now.getTime();
  let hi = now.getTime() + 26 * 60 * 60 * 1000;
  while (hi - lo > 1000) {
    const mid = Math.floor((lo + hi) / 2);
    if (londonDayNumber(new Date(mid)) > today) hi = mid; else lo = mid;
  }
  return hi - now.getTime();
}

function isVec2(v: unknown): v is Vec2 {
  return typeof v === 'object' && v !== null
    && typeof (v as Vec2).x === 'number' && typeof (v as Vec2).y === 'number';
}

/**
 * Guards the whole `SavedGame` shape, not just `id`. There's no XSS path here
 * (storage never reaches innerHTML), but a hand-edited or partially-written
 * entry — a string `attempts`, a string `startedAt` — renders visible
 * breakage (`"51"`, `NaN:NaN`, `NaN%` marker positions), so malformed data
 * drops the game rather than being trusted.
 */
function isValidGame(g: unknown): g is SavedGame {
  if (typeof g !== 'object' || g === null) return false;
  const game = g as Partial<SavedGame>;
  if (typeof game.id !== 'number') return false;
  if (typeof game.attempts !== 'number') return false;
  if (typeof game.solved !== 'boolean') return false;
  if (game.startedAt !== null && typeof game.startedAt !== 'number') return false;
  if (game.elapsedMs !== null && typeof game.elapsedMs !== 'number') return false;
  if (game.placement !== null) {
    if (typeof game.placement !== 'object') return false;
    if (!Object.values(game.placement).every(isVec2)) return false;
  }
  return true;
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
      game: p.game && isValidGame(p.game) ? p.game : null,
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
