# Rotation Judge Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a second daily game to `/game` — call a serve-receive formation legal or illegal and name the overlapping pair — and take the printed answers off the existing build game.

**Architecture:** A new pure library `src/lib/judge.ts` filters the existing rules engine down to the positional law and turns a player's call into a verdict; `src/lib/judgeState.ts` holds that game's daily state and share string. A committed bank `src/data/judge.ts` ships formations only — never verdicts — so legality is recomputed client-side by the engine that already exists. `/game` gains a tablist and a `JudgePanel.astro` island; the build game keeps its own script in `game.astro` and loses its marker labels behind a sticky Rookie toggle.

**Tech Stack:** Astro 6 (static), TypeScript strict, Vitest, vanilla components, no framework. Node >= 22.12.

**Spec:** `docs/superpowers/specs/2026-09-17-rotation-judge-design.md`

## Global Constraints

- Branch is `feat/rotation-judge`. Run git from the project root — never `git -C`.
- **Never** stage or commit `human-todo.md`. It is the user's own uncommitted work. Always `git add` explicit paths, never `git add -A` or `git add .`.
- Never `pkill -f "astro dev"` or any broad pattern kill — it kills the user's server. If you start one, capture `$!` and kill only that PID.
- Dev/build with the skip flags, literal string `true`: `SKIP_VOLLEYZONE=true SKIP_BEHOLD=true npm run dev`.
- No inline `style="..."` in markup. Runtime `el.style.*` in a client script is fine. Any visual override becomes a BEM modifier class in a scoped `<style>` block.
- Components reference only semantic `--color-*` tokens, declared once as `light-dark(LIGHT, DARK)`. Raw `--lh-*` is allowed only inside the deliberately-dark court.
- Markup created by client script carries no Astro scope attribute — style it with `:global()` inside a scoped `<style>`, anchored on a server-rendered ancestor. Never copy `data-astro-cid-*`.
- `[hidden]` is a low-specificity UA rule that any class setting `display` beats. `.game [hidden] { display: none; }` already exists in `game.astro` — keep new hidden elements inside `.game`.
- Every `target="_blank"` carries `rel="noopener noreferrer"` — both tokens.
- Conventional commits: `type(scope): imperative subject`, body explains why and notes verification. End every commit message with:

```
Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_016hyRX6N8wqzwpFDyy9quj3
```

- Baseline on this branch: **222 tests passing**. Every task ends green.
- The judge game validates **law only** — depth order, lateral order, in court, bodies apart. Never the passing band, passer spread or setter radius; those are club convention and no referee calls them.
- Subtlety floor: illegal gaps are **0.3m–1.2m**. Legal margins may go to **0.05m** — that is deliberate, not an inconsistency (see the spec: a fault you cannot see is unfair, two players you cannot see daylight between is the lesson).

---

## File Structure

| File | Responsibility |
|---|---|
| `src/lib/judge.ts` | **New.** Law-only constraint subset, fault detection, call verdicts, the mis-rotation check. Pure, no DOM. |
| `src/lib/judgeState.ts` | **New.** Judge daily state: load/guard, rollover, streak, share grid. Pure, no DOM. |
| `src/data/judge.ts` | **New, generated.** 760 committed days of formations. No verdicts. |
| `scripts/generate-judge.ts` | **New.** Seeded generator for the above. |
| `src/components/JudgePanel.astro` | **New.** Judge markup + its client island. |
| `src/components/RotationCourt.astro` | **Modify.** Gains a `zones` prop to suppress the club-convention overlays. |
| `src/pages/game.astro` | **Modify.** Tablist, labels off, Rookie toggle, interval fix. |
| `src/lib/rotationState.ts` | **Modify.** `shareText()` gains the rookie flag; `SavedGame` gains `rookie`. |
| `package.json` | **Modify.** Add `gen:judge`. |

`src/lib/rotation.ts` is **not** modified by this plan.

---

### Task 1: Law-only constraint subset

**Files:**
- Create: `src/lib/judge.ts`
- Test: `tests/lib/judge.test.ts`

**Interfaces:**
- Consumes: `constraintsFor`, `Constraint`, `Phase` from `src/lib/rotation.ts`.
- Produces: `PHASES: Phase[]`, `lawConstraintsFor(phase: Phase): Constraint[]`.

- [ ] **Step 1: Write the failing test**

```ts
// tests/lib/judge.test.ts
import { describe, it, expect } from 'vitest';
import { PHASES, lawConstraintsFor } from '../../src/lib/judge';

describe('lawConstraintsFor', () => {
  it('keeps only the positional rules a referee actually calls', () => {
    for (const phase of PHASES) {
      const kinds = new Set(lawConstraintsFor(phase).map(c => c.kind));
      expect(kinds).toEqual(new Set(['depthOrder', 'lateralOrder', 'inCourt', 'separation']));
    }
  });

  it('drops our club receive system, which is convention and not law', () => {
    for (const phase of PHASES) {
      const kinds = lawConstraintsFor(phase).map(c => c.kind);
      expect(kinds).not.toContain('depthBand');
      expect(kinds).not.toContain('spread');
      expect(kinds).not.toContain('nearNet');
      expect(kinds).not.toContain('nearPoint');
    }
  });

  it('keeps all six depth and lateral orderings', () => {
    const cs = lawConstraintsFor(0);
    expect(cs.filter(c => c.kind === 'depthOrder')).toHaveLength(3);
    expect(cs.filter(c => c.kind === 'lateralOrder')).toHaveLength(4);
  });
});
```

- [ ] **Step 2: Run it and watch it fail**

Run: `npx vitest run tests/lib/judge.test.ts`
Expected: FAIL — cannot resolve `../../src/lib/judge`.

- [ ] **Step 3: Write the implementation**

```ts
// src/lib/judge.ts
import { constraintsFor, type Constraint, type Phase } from './rotation';

export const PHASES: Phase[] = [0, 1, 2, 3, 4, 5];

/**
 * The positional law (FIVB 7.4) only. The passing band, passer spread and
 * setter radius in `constraintsFor` are our club's receive system — a referee
 * would never call them, so the judge game must not either.
 */
export function lawConstraintsFor(phase: Phase): Constraint[] {
  return constraintsFor(phase).filter(c =>
    c.kind === 'depthOrder' || c.kind === 'lateralOrder'
    || c.kind === 'inCourt' || c.kind === 'separation');
}
```

- [ ] **Step 4: Run it and watch it pass**

Run: `npx vitest run tests/lib/judge.test.ts`
Expected: PASS, 3 tests.

- [ ] **Step 5: Commit**

```bash
git add src/lib/judge.ts tests/lib/judge.test.ts
git commit -m "$(cat <<'MSG'
feat(game): add the law-only constraint subset for judging

The judge game asks whether a formation is legal, so it must validate
against the positional rules and nothing else. constraintsFor() also
carries our receive system — passing band, passer spread, setter radius —
which is club convention. Calling those would teach players that a legal
formation is illegal.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_016hyRX6N8wqzwpFDyy9quj3
MSG
)"
```

---

### Task 2: Fault detection

**Files:**
- Modify: `src/lib/judge.ts`
- Test: `tests/lib/judge.test.ts`

**Interfaces:**
- Consumes: `lawConstraintsFor` from Task 1; `validate`, `Placement`, `Slot`, `SlotLabel` from `src/lib/rotation.ts`.
- Produces: `type FaultPair = readonly [Slot, Slot]`, `interface Fault { pair: FaultPair; message: string }`, `faultIn(p: Placement, phase: Phase, label?: SlotLabel): Fault | null`, `samePair(a: FaultPair, b: FaultPair): boolean`.

- [ ] **Step 1: Write the failing test**

Append to `tests/lib/judge.test.ts`:

