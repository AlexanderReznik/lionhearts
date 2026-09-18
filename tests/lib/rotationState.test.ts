import { describe, it, expect } from 'vitest';
import {
  EPOCH_DAY, londonDayNumber, puzzleIndexFor, loadProgress, forToday, recordSolved, shareText,
  msUntilNextLondonDay,
} from '../../src/lib/rotationState';

describe('londonDayNumber', () => {
  it('rolls over at London midnight, not UTC midnight', () => {
    // 23:30 on 1 July UTC is already 00:30 on 2 July in London (BST).
    const before = londonDayNumber(new Date('2026-07-01T22:30:00Z'));
    const after = londonDayNumber(new Date('2026-07-01T23:30:00Z'));
    expect(after).toBe(before + 1);
  });

  it('does not roll over at 23:30 in winter', () => {
    const before = londonDayNumber(new Date('2026-01-01T22:30:00Z'));
    const after = londonDayNumber(new Date('2026-01-01T23:30:00Z'));
    expect(after).toBe(before);
  });
});

describe('msUntilNextLondonDay', () => {
  const MINUTE = 60_000;

  it('counts down to London midnight on a BST evening', () => {
    const ms = msUntilNextLondonDay(new Date('2026-07-01T22:30:00Z'));
    expect(ms).toBeGreaterThan(30 * MINUTE - 2000);
    expect(ms).toBeLessThan(30 * MINUTE + 2000);
  });

  it('counts down to London midnight on a GMT evening', () => {
    const ms = msUntilNextLondonDay(new Date('2026-01-01T22:30:00Z'));
    expect(ms).toBeGreaterThan(90 * MINUTE - 2000);
    expect(ms).toBeLessThan(90 * MINUTE + 2000);
  });

  it('reports a full day when now is exactly London midnight', () => {
    // 2026-07-02T00:00:00 Europe/London (BST, UTC+1) is 2026-07-01T23:00:00Z.
    const ms = msUntilNextLondonDay(new Date('2026-07-01T23:00:00Z'));
    expect(ms).toBeGreaterThan(24 * 60 * MINUTE - 2000);
    expect(ms).toBeLessThan(24 * 60 * MINUTE + 2000);
  });
});

describe('EPOCH_DAY', () => {
  it('is set to 2026-09-13', () => {
    expect(EPOCH_DAY).toBe(londonDayNumber(new Date('2026-09-13T12:00:00Z')));
  });

  it('means a player on 2026-09-13 gets puzzle index 0', () => {
    expect(puzzleIndexFor(new Date('2026-09-13T12:00:00Z'), 760)).toBe(0);
  });
});

describe('puzzleIndexFor', () => {
  it('advances one puzzle per day and wraps at the end of the bank', () => {
    const a = puzzleIndexFor(new Date('2026-10-01T12:00:00Z'), 10);
    const b = puzzleIndexFor(new Date('2026-10-02T12:00:00Z'), 10);
    expect(b).toBe((a + 1) % 10);
  });

  it('never returns a negative index before the epoch', () => {
    expect(puzzleIndexFor(new Date('2020-01-01T12:00:00Z'), 10)).toBeGreaterThanOrEqual(0);
  });
});

