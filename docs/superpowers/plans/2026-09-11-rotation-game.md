# Rotation Game Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship `/game` — a daily serve-receive puzzle where the player drags six players onto a 9×9 half-court and is scored on attempts and elapsed time.

**Architecture:** All rules live in pure, unit-tested modules under `src/lib/` (`rotation.ts` for the rules and validator, `rotationState.ts` for the day index, streak and share string). `src/data/` holds the fixed 14-player squad and a pre-generated puzzle bank. The page is vanilla Astro with one client `<script>` doing DOM glue only — matching the repo, where `src/lib` is tested and pages are not.

**Tech Stack:** Astro 6, TypeScript strict, Vitest, no framework. One new devDependency: `tsx`, to run the bank generator.

**Spec:** `docs/superpowers/specs/2026-09-11-rotation-game-design.md`

## Global Constraints

- Tests live in `tests/**/*.test.ts` — vitest's `include` covers nothing else. Never co-locate tests in `src/`.
- `npm test` must stay green before any task is called done.
- No inline `style="..."` anywhere. Spacing/visual overrides go in a scoped `<style>` block as a BEM modifier class. The one accepted exception is positions applied by script at runtime (`el.style.left`), as `flagField` already does.
- Every ordering comparison in the rules is `>=` / `<=`, never strict. Level is legal (FIVB 7.4.3.1, 7.4.3.2).
- Semantic `--color-*` tokens only in components. Dark overrides use `light-dark(LIGHT, DARK)`, not a bare `html[data-theme="dark"]` selector.
- The court panel is a dark surface in both themes, so it carries a local `--color-accent-text: var(--lh-blue)`.
- Run dev and build with `SKIP_VOLLEYZONE=true SKIP_BEHOLD=true` — literal `true`, `1` does not work.
- Git from the project root. Never `git -C`. Never `pkill -f "astro dev"`.
- Commit messages: `type(scope): imperative subject`, scope `game`.
- Work happens on the existing branch `feat/rotation-game`.

---

### Task 1: Rules core — cycle, phase maths, libero substitution

**Files:**
- Create: `src/lib/rotation.ts`
- Test: `tests/lib/rotation.test.ts`

**Interfaces:**
- Consumes: nothing.
- Produces: `Slot`, `Role`, `Phase`, `Vec2`, `Placement`, `LINEUP_CYCLE`, `FRONT_ROW`, `BACK_ROW`, `DEPTH_PAIRS`, `isFrontRow(slot)`, `roleAt(slot, phase)`, `liberoSlot(phase)`, `onCourtRole(slot, phase)`, `setterSlot(phase)`, `middleSlot(phase)`, `oppositeSlot(phase)`, `passerSlots(phase)`.

- [ ] **Step 1: Write the failing test**

```ts
// tests/lib/rotation.test.ts
import { describe, it, expect } from 'vitest';
import {
  LINEUP_CYCLE, BACK_ROW, isFrontRow, roleAt, liberoSlot, onCourtRole,
  setterSlot, middleSlot, oppositeSlot, passerSlots, type Phase, type Slot,
} from '../../src/lib/rotation';

const PHASES: Phase[] = [0, 1, 2, 3, 4, 5];

describe('lineup cycle', () => {
  it('is the club 5-1 order', () => {
    expect(LINEUP_CYCLE).toEqual(['S', 'OH', 'MB', 'OPP', 'OH', 'MB']);
  });

  it('puts every diagonal pair three apart', () => {
    for (const [a, b] of [[0, 3], [1, 4], [2, 5]] as const) {
      const pair = [LINEUP_CYCLE[a], LINEUP_CYCLE[b]].sort().join('/');
      expect(['MB/MB', 'OH/OH', 'OPP/S']).toContain(pair);
    }
  });
});

describe('roleAt', () => {
  it('lays out rotation 1 as S OH MB OPP OH MB', () => {
    expect(([1, 2, 3, 4, 5, 6] as Slot[]).map(s => roleAt(s, 0)))
      .toEqual(['S', 'OH', 'MB', 'OPP', 'OH', 'MB']);
  });

  it('advances one step per rotation', () => {
    expect(([1, 2, 3, 4, 5, 6] as Slot[]).map(s => roleAt(s, 1)))
      .toEqual(['OH', 'MB', 'OPP', 'OH', 'MB', 'S']);
  });
});

describe('libero substitution', () => {
  it('always replaces a back-row middle', () => {
    for (const phase of PHASES) {
      const slot = liberoSlot(phase);
      expect(BACK_ROW).toContain(slot);
      expect(roleAt(slot, phase)).toBe('MB');
      expect(onCourtRole(slot, phase)).toBe('L');
    }
  });

  it('leaves exactly one middle on court, always front row', () => {
    for (const phase of PHASES) {
      const middles = ([1, 2, 3, 4, 5, 6] as Slot[]).filter(s => onCourtRole(s, phase) === 'MB');
      expect(middles).toHaveLength(1);
      expect(isFrontRow(middles[0])).toBe(true);
      expect(middleSlot(phase)).toBe(middles[0]);
    }
  });
});

describe('role slots', () => {
  it('keeps setter and opposite diagonal', () => {
    for (const phase of PHASES) {
      expect(Math.abs(setterSlot(phase) - oppositeSlot(phase))).toBe(3);
    }
  });

  it('has exactly three passers — the libero and both outsides', () => {
    for (const phase of PHASES) {
      const passers = passerSlots(phase);
      expect(passers).toHaveLength(3);
      expect(passers).toContain(liberoSlot(phase));
      expect(passers.map(s => onCourtRole(s, phase)).sort()).toEqual(['L', 'OH', 'OH']);
    }
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/lib/rotation.test.ts`
Expected: FAIL — "Failed to resolve import ... src/lib/rotation".

- [ ] **Step 3: Write minimal implementation**

```ts
// src/lib/rotation.ts
export type Slot = 1 | 2 | 3 | 4 | 5 | 6;
export type Role = 'S' | 'OPP' | 'OH' | 'MB' | 'L';
export type Phase = 0 | 1 | 2 | 3 | 4 | 5;

export interface Vec2 { x: number; y: number }
export type Placement = Record<Slot, Vec2>;

/** Court half, metres. x: 0 left sideline → 9 right. y: 0 net → 9 end line. */
export const COURT_M = 9;

/** The club's 5-1, read around the circle from position 1 in rotation 1. */
export const LINEUP_CYCLE = ['S', 'OH', 'MB', 'OPP', 'OH', 'MB'] as const;

export const FRONT_ROW: Slot[] = [4, 3, 2];
export const BACK_ROW: Slot[] = [5, 6, 1];
export const ALL_SLOTS: Slot[] = [1, 2, 3, 4, 5, 6];

/** [front, back] — the corresponding pairs of 7.4.2.1, NOT the diagonals. */
export const DEPTH_PAIRS: ReadonlyArray<readonly [Slot, Slot]> = [[4, 5], [3, 6], [2, 1]];

/** Left-to-right order within each row, per 7.4.2.2. */
export const LATERAL_ROWS: ReadonlyArray<ReadonlyArray<Slot>> = [[4, 3, 2], [5, 6, 1]];

export const isFrontRow = (slot: Slot): boolean => FRONT_ROW.includes(slot);

/** Role occupying a slot from the starting line-up, before libero substitution. */
export function roleAt(slot: Slot, phase: Phase): Role {
  return LINEUP_CYCLE[(slot - 1 + phase) % 6];
}

/** The back-row middle, who the libero always comes on for. */
export function liberoSlot(phase: Phase): Slot {
  const slot = BACK_ROW.find(s => roleAt(s, phase) === 'MB');
  if (!slot) throw new Error(`no back-row middle in phase ${phase}`);
  return slot;
}

/** Role actually standing in a slot, libero substitution applied. */
export function onCourtRole(slot: Slot, phase: Phase): Role {
  return slot === liberoSlot(phase) ? 'L' : roleAt(slot, phase);
}

const slotWhere = (phase: Phase, role: Role): Slot => {
  const slot = ALL_SLOTS.find(s => onCourtRole(s, phase) === role);
  if (!slot) throw new Error(`no ${role} on court in phase ${phase}`);
  return slot;
};

export const setterSlot = (phase: Phase): Slot => slotWhere(phase, 'S');
export const oppositeSlot = (phase: Phase): Slot => slotWhere(phase, 'OPP');
export const middleSlot = (phase: Phase): Slot => slotWhere(phase, 'MB');

/** The libero and both outsides — exactly three, every rotation. */
export function passerSlots(phase: Phase): Slot[] {
  return ALL_SLOTS.filter(s => {
    const role = onCourtRole(s, phase);
    return role === 'L' || role === 'OH';
  });
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/lib/rotation.test.ts`
Expected: PASS, 6 tests.

- [ ] **Step 5: Commit**

```bash
git add src/lib/rotation.ts tests/lib/rotation.test.ts
git commit -m "feat(game): add the rotation cycle and libero substitution

The 5-1 circle S -> OH -> MB -> OPP -> OH -> MB puts diagonal pairs three
apart, so the required diagonals fall out of the phase maths and never
need a separate check. Exactly one middle is back row in every rotation,
which is what forces the libero on and keeps six players on court."
```

---

### Task 2: Constraint derivation