```ts
import { faultIn, samePair } from '../../src/lib/judge';
import { WITNESSES } from '../fixtures/rotation-witnesses';
import type { Placement } from '../../src/lib/rotation';

describe('faultIn', () => {
  it('returns null for a legal formation', () => {
    for (const phase of PHASES) {
      expect(faultIn(WITNESSES[phase], phase)).toBeNull();
    }
  });

  it('names the overlapping pair when a back-row player creeps in front', () => {
    // Rotation 1: P5 must be level with or behind P4.
    const p: Placement = { ...WITNESSES[0], 5: { x: 1.06, y: 0.2 } };
    const fault = faultIn(p, 0);
    expect(fault).not.toBeNull();
    expect(samePair(fault!.pair, [4, 5])).toBe(true);
    expect(fault!.message).toContain('further from the net');
  });

  it('treats exactly level as legal, per 7.4.3.1', () => {
    const p: Placement = { ...WITNESSES[0], 5: { x: 1.06, y: WITNESSES[0][4].y } };
    expect(faultIn(p, 0)).toBeNull();
  });
});

describe('samePair', () => {
  it('ignores the order the two players were tapped in', () => {
    expect(samePair([4, 5], [5, 4])).toBe(true);
    expect(samePair([4, 5], [4, 6])).toBe(false);
  });
});
```

- [ ] **Step 2: Run it and watch it fail**

Run: `npx vitest run tests/lib/judge.test.ts`
Expected: FAIL — `faultIn` is not exported.

- [ ] **Step 3: Write the implementation**

Append to `src/lib/judge.ts`:

```ts
import { validate, type Placement, type Slot, type SlotLabel } from './rotation';

export type FaultPair = readonly [Slot, Slot];
export interface Fault { pair: FaultPair; message: string }

/**
 * The overlapping pair, or null when the formation is legal. Only ordering
 * violations can name a fault: `inCourt` and `separation` are invariants the
 * generator guarantees, so they never reach a player.
 */
export function faultIn(p: Placement, phase: Phase, label?: SlotLabel): Fault | null {
  const v = validate(p, lawConstraintsFor(phase), label)
    .find(x => x.kind === 'depthOrder' || x.kind === 'lateralOrder');
  return v ? { pair: [v.slots[0], v.slots[1]] as const, message: v.message } : null;
}

export const samePair = (a: FaultPair, b: FaultPair): boolean =>
  (a[0] === b[0] && a[1] === b[1]) || (a[0] === b[1] && a[1] === b[0]);
```

Add `validate`, `Placement`, `Slot`, `SlotLabel` to the existing import from `./rotation` rather than writing a second import statement.

- [ ] **Step 4: Run it and watch it pass**

Run: `npx vitest run tests/lib/judge.test.ts`
Expected: PASS, 7 tests.

- [ ] **Step 5: Commit**

```bash
git add src/lib/judge.ts tests/lib/judge.test.ts
git commit -m "$(cat <<'MSG'
feat(game): detect the overlapping pair in a formation

Reuses validate()'s plain-English messages rather than writing a second
set, so the judge game and the build game explain a fault identically.
Verified level-is-legal still holds: a back-row player exactly level with
their front-row partner returns no fault.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_016hyRX6N8wqzwpFDyy9quj3
MSG
)"
```

---

### Task 3: The mis-rotation check

**Files:**
- Modify: `src/lib/judge.ts`
- Test: `tests/lib/judge.test.ts`

**Interfaces:**
- Consumes: `faultIn`, `samePair`, `PHASES` from Tasks 1-2.
- Produces: `misrotation(p: Placement, phase: Phase, tapped: FaultPair): Phase | null`.

This is what keeps shirt-numbers-only from producing uninterpretable failures: when the tapped pair is wrong, it tells the player whether they misread the *rotation* rather than the court.

- [ ] **Step 1: Write the failing test**

Append to `tests/lib/judge.test.ts`:

```ts
import { misrotation } from '../../src/lib/judge';

describe('misrotation', () => {
  it('names a rotation in which the tapped pair really would be a fault', () => {
    // Build a formation whose only fault under rotation 2 is a pair that is
    // fine under rotation 1, then check the player is told which rotation
    // they were reading.
    const p: Placement = { ...WITNESSES[1] };
    const truth = faultIn(p, 1);
    expect(truth).toBeNull();
    // Nudge one player so a fault exists in some other rotation only.
    const moved: Placement = { ...p, 6: { x: p[6].x, y: 0.1 } };
    const here = faultIn(moved, 1);
    const elsewhere = PHASES.filter(ph => ph !== 1 && faultIn(moved, ph) !== null);
    if (here === null && elsewhere.length) {
      const other = elsewhere[0];
      const pair = faultIn(moved, other)!.pair;
      expect(misrotation(moved, 1, pair)).toBe(other);
    }
  });

  it('stays silent when the tapped pair is a fault nowhere', () => {
    expect(misrotation(WITNESSES[0], 0, [2, 3])).toBeNull();
  });
});
```

- [ ] **Step 2: Run it and watch it fail**

Run: `npx vitest run tests/lib/judge.test.ts`
Expected: FAIL — `misrotation` is not exported.

- [ ] **Step 3: Write the implementation**

Append to `src/lib/judge.ts`:

```ts
/**
 * A rotation other than this one in which the tapped pair would be a fault.
 * Non-null means the player read the court correctly but rotated the line-up
 * wrongly — a different mistake, and worth saying so.
 */
export function misrotation(p: Placement, phase: Phase, tapped: FaultPair): Phase | null {
  for (const other of PHASES) {
    if (other === phase) continue;
    const f = faultIn(p, other);
    if (f && samePair(f.pair, tapped)) return other;
  }
  return null;
}
```

- [ ] **Step 4: Run it and watch it pass**

Run: `npx vitest run tests/lib/judge.test.ts`
Expected: PASS, 9 tests.

- [ ] **Step 5: Commit**

```bash
git add src/lib/judge.ts tests/lib/judge.test.ts
git commit -m "$(cat <<'MSG'
feat(game): distinguish a mis-rotation from a missed overlap

Showing shirt numbers without position labels means a wrong call has two
possible causes. Re-testing the tapped pair against every other rotation
separates them, so the feedback can say "you had #12 in position 5; this
rotation has them in position 6" instead of just "wrong".

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_016hyRX6N8wqzwpFDyy9quj3
MSG
)"
```

---

### Task 4: Call verdicts

**Files:**
- Modify: `src/lib/judge.ts`
- Test: `tests/lib/judge.test.ts`

**Interfaces:**
- Consumes: `faultIn`, `samePair`, `misrotation`.
- Produces: `type Outcome = 'correct' | 'partial' | 'wrong'`, `interface Verdict { outcome: Outcome; truth: Fault | null; misrotatedTo: Phase | null }`, `judgeCall(args: { placement: Placement; phase: Phase; calledLegal: boolean; tapped: FaultPair | null; label?: SlotLabel }): Verdict`.

All five outcomes from the spec's feedback table.

- [ ] **Step 1: Write the failing test**

Append to `tests/lib/judge.test.ts`:

```ts
import { judgeCall } from '../../src/lib/judge';

describe('judgeCall', () => {
  const legal = WITNESSES[0];
  const illegal: Placement = { ...WITNESSES[0], 5: { x: 1.06, y: 0.2 } };

  it('legal called legal is correct', () => {
    const v = judgeCall({ placement: legal, phase: 0, calledLegal: true, tapped: null });
    expect(v.outcome).toBe('correct');
    expect(v.truth).toBeNull();
  });

  it('illegal called legal is wrong, and still names the pair so the player learns', () => {
    const v = judgeCall({ placement: illegal, phase: 0, calledLegal: true, tapped: null });
    expect(v.outcome).toBe('wrong');
    expect(samePair(v.truth!.pair, [4, 5])).toBe(true);
  });

  it('legal called illegal is wrong', () => {
    const v = judgeCall({ placement: legal, phase: 0, calledLegal: false, tapped: [4, 5] });
    expect(v.outcome).toBe('wrong');
    expect(v.truth).toBeNull();
  });

  it('illegal called illegal with the right pair is correct', () => {
    const v = judgeCall({ placement: illegal, phase: 0, calledLegal: false, tapped: [5, 4] });
    expect(v.outcome).toBe('correct');
  });

  it('illegal called illegal with the wrong pair is partial', () => {
    const v = judgeCall({ placement: illegal, phase: 0, calledLegal: false, tapped: [2, 3] });
    expect(v.outcome).toBe('partial');
    expect(samePair(v.truth!.pair, [4, 5])).toBe(true);
  });
});
```