describe('loadProgress', () => {
  it('starts clean on null, junk, or the wrong shape', () => {
    for (const raw of [null, 'not json', '{"streak":"seven"}']) {
      expect(loadProgress(raw)).toEqual({ streak: 0, lastSolvedId: null, game: null });
    }
  });

  it('drops a malformed game but keeps a valid streak', () => {
    const base = { streak: 2, lastSolvedId: 4 };
    const good = { id: 5, startedAt: 100, attempts: 1, solved: false, elapsedMs: null, placement: null, rookie: false };
    const bad = [
      { ...good, attempts: '3' }, // attempts must be a number
      { ...good, startedAt: '100' }, // startedAt must be a number or null
      { ...good, solved: 'yes' }, // solved must be a boolean
      { ...good, elapsedMs: '90000' }, // elapsedMs must be a number or null
      { ...good, placement: { '1': { x: 'a', y: 2 } } }, // placement values must be {x,y} numbers
      { ...good, placement: 'nope' }, // placement must be an object or null
      { ...good, id: '5' }, // id must be a number
      { ...good, rookie: 'yes' }, // rookie must be a boolean when present
    ];
    for (const game of bad) {
      expect(loadProgress(JSON.stringify({ ...base, game }))).toEqual({ ...base, game: null });
    }
  });

  it('accepts a well-formed game, including a populated placement', () => {
    const base = { streak: 2, lastSolvedId: 4 };
    const game = { id: 5, startedAt: 100, attempts: 2, solved: false, elapsedMs: null, placement: { '1': { x: 1, y: 2 } }, rookie: false };
    expect(loadProgress(JSON.stringify({ ...base, game }))).toEqual({ ...base, game });
  });

  it('accepts a pre-upgrade saved game with no rookie field, and normalises it to false', () => {
    const base = { streak: 2, lastSolvedId: 4 };
    const game = { id: 5, startedAt: 100, attempts: 2, solved: false, elapsedMs: null, placement: null };
    expect(loadProgress(JSON.stringify({ ...base, game }))).toEqual({ ...base, game: { ...game, rookie: false } });
  });
});

describe('forToday', () => {
  it('keeps an in-progress game for the same puzzle', () => {
    const p = { streak: 3, lastSolvedId: 4, game: { id: 5, startedAt: 100, attempts: 2, solved: false, elapsedMs: null, placement: null, rookie: false } };
    expect(forToday(p, 5).game).toEqual(p.game);
  });

  it('discards an unfinished game once the day has rolled over', () => {
    const p = { streak: 3, lastSolvedId: 4, game: { id: 5, startedAt: 100, attempts: 2, solved: false, elapsedMs: null, placement: null, rookie: false } };
    expect(forToday(p, 6).game).toBeNull();
  });
});

describe('recordSolved', () => {
  it('extends the streak when yesterday was solved', () => {
    const p = { streak: 3, lastSolvedId: 5, game: null };
    expect(recordSolved(p, 6, 2, 90_000, false).streak).toBe(4);
  });

  it('resets the streak after a missed day', () => {
    const p = { streak: 9, lastSolvedId: 4, game: null };
    expect(recordSolved(p, 6, 2, 90_000, false).streak).toBe(1);
  });

  it('does not double-count re-solving the same puzzle', () => {
    const once = recordSolved({ streak: 3, lastSolvedId: 5, game: null }, 6, 2, 90_000, false);
    expect(recordSolved(once, 6, 2, 90_000, false).streak).toBe(4);
  });
});

describe('shareText', () => {
  it('reads as a result, with minutes and seconds', () => {
    const text = shareText({ id: 12, attempts: 3, elapsedMs: 151_000, streak: 6, rookie: false });
    expect(text).toContain('Rotation #12');
    expect(text).toContain('3 attempts');
    expect(text).toContain('2:31');
    expect(text).toContain('6');
  });

  it('says attempt, singular, for a first-time solve', () => {
    expect(shareText({ id: 1, attempts: 1, elapsedMs: 61_000, streak: 1, rookie: false })).toContain('1 attempt ');
  });
});

describe('shareText rookie marker', () => {
  it('marks a result played with labels on', () => {
    const text = shareText({ id: 12, attempts: 3, elapsedMs: 151_000, streak: 6, rookie: true });
    expect(text).toContain('rookie');
  });

  it('says nothing when played without them', () => {
    const text = shareText({ id: 12, attempts: 3, elapsedMs: 151_000, streak: 6, rookie: false });
    expect(text).not.toContain('rookie');
  });
});

describe('recordSolved rookie flag', () => {
  it('stores the flag on the finished game', () => {
    const p = { streak: 3, lastSolvedId: 5, game: null };
    expect(recordSolved(p, 6, 2, 90_000, true).game!.rookie).toBe(true);
  });
});
