# Floating Flag Field — Community Section

**Date:** 2026-07-26
**Component:** `src/components/CommunitySection.astro`
**Status:** Approved (design), pending implementation

## Goal

Replace the community section's static wrapped grid of member-nationality flags
with a living **floating flag field**: the same rectangular rounded-chip flags,
scattered in an organic cluster, gently drifting and softly reacting to the
cursor. Header stays stacked above the field (current layout), navy
`.section--feature` surface, no concentric rings.

Reference: `Lionhearts_Website_Assets/Screenshot 2026-07-26 at 11.04.25.png`
(approximate inspiration — we keep rectangular chips, drop the rings, and keep
the header above rather than beside).

## Decisions (from brainstorming)

- **Layout:** keep header stacked above; replace only the grid card with the
  floating cluster.
- **Flag shape:** keep the current rounded-rectangle chips (no circular crop).
- **Motion:** gentle continuous drift **plus** soft cursor repulsion (chips
  nudge away from the pointer, ease back).
- **Backdrop:** no rings — plain navy feature surface + existing blue radial
  glow (`.community::before`).

## Architecture

### Progressive enhancement (core structural choice)

The flags render in today's `flex-wrap` grid card by default. A client
`<script>` upgrades the container into an absolutely-positioned floating field
**only when** JS runs **and** `prefers-reduced-motion` is not set.

- **No JS / reduced-motion:** current tidy grid — fully accessible, no motion,
  no layout-shift risk. This is the graceful fallback, not a separate codepath
  to maintain.
- **JS + motion OK:** container gets an `is-floating` class; scoped CSS switches
  it to `position: relative` with a derived height; the script positions each
  chip and runs the animation loop.

This keeps authored markup free of inline styles — all positions/transforms are
applied by the script at runtime (the accepted animation exception, like the
theme boot script), never hand-written `style="..."`.

### Layout: jittered grid (deterministic)

Pure random scatter overlaps badly with 27 chips. Instead:

1. Choose column count from the field's measured width (~6 desktop, ~4 mobile).
2. Lay chips on that loose grid (cell = chip + gap).
3. Offset each cell by a fixed **per-index** jitter (deterministic, derived from
   the index — **no `Math.random`**), so it reads as organic scatter but is
   stable across reloads and unit-testable.
4. Field height derives from the row count → responsive, never overflows at
   320 / 375 / 414.

### Motion: two layers combined per frame (rAF loop)

1. **Drift:** each chip orbits its home cell on a tiny Lissajous path with
   per-index phase/frequency offsets (all out of sync), ~±6px, slow.
2. **Cursor repulsion:** chips within a radius of the pointer are pushed
   radially outward with distance falloff; the offset eases back to zero when
   the pointer leaves.

Drift + repulsion are summed and applied as one `transform: translate()` lerped
toward its target each frame — GPU-friendly, no reflow. The loop pauses when the
section is offscreen (IntersectionObserver) to save cycles.

### Files

- `src/lib/flagField.ts` (new) — pure, testable helpers:
  - `computeHomePositions(count, cols, cellW, cellH, jitter)` → `{x, y}[]`
  - `repulse(pointer, home, radius, strength)` → `{dx, dy}` offset vector
- `src/components/CommunitySection.astro` — class hooks on the mosaic +
  per-flag wrapper, scoped `.is-floating` styles, and the client `<script>`
  that measures, positions, and animates using the helpers.

## Testing

- **Vitest (`src/lib/flagField.ts`):**
  - `computeHomePositions`: returns exactly `count` positions; all within the
    field bounds; deterministic (same inputs → same output); row/column count
    correct for given `cols`.
  - `repulse`: zero offset beyond `radius`; monotonic falloff (closer → larger
    push); pushes directly away from the pointer; zero when pointer coincides
    with home (no divide-by-zero / NaN).
- **Manual (Chrome DevTools MCP):** verify no horizontal overflow at 320/375/414
  (`emulate` mobile viewport), drift + cursor repulsion feel right on desktop,
  and reduced-motion / no-JS falls back to the static grid.
- `npm test` stays green.

## Non-goals / YAGNI

- No circular flag crop, no concentric rings, no two-column relayout.
- No physics between flags (no chip-to-chip collision) — only pointer repulsion.
- No per-load randomness — layout is deterministic.