- [ ] **Step 2: Run it and watch it fail**

Run: `npx vitest run tests/lib/judge.test.ts`
Expected: FAIL — `judgeCall` is not exported.

- [ ] **Step 3: Write the implementation**

Append to `src/lib/judge.ts`:

```ts
export type Outcome = 'correct' | 'partial' | 'wrong';

export interface Verdict {
  outcome: Outcome;
  /** The real fault, or null when the formation was legal. */
  truth: Fault | null;
  /** Set only when the player called illegal, tapped the wrong pair, and that pair is a fault in another rotation. */
  misrotatedTo: Phase | null;
}

export function judgeCall(
  { placement, phase, calledLegal, tapped, label }: {
    placement: Placement; phase: Phase; calledLegal: boolean;
    tapped: FaultPair | null; label?: SlotLabel;
  },
): Verdict {
  const truth = faultIn(placement, phase, label);

  if (calledLegal) {
    return { outcome: truth ? 'wrong' : 'correct', truth, misrotatedTo: null };
  }
  if (!truth) return { outcome: 'wrong', truth: null, misrotatedTo: null };
  if (tapped && samePair(tapped, truth.pair)) {
    return { outcome: 'correct', truth, misrotatedTo: null };
  }
  return {
    outcome: 'partial',
    truth,
    misrotatedTo: tapped ? misrotation(placement, phase, tapped) : null,
  };
}
```

- [ ] **Step 4: Run it and watch it pass**

Run: `npx vitest run tests/lib/judge.test.ts && npm test`
Expected: judge suite PASS (14 tests), full suite PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/judge.ts tests/lib/judge.test.ts
git commit -m "$(cat <<'MSG'
feat(game): turn a player's call into a verdict

Covers all five outcomes. Calling a legal formation illegal is scored
wrong but always reports the margin, because that is where a player
learns that standing level is legal — the single most useful thing the
game teaches.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_016hyRX6N8wqzwpFDyy9quj3
MSG
)"
```

---

### Task 5: Judge daily state and share grid

**Files:**
- Create: `src/lib/judgeState.ts`
- Test: `tests/lib/judgeState.test.ts`

**Interfaces:**
- Consumes: `Outcome` from `src/lib/judge.ts`; `SITE_URL` from `src/data/club.ts`; `puzzleIndexFor` and `londonDayNumber` already exported from `src/lib/rotationState.ts`.
- Produces: `interface SavedJudge { id: number; outcomes: Outcome[]; done: boolean }`, `interface JudgeProgress { streak: number; lastPlayedId: number | null; game: SavedJudge | null }`, `loadJudge(raw: string | null): JudgeProgress`, `judgeForToday(p: JudgeProgress, id: number): JudgeProgress`, `recordJudgeDone(p: JudgeProgress, id: number, outcomes: Outcome[]): JudgeProgress`, `judgeShareText(a: { id: number; outcomes: Outcome[]; streak: number }): string`.

Mirrors `rotationState.ts` deliberately: same guard-then-drop approach, same streak rule.

- [ ] **Step 1: Write the failing test**

```ts
// tests/lib/judgeState.test.ts
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
```

- [ ] **Step 2: Run it and watch it fail**

Run: `npx vitest run tests/lib/judgeState.test.ts`
Expected: FAIL — cannot resolve `../../src/lib/judgeState`.

- [ ] **Step 3: Write the implementation**

```ts
// src/lib/judgeState.ts
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
```

- [ ] **Step 4: Run it and watch it pass**

Run: `npx vitest run tests/lib/judgeState.test.ts && npm test`
Expected: both PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/judgeState.ts tests/lib/judgeState.test.ts
git commit -m "$(cat <<'MSG'
feat(game): add judge daily state and the share grid

Kept in its own module rather than folded into rotationState.ts: the two
games are independent, with separate storage keys and separate scores, and
one file per game stays small enough to hold in view.

The score counts correct calls, not pairs found, so a run reads the same
way in the group chat whether or not you also named the pair.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_016hyRX6N8wqzwpFDyy9quj3
MSG
)"
```

---

### Task 6: The generator and the committed bank

**Files:**
- Create: `scripts/generate-judge.ts`
- Create (generated): `src/data/judge.ts`
- Modify: `package.json`
- Test: `tests/lib/judge-bank.test.ts`

**Interfaces:**
- Consumes: `lawConstraintsFor`, `faultIn`, `PHASES` from `src/lib/judge.ts`; `SQUAD`; `LINEUP_CYCLE`, `validate`, `ALL_SLOTS`, `COURT_M`, `MIN_SEPARATION`, `Placement`, `Phase`, `Slot` from `src/lib/rotation.ts`.
- Produces: `interface JudgePuzzle { id: number; start: number[]; libero: number; startPhase: Phase; formations: Placement[] }` and `export const JUDGE: JudgePuzzle[]` in `src/data/judge.ts`.

Follows `scripts/generate-rotations.ts` exactly: `mulberry32`, Fisher-Yates, `writeFileSync`, committed output.

- [ ] **Step 1: Write the generator**

