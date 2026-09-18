# Rotation — Daily Serve-Receive Puzzle

**Date:** 2026-09-11
**Page:** `/game` (title "Rotation")
**Status:** Implemented on `feat/rotation-game`
**Superseded in part by:** `2026-09-17-rotation-judge-design.md` — marker
labels, the acceptance of six geometries, and the share string.
**Rules edition:** FIVB *Official Volleyball Rules 2025-2028*, adopted by
Volleyball England for domestic competition from 1 September 2025.

## Goal

A daily volleyball puzzle in the Wordle mould: one puzzle a day, the same for
everyone, playable in a couple of minutes, with a short result string people
paste into the club WhatsApp group.

The puzzle is **serve receive positioning**. Given a squad sheet and a rotation,
the player drags six players onto our half of the court and submits. The game
checks their coordinates against the real positional rules plus our team's
receive system, and reports every violation. Score is **attempts and elapsed
time**.

This was chosen over a word game or a Connections clone because it teaches the
thing club players actually get wrong — overlap — rather than wearing volleyball
as a theme.

## Decisions

- **Receiving only.** Every puzzle is the moment the opponent contacts the serve.
  Under the 2025-28 rules the serving team has *no* positional requirement at
  all, so receiving is the only side of the ball where this puzzle exists.
- **Free coordinates, not a grid.** Players are dragged anywhere in our half and
  validated by coordinate comparison. A discretised court either collapsed the
  lateral rule (3 columns forces 4-3-2 with zero freedom) or needed ~20 cells,
  which is a poor mobile target.
- **No unique answer.** Many legal formations satisfy the constraints. The game
  checks a *constraint set*, not a stored solution.
- **Attempts, not one shot.** Each submission names every violated constraint, so
  a player who doesn't know the rules learns them by iterating. Attempt count is
  the score. No cap — everyone finishes.
- **No hints.** Post-attempt feedback is the hint.
- **All constraint values are drawn on the court.** The passing band, the setter's
  target circle and the net limits are visible. Otherwise the first attempt tests
  whether you can guess our club's conventions rather than whether you understand
  overlap.
- **No par / no optimisation.** An earlier design scored the setter's distance to
  their release point against a generator-computed "par". Dropped: the separation
  and spread constraints are non-convex, so par could not be claimed optimal. The
  setter is a pass/fail radius check instead.

## Coordinate system

Metres, from our team's point of view facing the net:

- `x` — `0` at the left sideline, `9` at the right sideline.
- `y` — `0` at the net (centre line), `9` at our end line. The attack line is
  `y = 3`.

Front row is P4 (left), P3 (centre), P2 (right); back row is P5 (left),
P6 (centre), P1 (right).

## Rules model

### Rotational structure

The starting lineup follows the club's 5-1 circle, P1 through P6:

```ts
const LINEUP_CYCLE = ['S', 'OH', 'MB', 'OPP', 'OH', 'MB'] as const;
```

Diagonal pairs sit three apart in the cycle, so the required diagonals
(S↔OPP, OH↔OH, MB↔MB) fall out automatically in every rotation and never need to
be checked separately.

A rotation is a phase offset. With `start` holding the R1 lineup as P1..P6 and
`phase` the number of rotations elapsed, the player currently in position `k` is
`start[(k - 1 + phase) % 6]`.

Because the two middles are diagonal, exactly one is back row in every rotation.
The libero replaces that middle, so:

- the on-court middle is **always front row**;
- the libero is **always back row**, at P1, P5 or P6;
- exactly six players are on court, always.

### Positional rules (7.4)

> **7.4** — "At the moment the ball is hit by the server, each team must be
> positioned within its own court (except the server). The players of the
> receiving team must be in the rotational order at the service hit… the players
> of the serving team, however, are free to occupy any position at the service
> hit."

Relative positions are **7.4.2** — back-row player further from the centre line
than the corresponding front-row player (7.4.2.1), rows ordered laterally
(7.4.2.2) — and are judged by feet under **7.4.3**:

> **7.4.3.1** — "each back-row player must be **level with** or have at least a
> part of one foot further from the centre line than the front foot of the
> corresponding front-row player"
>
> **7.4.3.2** — "each right (left) side player must be **level with** or have at
> least a part of one foot closer to the right (left) sideline…"

**Level is legal.** Every ordering comparison is therefore `≥` / `≤`, never
strict. This matters in practice because the keyboard nudge moves in 0.25 m
steps, so exactly-equal coordinates are common rather than measure-zero.

| | |
|---|---|
| Depth | `y5 ≥ y4`, `y6 ≥ y3`, `y1 ≥ y2` — each back-row player at least level with their *corresponding* front-row player (4↔5, 3↔6, 2↔1), which is **not** the same pairing as the diagonals |
| Lateral | `x4 ≤ x3 ≤ x2` and `x5 ≤ x6 ≤ x1` |
| In court | every player within `0 ≤ x ≤ 9`, `0 ≤ y ≤ 9` |

Nothing constrains P4 against P6, or P5 against P2. That asymmetry is the main
thing the game teaches.

(7.4.3.2 is literally worded against "the other players in that row" rather than
the adjacent one. The transitive adjacent-pair reading above is how it is
refereed and is what we implement.)

### Team system

Our convention, not law, and labelled as such in the UI so the game does not
teach doctrine as rules. Every value is derived from `phase` in the library —
none of it is stored per puzzle:

- the three passers are the libero and **both** outsides — exactly three, every
  rotation, regardless of which outside is front row;
- each passer between `5 m` and `7 m` from the net;
- passers at least `2 m` from each other;
- the (always front-row) middle within `1.5 m` of the net;
- the opposite, **when front row**, within `2 m` of the net; unconstrained when
  back row;
- the setter within a per-rotation radius of `(6.5, 0.5)` — near the net, right
  of centre. The setting position does not move between rotations; what changes
  is how close the setter can legally get, which the per-rotation radius absorbs.

**Physical sanity** (not a rule — bodies): no two players within `0.7 m`.

### Enforced by the UI, never charged as an attempt

`inCourt` and `separation` are not what the game teaches, so a player must not
lose an attempt to them. Dragging is clamped to our half, and markers push each
other apart on contact (resolved along the drag axis, minimally). Both remain in
the validator as invariants the feasibility tests rely on, but neither can appear
in a reveal.

### Where the difficulty comes from

The passing band collides with the depth rule. A front-row outside passing at
`y = 6` forces whoever is at P5 to be at least level with them. If that is the
libero, they are squeezed into `6 ≤ y ≤ 7`. If it is the setter, the setter is
pinned six metres from the net and cannot reach their release point — the
rotational headache real teams build their lineups around.

With this lineup order, R1 puts the setter at P1 behind a passing outside at P2,
so the setter is pinned beyond 5 m and their radius is close to unconstrained.
That is realistic, but R1 is a weak puzzle on the setter axis.

## Data

### Squad — `src/data/squad.ts`

One fixed fictional squad of 14, the same every day, so regulars come to know it
the way they know a real team sheet: 2 setters, 2 opposites, 4 outsides,
4 middles, 2 liberos. Shirt number → role.

### Puzzle bank — `src/data/rotations.ts`

Because every constraint derives from `phase`, a puzzle is only a cast and a
rotation:

```ts
interface RotationPuzzle {
  id: number;              // daily index
  start: ShirtNumber[];    // R1 lineup, P1..P6, roles matching LINEUP_CYCLE
  libero: ShirtNumber;
  phase: 0 | 1 | 2 | 3 | 4 | 5;
}
```

Generated ahead of time and committed, following the repo convention that
`src/data/` is the source of truth, so that a later code change can never rewrite
which puzzle appeared on a day people already played. Roughly two years of
entries; the client selects by days elapsed in `Europe/London`.