**Files:**
- Modify: `src/lib/rotation.ts`
- Modify: `tests/lib/rotation.test.ts`

**Interfaces:**
- Consumes: Task 1's `Phase`, `Slot`, `Vec2`, `passerSlots`, `setterSlot`, `middleSlot`, `oppositeSlot`, `isFrontRow`, `DEPTH_PAIRS`, `LATERAL_ROWS`.
- Produces: `Constraint` union, `PASS_BAND`, `PASS_SPREAD`, `MIN_SEPARATION`, `MB_NET_MAX`, `OPP_NET_MAX`, `SETTER_TARGET`, `SETTER_RADIUS`, `constraintsFor(phase): Constraint[]`.

`SETTER_RADIUS` is seeded with placeholder-free provisional values here and replaced with generator-derived values in Task 4; Task 4's test is what pins them.

- [ ] **Step 1: Write the failing test**

```ts
// append to tests/lib/rotation.test.ts
import { constraintsFor, PASS_BAND, type Constraint } from '../../src/lib/rotation';

const kinds = (cs: Constraint[], kind: Constraint['kind']) => cs.filter(c => c.kind === kind);

describe('constraintsFor', () => {
  it('always carries the three depth and four lateral orderings', () => {
    for (const phase of PHASES) {
      const cs = constraintsFor(phase);
      expect(kinds(cs, 'depthOrder')).toHaveLength(3);
      expect(kinds(cs, 'lateralOrder')).toHaveLength(4);
      expect(kinds(cs, 'inCourt')).toHaveLength(1);
      expect(kinds(cs, 'separation')).toHaveLength(1);
    }
  });

  it('bands exactly the three passers', () => {
    for (const phase of PHASES) {
      const band = kinds(constraintsFor(phase), 'depthBand');
      expect(band).toHaveLength(1);
      const c = band[0] as Extract<Constraint, { kind: 'depthBand' }>;
      expect(c.slots.sort()).toEqual(passerSlots(phase).sort());
      expect([c.min, c.max]).toEqual([PASS_BAND.min, PASS_BAND.max]);
    }
  });

  it('holds the middle to the net in every rotation', () => {
    for (const phase of PHASES) {
      const net = kinds(constraintsFor(phase), 'nearNet');
      const middle = net.find(c => (c as { slot: Slot }).slot === middleSlot(phase));
      expect(middle).toBeDefined();
    }
  });

  it('only holds the opposite to the net when they are front row', () => {
    for (const phase of PHASES) {
      const net = kinds(constraintsFor(phase), 'nearNet');
      const opp = net.find(c => (c as { slot: Slot }).slot === oppositeSlot(phase));
      expect(Boolean(opp)).toBe(isFrontRow(oppositeSlot(phase)));
    }
  });

  it('pins the setter to their release point', () => {
    for (const phase of PHASES) {
      const near = kinds(constraintsFor(phase), 'nearPoint');
      expect(near).toHaveLength(1);
      expect((near[0] as { slot: Slot }).slot).toBe(setterSlot(phase));
    }
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/lib/rotation.test.ts`
Expected: FAIL — `constraintsFor` is not exported.

- [ ] **Step 3: Write minimal implementation**

```ts
// append to src/lib/rotation.ts

/** Team system values — our convention, not the rulebook. */
export const PASS_BAND = { min: 5, max: 7 } as const;
export const PASS_SPREAD = 2;
export const MB_NET_MAX = 1.5;
export const OPP_NET_MAX = 2;
export const SETTER_TARGET: Vec2 = { x: 6.5, y: 0.5 };

/** Physical sanity, not a rule. */
export const MIN_SEPARATION = 0.7;

/**
 * Per-rotation setter radius. Replaced by `npm run gen:rotations`, which
 * proves each value reachable with a committed witness formation.
 */
export const SETTER_RADIUS: Record<Phase, number> = {
  0: 5, 1: 2, 2: 3, 3: 3, 4: 2, 5: 2,
};

export type Constraint =
  | { kind: 'depthOrder'; front: Slot; back: Slot }
  | { kind: 'lateralOrder'; left: Slot; right: Slot }
  | { kind: 'inCourt' }
  | { kind: 'separation'; min: number }
  | { kind: 'depthBand'; slots: Slot[]; min: number; max: number }
  | { kind: 'spread'; slots: Slot[]; min: number }
  | { kind: 'nearNet'; slot: Slot; max: number }
  | { kind: 'nearPoint'; slot: Slot; point: Vec2; radius: number };

export function constraintsFor(phase: Phase): Constraint[] {
  const passers = passerSlots(phase);
  const opposite = oppositeSlot(phase);

  const cs: Constraint[] = [
    ...DEPTH_PAIRS.map(([front, back]): Constraint => ({ kind: 'depthOrder', front, back })),
    ...LATERAL_ROWS.flatMap((row): Constraint[] =>
      row.slice(0, -1).map((left, i) => ({ kind: 'lateralOrder', left, right: row[i + 1] }))),
    { kind: 'inCourt' },
    { kind: 'separation', min: MIN_SEPARATION },
    { kind: 'depthBand', slots: passers, min: PASS_BAND.min, max: PASS_BAND.max },
    { kind: 'spread', slots: passers, min: PASS_SPREAD },
    { kind: 'nearNet', slot: middleSlot(phase), max: MB_NET_MAX },
    { kind: 'nearPoint', slot: setterSlot(phase), point: SETTER_TARGET, radius: SETTER_RADIUS[phase] },
  ];

  if (isFrontRow(opposite)) cs.push({ kind: 'nearNet', slot: opposite, max: OPP_NET_MAX });
  return cs;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/lib/rotation.test.ts`
Expected: PASS, 11 tests.

- [ ] **Step 5: Commit**

```bash
git add src/lib/rotation.ts tests/lib/rotation.test.ts
git commit -m "feat(game): derive the constraint set from the rotation

Every value follows from phase, so a puzzle is only a cast and a rotation
and nothing per-puzzle needs storing. The opposite is held to the net only
when they are front row; the passers are always the libero and both
outsides."
```

---

### Task 3: The validator

**Files:**
- Modify: `src/lib/rotation.ts`
- Create: `tests/lib/rotation-validate.test.ts`

**Interfaces:**
- Consumes: Task 2's `Constraint`, `constraintsFor`, `Placement`.
- Produces: `Violation { kind, slots, message }`, `validate(placement, constraints, label?): Violation[]`, `LEGAL_R2` is *not* produced here (Task 4 owns witnesses).

`label` maps a slot to display text so the page can put shirt numbers in messages; it defaults to `P<slot>`.

- [ ] **Step 1: Write the failing test**

```ts
// tests/lib/rotation-validate.test.ts
import { describe, it, expect } from 'vitest';
import { validate, constraintsFor, type Placement } from '../../src/lib/rotation';

/** Hand-checked legal formation for rotation phase 1. */
const R2: Placement = {
  4: { x: 3.2, y: 5.6 },  // OH, passer
  3: { x: 4.8, y: 1.2 },  // OPP, front row
  2: { x: 7.6, y: 0.9 },  // MB, front row
  5: { x: 1.0, y: 7.0 },  // libero, passer
  6: { x: 6.5, y: 2.2 },  // setter
  1: { x: 7.0, y: 6.0 },  // OH, passer
};
const cs = constraintsFor(1);
const move = (p: Placement, slot: keyof Placement, d: Partial<{ x: number; y: number }>): Placement =>
  ({ ...p, [slot]: { ...p[slot], ...d } });
const kindsOf = (p: Placement) => validate(p, cs).map(v => v.kind);

describe('validate', () => {
  it('passes a legal formation', () => {
    expect(validate(R2, cs)).toEqual([]);
  });

  it('rejects a back-row player in front of their front-row partner', () => {
    // libero at P5 drifts in front of the outside at P4
    expect(kindsOf(move(R2, 5, { y: 5.2 }))).toContain('depthOrder');
  });

  it('accepts a back-row player exactly level — 7.4.3.1 allows it', () => {
    expect(kindsOf(move(R2, 5, { y: 5.6 }))).not.toContain('depthOrder');
  });

  it('rejects a row out of lateral order', () => {
    expect(kindsOf(move(R2, 4, { x: 5.5 }))).toContain('lateralOrder');
  });

  it('accepts two players exactly level laterally — 7.4.3.2 allows it', () => {
    expect(kindsOf(move(R2, 4, { x: 4.8 }))).not.toContain('lateralOrder');
  });

  it('rejects a player outside our half', () => {
    expect(kindsOf(move(R2, 1, { x: 9.4 }))).toContain('inCourt');
  });

  it('rejects two players standing on top of each other', () => {
    expect(kindsOf({ ...R2, 6: { x: 7.4, y: 1.1 } })).toContain('separation');
  });

  it('rejects a passer outside the 5-7m band', () => {
    expect(kindsOf(move(R2, 1, { y: 4.4 }))).toContain('depthBand');
  });

  it('rejects passers bunched closer than 2m', () => {
    expect(kindsOf(move(R2, 5, { x: 2.6, y: 6.2 }))).toContain('spread');
  });

  it('rejects a middle loitering off the net', () => {
    expect(kindsOf(move(R2, 2, { y: 2.4 }))).toContain('nearNet');
  });

  it('rejects a setter too far from their release point', () => {
    expect(kindsOf(move(R2, 6, { y: 4.4 }))).toContain('nearPoint');
  });

  it('names the implicated slots and reads in plain English', () => {
    const [v] = validate(move(R2, 5, { y: 5.2 }), cs);
    expect(v.slots).toEqual([4, 5]);
    expect(v.message).toMatch(/level with/i);
  });

  it('uses caller labels in messages when given', () => {
    const [v] = validate(move(R2, 5, { y: 5.2 }), cs, s => `#${{ 4: 12, 5: 10 }[s] ?? s}`);
    expect(v.message).toContain('#10');
    expect(v.message).toContain('#12');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/lib/rotation-validate.test.ts`
Expected: FAIL — `validate` is not exported.

- [ ] **Step 3: Write minimal implementation**

```ts
// append to src/lib/rotation.ts
export interface Violation {
  kind: Constraint['kind'];
  slots: Slot[];
  message: string;
}

