# Rotation Judge — Daily Overlap Calls

**Date:** 2026-09-17
**Page:** `/game` (two tabs: Build and Judge)
**Status:** Designed, not implemented
**Rules edition:** FIVB *Official Volleyball Rules 2025-2028*, adopted by
Volleyball England for domestic competition from 1 September 2025.
**Supersedes parts of:** `2026-09-11-rotation-game-design.md` (see *Amendments*).

## Goal

Add a second daily game to `/game` — you are shown a serve-receive formation
and must call it legal or illegal, and when illegal, name the two players
overlapping. Six calls a day, one shot each.

It exists to fix a measured ceiling in the build game and to make the build
game a puzzle again. Two changes, taken together:

- **Judge** — a new game whose puzzles are generated rather than drawn from a
  fixed set of shapes, so it does not run out.
- **Labels off** — the build game stops printing the answer on its pieces.

## Why — the measurements behind this

These are the numbers that drove every decision below. All were measured
against the shipped `src/lib/rotation.ts`.

| Finding | Measurement |
|---|---|
| The build game has six puzzles, not 760 | Every constraint derives from `phase`, so the 760 committed puzzles contain **6 distinct geometries**. The 408 distinct line-ups re-cast the same six shapes. |
| The six shapes are genuinely different, though | No single role-indexed formation satisfies all six rotations at 1m, 0.5m or 0.25m lattices, and only **2 of 15** rotation pairs can share one shape. The per-rotation lesson is real — there are just six of them. |
| The build game answers its own question | Each marker is stamped `P{slot} {role}` and its number already has the libero substituted in, while the brief asks the player to work out exactly those things. |
| Precision is not the difficulty | On a 1m grid each rotation admits between **5,592 and 391,908** legal formations. |
| Illegal formations generate freely | Single-fault formations were constructed in **296–300 of 300** attempts in every rotation, at every subtlety tried. |
| Legal decoys do **not** occur naturally | **0 of 4,000** randomly sampled legal formations sat within 0.2m of a fault. Tight legal formations must be built deliberately — otherwise every formation that *looks* tight is illegal, and players learn that tell instead of the rules. |
| Tight legal decoys can be built deliberately | **300 of 300** in every rotation at margins from 0.05m to 0.3m, while keeping bodies 0.7m apart. |

### Subtlety is bounded by pixels

A violation of *d* metres renders at:

| violation | phone (320px, court 260px) | desktop (court 460px) |
|---|---|---|
| 0.15m | 4px | 8px |
| 0.3m | 9px | 15px |
| 0.6m | 17px | 31px |
| 1.2m | 35px | 61px |

Below roughly 0.3m a fault is invisible on a phone and the call becomes a coin
flip. **0.3m is therefore a floor, not a preference.** This is a real
constraint in the same sense as the marker-geometry note in the previous spec.

The floor applies to **illegal gaps only**. Legal margins are allowed far
tighter — down to 0.05m — and that is not an inconsistency to be tidied away.
A fault the player cannot see is unfair, because the correct answer is
unreachable. Two players the player cannot see daylight between is *fair*, and
in fact the central lesson: under 7.4.3.1 and 7.4.3.2 level is legal, so
"I can't see a gap" correctly resolves to **legal**.

## Decisions

- **Two independent games, one page.** `/game` keeps its URL and its nav entry.
  Tabs, separate state, separate scores, separate share strings. Finishing one
  neither reveals nor affects the other.
- **Six calls a day.** About a minute, and a single-row share grid.
- **The mix is randomised and undisclosed** — between two and four illegal each
  day. A fixed, stated split would let a player deduce the last calls by
  counting rather than by reading the court.
- **One cast, rotation advances each call.** The same squad all day; call one is
  some rotation, call two the next, through a full cycle of six. All six
  geometries appear every day — the exact ceiling the build game hits — and each
  deduction is one step from the last rather than a fresh puzzle.
- **Shirt numbers only, with a line-up brief.** The player rotates the line-up
  themselves, then judges. Overlap is defined *by rotational order*, so a court
  of anonymous discs is unjudgeable; what varies between designs is how much
  work it takes to recover each player's position.