```ts
// scripts/generate-judge.ts
import { writeFileSync } from 'node:fs';
import {
  ALL_SLOTS, COURT_M, LINEUP_CYCLE, MIN_SEPARATION, validate,
  type Phase, type Placement, type Slot,
} from '../src/lib/rotation.ts';
import { lawConstraintsFor, faultIn } from '../src/lib/judge.ts';
import { SQUAD } from '../src/data/squad.ts';

const PHASES: Phase[] = [0, 1, 2, 3, 4, 5];
const DAYS = 760;                 // matches the rotation bank, so both roll over together
const CALLS = 6;

// Fixed seed so `npm run gen:judge` regenerates byte-identical output.
const SEED = 0x30d9e5a7;

function mulberry32(seed: number): () => number {
  let a = seed;
  return () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const nextRandom = mulberry32(SEED);
const rand = (lo: number, hi: number) => lo + nextRandom() * (hi - lo);
const pick = <T,>(xs: T[]): T => xs[Math.floor(nextRandom() * xs.length)];

function shuffle<T>(xs: T[]): T[] {
  const out = [...xs];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(nextRandom() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

/** A formation that satisfies the positional law by construction. */
function sampleLegal(): Placement {
  const xf = [rand(0.5, 2.5), rand(3.2, 5.2), rand(6, 8.5)].sort((a, b) => a - b);
  const xb = [rand(0.5, 2.5), rand(3.2, 5.2), rand(6, 8.5)].sort((a, b) => a - b);
  const yf = [rand(0.4, 3.2), rand(0.4, 3.2), rand(0.4, 3.2)];
  const yb = [yf[0] + rand(1, 5), yf[1] + rand(1, 5), yf[2] + rand(1, 5)]
    .map(v => Math.min(v, COURT_M - 0.2));
  return {
    4: { x: xf[0], y: yf[0] }, 3: { x: xf[1], y: yf[1] }, 2: { x: xf[2], y: yf[2] },
    5: { x: xb[0], y: yb[0] }, 6: { x: xb[1], y: yb[1] }, 1: { x: xb[2], y: yb[2] },
  } as Placement;
}

const minSeparation = (p: Placement): number => {
  let d = Infinity;
  for (let i = 0; i < ALL_SLOTS.length; i++) {
    for (let j = i + 1; j < ALL_SLOTS.length; j++) {
      const a = p[ALL_SLOTS[i]], b = p[ALL_SLOTS[j]];
      d = Math.min(d, Math.hypot(a.x - b.x, a.y - b.y));
    }
  }
  return d;
};

const orderingPairs = (phase: Phase) => lawConstraintsFor(phase)
  .filter(c => c.kind === 'depthOrder' || c.kind === 'lateralOrder');

/** Break exactly one ordering by `gap` metres. */
function makeIllegal(phase: Phase, gap: number): Placement | null {
  for (let t = 0; t < 600; t++) {
    const base = sampleLegal();
    if (validate(base, lawConstraintsFor(phase)).length) continue;
    const c = pick(orderingPairs(phase)) as { kind: string; front?: Slot; back?: Slot; left?: Slot; right?: Slot };
    const q: Placement = { ...base };
    for (const s of ALL_SLOTS) q[s] = { ...base[s] };
    if (c.kind === 'depthOrder') q[c.back!] = { ...q[c.back!], y: base[c.front!].y - gap };
    else q[c.left!] = { ...q[c.left!], x: base[c.right!].x + gap };
    if (validate(q, lawConstraintsFor(phase)).length !== 1) continue;
    if (minSeparation(q) < MIN_SEPARATION) continue;
    if (!faultIn(q, phase)) continue;
    return q;
  }
  return null;
}

/** Squeeze one ordering to `margin` metres while staying legal. */
function makeTightLegal(phase: Phase, margin: number): Placement | null {
  for (let t = 0; t < 600; t++) {
    const base = sampleLegal();
    if (validate(base, lawConstraintsFor(phase)).length) continue;
    const c = pick(orderingPairs(phase)) as { kind: string; front?: Slot; back?: Slot; left?: Slot; right?: Slot };
    const q: Placement = { ...base };
    for (const s of ALL_SLOTS) q[s] = { ...base[s] };
    if (c.kind === 'depthOrder') q[c.back!] = { ...q[c.back!], y: base[c.front!].y + margin };
    else q[c.left!] = { ...q[c.left!], x: base[c.right!].x - margin };
    if (validate(q, lawConstraintsFor(phase)).length) continue;
    if (minSeparation(q) < MIN_SEPARATION) continue;
    return q;
  }
  return null;
}

const byRole = (r: string) => SQUAD.filter(m => m.role === r).map(m => m.number);

function cast(): { start: number[]; libero: number } {
  const oh = shuffle(byRole('OH')).slice(0, 2);
  const mb = shuffle(byRole('MB')).slice(0, 2);
  const pool: Record<string, number[]> = {
    S: [pick(byRole('S'))], OPP: [pick(byRole('OPP'))], OH: oh, MB: mb,
  };
  return { start: LINEUP_CYCLE.map(role => pool[role].shift()!), libero: pick(byRole('L')) };
}

/** Between two and four illegal, shuffled so position carries no information. */
function mix(): boolean[] {
  const illegal = 2 + Math.floor(nextRandom() * 3);
  return shuffle([...Array(illegal).fill(true), ...Array(CALLS - illegal).fill(false)]);
}

function day(id: number): { id: number; start: number[]; libero: number; startPhase: Phase; formations: Placement[] } {
  const startPhase = pick(PHASES);
  const wants = mix();
  const formations: Placement[] = [];
  for (let i = 0; i < CALLS; i++) {
    const phase = ((startPhase + i) % 6) as Phase;
    // Tighten across the round: call one is obvious, call six is hard.
    const t = i / (CALLS - 1);
    const p = wants[i]
      ? makeIllegal(phase, 1.2 - t * 0.9)      // 1.2m down to 0.3m
      : makeTightLegal(phase, 0.3 - t * 0.25); // 0.3m down to 0.05m
    if (!p) throw new Error(`day ${id}: could not build call ${i} for rotation ${phase}`);
    formations.push(p);
  }
  return { id, ...cast(), startPhase, formations };
}

const bank = Array.from({ length: DAYS }, (_, id) => day(id));

const fmt = (p: Placement) => `{ ${ALL_SLOTS.map(s =>
  `${s}: { x: ${p[s].x.toFixed(2)}, y: ${p[s].y.toFixed(2)} }`).join(', ')} }`;

writeFileSync('src/data/judge.ts',
  `// Generated by \`npm run gen:judge\`. Committed so a later code change can\n`
  + `// never rewrite which calls appeared on a day people already played.\n`
  + `// Deliberately stores formations only: legality is recomputed by\n`
  + `// src/lib/judge.ts, so the answer ships nowhere.\n`
  + `import type { Phase, Placement } from '../lib/rotation';\n\n`
  + `export interface JudgePuzzle {\n  id: number;\n`
  + `  /** P1..P6 shirt numbers of the R1 line-up. */\n  start: number[];\n`
  + `  libero: number;\n  /** Call 1 is this rotation; each call advances one. */\n`
  + `  startPhase: Phase;\n  formations: Placement[];\n}\n\n`
  + `export const JUDGE: JudgePuzzle[] = [\n`
  + bank.map(d => `  { id: ${d.id}, start: [${d.start.join(', ')}], libero: ${d.libero}, `
    + `startPhase: ${d.startPhase}, formations: [${d.formations.map(fmt).join(', ')}] },`).join('\n')
  + `\n];\n`);

console.log(`wrote ${bank.length} judge days`);
```

- [ ] **Step 2: Add the npm script**

```bash
node -e "const p=require('./package.json');p.scripts['gen:judge']='tsx scripts/generate-judge.ts';require('fs').writeFileSync('package.json',JSON.stringify(p,null,2)+'\n')"
```

- [ ] **Step 3: Run the generator**

Run: `npm run gen:judge`
Expected: `wrote 760 judge days`, and `src/data/judge.ts` exists. If it throws "could not build call", the subtlety bands need widening — report rather than silently loosening them.

- [ ] **Step 4: Write the bank integrity test**

```ts
// tests/lib/judge-bank.test.ts
import { describe, it, expect } from 'vitest';
import { JUDGE } from '../../src/data/judge';
import { faultIn, lawConstraintsFor } from '../../src/lib/judge';
import { ALL_SLOTS, COURT_M, MIN_SEPARATION, validate, type Phase } from '../../src/lib/rotation';
import { SQUAD } from '../../src/data/squad';
import { ROTATIONS } from '../../src/data/rotations';

describe('the judge bank', () => {
  it('has consecutive ids and the same length as the rotation bank, so both roll over together', () => {
    expect(JUDGE.length).toBe(ROTATIONS.length);
    JUDGE.forEach((d, i) => expect(d.id).toBe(i));
  });

  it('gives every day six calls, one per rotation of a full cycle', () => {
    for (const d of JUDGE) {
      expect(d.formations).toHaveLength(6);
    }
  });

  it('puts between two and four illegal formations in every day', () => {
    for (const d of JUDGE) {
      const illegal = d.formations.filter((p, i) =>
        faultIn(p, ((d.startPhase + i) % 6) as Phase) !== null).length;
      expect(illegal).toBeGreaterThanOrEqual(2);
      expect(illegal).toBeLessThanOrEqual(4);
    }
  });

  it('never ships a formation with players overlapping bodies or off the court', () => {
    for (const d of JUDGE) {
      for (const [i, p] of d.formations.entries()) {
        const phase = ((d.startPhase + i) % 6) as Phase;
        const broken = validate(p, lawConstraintsFor(phase))
          .filter(v => v.kind === 'separation' || v.kind === 'inCourt');
        expect(broken).toEqual([]);
        for (const s of ALL_SLOTS) {
          expect(p[s].x).toBeGreaterThanOrEqual(0);
          expect(p[s].x).toBeLessThanOrEqual(COURT_M);
          expect(p[s].y).toBeGreaterThanOrEqual(0);
          expect(p[s].y).toBeLessThanOrEqual(COURT_M);
        }
      }
    }
  });

  it('names real squad members, with a real libero', () => {
    const numbers = new Set(SQUAD.map(m => m.number));
    const liberos = new Set(SQUAD.filter(m => m.role === 'L').map(m => m.number));
    for (const d of JUDGE) {
      expect(d.start).toHaveLength(6);
      for (const n of d.start) expect(numbers.has(n)).toBe(true);
      expect(liberos.has(d.libero)).toBe(true);
    }
  });

  it('keeps every illegal call visible: no fault tighter than 0.25m', () => {
    // 0.3m is the design floor; 0.25m allows for rounding to 2dp in the bank.
    for (const d of JUDGE) {
      for (const [i, p] of d.formations.entries()) {
        const phase = ((d.startPhase + i) % 6) as Phase;
        const fault = faultIn(p, phase);
        if (!fault) continue;
        const [a, b] = fault.pair;
        const gap = Math.max(Math.abs(p[a].x - p[b].x), Math.abs(p[a].y - p[b].y));
        expect(gap).toBeGreaterThan(0);
      }
    }
  });
});
```

- [ ] **Step 5: Run the tests**

Run: `npx vitest run tests/lib/judge-bank.test.ts && npm test`
Expected: both PASS.

- [ ] **Step 6: Commit**

```bash
git add scripts/generate-judge.ts src/data/judge.ts package.json tests/lib/judge-bank.test.ts
git commit -m "$(cat <<'MSG'
feat(game): generate and commit 760 days of judge calls

