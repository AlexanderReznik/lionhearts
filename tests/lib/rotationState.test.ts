import { describe, it, expect } from 'vitest';
import {
  EPOCH_DAY, londonDayNumber, puzzleIndexFor, loadProgress, forToday, recordSolved, shareText,
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
});

describe('forToday', () => {
  it('keeps an in-progress game for the same puzzle', () => {
    const p = { streak: 3, lastSolvedId: 4, game: { id: 5, startedAt: 100, attempts: 2, solved: false, elapsedMs: null, placement: null } };
    expect(forToday(p, 5).game).toEqual(p.game);
  });

  it('discards an unfinished game once the day has rolled over', () => {
    const p = { streak: 3, lastSolvedId: 4, game: { id: 5, startedAt: 100, attempts: 2, solved: false, elapsedMs: null, placement: null } };
    expect(forToday(p, 6).game).toBeNull();
  });
});

describe('recordSolved', () => {
  it('extends the streak when yesterday was solved', () => {
    const p = { streak: 3, lastSolvedId: 5, game: null };
    expect(recordSolved(p, 6, 2, 90_000).streak).toBe(4);
  });

  it('resets the streak after a missed day', () => {
    const p = { streak: 9, lastSolvedId: 4, game: null };
    expect(recordSolved(p, 6, 2, 90_000).streak).toBe(1);
  });

  it('does not double-count re-solving the same puzzle', () => {
    const once = recordSolved({ streak: 3, lastSolvedId: 5, game: null }, 6, 2, 90_000);
    expect(recordSolved(once, 6, 2, 90_000).streak).toBe(4);
  });
});

describe('shareText', () => {
  it('reads as a result, with minutes and seconds', () => {
    const text = shareText({ id: 12, attempts: 3, elapsedMs: 151_000, streak: 6 });
    expect(text).toContain('Rotation #12');
    expect(text).toContain('3 attempts');
    expect(text).toContain('2:31');
    expect(text).toContain('6');
  });

  it('says attempt, singular, for a first-time solve', () => {
    expect(shareText({ id: 1, attempts: 1, elapsedMs: 61_000, streak: 1 })).toContain('1 attempt ');
  });
});