- **Call it, then tap the pair.** Legal or illegal; if illegal, tap the two
  players overlapping. The tap is what distinguishes seeing the fault from
  guessing.
- **One shot per call.** It is a referee's call, not an attempt.
- **No clock.** Six one-shot calls under time pressure rewards rushing, which is
  the opposite of the skill being taught. The build game keeps its clock.
- **Law only, never club convention.** The judge game validates against the
  positional rules — depth order, lateral order, in court, bodies apart — and
  explicitly *not* the passing band, passer spread or setter radius. Those are
  our system, not law, and no referee would call them.
- **The answer is never shipped.** The bank stores formations only. Legality is
  recomputed by `validate()` at the moment the player answers.

## Page structure and state

`/game` gains a tablist — **Build** and **Judge** — as a proper tablist with
roving tabindex, arrow-key movement and `aria-selected`, not styled links,
since both panels live in one document. `Nav.astro` does not change.

| | Build | Judge |
|---|---|---|
| Storage key | `lh-rotation` (unchanged) | `lh-rotation-judge` |
| Bank | `src/data/rotations.ts` (unchanged) | `src/data/judge.ts` |
| Score | attempts + time | calls correct out of six |
| Share | unchanged, plus rookie marker | six-square grid |

Both banks are selected by the same London day number, so the two games roll
over together at local midnight. Each storage entry is validated by its own
shape guard; neither can corrupt the other.

The last-used tab is remembered.

## The judge game

### Bank — `src/data/judge.ts`

```ts
interface JudgePuzzle {
  id: number;
  start: number[];         // R1 line-up, P1..P6
  libero: number;
  startPhase: Phase;       // call 1 is this rotation; each call advances one
  formations: Placement[]; // exactly 6, one per call
}
```

There is deliberately no `legal` flag and no stored fault pair. The verdict is
computed on the client from the formation, so the answer exists nowhere in the
shipped data and the engine remains the single source of truth. The rotation for
call *i* is `(startPhase + i) % 6`, derived rather than stored.

### Generation — `scripts/generate-judge.ts`

Seeded `mulberry32`, committed ahead of time, following the rotation
generator's conventions so a later code change can never rewrite a day people
already played.

Per day: draw a cast from the squad, draw a `startPhase`, then for each of the
six calls decide legal or illegal from the day's shuffled mix and build a
formation accordingly.

- **Illegal** — exactly one broken constraint, gap drawn from **0.3m to 1.2m**.
- **Legal** — squeezed so its tightest margin falls in **0.05m to 0.3m**.
- Both keep every pair at least 0.7m apart and everyone inside the court.

Margins tighten across the six calls, so call one is obvious and call six is
genuinely hard.

The bands overlap at 0.3m on purpose: a legal margin and an illegal gap can be
the same visual magnitude, so size alone never answers the question.

### A call

The brief shows the team sheet and the R1 line-up throughout, and each call
names its rotation. Six discs carry shirt numbers only.

The player presses **Legal** or **Illegal**. Choosing Illegal asks them to tap
two discs to name the pair, then confirm. The call is then final and the
verdict is shown.

### Feedback

Because the truth is computed rather than stored, the game can diagnose *why* a
call was wrong — which matters because with shirt numbers only, a wrong call has
two possible causes.

| Call | Truth | Response |
|---|---|---|
| Legal | Legal | Correct. |
| Illegal | Legal | Names the margin: "#12 is level with #7 by 0.08m — level is legal." |
| Legal | Illegal | Names the pair and the distance. |
| Illegal + right pair | Illegal | Correct. |
| Illegal + wrong pair | Illegal | "Right call, wrong pair" — plus the rotation check below. |

**The rotation check.** When the tapped pair is wrong, the game re-tests it
against every *other* rotation's slot mapping. If the tapped pair would be a
fault under a different rotation, the player mis-rotated rather than misread the
court, and the feedback says so: "you had #12 in position 5; this rotation has
them in position 6." This is what keeps shirt-numbers-only from producing
uninterpretable failures.

Calling a legal formation illegal is the most valuable teaching moment in the
game — it is where a player learns that level is legal.

