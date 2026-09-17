import type { Outcome } from './judge';
import { SITE_URL } from '../data/club';

export interface SavedJudge {
  id: number;
  /** One per call already answered, in order. */
  outcomes: Outcome[];
  done: boolean;
}

export interface JudgeProgress {
  streak: number;
  lastPlayedId: number | null;
  game: SavedJudge | null;
}

const EMPTY: JudgeProgress = { streak: 0, lastPlayedId: null, game: null };
const OUTCOMES: Outcome[] = ['correct', 'partial', 'wrong'];
const isOutcome = (v: unknown): v is Outcome => OUTCOMES.includes(v as Outcome);

function isValidJudge(g: unknown): g is SavedJudge {
  if (typeof g !== 'object' || g === null) return false;
  const game = g as Partial<SavedJudge>;
  if (typeof game.id !== 'number') return false;
  if (typeof game.done !== 'boolean') return false;
  if (!Array.isArray(game.outcomes)) return false;
  return game.outcomes.every(isOutcome);
}

export function loadJudge(raw: string | null): JudgeProgress {
  if (!raw) return EMPTY;
  try {
    const parsed: unknown = JSON.parse(raw);
    if (typeof parsed !== 'object' || parsed === null) return EMPTY;
    const p = parsed as Partial<JudgeProgress>;
    if (typeof p.streak !== 'number') return EMPTY;
    return {
      streak: p.streak,
      lastPlayedId: typeof p.lastPlayedId === 'number' ? p.lastPlayedId : null,
      game: p.game && isValidJudge(p.game) ? p.game : null,
    };
  } catch {
    return EMPTY;
  }
}

/** A round in progress is dropped once the puzzle has rolled over. */
export function judgeForToday(p: JudgeProgress, id: number): JudgeProgress {
  return p.game?.id === id ? p : { ...p, game: null };
}

export function recordJudgeDone(p: JudgeProgress, id: number, outcomes: Outcome[]): JudgeProgress {
  const streak = p.lastPlayedId === id
    ? p.streak
    : p.lastPlayedId === id - 1 ? p.streak + 1 : 1;
  return { streak, lastPlayedId: id, game: { id, outcomes, done: true } };
}

const SQUARE: Record<Outcome, string> = {
  correct: '\u{1F7E9}',
  partial: '\u{1F7E8}',
  wrong: '\u{1F7E5}',
};

export function judgeShareText(
  { id, outcomes, streak }: { id: number; outcomes: Outcome[]; streak: number },
): string {
  const right = outcomes.filter(o => o !== 'wrong').length;
  return `Lionhearts Judge #${id}\n`
    + `${outcomes.map(o => SQUARE[o]).join('')}  ${right}/${outcomes.length}\n`
    + `\u{1F525} streak ${streak}\n`
    + `${SITE_URL}/game`;
}