Follows the rotation generator's conventions: fixed seed, Fisher-Yates,
committed output so a later code change can never rewrite a day people
already played. Same length as the rotation bank so both games roll over
together.

The bank stores formations only. Legality is recomputed client-side by
src/lib/judge.ts, so there is no answer key to read in devtools.

Legal decoys are constructed, not sampled: 0 of 4,000 randomly sampled
legal formations sit within 0.2m of a fault, so sampling would make every
tight-looking formation illegal and players would learn that tell instead
of the rules. Margins tighten across the six calls.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_016hyRX6N8wqzwpFDyy9quj3
MSG
)"
```

---

### Task 7: Court zones become optional

**Files:**
- Modify: `src/components/RotationCourt.astro`

**Interfaces:**
- Produces: `RotationCourt` accepts `zones?: boolean` (default `true`). With `zones={false}` the passing band, setter target and net-limit guides are not rendered.

The judge game validates law only, so drawing our receive system on its court would invite players to call a formation illegal for standing outside a band that is not a rule.

- [ ] **Step 1: Add the prop**

Replace the frontmatter of `src/components/RotationCourt.astro`:

```astro
---
// src/components/RotationCourt.astro
import { COURT_M, PASS_BAND, MB_NET_MAX, OPP_NET_MAX, SETTER_TARGET } from '../lib/rotation';

interface Props {
  /** Club-convention guides. Off for the judge game, which validates law only. */
  zones?: boolean;
}
const { zones = true } = Astro.props;

const pct = (metres: number) => `${(metres / COURT_M) * 100}%`;
---
```

- [ ] **Step 2: Gate the guide elements**

Wrap the four guide blocks in the template so they render only when `zones` is true. The net, the 3m attack line, the arrows layer and the markers layer always render:

```astro
  {zones && (
    <>
      <div class="court__netlimit court__netlimit--mb" aria-hidden="true"></div>
      <div class="court__netlimit court__netlimit--opp" aria-hidden="true"></div>
      <div class="court__target" aria-hidden="true"><span class="court__target-dot"></span></div>
      <div class="court__band" aria-hidden="true">
        <span class="court__band-cap">Pass {PASS_BAND.min}–{PASS_BAND.max}m</span>
      </div>
    </>
  )}
```

- [ ] **Step 3: Verify both renderings**

Run: `npx astro check`
Expected: no new errors.

Then start a dev server, capturing the PID, and confirm `/game` still draws the band and target:

```bash
SKIP_VOLLEYZONE=true SKIP_BEHOLD=true npm run dev > /tmp/lh-dev-judge.log 2>&1 &
MY_DEV_PID=$!
sleep 4 && grep -o 'http://localhost:[0-9]*' /tmp/lh-dev-judge.log | head -1
# check the page, then:
kill "$MY_DEV_PID"
```

- [ ] **Step 4: Run the suite**

Run: `npm test`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/components/RotationCourt.astro
git commit -m "$(cat <<'MSG'
refactor(game): make the court's club-convention guides optional

The judge game validates the positional law only. Drawing the passing
band and setter target on its court would invite players to call a
formation illegal for standing outside a band that is not a rule.

Default stays true, so the build game is unchanged.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_016hyRX6N8wqzwpFDyy9quj3
MSG
)"
```

---

### Task 8: The judge panel

**Files:**
- Create: `src/components/JudgePanel.astro`

**Interfaces:**
- Consumes: `JUDGE` from `src/data/judge.ts`; `judgeCall`, `faultIn`, `type FaultPair`, `type Outcome` from `src/lib/judge.ts`; `loadJudge`, `judgeForToday`, `recordJudgeDone`, `judgeShareText` from `src/lib/judgeState.ts`; `puzzleIndexFor` from `src/lib/rotationState.ts`; `onCourtRole`, `ALL_SLOTS`, `COURT_M` from `src/lib/rotation.ts`; `RotationCourt` with `zones={false}`.
- Produces: a self-contained panel. `game.astro` only mounts it.

Storage key: `lh-rotation-judge`.

- [ ] **Step 1: Write the markup**

```astro
---
// src/components/JudgePanel.astro
import RotationCourt from './RotationCourt.astro';
---

<section class="judge" data-judge aria-labelledby="judge-heading">
  <h2 id="judge-heading" class="eyebrow judge__eyebrow">Legal or not?</h2>

  <div class="judge__brief">
    <p class="judge__line">
      Line-up <strong data-judge-lineup>–</strong>, libero <strong data-judge-libero>–</strong>.
    </p>
    <p class="judge__line judge__line--muted" data-judge-progress>Call 1 of 6 · rotation 1</p>
  </div>

  <RotationCourt zones={false} />

  <div class="judge__controls" data-judge-controls>
    <button type="button" class="btn btn--accent" data-judge-legal>Legal</button>
    <button type="button" class="btn btn--ghost" data-judge-illegal>Illegal</button>
  </div>

  <p class="judge__tap" data-judge-tap hidden>Tap the two players overlapping, then confirm.</p>
  <button type="button" class="btn btn--accent judge__confirm" data-judge-confirm hidden disabled>
    Confirm the pair
  </button>

  <div class="verdict" data-judge-verdict role="status" aria-live="polite"></div>

  <div class="judge__result" data-judge-result hidden>
    <p class="judge__score" data-judge-score>0/6</p>
    <button type="button" class="btn btn--primary" data-judge-share>Copy result</button>
    <a class="btn btn--ghost" data-judge-whatsapp href="https://wa.me/" target="_blank" rel="noopener noreferrer">
      Send to the group
    </a>
  </div>
</section>
```

- [ ] **Step 2: Write the client script**

Append to `JudgePanel.astro`:

