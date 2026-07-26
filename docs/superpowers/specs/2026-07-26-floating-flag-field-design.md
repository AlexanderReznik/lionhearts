# Floating Flag Field — Community Section

**Date:** 2026-07-26
**Component:** `src/components/CommunitySection.astro`
**Status:** Implemented

## Goal

Replace the community section's static wrapped grid of member-nationality flags
with a living **floating flag field**: the same rectangular rounded-chip flags,
scattered organically, gently drifting and softly reacting to the cursor.

Reference: `Lionhearts_Website_Assets/Screenshot 2026-07-26 at 11.04.25.png` — a
round cluster of flags beside the headline, over concentric rings.

## Decisions (as built)

- **Flag shape:** rounded-rectangle chips (no circular crop).
- **Motion:** gentle continuous drift **plus** soft cursor repulsion (chips
  nudge away from the pointer, ease back).
- **Layout:** two-column on wide screens — headline left, round flag cluster
  right (matches the reference). Stacks to one column below 900px.
- **Cluster shape:** a disc where there's room; a full-width rectangular field
  on narrow screens (a circle can't hold ~27 chips on a phone without heavy
  overlap).
- **Backdrop:** the brand **Pride Circle** concentric rings
  (`src/assets/decor/pride-circle.svg`, light-blue at 12% opacity) centred
  behind the cluster — circle mode only.

## Architecture

### Progressive enhancement (core structural choice)

Flags render in a `flex-wrap` grid card by default. A client `<script>` upgrades
the container into an absolutely-positioned floating field **only when** JS runs
**and** `prefers-reduced-motion` is not set.

- **No JS / reduced-motion:** the static grid card — fully accessible, no motion,
  no layout-shift risk.
- **JS + motion OK:** the container gets `is-floating`; the script measures,
  positions each chip, and runs the animation loop.

All positions/transforms are applied by the script at runtime (the accepted
animation exception, like the theme boot script), never hand-written
`style="..."`.

### Layout: blue-noise scatter with a guaranteed min gap

Pure random or jittered-grid placement either overlaps or still reads as a grid.
Instead, `src/lib/flagField.ts` provides two deterministic scatterers (no
`Math.random`, so layout is stable across reloads and unit-testable), both using
**Mitchell's best-candidate** (blue-noise) placement:

- `scatterPositions(count, width, height, candidates, minDist)` — rectangular
  field.
- `scatterInCircle(count, radius, candidates, minDist)` — disc.

Both finish with a **relaxation pass** (`separate`) that pushes any pair closer
than `minDist` apart and pulls each point back inside the field. The component
passes `minDist = √(44² + 32²) + 12 ≈ 66px` — beyond the chip diagonal (two
44×32 chips can't overlap past ~55px of centre spacing) plus headroom for the
±5px ambient drift — so the resting layout is provably overlap-free and stays
clean while drifting.

### Layout selection (`layout()`)

1. Target disc `diameter = 2·√(count · AREA_PER_FLAG / π)` (density-constant, so
   it grows with the flag count).
2. If `diameter` fits the field width → **circle mode**: `is-circle` sheds the
   card chrome, the disc is centred, and the Pride Circle rings show behind it.
3. Otherwise (narrow screens) → **rectangular scatter**: cols/rows only size the
   field height; flags fill it freely.

Recomputed on debounced resize; the rAF loop pauses when the section is offscreen
(IntersectionObserver).

### Motion: two layers combined per frame (rAF loop)

1. **Drift:** each chip orbits its home on a tiny Lissajous path with per-index
   phase/frequency (all out of sync), ~±5px.
2. **Cursor repulsion:** chips within a radius of the pointer are pushed radially
   outward with distance falloff (`repulse`), easing back when it leaves.

Summed and applied as one `transform: translate()` lerped toward target each
frame — GPU-friendly, no reflow.

### Files

- `src/lib/flagField.ts` — pure helpers: `scatterPositions`, `scatterInCircle`,
  `separate` (relaxation), `repulse`.
- `src/assets/decor/pride-circle.svg` — brand rings backdrop (astro:assets
  inline SVG component; decorative, `aria-hidden`, `pointer-events: none`).
- `src/components/CommunitySection.astro` — two-column `__top` grid, class hooks,
  scoped styles, and the client animation script.

## Testing

- **Vitest (`tests/lib/flagField.test.ts`):** count, in-bounds, determinism,
  spread (no clumping), not-a-grid, and the guaranteed min gap for both
  scatterers; `repulse` falloff/direction/edge cases.
- **Manual (Chrome DevTools MCP):** verified circle (desktop) and rectangle
  (mobile) modes, 0 resting overlaps, no horizontal overflow at 320/375/414,
  drift + repulsion, rings shown only in circle mode, and reduced-motion / no-JS
  falling back to the static grid.
- `npm test` green; production build compiles the SVG import.

## Non-goals / YAGNI

- No circular flag crop, no two-column relayout on mobile.
- No chip-to-chip collision physics — only pointer repulsion (which may briefly
  overlap a neighbour while actively shoving it; resting state stays clean).
- No per-load randomness — layout is deterministic.
