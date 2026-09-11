# Rotation — Daily Serve-Receive Puzzle

**Date:** 2026-09-11
**Page:** `/game` (title "Rotation")
**Status:** Designed, not implemented

## Goal

A daily volleyball puzzle in the Wordle mould: one puzzle a day, the same for
everyone, playable in a couple of minutes, with a short result string people
paste into the club WhatsApp group.

The puzzle is **serve receive positioning**. Given a squad sheet and a rotation,
the player drags six players onto our half of the court and submits. The game
checks their coordinates against the real overlap rules plus our team's receive
system, and reports every violation. Score is **attempts and elapsed time**.

This was chosen over a word game or a Connections clone because it teaches the
thing club players actually get wrong — overlap — rather than wearing volleyball
as a theme.

## Decisions

- **Receiving only.** Every puzzle is the moment the opponent contacts the serve.
  Our team never serves, so the libero is always on court and all six players are
  bound by the positional rules (a server would be exempt).
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
- **No par / no optimisation.** An earlier design scored the setter's distance to
  their release point against a generator-computed "par". Dropped: the separation
  and spread constraints are non-convex, so par could not be claimed optimal. The
  setter is a pass/fail radius check instead, which also removes the optimiser
  from the generator entirely.

## Coordinate system

Metres, from our team's point of view facing the net:

- `x` — `0` at the left sideline, `9` at the right sideline.
- `y` — `0` at the net, `9` at our end line. The attack line is `y = 3`.

Front row is P4 (left), P3 (centre), P2 (right); back row is P5 (left),
P6 (centre), P1 (right).

## Rules model

### Rotational structure

The starting lineup always follows the standard 5-1 circle:

```ts
const LINEUP_CYCLE = ['OH', 'S', 'MB', 'OH', 'OPP', 'MB'] as const;
```

Diagonal pairs sit three apart in the cycle, so the required diagonals
(OH↔OH, S↔OPP, MB↔MB) fall out automatically in every rotation and never need
to be checked separately.

A rotation is a phase offset. With `start` holding the R1 lineup as P1..P6 and
`phase` the number of rotations elapsed, the player currently in position `k` is
`start[(k - 1 + phase) % 6]`.

Because the two middles are diagonal, exactly one is back row in every rotation.
The libero replaces that middle, so:

- the on-court middle is **always front row**;
- the libero is **always back row**, at P1, P5 or P6;
- exactly six players are on court, always.

### Constraints

All are hard. Breaking any one makes the attempt illegal — there is no partial
credit.

**Rulebook** (FIVB 7.4, positions at the moment of service contact):

| | |
|---|---|
| Depth | `y5 > y4`, `y6 > y3`, `y1 > y2` — each back-row player behind their *corresponding* front-row player (4↔5, 3↔6, 2↔1), which is **not** the same pairing as the diagonals |
| Lateral | `x4 < x3 < x2` and `x5 < x6 < x1` |
| In court | every player within `0 ≤ x ≤ 9`, `0 ≤ y ≤ 9` |

Ordering is strict: two players on exactly equal coordinates is a fault.

Nothing constrains P4 against P6, or P5 against P2. That asymmetry is the main
thing the game teaches.

**Physical sanity** (not a rule — bodies):

- no two players within `0.7 m` of each other.

**Team system** (our convention, and labelled as such in the UI so the game does
not teach doctrine as law):

- the three passers are the libero and **both** outsides — exactly three, every
  rotation, regardless of which outside is front row;
- each passer between `5 m` and `7 m` from the net;
- passers at least `2 m` from each other;
- the (always front-row) middle within `1.5 m` of the net;
- the opposite, **when front row**, within `2 m` of the net; unconstrained when
  back row;
- the setter within `setterRadius` of `setterTarget`.

`setterTarget` defaults to `(6.5, 0.5)` — near the net, right of centre — for all
six rotations, and is stored per puzzle so it can be tuned. The setting position
does not physically move between rotations; what changes is how close the setter
can legally get, which is absorbed by `setterRadius`.

### Where the difficulty comes from