export type SlotLabel = (slot: Slot) => string;
const defaultLabel: SlotLabel = slot => `P${slot}`;

const dist = (a: Vec2, b: Vec2) => Math.hypot(a.x - b.x, a.y - b.y);
const m = (v: number) => `${v.toFixed(1)}m`;

/**
 * Every ordering is `>=` / `<=`: FIVB 7.4.3.1 and 7.4.3.2 both permit a player
 * to be "level with" the player they are judged against.
 */
export function validate(p: Placement, constraints: Constraint[], label: SlotLabel = defaultLabel): Violation[] {
  const out: Violation[] = [];

  for (const c of constraints) {
    switch (c.kind) {
      case 'depthOrder': {
        if (p[c.back].y >= p[c.front].y) break;
        out.push({
          kind: c.kind, slots: [c.front, c.back],
          message: `${label(c.back)} is ${m(p[c.front].y - p[c.back].y)} in front of ${label(c.front)}. `
            + 'A back-row player must be level with or further from the net than their front-row partner.',
        });
        break;
      }
      case 'lateralOrder': {
        if (p[c.left].x <= p[c.right].x) break;
        out.push({
          kind: c.kind, slots: [c.left, c.right],
          message: `${label(c.left)} has crossed to the right of ${label(c.right)}. `
            + 'Each row must stay in left-to-right order.',
        });
        break;
      }
      case 'inCourt': {
        const out_ = ALL_SLOTS.filter(s => {
          const { x, y } = p[s];
          return x < 0 || x > COURT_M || y < 0 || y > COURT_M;
        });
        if (!out_.length) break;
        out.push({
          kind: c.kind, slots: out_,
          message: `${out_.map(label).join(', ')} must be inside our own half at the service hit.`,
        });
        break;
      }
      case 'separation': {
        for (let i = 0; i < ALL_SLOTS.length; i++) {
          for (let j = i + 1; j < ALL_SLOTS.length; j++) {
            const [a, b] = [ALL_SLOTS[i], ALL_SLOTS[j]];
            if (dist(p[a], p[b]) >= c.min) continue;
            out.push({
              kind: c.kind, slots: [a, b],
              message: `${label(a)} and ${label(b)} are standing on top of each other.`,
            });
          }
        }
        break;
      }
      case 'depthBand': {
        for (const s of c.slots) {
          const { y } = p[s];
          if (y >= c.min && y <= c.max) continue;
          out.push({
            kind: c.kind, slots: [s],
            message: `${label(s)} is passing from ${m(y)}. Our three passers receive between `
              + `${m(c.min)} and ${m(c.max)} from the net.`,
          });
        }
        break;
      }
      case 'spread': {
        for (let i = 0; i < c.slots.length; i++) {
          for (let j = i + 1; j < c.slots.length; j++) {
            const [a, b] = [c.slots[i], c.slots[j]];
            if (dist(p[a], p[b]) >= c.min) continue;
            out.push({
              kind: c.kind, slots: [a, b],
              message: `${label(a)} and ${label(b)} are only ${m(dist(p[a], p[b]))} apart. `
                + `Passers stay at least ${m(c.min)} from each other so they do not chase the same ball.`,
            });
          }
        }
        break;
      }
      case 'nearNet': {
        if (p[c.slot].y <= c.max) break;
        out.push({
          kind: c.kind, slots: [c.slot],
          message: `${label(c.slot)} is ${m(p[c.slot].y)} off the net and cannot attack from there. `
            + `Stay within ${m(c.max)}.`,
        });
        break;
      }
      case 'nearPoint': {
        const d = dist(p[c.slot], c.point);
        if (d <= c.radius) break;
        out.push({
          kind: c.kind, slots: [c.slot],
          message: `${label(c.slot)} is ${m(d)} from the release point and will not make it to set. `
            + `Get within ${m(c.radius)}.`,
        });
        break;
      }
    }
  }
  return out;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/lib/rotation-validate.test.ts`
Expected: PASS, 13 tests.

- [ ] **Step 5: Commit**

```bash
git add src/lib/rotation.ts tests/lib/rotation-validate.test.ts
git commit -m "feat(game): validate a placement against the rotation's constraints

Every ordering comparison is >=/<=, since FIVB 7.4.3.1 and 7.4.3.2 both
permit a player to be level with the player they are judged against.
Violations carry the implicated slots so the reveal can draw an arrow
between them, and take a caller-supplied label so messages name shirt
numbers rather than slots."
```

---

### Task 4: Witnesses and the setter radii

**Files:**
- Create: `scripts/generate-rotations.ts`
- Create: `tests/fixtures/rotation-witnesses.ts`
- Modify: `src/lib/rotation.ts` (the `SETTER_RADIUS` table)
- Modify: `package.json` (devDependency `tsx`, script `gen:rotations`)
- Create: `tests/lib/rotation-feasible.test.ts`

**Interfaces:**
- Consumes: Task 3's `validate`, Task 2's `constraintsFor`.
- Produces: `WITNESSES: Record<Phase, Placement>` from `tests/fixtures/rotation-witnesses.ts`, and a `SETTER_RADIUS` table proven reachable.

Witnesses live under `tests/` rather than `src/lib/__fixtures__/` so a solved formation can never reach the client — this tightens the spec's promise and is the one place the plan departs from it.

- [ ] **Step 1: Write the failing test**

```ts
// tests/lib/rotation-feasible.test.ts
import { describe, it, expect } from 'vitest';
import { validate, constraintsFor, SETTER_RADIUS, SETTER_TARGET, type Phase } from '../../src/lib/rotation';
import { WITNESSES } from '../fixtures/rotation-witnesses';

const PHASES: Phase[] = [0, 1, 2, 3, 4, 5];

describe('every rotation is solvable', () => {
  it.each(PHASES)('rotation %i has a legal formation', phase => {
    expect(validate(WITNESSES[phase], constraintsFor(phase))).toEqual([]);
  });

  it.each(PHASES)('rotation %i has a setter radius that is not vacuous', phase => {
    // A radius wide enough to cover the whole court would not constrain anything.
    expect(SETTER_RADIUS[phase]).toBeLessThan(Math.hypot(9, 9));
    expect(SETTER_RADIUS[phase]).toBeGreaterThan(0);
  });

  it.each(PHASES)('rotation %i keeps its witness setter inside the radius', phase => {
    const setter = Object.entries(WITNESSES[phase])
      .map(([slot, v]) => ({ slot: Number(slot), v }))
      .find(({ slot }) => constraintsFor(phase).some(
        c => c.kind === 'nearPoint' && c.slot === slot));
    expect(setter).toBeDefined();
    const d = Math.hypot(setter!.v.x - SETTER_TARGET.x, setter!.v.y - SETTER_TARGET.y);
    expect(d).toBeLessThanOrEqual(SETTER_RADIUS[phase]);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/lib/rotation-feasible.test.ts`
Expected: FAIL — cannot resolve `../fixtures/rotation-witnesses`.

- [ ] **Step 3: Write the generator**

```bash
npm install -D tsx
```

Add to `package.json` scripts: `"gen:rotations": "tsx scripts/generate-rotations.ts"`.

```ts
// scripts/generate-rotations.ts
import { writeFileSync } from 'node:fs';
import {
  ALL_SLOTS, COURT_M, LATERAL_ROWS, MB_NET_MAX, OPP_NET_MAX, PASS_BAND,
  SETTER_TARGET, constraintsFor, isFrontRow, middleSlot, oppositeSlot,
  passerSlots, setterSlot, validate,
  type Phase, type Placement, type Slot, type Vec2,
} from '../src/lib/rotation.ts';
import { SQUAD } from '../src/data/squad.ts';

const PHASES: Phase[] = [0, 1, 2, 3, 4, 5];
const ATTEMPTS = 400_000;
const rand = (lo: number, hi: number) => lo + Math.random() * (hi - lo);

/** Sample a slot's y from the region its own constraints allow, so hits are common. */
function sampleY(slot: Slot, phase: Phase): number {
  if (passerSlots(phase).includes(slot)) return rand(PASS_BAND.min, PASS_BAND.max);
  if (slot === middleSlot(phase)) return rand(0.2, MB_NET_MAX);
  if (slot === oppositeSlot(phase) && isFrontRow(slot)) return rand(0.2, OPP_NET_MAX);
  return rand(0.2, COURT_M - 0.2);
}

/** Sort each row's x values into the required left-to-right order, so lateral never fails. */
function repairLateral(p: Placement): Placement {
  const out = { ...p };
  for (const row of LATERAL_ROWS) {
    const xs = row.map(s => out[s].x).sort((a, b) => a - b);
    row.forEach((s, i) => { out[s] = { ...out[s], x: xs[i] }; });
  }
  return out;
}

function candidate(phase: Phase): Placement {
  const p = Object.fromEntries(
    ALL_SLOTS.map(s => [s, { x: rand(0.3, COURT_M - 0.3), y: sampleY(s, phase) }]),
  ) as Placement;
  return repairLateral(p);
}

const toTarget = (v: Vec2) => Math.hypot(v.x - SETTER_TARGET.x, v.y - SETTER_TARGET.y);

/** Widest radius that still admits a solution, found by sampling; slack keeps it humane. */
function solve(phase: Phase): { witness: Placement; radius: number } {
  const setter = setterSlot(phase);
  // Constraints minus the setter radius — we are measuring what the setter can reach.
  const base = constraintsFor(phase).filter(c => c.kind !== 'nearPoint');
  let best: Placement | null = null;
  let bestD = Infinity;

  for (let i = 0; i < ATTEMPTS; i++) {
    const p = candidate(phase);
    if (validate(p, base).length) continue;
    const d = toTarget(p[setter]);
    if (d < bestD) { bestD = d; best = p; }
  }
  if (!best) throw new Error(`no legal formation found for rotation ${phase}`);
  return { witness: best, radius: Math.ceil((bestD + 0.4) * 2) / 2 };
}

const results = PHASES.map(phase => ({ phase, ...solve(phase) }));

const fmt = (p: Placement) => `{ ${ALL_SLOTS.map(s =>
  `${s}: { x: ${p[s].x.toFixed(2)}, y: ${p[s].y.toFixed(2)} }`).join(', ')} }`;

writeFileSync('tests/fixtures/rotation-witnesses.ts',
  `// Generated by \`npm run gen:rotations\`. One legal formation per rotation,\n`
  + `// proving the constraint set in src/lib/rotation.ts is satisfiable.\n`
  + `// Test-only: never import from src/, or players get a ready-made answer.\n`
  + `import type { Phase, Placement } from '../../src/lib/rotation';\n\n`
  + `export const WITNESSES: Record<Phase, Placement> = {\n`
  + results.map(r => `  ${r.phase}: ${fmt(r.witness)},`).join('\n')
  + `\n};\n`);

console.log('SETTER_RADIUS:', Object.fromEntries(results.map(r => [r.phase, r.radius])));
console.log(`squad of ${SQUAD.length} loaded`);
```

- [ ] **Step 4: Run the generator and paste its radii into the library**

Run: `npm run gen:rotations`
Expected: writes `tests/fixtures/rotation-witnesses.ts` and prints a `SETTER_RADIUS` object.
Replace the provisional `SETTER_RADIUS` table in `src/lib/rotation.ts` with the printed values verbatim.

Note: Task 5 creates `src/data/squad.ts`. If running this task first, create that file from Task 5 Step 3 before running the generator.

- [ ] **Step 5: Run tests to verify they pass**

Run: `npx vitest run`
Expected: PASS. If any rotation reports no legal formation, the constraint set is over-tight for that rotation — widen `PASS_BAND` or `OPP_NET_MAX` in the library rather than special-casing the rotation, and re-run.

- [ ] **Step 6: Commit**

```bash
git add scripts/generate-rotations.ts tests/fixtures/rotation-witnesses.ts \
        tests/lib/rotation-feasible.test.ts src/lib/rotation.ts package.json package-lock.json
git commit -m "feat(game): prove every rotation solvable and pin the setter radii

Because the constraint set depends only on phase, solvability is a
property of the six rotations rather than of each puzzle, so it is proven
six times by committed witness formations. The generator measures how
close the setter can legally get in each rotation and the radius follows
from that plus slack.

Witnesses live under tests/ rather than src/ so a solved formation can
never be bundled into the page."
```

---

### Task 5: Squad and puzzle bank

**Files:**
- Create: `src/data/squad.ts`
- Create: `src/data/rotations.ts` (generated)
- Modify: `scripts/generate-rotations.ts`
- Create: `tests/lib/rotation-bank.test.ts`

**Interfaces:**
- Consumes: Task 1's `Role`, `Phase`, `LINEUP_CYCLE`, `roleAt`.
- Produces: `SQUAD: SquadMember[]`, `ROTATIONS: RotationPuzzle[]`, `RotationPuzzle { id, start, libero, phase }`.

- [ ] **Step 1: Write the failing test**

```ts
// tests/lib/rotation-bank.test.ts
import { describe, it, expect } from 'vitest';
import { SQUAD } from '../../src/data/squad';
import { ROTATIONS } from '../../src/data/rotations';
import { LINEUP_CYCLE, roleAt, type Slot } from '../../src/lib/rotation';

const roleOf = (n: number) => SQUAD.find(m => m.number === n)?.role;

describe('squad', () => {
  it('is fourteen players with unique numbers', () => {
    expect(SQUAD).toHaveLength(14);
    expect(new Set(SQUAD.map(m => m.number)).size).toBe(14);
  });

  it('carries a full 5-1 bench', () => {
    const count = (r: string) => SQUAD.filter(m => m.role === r).length;
    expect([count('S'), count('OPP'), count('OH'), count('MB'), count('L')]).toEqual([2, 2, 4, 4, 2]);
  });
});

describe('puzzle bank', () => {
  it('covers at least two years', () => {
    expect(ROTATIONS.length).toBeGreaterThanOrEqual(730);
  });

  it('numbers puzzles consecutively from zero', () => {
    ROTATIONS.forEach((p, i) => expect(p.id).toBe(i));
  });

  it('casts every slot with a squad member of the right role', () => {
    for (const p of ROTATIONS) {
      expect(p.start).toHaveLength(6);
      ([1, 2, 3, 4, 5, 6] as Slot[]).forEach(slot => {
        expect(roleOf(p.start[slot - 1])).toBe(roleAt(slot, 0));
      });
      expect(roleOf(p.libero)).toBe('L');
      expect(new Set(p.start).size).toBe(6);
    }
  });

  it('shuffles rotations so each block of six covers all of them', () => {
    for (let i = 0; i + 6 <= ROTATIONS.length; i += 6) {
      const block = ROTATIONS.slice(i, i + 6).map(p => p.phase).sort();
      expect(block).toEqual([0, 1, 2, 3, 4, 5]);
    }
  });

  it('never repeats a rotation back to back', () => {
    for (let i = 1; i < ROTATIONS.length; i++) {
      expect(ROTATIONS[i].phase).not.toBe(ROTATIONS[i - 1].phase);
    }
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/lib/rotation-bank.test.ts`
Expected: FAIL — cannot resolve `src/data/squad`.

- [ ] **Step 3: Write the squad**

```ts
// src/data/squad.ts
import type { Role } from '../lib/rotation';

export interface SquadMember {
  number: number;
  role: Role;
}

/**
 * A fixed fictional squad, the same in every puzzle, so regulars come to know
 * it the way they know a real team sheet. Two of each specialist, four
 * outsides and four middles — a normal 5-1 bench.
 */
export const SQUAD: SquadMember[] = [
  { number: 1,  role: 'S'   }, { number: 11, role: 'S'   },
  { number: 5,  role: 'OPP' }, { number: 15, role: 'OPP' },
  { number: 3,  role: 'OH'  }, { number: 7,  role: 'OH'  },
  { number: 12, role: 'OH'  }, { number: 17, role: 'OH'  },
  { number: 4,  role: 'MB'  }, { number: 9,  role: 'MB'  },
  { number: 14, role: 'MB'  }, { number: 20, role: 'MB'  },
  { number: 10, role: 'L'   }, { number: 18, role: 'L'   },
];
```

- [ ] **Step 4: Extend the generator to emit the bank**

Append to `scripts/generate-rotations.ts`:

```ts
const DAYS = 760;
const pick = <T,>(xs: T[]): T => xs[Math.floor(Math.random() * xs.length)];
const byRole = (r: string) => SQUAD.filter(m => m.role === r).map(m => m.number);

/** Successive permutations of 0-5: every rotation once per block, never twice running. */
function phaseOrder(days: number): Phase[] {
  const out: Phase[] = [];
  while (out.length < days) {
    const block = [...PHASES];
    for (let i = block.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [block[i], block[j]] = [block[j], block[i]];
    }
    if (out.length && block[0] === out[out.length - 1]) continue;
    out.push(...block);
  }
  return out.slice(0, days);
}

function cast(): { start: number[]; libero: number } {
  const oh = [...byRole('OH')].sort(() => Math.random() - 0.5).slice(0, 2);
  const mb = [...byRole('MB')].sort(() => Math.random() - 0.5).slice(0, 2);
  const pool: Record<string, number[]> = { S: [pick(byRole('S'))], OPP: [pick(byRole('OPP'))], OH: oh, MB: mb };
  const start = LINEUP_CYCLE.map(role => pool[role].shift()!);
  return { start, libero: pick(byRole('L')) };
}

const bank = phaseOrder(DAYS).map((phase, id) => ({ id, phase, ...cast() }));

writeFileSync('src/data/rotations.ts',
  `// Generated by \`npm run gen:rotations\`. Committed so a later code change can\n`
  + `// never rewrite which puzzle appeared on a day people already played.\n`
  + `import type { Phase } from '../lib/rotation';\n\n`
  + `export interface RotationPuzzle {\n  id: number;\n  /** P1..P6 shirt numbers of the R1 line-up. */\n`
  + `  start: number[];\n  libero: number;\n  phase: Phase;\n}\n\n`
  + `export const ROTATIONS: RotationPuzzle[] = [\n`
  + bank.map(p => `  { id: ${p.id}, start: [${p.start.join(', ')}], libero: ${p.libero}, phase: ${p.phase} },`).join('\n')
  + `\n];\n`);
```

Also add `LINEUP_CYCLE` to the script's import list from `../src/lib/rotation.ts`.

- [ ] **Step 5: Run the generator, then the tests**

Run: `npm run gen:rotations && npx vitest run`
Expected: PASS, bank tests included.

- [ ] **Step 6: Commit**

```bash
git add src/data/squad.ts src/data/rotations.ts scripts/generate-rotations.ts tests/lib/rotation-bank.test.ts
git commit -m "feat(game): add the squad and generate the puzzle bank

Rotations are emitted as successive permutations of 0-5, so every block
of six days covers all six with no back-to-back repeat and the next one
is unpredictable. The cast is redrawn daily from the fourteen, keeping the
up-front deduction fresh even though the geometry is one of six."
```

---

### Task 6: Day index, streak and share string

**Files:**
- Create: `src/lib/rotationState.ts`
- Create: `tests/lib/rotationState.test.ts`

**Interfaces:**
- Consumes: nothing from earlier tasks except `Vec2`.
- Produces: `EPOCH_DAY`, `londonDayNumber(now)`, `puzzleIndexFor(now, bankLength)`, `SavedProgress`, `SavedGame`, `loadProgress(raw)`, `forToday(progress, id)`, `recordSolved(progress, id, attempts, elapsedMs)`, `shareText({id, attempts, elapsedMs, streak})`.

- [ ] **Step 1: Write the failing test**

```ts
// tests/lib/rotationState.test.ts
import { describe, it, expect } from 'vitest';
import {
  londonDayNumber, puzzleIndexFor, loadProgress, forToday, recordSolved, shareText,
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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/lib/rotationState.test.ts`
Expected: FAIL — cannot resolve `src/lib/rotationState`.

- [ ] **Step 3: Write minimal implementation**

```ts
// src/lib/rotationState.ts
import type { Vec2 } from './rotation';
import { SITE_URL } from '../data/club';

/** Day zero of the game, as a London day number. */
export const EPOCH_DAY = 20_711; // 2026-09-14

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
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/lib/rotationState.test.ts`
Expected: PASS, 12 tests. If `EPOCH_DAY` makes `puzzleIndexFor` start somewhere unintended, set it to `londonDayNumber(new Date('2026-09-14T12:00:00Z'))` and hard-code the printed number.

- [ ] **Step 5: Commit**

```bash
git add src/lib/rotationState.ts tests/lib/rotationState.test.ts
git commit -m "feat(game): add the day index, streak and share string

The puzzle turns over at London midnight rather than UTC, which in BST
are 90 minutes apart. An unfinished puzzle is discarded at rollover and
never extends the streak; re-solving the same puzzle does not
double-count it."
```

---

### Task 7: Page shell, nav entry and the brief

**Files:**
- Create: `src/pages/game.astro`
- Create: `src/components/RotationBrief.astro`
- Modify: `src/components/Nav.astro:4-11`

**Interfaces:**
- Consumes: `SQUAD`, `ROTATIONS`, `puzzleIndexFor`, `roleAt`, `LINEUP_CYCLE`.
- Produces: the `#rotation-app` root element and `data-puzzle` JSON payload the client script in Tasks 9-11 reads.

The page is static, so it cannot know the visitor's date at build time. It ships the **whole bank** as JSON and the client picks today's puzzle — the same approach the spec assumes.

- [ ] **Step 1: Add the nav entry**

In `src/components/Nav.astro`, add to `navLinks` after Teams:

```ts
  { label: 'Game',      href: '/game' },
```

- [ ] **Step 2: Write the brief component**

```astro
---
// src/components/RotationBrief.astro
import { SQUAD } from '../data/squad';
import { LINEUP_CYCLE, type Slot } from '../lib/rotation';

const slots: Slot[] = [1, 2, 3, 4, 5, 6];
const byRole = (role: string) => SQUAD.filter(m => m.role === role);
const roleOrder = ['S', 'OPP', 'OH', 'MB', 'L'] as const;
const roleName: Record<string, string> = {
  S: 'Setters', OPP: 'Opposites', OH: 'Outsides', MB: 'Middles', L: 'Liberos',
};
---

<section class="brief" aria-labelledby="brief-heading">
  <h2 id="brief-heading" class="eyebrow brief__eyebrow">The team sheet</h2>

  <div class="brief__grid">
    <div class="brief__block">
      <h3 class="brief__label">Squad</h3>
      <dl class="squad">
        {roleOrder.map(role => (
          <div class="squad__row">
            <dt>{roleName[role]}</dt>
            <dd>{byRole(role).map(m => `#${m.number}`).join('  ')}</dd>
          </div>
        ))}
      </dl>
    </div>

    <div class="brief__block">
      <h3 class="brief__label">Starting line-up</h3>
      <ol class="lineup" data-lineup>
        {slots.map(slot => (
          <li class="lineup__item">
            <span class="lineup__slot">P{slot}</span>
            <span class="lineup__num" data-lineup-slot={slot}>–</span>
            <span class="lineup__role">{LINEUP_CYCLE[slot - 1]}</span>
          </li>
        ))}
      </ol>
    </div>

    <div class="brief__block">
      <h3 class="brief__label">This serve</h3>
      <p class="brief__now">
        Libero <strong data-brief-libero>–</strong>.
        <strong data-brief-at-one>–</strong> is now in position 1.
      </p>
      <p class="brief__now brief__now--muted">
        We are receiving. Rotate the line-up yourself, work out which middle is
        back row, and stand the libero in their slot.
      </p>
    </div>
  </div>
</section>

<style>
  .brief { display: grid; gap: 16px; }
  .brief__eyebrow { color: var(--color-accent-text); }
  .brief__grid { display: grid; gap: 18px; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); }
  .brief__block { display: grid; gap: 8px; align-content: start; }
  .brief__label {
    font-size: var(--text-body-sm); font-weight: var(--weight-black);
    text-transform: uppercase; letter-spacing: var(--tracking-wide);
    color: var(--color-text-muted); margin: 0;
  }
  .squad { margin: 0; display: grid; gap: 4px; }
  .squad__row { display: grid; grid-template-columns: 5.5rem 1fr; gap: 8px; }
  .squad dt { color: var(--color-text-muted); font-size: var(--text-body-sm); }
  .squad dd { margin: 0; font-variant-numeric: tabular-nums; letter-spacing: 0.02em; }
  .lineup { list-style: none; margin: 0; padding: 0; display: grid; gap: 4px; }
  .lineup__item { display: grid; grid-template-columns: 2.2rem 3rem 1fr; gap: 8px; align-items: baseline; }
  .lineup__slot { color: var(--color-text-muted); font-size: var(--text-body-sm); }
  .lineup__num { font-weight: var(--weight-black); font-variant-numeric: tabular-nums; }
  .lineup__role { color: var(--color-text-muted); font-size: var(--text-body-sm); }
  .brief__now { margin: 0; }
  .brief__now--muted { color: var(--color-text-muted); font-size: var(--text-body-sm); }
</style>
```

- [ ] **Step 3: Write the page**

```astro
---
// src/pages/game.astro
import BaseLayout from '../layouts/BaseLayout.astro';
import RotationBrief from '../components/RotationBrief.astro';
import { ROTATIONS } from '../data/rotations';
import { SQUAD } from '../data/squad';
---

<BaseLayout
  title="Rotation — the daily volleyball puzzle"
  description="One serve receive a day. Place the six, keep the rotation legal, and post your score to the group chat."
>
  <section class="page-hero">
    <div class="container">
      <h2 class="eyebrow">Daily puzzle</h2>
      <h1 class="page-hero__title">Rotation</h1>
      <p class="page-hero__sub">
        One serve receive a day, the same for everyone. Place the six, keep the
        rotation legal, and see how few attempts it takes.
      </p>
    </div>
  </section>

  <div class="container game">
    <RotationBrief />

    <div
      id="rotation-app"
      class="game__app"
      data-bank={JSON.stringify(ROTATIONS)}
      data-squad={JSON.stringify(SQUAD)}
    >
      <button type="button" class="btn btn--accent game__start" data-start>Start today's puzzle</button>
      <p class="game__hint" data-start-hint>The clock starts when you press it.</p>
    </div>
  </div>
</BaseLayout>

<style>
  .game { display: grid; gap: 28px; padding-block: 32px 64px; }
  .game__app { display: grid; gap: 12px; justify-items: center; }
  .game__hint { color: var(--color-text-muted); font-size: var(--text-body-sm); margin: 0; }
</style>
```

- [ ] **Step 4: Note the OG image**

The spec asks for the page to have its own OG image. No asset exists yet — the
site-wide `public/og-image.jpg` is itself still a placeholder (see `human-todo.md`
item 4), so `/game` inherits it rather than pointing at a file that is not there.
Add a line to `human-todo.md` under the OG image item:

```markdown
- A second 1200×630 image for `/game` would help the daily puzzle share well in
  the group chat: court diagram + "Rotation" + the club crest. Once it exists,
  save it to `public/og-game.jpg` and pass `ogImage="/og-game.jpg"` on the
  BaseLayout in `src/pages/game.astro`.
```

- [ ] **Step 5: Verify the page renders**

Run: `curl -s -o /dev/null -w '%{http_code}' http://localhost:4321` — if that answers, reuse the running server. Otherwise:

```bash
SKIP_VOLLEYZONE=true SKIP_BEHOLD=true npm run dev > /tmp/lh-dev.log 2>&1 &
MY_DEV_PID=$!
grep -m1 'localhost:' /tmp/lh-dev.log
```

Load `/game`. Expected: hero, team sheet with the squad listed by role, a line-up list showing `–` placeholders, and a Start button. Nav shows Game.

Kill only your own server with `kill "$MY_DEV_PID"` when done — never `pkill -f "astro dev"`.

- [ ] **Step 6: Commit**

```bash
git add src/pages/game.astro src/components/RotationBrief.astro src/components/Nav.astro human-todo.md
git commit -m "feat(game): add the /game shell, nav entry and team sheet

The site is static, so the page ships the whole bank and the client picks
today's puzzle by London date. The line-up renders with placeholders that
the client fills once the player presses Start — the clock has to begin
before the rotation work, not after it."
```

---

### Task 8: The court

**Files:**
- Create: `src/components/RotationCourt.astro`
- Modify: `src/pages/game.astro`

**Interfaces:**
- Consumes: `PASS_BAND`, `MB_NET_MAX`, `OPP_NET_MAX`, `SETTER_TARGET`, `SETTER_RADIUS`, `COURT_M`.
- Produces: `.court` element with `data-court`, zone elements, and an empty `[data-markers]` layer plus `[data-arrows]` SVG that Tasks 9-10 populate.

Visual direction A — tactics board — from `https://claude.ai/code/artifact/283876b8-b5bc-4f32-a571-8a8ea15fde25`.

- [ ] **Step 1: Write the component**

```astro
---
// src/components/RotationCourt.astro
import { COURT_M, PASS_BAND, MB_NET_MAX, OPP_NET_MAX, SETTER_TARGET } from '../lib/rotation';

const pct = (metres: number) => `${(metres / COURT_M) * 100}%`;
---

<div class="court" data-court role="application" aria-label="Our half of the court">
  <div class="court__net" aria-hidden="true"></div>
  <span class="court__tag court__tag--net" aria-hidden="true">Net</span>

  <div class="court__attack" aria-hidden="true"></div>
  <span class="court__tag court__tag--attack" aria-hidden="true">3m</span>

  <div class="court__netlimit court__netlimit--mb" aria-hidden="true"></div>
  <div class="court__netlimit court__netlimit--opp" aria-hidden="true"></div>

  <div class="court__target" aria-hidden="true"><span class="court__target-dot"></span></div>

  <div class="court__band" aria-hidden="true">
    <span class="court__band-cap">Pass {PASS_BAND.min}–{PASS_BAND.max}m</span>
  </div>

  <svg class="court__arrows" data-arrows viewBox={`0 0 ${COURT_M} ${COURT_M}`} aria-hidden="true">
    <defs>
      <marker id="rot-arrow" viewBox="0 0 6 6" refX="5" refY="3" markerWidth="5" markerHeight="5" orient="auto">
        <path d="M0,0 L6,3 L0,6 z" fill="var(--lh-red)"></path>
      </marker>
    </defs>
  </svg>

  <div class="court__markers" data-markers></div>
</div>

<style define:vars={{
  bandTop: pct(PASS_BAND.min),
  bandHeight: pct(PASS_BAND.max - PASS_BAND.min),
  mbLimit: pct(MB_NET_MAX),
  oppLimit: pct(OPP_NET_MAX),
  targetX: pct(SETTER_TARGET.x),
  targetY: pct(SETTER_TARGET.y),
}}>
  /* Dark in both themes, like .section--feature, so accent text re-asserts light blue. */
  .court {
    --color-accent-text: var(--lh-blue);
    --court-line: rgba(143, 197, 247, 0.45);
    --court-ink: var(--lh-blue-100);
    position: relative;
    aspect-ratio: 1;
    width: 100%;
    max-width: 460px;
    margin-inline: auto;
    background: var(--lh-navy-deep);
    border: 1.5px solid var(--court-line);
    border-radius: 4px;
    box-shadow: inset 0 0 60px rgba(0, 0, 0, 0.45);
    overflow: hidden;
    touch-action: none;
  }
  .court__net { position: absolute; inset: 0 0 auto 0; height: 5px; background: var(--court-ink); opacity: 0.9; }
  .court__attack { position: absolute; left: 0; right: 0; top: 33.33%; border-top: 1.5px solid var(--court-line); }
  .court__tag {
    position: absolute; font-size: 10px; font-weight: var(--weight-black);
    letter-spacing: var(--tracking-wide); text-transform: uppercase;
    color: var(--court-ink); opacity: 0.55;
  }
  .court__tag--net { top: 8px; left: 8px; }
  .court__tag--attack { top: 33.33%; right: 8px; transform: translateY(3px); }
  .court__netlimit {
    position: absolute; left: 0; right: 0;
    border-top: 1px dotted color-mix(in srgb, var(--lh-blue) 60%, transparent);
  }
  .court__netlimit--mb { top: var(--mbLimit); }
  .court__netlimit--opp { top: var(--oppLimit); }
  .court__band {
    position: absolute; left: 0; right: 0; top: var(--bandTop); height: var(--bandHeight);
    background: color-mix(in srgb, var(--lh-blue) 22%, transparent);
    border-block: 1px dashed color-mix(in srgb, var(--lh-blue) 70%, transparent);
  }
  .court__band-cap {
    position: absolute; right: 6px; top: 3px; font-size: 10px;
    font-weight: var(--weight-black); letter-spacing: var(--tracking-wide);
    text-transform: uppercase; color: var(--court-ink); opacity: 0.7;
  }
  .court__target {
    position: absolute; left: var(--targetX); top: var(--targetY);
    width: 30%; aspect-ratio: 1; transform: translate(-50%, -50%);
    border: 1.5px dashed color-mix(in srgb, var(--lh-blue) 75%, transparent);
    border-radius: 50%;
    background: color-mix(in srgb, var(--lh-blue) 9%, transparent);
  }
  .court__target-dot {
    position: absolute; left: 50%; top: 50%; width: 6px; height: 6px;
    border-radius: 50%; background: var(--lh-blue); transform: translate(-50%, -50%);
  }
  .court__arrows { position: absolute; inset: 0; width: 100%; height: 100%; pointer-events: none; }
  .court__markers { position: absolute; inset: 0; }
</style>
```

The target circle ships at a neutral proportion; Task 11's `reveal()` resizes it from `SETTER_RADIUS[phase]` when the puzzle is unlocked, since the radius is per-rotation and the page is static.

- [ ] **Step 2: Mount it in the page**

In `src/pages/game.astro`, import `RotationCourt` and render it inside `#rotation-app`, above the Start button, wrapped in `<div class="game__board" hidden data-board>` so it is revealed on Start.

- [ ] **Step 3: Verify at 320px**

With the dev server running, open `/game` in Chrome DevTools MCP and `emulate` with `viewport: "320x700x2,mobile,touch"`. Confirm:
- `document.documentElement.scrollWidth <= clientWidth` (no horizontal overflow);
- the court is square and the passing band sits between 55.6% and 77.8% of its height;
- the court stays dark with the site in light theme.

- [ ] **Step 4: Commit**

```bash
git add src/components/RotationCourt.astro src/pages/game.astro
git commit -m "style(game): draw the court as a tactics board

Direction A from the mockups: deep navy floor, light-blue lines, the
passing band and setter target drawn on rather than left implicit — a
player should only need to supply the positional rules, not guess our
club's conventions. The court is a dark surface in both themes, so it
carries a local --color-accent-text like .section--feature.

Verified no overflow at 320."
```

---

### Task 9: Placing the six

**Files:**
- Modify: `src/pages/game.astro` (client `<script>`)

**Interfaces:**
- Consumes: everything from Tasks 1-8.
- Produces: in-page `state` with `placement`, and `renderMarkers()` / `toMetres()` used by Tasks 10-11.

- [ ] **Step 1: Write the script**

Add to `src/pages/game.astro`:

```astro
<script>
  import {
    ALL_SLOTS, COURT_M, MIN_SEPARATION, SETTER_RADIUS, constraintsFor,
    onCourtRole, validate, type Phase, type Placement, type Slot, type Vec2,
  } from '../lib/rotation';
  import { ROTATIONS } from '../data/rotations';
  import { SQUAD } from '../data/squad';
  import { puzzleIndexFor } from '../lib/rotationState';

  const app = document.getElementById('rotation-app');
  if (app) {
    const puzzle = ROTATIONS[puzzleIndexFor(new Date(), ROTATIONS.length)];
    const phase = puzzle.phase as Phase;
    const court = app.querySelector<HTMLElement>('[data-court]')!;
    const layer = app.querySelector<HTMLElement>('[data-markers]')!;

    /** Shirt number standing in a slot right now, libero substitution applied. */
    const numberAt = (slot: Slot): number =>
      onCourtRole(slot, phase) === 'L' ? puzzle.libero : puzzle.start[(slot - 1 + phase) % 6];

    const label = (slot: Slot) => `#${numberAt(slot)} (${onCourtRole(slot, phase)}, P${slot})`;

    const placement: Partial<Placement> = {};

    const toMetres = (ev: { clientX: number; clientY: number }): Vec2 => {
      const r = court.getBoundingClientRect();
      const clamp = (v: number) => Math.min(COURT_M, Math.max(0, v));
      return {
        x: clamp(((ev.clientX - r.left) / r.width) * COURT_M),
        y: clamp(((ev.clientY - r.top) / r.height) * COURT_M),
      };
    };

    /** Nudge apart anything closer than the body gap, so the court never contradicts itself. */
    const separate = (slot: Slot, at: Vec2): Vec2 => {
      let { x, y } = at;
      for (const other of ALL_SLOTS) {
        const o = placement[other];
        if (other === slot || !o) continue;
        const d = Math.hypot(x - o.x, y - o.y);
        if (d >= MIN_SEPARATION) continue;
        const push = (MIN_SEPARATION - d) || MIN_SEPARATION;
        const ang = d === 0 ? Math.random() * Math.PI * 2 : Math.atan2(y - o.y, x - o.x);
        x = Math.min(COURT_M, Math.max(0, x + Math.cos(ang) * push));
        y = Math.min(COURT_M, Math.max(0, y + Math.sin(ang) * push));
      }
      return { x, y };
    };

    function renderMarkers(faults: Slot[] = []) {
      layer.replaceChildren();
      for (const slot of ALL_SLOTS) {
        const at = placement[slot];
        if (!at) continue;
        const el = document.createElement('button');
        el.type = 'button';
        el.className = 'marker';
        el.classList.toggle('marker--pass', constraintsFor(phase).some(
          c => c.kind === 'depthBand' && c.slots.includes(slot)));
        el.classList.toggle('marker--set', onCourtRole(slot, phase) === 'S');
        el.classList.toggle('marker--bad', faults.includes(slot));
        el.dataset.slot = String(slot);
        el.style.left = `${(at.x / COURT_M) * 100}%`;
        el.style.top = `${(at.y / COURT_M) * 100}%`;
        el.innerHTML = `<span class="marker__num">${numberAt(slot)}</span>`
          + `<span class="marker__tag">P${slot} ${onCourtRole(slot, phase)}</span>`;
        el.setAttribute('aria-label',
          `${label(slot)} at ${at.x.toFixed(1)} metres across, ${at.y.toFixed(1)} metres from the net`);
        layer.append(el);
      }
    }

    /** Picking resolves to the nearest centre, because hit areas overlap where discs do not. */
    const nearest = (at: Vec2): Slot | null => {
      let best: Slot | null = null;
      let bestD = Infinity;
      for (const slot of ALL_SLOTS) {
        const o = placement[slot];
        if (!o) continue;
        const d = Math.hypot(at.x - o.x, at.y - o.y);
        if (d < bestD) { bestD = d; best = slot; }
      }
      return bestD <= 1.5 ? best : null;
    };

    let dragging: Slot | null = null;
    let pending: Slot | null = null;   // tile selected from the rack, awaiting a tap

    court.addEventListener('pointerdown', ev => {
      const at = toMetres(ev);
      if (pending !== null) {
        placement[pending] = separate(pending, at);
        pending = null;
        renderMarkers();
        app.dispatchEvent(new CustomEvent('rotation:placed'));
        return;
      }
      dragging = nearest(at);
      if (dragging !== null) court.setPointerCapture(ev.pointerId);
    });

    court.addEventListener('pointermove', ev => {
      if (dragging === null) return;
      placement[dragging] = separate(dragging, toMetres(ev));
      renderMarkers();
    });

    court.addEventListener('pointerup', () => {
      dragging = null;
      app.dispatchEvent(new CustomEvent('rotation:placed'));
    });

    /** Keyboard: focus a marker, nudge in 0.25m steps. */
    const STEP = 0.25;
    layer.addEventListener('keydown', ev => {
      const el = ev.target as HTMLElement;
      const slot = Number(el.dataset?.slot) as Slot;
      const at = placement[slot];
      if (!at) return;
      const d: Record<string, Vec2> = {
        ArrowLeft: { x: -STEP, y: 0 }, ArrowRight: { x: STEP, y: 0 },
        ArrowUp: { x: 0, y: -STEP }, ArrowDown: { x: 0, y: STEP },
      };
      const move = d[ev.key];
      if (!move) return;
      ev.preventDefault();
      placement[slot] = separate(slot, {
        x: Math.min(COURT_M, Math.max(0, at.x + move.x)),
        y: Math.min(COURT_M, Math.max(0, at.y + move.y)),
      });
      renderMarkers();
      layer.querySelector<HTMLElement>(`[data-slot="${slot}"]`)?.focus();
      app.dispatchEvent(new CustomEvent('rotation:placed'));
    });
  }
</script>
```

Add the marker styles to the page's `<style>` block. The disc is sized in court metres so it can never be wider than the separation rule it obeys, with a larger transparent hit area around it:

```css
  .marker {
    position: absolute;
    transform: translate(-50%, -50%);
    display: grid;
    place-items: center;
    /* 0.7m of a 9m court — never wider than the separation rule. */
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
    cursor: grab;
    box-shadow: 0 2px 0 rgba(0, 0, 0, 0.35);
  }
  /* Tap target, not the disc: hit areas overlap where discs must not. */
  .marker::before { content: ''; position: absolute; inset: -50%; min-width: 44px; min-height: 44px; }
  .marker:focus-visible { outline: 2px solid var(--lh-white); outline-offset: 3px; }
  .marker--pass { box-shadow: 0 0 0 2.5px var(--lh-blue-100), 0 2px 0 rgba(0, 0, 0, 0.35); }
  .marker--set { background: var(--lh-white); }
  .marker--bad { background: var(--lh-red); color: var(--lh-white); }
  .marker__tag {
    position: absolute; top: calc(100% + 2px); font-size: 9px;
    letter-spacing: 0.06em; font-weight: var(--weight-black); white-space: nowrap;
    color: var(--lh-blue-100); opacity: 0.8; text-transform: uppercase;
  }
```

- [ ] **Step 2: Verify placement by hand**

At 320px in Chrome DevTools MCP: place all six, drag one into another and confirm they push apart rather than overlapping; drag one off the edge and confirm it clamps; tab to a marker and confirm arrow keys move it and the focus ring is visible.

- [ ] **Step 3: Commit**

```bash
git add src/pages/game.astro
git commit -m "feat(game): place and drag the six

Discs are sized in court metres (0.7m) so a marker can never be wider than
the separation rule it obeys, with a 44px transparent hit area around it;
picking resolves to the nearest centre because those hit areas overlap
where the discs must not. Staying in court and keeping bodies apart are
enforced here rather than charged as attempts — neither is what the game
teaches.

Verified drag, clamp, push-apart and arrow-key nudge at 320."
```

---

### Task 10: Submit, reveal and attempts

**Files:**
- Modify: `src/pages/game.astro`

**Interfaces:**
- Consumes: Task 9's `placement`, `renderMarkers`, `label`; Task 3's `validate`; Task 2's `constraintsFor`.
- Produces: `attempts` count and a `rotation:solved` event carrying `{ attempts, elapsedMs }` for Task 11.

- [ ] **Step 1: Add the submit and reveal markup**

Inside `[data-board]` in `src/pages/game.astro`:

```astro
<button type="button" class="btn btn--accent game__submit" data-submit disabled>Submit line-up</button>
<div class="verdict" data-verdict role="status" aria-live="polite"></div>
```

- [ ] **Step 2: Wire it up**

Append inside the client script's `if (app)` block:

```ts
    const submit = app.querySelector<HTMLButtonElement>('[data-submit]')!;
    const verdict = app.querySelector<HTMLElement>('[data-verdict]')!;
    const arrows = app.querySelector<SVGElement>('[data-arrows]')!;
    let attempts = 0;

    const complete = () => ALL_SLOTS.every(s => placement[s]);
    app.addEventListener('rotation:placed', () => { submit.disabled = !complete(); });

    function drawArrows(pairs: Slot[][]) {
      arrows.querySelectorAll('line').forEach(l => l.remove());
      for (const [a, b] of pairs) {
        const from = placement[a], to = placement[b];
        if (!from || !to) continue;
        const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        line.setAttribute('x1', String(from.x));
        line.setAttribute('y1', String(from.y));
        line.setAttribute('x2', String(to.x));
        line.setAttribute('y2', String(to.y));
        line.setAttribute('stroke', 'var(--lh-red)');
        line.setAttribute('stroke-width', '0.09');
        line.setAttribute('stroke-dasharray', '0.28 0.2');
        line.setAttribute('marker-end', 'url(#rot-arrow)');
        arrows.append(line);
      }
    }

    submit.addEventListener('click', () => {
      if (!complete()) return;
      attempts += 1;
      const violations = validate(placement as Placement, constraintsFor(phase), label);
      const faulted = [...new Set(violations.flatMap(v => v.slots))];
      renderMarkers(faulted);
      drawArrows(violations.filter(v => v.slots.length === 2).map(v => v.slots));

      if (!violations.length) {
        verdict.className = 'verdict verdict--ok';
        verdict.innerHTML = `<b>Legal line-up</b><p>Solved in ${attempts} `
          + `attempt${attempts === 1 ? '' : 's'}.</p>`;
        submit.disabled = true;
        app.dispatchEvent(new CustomEvent('rotation:solved', { detail: { attempts } }));
        return;
      }

      verdict.className = 'verdict verdict--bad';
      verdict.innerHTML = `<b>${violations.length} fault${violations.length === 1 ? '' : 's'} `
        + `· attempt ${attempts}</b>`
        + violations.map(v => `<p>${v.message}</p>`).join('');
    });
```

Verdict styles, in the page `<style>` block:

```css
  .verdict { display: grid; gap: 6px; border-radius: 8px; padding: 11px 13px; font-size: var(--text-body-sm); }
  .verdict:empty { display: none; }
  .verdict b {
    font-size: 12px; letter-spacing: var(--tracking-wide);
    text-transform: uppercase; display: block;
  }
  .verdict p { margin: 0; }
  .verdict--bad {
    background: color-mix(in srgb, var(--lh-red) 12%, transparent);
    border: 1px solid color-mix(in srgb, var(--lh-red) 45%, transparent);
  }
  .verdict--bad b { color: var(--lh-red); }
  .verdict--ok {
    background: color-mix(in srgb, var(--lh-green) 14%, transparent);
    border: 1px solid color-mix(in srgb, var(--lh-green) 50%, transparent);
  }
  .verdict--ok b { color: light-dark(#3c7a22, var(--lh-green)); }
```

- [ ] **Step 3: Verify the loop**

At 375px: place six players deliberately wrongly, submit, and confirm every broken rule is listed in plain English, the implicated markers turn red, and an arrow joins each pair. Fix them and confirm the second submission reports a legal line-up and the attempt count reads 2.

- [ ] **Step 4: Commit**

```bash
git add src/pages/game.astro
git commit -m "feat(game): submit, reveal every fault, and count attempts

The reveal is what teaches: each violated rule is named in plain English
with an arrow between the two players it implicates, and the board stays
editable so the next attempt is a correction rather than a restart.

Verified the fault-then-fix loop at 375."
```

---

### Task 11: Start gate, clock, streak and sharing

**Files:**
- Modify: `src/pages/game.astro`

**Interfaces:**
- Consumes: Task 6's `loadProgress`, `forToday`, `recordSolved`, `shareText`; Task 10's `rotation:solved`.
- Produces: nothing downstream.

- [ ] **Step 1: Add the markup**

Inside `[data-board]`, after the verdict:

```astro
<div class="game__result" hidden data-result>
  <p class="game__clock" data-clock>0:00</p>
  <button type="button" class="btn btn--primary" data-share>Copy result</button>
  <a class="btn btn--ghost" data-whatsapp href="https://wa.me/" target="_blank" rel="noopener noreferrer">
    Send to the group
  </a>
</div>
```

- [ ] **Step 2: Wire it up**

Append inside the client script's `if (app)` block:

```ts
    const KEY = 'lh-rotation';
    const board = app.querySelector<HTMLElement>('[data-board]')!;
    const startBtn = app.querySelector<HTMLButtonElement>('[data-start]')!;
    const result = app.querySelector<HTMLElement>('[data-result]')!;
    const clockEl = app.querySelector<HTMLElement>('[data-clock]')!;

    let progress = forToday(loadProgress(localStorage.getItem(KEY)), puzzle.id);
    const save = () => localStorage.setItem(KEY, JSON.stringify(progress));
    const elapsed = () => Date.now() - (progress.game?.startedAt ?? Date.now());
    const clock = (ms: number) => {
      const t = Math.round(ms / 1000);
      return `${Math.floor(t / 60)}:${String(t % 60).padStart(2, '0')}`;
    };

    // Fill the brief only once the clock is running: rotating the line-up is the thinking.
    function reveal() {
      for (const slot of ALL_SLOTS) {
        app.querySelector(`[data-lineup-slot="${slot}"]`)!.textContent = `#${puzzle.start[slot - 1]}`;
      }
      app.querySelector('[data-brief-libero]')!.textContent = `#${puzzle.libero}`;
      app.querySelector('[data-brief-at-one]')!.textContent = `#${puzzle.start[phase]}`;
      // Per-rotation setter radius, drawn to scale.
      const target = app.querySelector<HTMLElement>('.court__target')!;
      target.style.width = `${(SETTER_RADIUS[phase] * 2 / COURT_M) * 100}%`;
      board.hidden = false;
      startBtn.hidden = true;
    }

    startBtn.addEventListener('click', () => {
      progress = { ...progress, game: { id: puzzle.id, startedAt: Date.now(), attempts: 0, solved: false, elapsedMs: null, placement: null } };
      save();
      reveal();
      tick();
    });

    let timer = 0;
    function tick() {
      if (progress.game?.solved) return;
      clockEl.textContent = clock(elapsed());
      timer = window.setTimeout(tick, 1000);
    }

    app.addEventListener('rotation:solved', ev => {
      const ms = elapsed();
      clearTimeout(timer);
      attempts = (ev as CustomEvent<{ attempts: number }>).detail.attempts;
      progress = recordSolved(progress, puzzle.id, attempts, ms);
      save();
      clockEl.textContent = clock(ms);
      result.hidden = false;

      const text = shareText({ id: puzzle.id, attempts, elapsedMs: ms, streak: progress.streak });
      app.querySelector<HTMLAnchorElement>('[data-whatsapp]')!.href =
        `https://wa.me/?text=${encodeURIComponent(text)}`;
      app.querySelector('[data-share]')!.addEventListener('click', async () => {
        await navigator.clipboard.writeText(text);
        app.querySelector('[data-share]')!.textContent = 'Copied';
      });
    });

    // Already solved today: show the result rather than the puzzle.
    if (progress.game?.solved && progress.game.id === puzzle.id) {
      reveal();
      result.hidden = false;
      clockEl.textContent = clock(progress.game.elapsedMs ?? 0);
      app.querySelector<HTMLElement>('[data-submit]')!.hidden = true;
    } else if (progress.game?.startedAt) {
      reveal();
      tick();
    }
```

Import `loadProgress`, `forToday`, `recordSolved`, `shareText` alongside `puzzleIndexFor`.

- [ ] **Step 3: Verify state across reloads**

At 375px: press Start, note the clock running; reload and confirm the board is still revealed and the clock continued from the original stamp rather than restarting. Solve it, confirm the result panel and a copied share string. Reload again and confirm the solved result shows rather than a fresh puzzle. In DevTools, edit `localStorage['lh-rotation']` to an earlier `id` and reload to confirm a stale unfinished game is discarded.

- [ ] **Step 4: Commit**

```bash
git add src/pages/game.astro
git commit -m "feat(game): gate the puzzle behind Start, then time, streak and share

The line-up stays hidden until Start, because rotating it is most of the
thinking and starting the clock on the first drag would make that free.
Elapsed time is wall-clock from the stamp, so a reload resumes rather than
restarts and there is nothing to game.

Verified reload mid-puzzle, solved-state revisit, and stale-day discard."
```

---

### Task 12: Verification pass

**Files:** none changed unless a defect is found.

- [ ] **Step 1: Full test run**

Run: `npm test`
Expected: PASS, all suites.

- [ ] **Step 2: Production build**

Run: `SKIP_VOLLEYZONE=true SKIP_BEHOLD=true npm run build`
Expected: succeeds, and `dist/game/index.html` exists.

- [ ] **Step 3: Confirm no witness shipped**

Run: `grep -rl "WITNESSES" dist/ || echo "clean"`
Expected: `clean`.

- [ ] **Step 4: Responsive sweep**

In Chrome DevTools MCP, for each of `320x700x2,mobile,touch`, `375x812x3,mobile,touch` and `414x896x3,mobile,touch`:
- assert `document.documentElement.scrollWidth <= document.documentElement.clientWidth`;
- if it overflows, enumerate elements whose `getBoundingClientRect().right` exceeds the viewport and fix every offender, not just the first;
- play one puzzle through to a solve.

- [ ] **Step 5: Theme and accessibility check**

- Toggle the site theme and confirm the court stays dark and legible in both, and that the verdict text meets contrast on its tinted background.
- Tab through the page: skip link, nav, Start, each marker, Submit. Every stop needs a visible `:focus-visible` ring.
- Confirm the verdict's `aria-live` region announces faults after a submission.

- [ ] **Step 6: Commit any fixes**

```bash
git add -A
git commit -m "fix(game): <what was actually wrong>

Verified at 320/375/414, both themes, keyboard-only."
```