**Daily variation.** Two things change every day:

- **The rotation is shuffled, not cyclic.** Phases are emitted as successive
  random permutations of 0-5, so each block of six days covers every rotation
  exactly once with no back-to-back repeats, and the player cannot predict which
  is coming.
- **The cast is redrawn** from the 14-player squad — which setter, which
  opposite, which two outsides and in which order, which two middles, which
  libero. That is 1,152 distinct casts, so the up-front deduction (rotate the
  lineup, find the back-row middle, slot the libero) is fresh daily.

**Known and accepted:** neither of these moves the *geometry*. Every constraint
derives from `phase`, so the positioning problem on any given day is one of six.
Shuffling makes it unpredictable and re-casting makes the deduction fresh, but a
regular player will meet the same six squeezes. Accepted deliberately — repetition
is how rotations are actually learned. If more variety is wanted later, the
cheapest dial is the mirror lineup cycle (`S → MB → OH → OPP → MB → OH`), which
is an equally valid 5-1 and doubles the geometric configurations to twelve.

The bank is visible in devtools; so was Wordle's. Not worth obfuscating — but see
the witnesses below, which are deliberately *not* shipped.

### Feasibility witnesses — `tests/fixtures/rotation-witnesses.ts`

One hand-checked legal formation per rotation, six in total. Because the
constraint set depends only on `phase`, solvability is a property of the six
rotations rather than of each puzzle, and is proven once per rotation in the
tests. Witnesses live under `tests/` — not `src/` — and are **never** shipped to the client;
putting them in the bank would hand every player a ready-made answer.

## Library — `src/lib/rotation.ts`

Pure, no DOM, fully unit-tested. Holds `LINEUP_CYCLE`, the phase/slot maths, the
libero substitution, the per-rotation constraint derivation, and the validator.

Constraints are one typed list, evaluated uniformly:

```ts
type Constraint =
  | { kind: 'depthOrder'; front: Slot; back: Slot }
  | { kind: 'lateralOrder'; left: Slot; right: Slot }
  | { kind: 'inCourt' }
  | { kind: 'separation'; min: number }
  | { kind: 'depthBand'; group: 'passers'; min: number; max: number }
  | { kind: 'spread'; group: 'passers'; min: number }
  | { kind: 'nearNet'; slot: Slot; max: number }
  | { kind: 'nearPoint'; slot: Slot; point: Vec2; radius: number };
```

`constraintsFor(phase)` returns the full list. `validate()` returns violations,
each carrying the implicated slots and a plain-English message, which the reveal
renders directly.

## Page and interaction

`/game`, standard `BaseLayout`, main nav, in the sitemap, its own OG image.
Vanilla Astro with one client `<script>` island — no framework.

**Input panel.** The squad sheet, the R1 starting lineup by position, the libero,
and one line naming which starting-six player is now in position 1. The player
rotates the lineup themselves, works out which middle is back row, and places the
libero in that slot. Tiles then read `#12 · OH · P5`, so front-court and
back-court outside are never ambiguous.

**Court.** Inline SVG of our 9×9 half with the net along the top and the attack
line at 3 m, aspect-ratio locked, designed at 320 px first. The passing band
(5–7 m), the setter's target circle and the net limits are drawn on it, so the
only thing a player must supply from knowledge is the positional rules.

**Placing.** Drag with pointer and touch. Keyboard: focus a tile, nudge with the
arrow keys in 0.25 m steps — playable without a mouse, with `:focus-visible`
rings per the site convention. Submit is disabled until all six are placed.

**No live validation.** Showing faults during the drag would hand over the
puzzle.

**Reveal.** On submit, every violation is drawn as an arrow between the
implicated players with one sentence each — "your libero at P5 is 0.4 m in front
of your outside at P4; back-row players must be at least level with their
front-row partner." Violations are announced in an `aria-live` region. The board
stays editable for the next attempt.