The passing band collides with the depth rule. A front-row outside passing at
`y = 6` forces whoever is at P5 deeper still. If that is the libero, they are
squeezed into `6 < y ≤ 7`. If it is the setter, the setter is pinned six metres
from the net and cannot reach their release point — the rotational headache real
teams build their lineups around. The shape of the squeeze changes every
rotation.

## Data

### Squad — `src/data/squad.ts`

One fixed fictional squad of 14, the same every day, so regulars come to know it
the way they know a real team sheet: 2 setters, 2 opposites, 4 outsides,
4 middles, 2 liberos. Shirt number → role.

### Puzzle bank — `src/data/rotations.ts`

Generated ahead of time and committed, following the repo convention that
`src/data/` is the source of truth. Roughly two years of entries, each:

```ts
interface RotationPuzzle {
  id: number;              // daily index
  start: ShirtNumber[];    // R1 lineup, P1..P6, roles matching LINEUP_CYCLE
  libero: ShirtNumber;
  phase: 0 | 1 | 2 | 3 | 4 | 5;
  setterTarget: Vec2;
  setterRadius: number;    // difficulty dial
}
```

The client selects by days elapsed in `Europe/London`. The bank is visible in
devtools; so was Wordle's. Not worth obfuscating.

### Generation

`scripts/generate-rotations.ts`, run manually, working **backwards** so every
puzzle is solvable by construction:

1. pick role-slot players from the squad and a phase;
2. construct a random formation satisfying every constraint except the setter
   radius;
3. nudge the setter toward the target by local search while staying legal;
4. set `setterRadius` to the achieved distance plus slack — slack is the
   difficulty dial;
5. re-run the validator on the constructed formation and discard the puzzle if it
   does not pass.

## Library — `src/lib/rotation.ts`

Pure, no DOM, fully unit-tested. Holds `LINEUP_CYCLE`, the phase/slot maths, the
libero substitution, and the validator.

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

The rulebook and physical constraints are appended to every puzzle; the system
constraints come from the bank entry. `validate()` returns a list of violations,
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
line at 3 m, aspect-ratio locked, designed at 320 px first.

**Placing.** Drag with pointer and touch. Keyboard: focus a tile, nudge with the
arrow keys in 0.25 m steps — playable without a mouse, with `:focus-visible`
rings per the site convention. Submit is disabled until all six are placed.

**No live validation.** Showing faults during the drag would hand over the
puzzle.

**Reveal.** On submit, every violation is drawn as an arrow between the
implicated players with one sentence each — "your libero at P5 is 0.4 m in front
of your outside at P4; back-row players must stay behind their front-row
partner." Violations are announced in an `aria-live` region. The board stays
editable for the next attempt.

## State and sharing

`localStorage['lh-rotation']`: puzzle id, attempts, elapsed ms, solved flag,
current placement, streak, last-played date. Returning after solving shows the
result and a countdown to the next puzzle.

The timer starts on first interaction, not page load, and stops on the solving
submission.

```
Lionhearts Rotation #12
✅ 3 attempts · 2:31
🔥 streak 6
lionheartslondon.com/game
```

Copy to clipboard plus a WhatsApp share link built from `WHATSAPP_URL`'s sibling
share intent.

## Testing

Vitest, on the library only, matching the repo's existing test scope:

- one table-driven case per `Constraint` kind — a known-legal formation, then one
  deliberate single violation at a time;
- the strict-ordering boundary: exactly equal coordinates is a fault;
- phase maths: every rotation produces legal diagonals, exactly one back-row
  middle, and the libero in a back-row slot;
- bank integrity: every puzzle in `src/data/rotations.ts` validates against its
  own generated formation.

## Out of scope

- Serving formations (and the seventh tile / libero-off case they imply).
- The opposing team's positions.
- 6-2 systems, two liberos in play, receive patterns other than three-passer.
- Any server, account, or live leaderboard. Competition happens in the group chat.

## Open

Visual design is undecided — the court, tiles, and reveal all need browser
mockups shown as options before implementation, per the project convention.