### Score and share

Calls correct out of six, with pairs found as a secondary figure. No points
currency. Completing all six extends the streak; the score is the bragging
right.

```
Lionhearts Judge #48
🟩🟩🟨🟥🟩🟩  5/6
🔥 streak 4
lionheartslondon.com/game
```

🟩 correct call with the pair found, or a correct legal call · 🟨 correct call,
wrong pair · 🟥 wrong call.

## Build game changes

### Labels off

The `marker__tag` span is removed. The disc keeps its shirt number and nothing
else.

The marker's **accessible name changes with it**, from `#12 (OH, P5) at 3.2
metres across…` to the shirt number and coordinates alone. Leaving it would mean
the puzzle is hard only for sighted players while a screen-reader user is handed
the answer.

The deduction this restores is real. The discs still show rotated,
libero-substituted numbers, so the player knows *who* is on court; what they must
work out is which position each holds — and every ordering constraint is keyed to
position. Recognising that the libero's number stands in the back-row middle's
slot is part of it.

### The Rookie toggle

A toggle by the board, persisted in `localStorage['lh-rotation-rookie']`,
restores the tags and the full accessible name.

The flag is **sticky for the day**: once labels have been shown, that day's
result is a rookie result regardless of what the toggle is set to afterwards. A
mode marker you can flip the moment you get stuck is worth nothing. The flag
lives in the day's saved game, not only in the toggle.

```
Lionhearts Rotation #12
✅ 3 attempts · 2:31 · rookie
🔥 streak 6
```

## Amendments to the 2026-09-11 spec

Three statements there are now wrong and are corrected when this is built:

- *"Tiles then read `#12 · OH · P5`"* (Page and interaction) — tiles read `#12`.
- *"Labels — slot and role beneath each marker (`P5 L`)"* (Visual direction) —
  no label beneath the marker by default; the Rookie toggle restores it.
- The marker-geometry note about the shirt number moving from inside the disc
  into the label beneath it at small sizes needs restating, since by default
  there is no label to move into.

The "known and accepted" note about six geometries also stands corrected in
effect: it is no longer accepted, it is the reason the judge game exists.

## Libraries and files

| File | Change |
|---|---|
| `src/lib/rotation.ts` | none |
| `src/lib/judge.ts` | new — law-only constraint subset, call verdicts, rotation check |
| `src/lib/rotationState.ts` | `shareText()` gains the rookie flag; judge state helpers |
| `src/data/judge.ts` | new — generated, committed |
| `scripts/generate-judge.ts` | new |
| `src/pages/game.astro` | tablist, labels off, Rookie toggle, judge panel |
| `src/components/RotationCourt.astro` | reused; zone overlays suppressed in judge mode |
| `src/components/Nav.astro` | none |

`src/lib/judge.ts` is pure and DOM-free like `rotation.ts`.

## Testing

Vitest on the libraries, matching the repo's existing test scope.

- the law subset excludes club convention — pass band, spread and setter radius
  must be absent
- a level-but-legal decoy is judged **legal**, mirroring the existing boundary
  tests for 7.4.3.1 and 7.4.3.2
- a single-fault formation names exactly one pair
- the rotation check fires for a pair that is legal in this rotation but a fault
  in another, and stays silent otherwise
- all five verdict outcomes
- bank integrity: six formations a day, two to four illegal, margins in band,
  bodies at least 0.7m apart, everyone in court, a real cast, rotations
  advancing correctly
- both games roll over on the same London day
- share strings for every outcome, including the rookie marker and its
  stickiness

`shareText()` gains a parameter, so its existing tests change with it. The 222
tests passing today stay green.

**One fix while in the file:** `startCountdown()` sets an interval that is never
cleared.

## Out of scope

- Any server, account or live leaderboard. Competition happens in the group chat.
- Merging the two games' scores into one figure.
- A practice or archive mode for either game.
- Judging the serving team — under 2025-28 rule 7.4 they may occupy any
  position, so there is nothing to judge.

## Open

Which tab opens on a first visit. A copy and onboarding decision, not a
structural one; settled during implementation.