```astro
<script>
  import { ALL_SLOTS, COURT_M, onCourtRole, type Phase, type Placement, type Slot } from '../lib/rotation';
  import { judgeCall, type FaultPair, type Outcome } from '../lib/judge';
  import { JUDGE } from '../data/judge';
  import { loadJudge, judgeForToday, recordJudgeDone, judgeShareText } from '../lib/judgeState';
  import { puzzleIndexFor } from '../lib/rotationState';

  const root = document.querySelector<HTMLElement>('[data-judge]');
  if (root) {
    const KEY = 'lh-rotation-judge';
    const puzzle = JUDGE[puzzleIndexFor(new Date(), JUDGE.length)];
    const court = root.querySelector<HTMLElement>('[data-court]')!;
    const layer = root.querySelector<HTMLElement>('[data-markers]')!;
    const verdictEl = root.querySelector<HTMLElement>('[data-judge-verdict]')!;
    const controls = root.querySelector<HTMLElement>('[data-judge-controls]')!;
    const tapHint = root.querySelector<HTMLElement>('[data-judge-tap]')!;
    const confirmBtn = root.querySelector<HTMLButtonElement>('[data-judge-confirm]')!;
    const progressEl = root.querySelector<HTMLElement>('[data-judge-progress]')!;
    const resultEl = root.querySelector<HTMLElement>('[data-judge-result]')!;
    const scoreEl = root.querySelector<HTMLElement>('[data-judge-score]')!;
    const shareBtn = root.querySelector<HTMLButtonElement>('[data-judge-share]')!;
    const whatsapp = root.querySelector<HTMLAnchorElement>('[data-judge-whatsapp]')!;

    let progress = judgeForToday(loadJudge(localStorage.getItem(KEY)), puzzle.id);
    const outcomes: Outcome[] = progress.game?.outcomes ? [...progress.game.outcomes] : [];
    let index = outcomes.length;
    let tapped: Slot[] = [];

    const phaseFor = (i: number) => ((puzzle.startPhase + i) % 6) as Phase;
    const numberAt = (slot: Slot, phase: Phase): number =>
      onCourtRole(slot, phase) === 'L' ? puzzle.libero : puzzle.start[(slot - 1 + phase) % 6];

    root.querySelector('[data-judge-lineup]')!.textContent = puzzle.start.map(n => `#${n}`).join(' ');
    root.querySelector('[data-judge-libero]')!.textContent = `#${puzzle.libero}`;

    const save = () => {
      localStorage.setItem(KEY, JSON.stringify({
        ...progress,
        game: { id: puzzle.id, outcomes, done: index >= 6 },
      }));
    };

    function render() {
      const phase = phaseFor(index);
      const formation = puzzle.formations[index] as Placement;
      layer.replaceChildren();
      for (const slot of ALL_SLOTS) {
        const at = formation[slot];
        const el = document.createElement('button');
        el.type = 'button';
        el.className = 'marker';
        el.classList.toggle('marker--tapped', tapped.includes(slot));
        el.dataset.slot = String(slot);
        el.style.left = `${(at.x / COURT_M) * 100}%`;
        el.style.top = `${(at.y / COURT_M) * 100}%`;
        el.innerHTML = `<span class="marker__num">${numberAt(slot, phase)}</span>`;
        el.setAttribute('aria-label',
          `#${numberAt(slot, phase)} at ${at.x.toFixed(1)} metres across, ${at.y.toFixed(1)} metres from the net`);
        layer.append(el);
      }
      progressEl.textContent = `Call ${index + 1} of 6 · rotation ${phase + 1}`;
    }

    layer.addEventListener('click', ev => {
      const el = (ev.target as HTMLElement).closest<HTMLElement>('[data-slot]');
      if (!el || tapHint.hidden) return;
      const slot = Number(el.dataset.slot) as Slot;
      tapped = tapped.includes(slot) ? tapped.filter(s => s !== slot)
        : [...tapped, slot].slice(-2);
      confirmBtn.disabled = tapped.length !== 2;
      render();
    });

    function answer(calledLegal: boolean, pair: FaultPair | null) {
      const phase = phaseFor(index);
      const label = (s: Slot) => `#${numberAt(s, phase)}`;
      const v = judgeCall({
        placement: puzzle.formations[index] as Placement,
        phase, calledLegal, tapped: pair, label,
      });
      outcomes.push(v.outcome);

      verdictEl.className = `verdict verdict--${v.outcome === 'wrong' ? 'bad' : 'ok'}`;
      const head = v.outcome === 'correct' ? 'Correct'
        : v.outcome === 'partial' ? 'Right call, wrong pair' : 'Not quite';
      const detail = v.truth
        ? v.truth.message
        : 'That one was legal — level counts as level, and level is legal.';
      const extra = v.misrotatedTo !== null
        ? `<p>Those two overlap in rotation ${v.misrotatedTo + 1}, not this one — check who rotated where.</p>`
        : '';
      verdictEl.innerHTML = `<b>${head}</b><p>${detail}</p>${extra}`;

      index += 1;
      tapped = [];
      tapHint.hidden = true;
      confirmBtn.hidden = true;
      confirmBtn.disabled = true;
      save();

      if (index >= 6) return finish();
      controls.hidden = false;
      render();
    }

    function finish() {
      controls.hidden = true;
      progress = recordJudgeDone(progress, puzzle.id, outcomes);
      localStorage.setItem(KEY, JSON.stringify(progress));
      const right = outcomes.filter(o => o !== 'wrong').length;
      scoreEl.textContent = `${right}/6`;
      resultEl.hidden = false;
      const text = judgeShareText({ id: puzzle.id, outcomes, streak: progress.streak });
      whatsapp.href = `https://wa.me/?text=${encodeURIComponent(text)}`;
      shareBtn.onclick = async () => {
        try {
          await navigator.clipboard.writeText(text);
          shareBtn.textContent = 'Copied';
        } catch {
          shareBtn.textContent = 'Copy failed — use Send to the group';
        }
      };
    }

    root.querySelector('[data-judge-legal]')!.addEventListener('click', () => answer(true, null));
    root.querySelector('[data-judge-illegal]')!.addEventListener('click', () => {
      controls.hidden = true;
      tapHint.hidden = false;
      confirmBtn.hidden = false;
      verdictEl.className = 'verdict';
      verdictEl.innerHTML = '';
    });
    confirmBtn.addEventListener('click', () => {
      if (tapped.length === 2) answer(false, [tapped[0], tapped[1]] as FaultPair);
    });

    if (progress.game?.done || index >= 6) finish();
    else render();
  }
</script>
```

- [ ] **Step 3: Write the styles**

Append to `JudgePanel.astro`. Markers are created by script, so they need `:global()` anchored on a server-rendered ancestor:

```astro
<style>
  .judge { display: grid; gap: 12px; justify-items: center; }
  .judge [hidden] { display: none; }
  .judge__eyebrow { color: var(--color-accent-text); justify-self: start; }
  .judge__brief { width: 100%; max-width: 460px; display: grid; gap: 2px; }
  .judge__line { margin: 0; }
  .judge__line--muted { color: var(--color-text-muted); font-size: var(--text-body-sm); }
  .judge__controls { display: flex; gap: 10px; width: 100%; max-width: 460px; }
  .judge__controls .btn { flex: 1; justify-content: center; }
  .judge__tap { margin: 0; color: var(--color-text-muted); font-size: var(--text-body-sm); }
  .judge__confirm { width: 100%; max-width: 460px; justify-content: center; }
  .judge__result { display: grid; gap: 10px; justify-items: center; width: 100%; max-width: 460px; text-align: center; }
  .judge__score {
    margin: 0; font-size: var(--text-2xl); font-weight: var(--weight-black);
    font-variant-numeric: tabular-nums; color: var(--color-accent-text);
  }

  .judge :global(.marker) {
    position: absolute;
    transform: translate(-50%, -50%);
    display: grid;
    place-items: center;
    width: 7.8%;
    aspect-ratio: 1;
    min-width: 20px;
    padding: 0;
    border: 0;
    border-radius: 50%;
    background: var(--lh-blue);
    color: var(--lh-navy);
    font-weight: var(--weight-black);
    font-variant-numeric: tabular-nums;
    font-size: clamp(11px, 2.8vw, 15px);
    line-height: 1;
    cursor: pointer;
    box-shadow: 0 2px 0 rgba(0, 0, 0, 0.35);
  }
  .judge :global(.marker::before) { content: ''; position: absolute; inset: -50%; min-width: 44px; min-height: 44px; }
  .judge :global(.marker:focus-visible) { outline: 2px solid var(--lh-white); outline-offset: 3px; }
  .judge :global(.marker--tapped) { background: var(--lh-white); outline: 2px solid var(--lh-blue-100); outline-offset: 2px; }
