import { describe, it, expect } from 'vitest';
import { loadJudge, judgeForToday, recordJudgeDone, judgeShareText } from '../../src/lib/judgeState';
import type { Outcome } from '../../src/lib/judge';

const SIX: Outcome[] = ['correct', 'correct', 'partial', 'wrong', 'correct', 'correct'];

describe('loadJudge', () => {
  it('starts clean on null, junk, or the wrong shape', () => {
    for (const raw of [null, 'not json', '{"streak":"seven"}']) {
      expect(loadJudge(raw)).toEqual({ streak: 0, lastPlayedId: null, game: null });
    }
  });

  it('drops a malformed game but keeps a valid streak', () => {
    const base = { streak: 2, lastPlayedId: 4 };
    const good = { id: 5, outcomes: ['correct'], done: false };
    const bad = [
      { ...good, id: '5' },
      { ...good, done: 'yes' },
      { ...good, outcomes: 'correct' },
      { ...good, outcomes: ['nonsense'] },
    ];
    for (const game of bad) {
      expect(loadJudge(JSON.stringify({ ...base, game }))).toEqual({ ...base, game: null });
    }
  });

  it('accepts a well-formed game', () => {
    const base = { streak: 2, lastPlayedId: 4 };
    const game = { id: 5, outcomes: ['correct', 'wrong'], done: false };
    expect(loadJudge(JSON.stringify({ ...base, game }))).toEqual({ ...base, game });
  });
});

describe('judgeForToday', () => {
  it('discards an unfinished round once the day has rolled over', () => {
    const p = { streak: 3, lastPlayedId: 4, game: { id: 5, outcomes: [], done: false } };
    expect(judgeForToday(p, 6).game).toBeNull();
    expect(judgeForToday(p, 5).game).toEqual(p.game);
  });
});

describe('recordJudgeDone', () => {
  it('extends the streak when yesterday was played', () => {
    const p = { streak: 3, lastPlayedId: 5, game: null };
    expect(recordJudgeDone(p, 6, SIX).streak).toBe(4);
  });

  it('resets the streak after a missed day', () => {
    const p = { streak: 9, lastPlayedId: 4, game: null };
    expect(recordJudgeDone(p, 6, SIX).streak).toBe(1);
  });

  it('does not double-count replaying the same day', () => {
    const once = recordJudgeDone({ streak: 3, lastPlayedId: 5, game: null }, 6, SIX);
    expect(recordJudgeDone(once, 6, SIX).streak).toBe(4);
  });
});

describe('judgeShareText', () => {
  it('draws a square per call and scores correct calls, not pairs found', () => {
    const text = judgeShareText({ id: 48, outcomes: SIX, streak: 4 });
    expect(text).toContain('Judge #48');
    expect(text).toContain('\u{1F7E9}\u{1F7E9}\u{1F7E8}\u{1F7E5}\u{1F7E9}\u{1F7E9}');
    expect(text).toContain('5/6');
    expect(text).toContain('streak 4');
  });
});