## Timing and state

The puzzle is hidden behind a **Start** button, which reveals the squad sheet, the
rotation and the court together and stamps `startedAt`. Starting the clock on
first drag would make the rotation work — which is most of the thinking — free.

Elapsed time is wall-clock from `startedAt`, so it is unaffected by reload and
does not pause when the tab is hidden; there is nothing to game and nothing to
reconcile.

`localStorage['lh-rotation']`: puzzle id, `startedAt`, attempts, solved flag,
final elapsed ms, current placement, streak, last-played date.

- **Reload mid-puzzle** — placement, attempts and `startedAt` are restored; the
  clock continues from the original stamp.
- **Day rollover with a puzzle in progress** — the stored id no longer matches
  today's, so the in-progress state is discarded and the new puzzle starts
  unstarted. An unfinished puzzle does not extend the streak.
- **Returning after solving** — shows the result and a countdown to the next
  puzzle.

```
Lionhearts Rotation #12
✅ 3 attempts · 2:31
🔥 streak 6
lionheartslondon.com/game
```

Copy to clipboard plus a WhatsApp share link.

## Testing

Vitest, on the library only, matching the repo's existing test scope:

- one table-driven case per `Constraint` kind — a known-legal formation, then one
  deliberate single violation at a time;
- the level boundary: exactly equal coordinates are **legal** on both the depth
  and lateral orderings (7.4.3.1, 7.4.3.2);
- phase maths: every rotation produces legal diagonals, exactly one back-row
  middle, and the libero in a back-row slot;
- feasibility: each of the six rotations' witness formations passes
  `validate(constraintsFor(phase))`;
- bank integrity: every puzzle in `src/data/rotations.ts` names real squad
  members whose roles match `LINEUP_CYCLE`, with a libero that is a libero.

## Out of scope

- The opposing team's positions.
- 6-2 systems, two liberos in play, receive patterns other than three-passer.
- Any server, account, or live leaderboard. Competition happens in the group chat.

Serving formations are not "out of scope" so much as nonexistent: under 2025-28
rule 7.4 the serving team may occupy any position, so there is no puzzle there.

## Visual direction

**Direction A — tactics board.** Chosen from three browser mockups:
<https://claude.ai/code/artifact/283876b8-b5bc-4f32-a571-8a8ea15fde25>

- **Court** — deep navy floor (`--lh-navy-deep`), light-blue lines, an inset
  shadow for depth. It stays dark in **both** site themes, like
  `.section--feature`, so it carries a local `--color-accent-text: var(--lh-blue)`
  per the dark-panel convention in CLAUDE.md.
- **Players** — solid brand-blue discs with navy numerals in Barlow Condensed,
  tabular figures. Passers carry a `--lh-blue-100` ring, the setter is white, a
  faulted player turns `--lh-red`. Solid accent fill reads as interactive on this
  site, which is correct here: the discs are the draggable objects.
- **Zones** — passing band as a translucent blue fill with dashed edges; the
  setter target a dashed circle with a centre dot; net limits dotted; attack line
  at 3 m. The target circle is drawn above the band and below the markers.
- **Labels** — slot and role beneath each marker (`P5 L`).

### Marker geometry (a real constraint, not a style note)

Measured at 320 px the court renders 260 px wide, so one metre is **28.9 px**. A
30 px marker is therefore **1.04 m across — wider than the 0.7 m separation rule
it must obey**, so two legally separated players would visibly overlap and the
court would appear to contradict itself.

Therefore:

- the disc is sized in **court metres**, not pixels, at roughly `0.7 m`;
- the tap target is a larger transparent hit area (≥ 44 px) centred on it, so hit
  areas overlap where discs do not — picking resolves to the **nearest centre**;
- below roughly a 26 px disc the shirt number moves from inside the disc into the
  label beneath it, since two digits in Barlow Condensed stop being legible first.

## Open

Nothing. Ready for an implementation plan.