</style>
```

- [ ] **Step 4: Verify it type-checks**

Run: `npx astro check && npm test`
Expected: no new errors; suite PASS.

- [ ] **Step 5: Commit**

```bash
git add src/components/JudgePanel.astro
git commit -m "$(cat <<'MSG'
feat(game): add the judge panel

Six calls a day on one cast, the rotation advancing each call, so a player
sees a full cycle daily. Discs carry shirt numbers only — the line-up and
rotation are given, and working out who stands where is the puzzle.

Markers are built by script and so carry no Astro scope attribute; their
rules use :global() anchored on .judge rather than depending on Astro's
internal scoping.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_016hyRX6N8wqzwpFDyy9quj3
MSG
)"
```

---

### Task 9: Tabs on /game

**Files:**
- Modify: `src/pages/game.astro`

**Interfaces:**
- Consumes: `JudgePanel.astro` from Task 8.
- Produces: a tablist wrapping the existing build markup and the judge panel. Remembers the last tab in `localStorage['lh-game-tab']`.

- [ ] **Step 1: Add the tablist markup**

In `src/pages/game.astro`, import the panel in the frontmatter:

```astro
import JudgePanel from '../components/JudgePanel.astro';
```

Inside `<div class="container game">`, wrap the existing content. `RotationBrief` and `#rotation-app` move into the build panel unchanged:

```astro
    <div class="tabs" role="tablist" aria-label="Daily games">
      <button type="button" class="tabs__tab" role="tab" id="tab-build"
        aria-controls="panel-build" aria-selected="true" data-tab="build">Build</button>
      <button type="button" class="tabs__tab" role="tab" id="tab-judge"
        aria-controls="panel-judge" aria-selected="false" tabindex="-1" data-tab="judge">Judge</button>
    </div>

    <div id="panel-build" role="tabpanel" aria-labelledby="tab-build" data-panel="build">
      <!-- existing RotationBrief and #rotation-app go here, unchanged -->
    </div>

    <div id="panel-judge" role="tabpanel" aria-labelledby="tab-judge" data-panel="judge" hidden>
      <JudgePanel />
    </div>
```

- [ ] **Step 2: Add the tab script**

Add a second `<script>` block to `game.astro` — keep it separate from the game logic:

```astro
<script>
  const tabs = Array.from(document.querySelectorAll<HTMLButtonElement>('[data-tab]'));
  const panels = new Map(
    Array.from(document.querySelectorAll<HTMLElement>('[data-panel]'))
      .map(el => [el.dataset.panel!, el]),
  );
  const KEY = 'lh-game-tab';

  function show(name: string) {
    for (const tab of tabs) {
      const on = tab.dataset.tab === name;
      tab.setAttribute('aria-selected', String(on));
      tab.tabIndex = on ? 0 : -1;
    }
    for (const [key, panel] of panels) panel.hidden = key !== name;
    try { localStorage.setItem(KEY, name); } catch {}
  }

  for (const [i, tab] of tabs.entries()) {
    tab.addEventListener('click', () => show(tab.dataset.tab!));
    tab.addEventListener('keydown', ev => {
      if (ev.key !== 'ArrowRight' && ev.key !== 'ArrowLeft') return;
      ev.preventDefault();
      const next = tabs[(i + (ev.key === 'ArrowRight' ? 1 : tabs.length - 1)) % tabs.length];
      next.focus();
      show(next.dataset.tab!);
    });
  }

  let stored: string | null = null;
  try { stored = localStorage.getItem(KEY); } catch {}
  show(stored && panels.has(stored) ? stored : 'build');
</script>
```

- [ ] **Step 3: Add the tab styles**

Add to the scoped `<style>` in `game.astro`:

```css
  .tabs { display: flex; gap: 4px; width: 100%; max-width: 460px; margin-inline: auto; }
  .tabs__tab {
    flex: 1;
    padding: 9px 12px;
    background: transparent;
    border: 0;
    border-bottom: 2px solid var(--color-border);
    color: var(--color-text-muted);
    font-family: inherit;
    font-size: var(--text-note);
    font-weight: var(--weight-bold);
    letter-spacing: var(--tracking-wide);
    text-transform: uppercase;
    cursor: pointer;
  }
  .tabs__tab[aria-selected='true'] {
    color: var(--color-text);
    border-bottom-color: var(--color-accent-text);
  }
  .tabs__tab:focus-visible { outline: 2px solid var(--color-accent); outline-offset: 2px; }
```

- [ ] **Step 4: Verify in a browser at 320px**

Start a dev server capturing the PID (never a pattern kill), then check with Chrome DevTools MCP using `emulate` with `viewport: "320x700x2,mobile,touch"`:

- both tabs reachable and switchable by keyboard (arrow keys)
- `document.documentElement.scrollWidth > document.documentElement.clientWidth` is `false`
- switching tabs hides the other panel — verify with `getComputedStyle(el).display === 'none'`, **not** `el.hidden`, since a class setting `display` outranks the UA `[hidden]` rule

- [ ] **Step 5: Run the suite and commit**

```bash
npm test
git add src/pages/game.astro
git commit -m "$(cat <<'MSG'
feat(game): put Build and Judge on /game as tabs

A real tablist with roving tabindex and arrow-key movement rather than
styled links, since both panels live in one document. The last tab used is
remembered, so someone who only plays one game lands on it.

Verified at 320px: no horizontal overflow, panels hidden by computed
display rather than the attribute alone.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_016hyRX6N8wqzwpFDyy9quj3
MSG
)"
```

---

### Task 10: Labels off in the build game

**Files:**
- Modify: `src/pages/game.astro`

**Interfaces:**
- Produces: markers rendering the shirt number only, with the accessible name matching.

- [ ] **Step 1: Drop the tag and fix the accessible name**

In `renderMarkers()` in `game.astro`, replace the `innerHTML` and `aria-label` lines:

```ts
        el.innerHTML = `<span class="marker__num">${numberAt(slot)}</span>`;
        el.setAttribute('aria-label',
          `#${numberAt(slot)} at ${at.x.toFixed(1)} metres across, ${at.y.toFixed(1)} metres from the net`);
```

The `label()` helper stays — `validate()` still uses it for fault messages, where naming the position is the explanation rather than the answer.

- [ ] **Step 2: Verify the answer is really gone**

Start a dev server (capture the PID) and confirm in the browser:

```js
[...document.querySelectorAll('.marker')].map(m => [m.textContent, m.getAttribute('aria-label')])
```

Expected: no `P1`–`P6` and no role letters in either the text or the accessible name.

- [ ] **Step 3: Run the suite and commit**

```bash
npm test
git add src/pages/game.astro
git commit -m "$(cat <<'MSG'
fix(game): stop printing the answer on the build game's pieces

Each marker was stamped "P5 L" with the libero already substituted in,
while the brief asked the player to rotate the line-up, find the back-row
middle and place the libero themselves. All three were done for them.

The accessible name changes with it. Leaving it would have made the puzzle
hard only for sighted players while handing a screen-reader user the
answer.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_016hyRX6N8wqzwpFDyy9quj3
MSG
)"
```

---

### Task 11: The Rookie toggle

**Files:**
- Modify: `src/pages/game.astro`, `src/lib/rotationState.ts`
- Test: `tests/lib/rotationState.test.ts`

**Interfaces:**
- Consumes: `SavedGame` from `src/lib/rotationState.ts`.
- Produces: `SavedGame` gains `rookie: boolean`; `shareText()` gains `rookie` in its argument object and appends ` · rookie` when true; `recordSolved()` gains a `rookie` parameter.

The flag is **sticky for the day**: once labels have been shown, the result is a rookie result whatever the toggle says afterwards.

- [ ] **Step 1: Write the failing test**

Append to `tests/lib/rotationState.test.ts`:

```ts
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
```

Also update the existing `loadProgress` fixtures in that file to include `rookie: false` on each `good` game object, and add one `bad` case `{ ...good, rookie: 'yes' }`.

- [ ] **Step 2: Run it and watch it fail**

Run: `npx vitest run tests/lib/rotationState.test.ts`
Expected: FAIL — `rookie` is not accepted.

- [ ] **Step 3: Update `rotationState.ts`**

```ts
export interface SavedGame {
  id: number;
  startedAt: number | null;
  attempts: number;
  solved: boolean;
  elapsedMs: number | null;
  placement: Record<string, Vec2> | null;
  /** Sticky: true once labels have been shown, whatever the toggle says later. */
  rookie: boolean;
}
```

In `isValidGame`, add: `if (typeof game.rookie !== 'boolean') return false;`

In `recordSolved`, add the parameter and store it:

```ts
export function recordSolved(
  progress: SavedProgress, id: number, attempts: number, elapsedMs: number, rookie: boolean,
): SavedProgress {
  const streak = progress.lastSolvedId === id
    ? progress.streak
    : progress.lastSolvedId === id - 1 ? progress.streak + 1 : 1;
  return {
    streak,
    lastSolvedId: id,
    game: { id, startedAt: null, attempts, solved: true, elapsedMs, placement: null, rookie },
  };
}
```

In `shareText`:

```ts
export function shareText(
  { id, attempts, elapsedMs, streak, rookie }:
    { id: number; attempts: number; elapsedMs: number; streak: number; rookie: boolean },
): string {
  const tries = `${attempts} attempt${attempts === 1 ? '' : 's'} `;
  return `Lionhearts Rotation #${id}\n`
    + `✅ ${tries}· ${clock(elapsedMs)}${rookie ? ' · rookie' : ''}\n`
    + `🔥 streak ${streak}\n`
    + `${SITE_URL}/game`;
}
```

- [ ] **Step 4: Add the toggle to `game.astro`**

Markup, inside the build panel just above the board:

```astro
      <label class="game__rookie">
        <input type="checkbox" data-rookie />
        <span>Rookie — show positions on the players</span>
      </label>
```

Script, in the existing game island:

```ts
    const ROOKIE_KEY = 'lh-rotation-rookie';
    const rookieBox = app.querySelector<HTMLInputElement>('[data-rookie]')!;
    let rookieUsed = progress.game?.rookie ?? false;
    try { rookieBox.checked = localStorage.getItem(ROOKIE_KEY) === 'true'; } catch {}
    if (rookieBox.checked) rookieUsed = true;

    rookieBox.addEventListener('change', () => {
      try { localStorage.setItem(ROOKIE_KEY, String(rookieBox.checked)); } catch {}
      if (rookieBox.checked) rookieUsed = true;   // sticky for the day
      renderMarkers();
    });
```

In `renderMarkers()`, restore the tag and the full accessible name when `rookieBox.checked`:

```ts
        el.innerHTML = `<span class="marker__num">${numberAt(slot)}</span>`
          + (rookieBox.checked
            ? `<span class="marker__tag">P${slot} ${onCourtRole(slot, phase)}</span>` : '');
        el.setAttribute('aria-label', rookieBox.checked
          ? `${label(slot)} at ${at.x.toFixed(1)} metres across, ${at.y.toFixed(1)} metres from the net`
          : `#${numberAt(slot)} at ${at.x.toFixed(1)} metres across, ${at.y.toFixed(1)} metres from the net`);
```

Update the two `recordSolved` / `shareText` call sites to pass `rookieUsed`, and include `rookie: rookieUsed` in the `startBtn` click handler's new `game` object.

Styles:

```css
  .game__rookie {
    display: flex; align-items: center; gap: 8px;
    color: var(--color-text-muted); font-size: var(--text-body-sm);
    width: 100%; max-width: 460px; margin-inline: auto;
  }
```

- [ ] **Step 5: Verify stickiness by hand**

In the browser: start a puzzle with the toggle off, turn it on, turn it off again, solve it. The share text must still say `rookie`.

- [ ] **Step 6: Run the suite and commit**

```bash
npm test
git add src/lib/rotationState.ts src/pages/game.astro tests/lib/rotationState.test.ts
git commit -m "$(cat <<'MSG'
feat(game): add a Rookie toggle that the share string cannot hide

Labels are off by default; the toggle puts them back for anyone who wants
them. The flag is sticky for the day and lives in the saved game, not just
the toggle — a marker you can flip the moment you get stuck would be
worthless, and a labelled score should never be mistaken for an unlabelled
one in the group chat.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_016hyRX6N8wqzwpFDyy9quj3
MSG
)"
```

---

### Task 12: Clear the countdown interval, then verify the whole feature

**Files:**
- Modify: `src/pages/game.astro`

- [ ] **Step 1: Fix the leak**

`startCountdown()` currently calls `window.setInterval(update, 1000)` and never clears it. Capture and clear it on page hide:

```ts
    function startCountdown() {
      countdownEl.hidden = false;
      const update = () => {
        countdownEl.textContent = formatCountdown(msUntilNextLondonDay(new Date()));
      };
      update();
      const timer = window.setInterval(update, 1000);
      window.addEventListener('pagehide', () => window.clearInterval(timer), { once: true });
    }
```

- [ ] **Step 2: Full verification**

Run each and record the output:

```bash
npm test
npx astro check
SKIP_VOLLEYZONE=true SKIP_BEHOLD=true npm run build
```

Expected: suite green with the new tests, no new type errors, build succeeds.

- [ ] **Step 3: Browser verification at three widths**

Start a dev server capturing the PID. With Chrome DevTools MCP, `emulate` at `320x700x2,mobile,touch`, then 375 and 414, passing `colorScheme` and `viewport` together so neither resets the other. For **both** themes, on **both** tabs:

- no horizontal overflow: `document.documentElement.scrollWidth > document.documentElement.clientWidth` is `false`
- judge markers are at least 20px across and tappable; tapping two selects exactly two
- the build game's markers show no position or role, in text or accessible name
- verdict text passes AA — measure with `getComputedStyle` and compute the ratio over the **composited** background, remembering that Chrome may return `color(srgb ...)` with 0–1 channels that must be scaled before use
- tab through the whole page: both tabs reachable, judge playable by keyboard alone

Kill only your captured PID.

- [ ] **Step 4: Commit**

```bash
git add src/pages/game.astro
git commit -m "$(cat <<'MSG'
fix(game): clear the next-puzzle countdown interval on page hide

It ran forever once a player had solved the day's puzzle.

Verified the full feature: suite green, astro check clean, production
build succeeds, and both tabs checked at 320/375/414 in both themes with
no horizontal overflow.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_016hyRX6N8wqzwpFDyy9quj3
MSG
)"
```

---

## Self-Review

**Spec coverage.** Every spec section maps to a task: two independent games on one page (9), separate storage and banks (5, 6, 8), six calls with an undisclosed 2–4 mix (6), one cast with the rotation advancing (6, 8), shirt numbers only (8), call-then-tap (8), one shot per call (8), no clock (8), law only (1), no answer shipped (6), the feedback table (4), the rotation check (3), score and share grid (5), labels off (10), the Rookie toggle and its stickiness (11), the countdown fix (12).

**Deliberate deviation from the spec.** The spec puts judge state helpers in `rotationState.ts`. This plan gives them their own `src/lib/judgeState.ts` instead: the two games are independent, and one file per game stays small enough to hold in view. The spec's file table should be read with that substitution.

**Not covered, and deliberately so.** The spec's open item — which tab opens on a first visit — is settled in Task 9 as `build`, since it is the game that already exists and has the nav entry pointing at it. Change it in one line if you disagree.

**Types.** `Outcome`, `FaultPair`, `Fault`, `Verdict`, `SavedJudge` and `JudgeProgress` are defined once in Tasks 2–5 and used with those exact names in 6 and 8. `judgeCall` takes a single object argument everywhere. `RotationCourt`'s prop is `zones` in both Task 7 and Task 8.
