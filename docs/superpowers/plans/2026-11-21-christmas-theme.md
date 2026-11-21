# Christmas Theme Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a decoration-only Christmas layer (Santa hat, fairy lights, whole-page snow, footer volleyball baubles) that the build switches on from 1 Dec to 5 Jan.

**Architecture:** A pure, tested date gate (`src/lib/season.ts`) runs once per page in `BaseLayout`. When it's on, `BaseLayout` renders four self-contained `Christmas*.astro` components. Each one carries its own `<style is:inline>` with `christmas-`-prefixed classes, so neither the markup nor the CSS reaches the built site out of season. `Nav` and `Footer` get a `christmas` prop and render their decoration conditionally.

**Tech Stack:** Astro 6 (static), TypeScript strict, Vitest, native SVG-component imports.

**Spec:** `docs/superpowers/specs/2026-11-21-christmas-theme-design.md`

## Global Constraints

- Work on branch `feat/christmas-theme` (we're on `main`; CLAUDE.md: branch first). Commits use `type(scope): subject` with scope `theme`, a body explaining the why plus what was verified, and end with `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`. Run git from the project root, never `git -C`.
- Season window: the Europe/London calendar date is **1–31 December or 1–5 January**, any year.
- Override env var `CHRISTMAS_THEME`: `'on'` forces on, `'off'` forces off, anything else (including unset or a different case) means "by date". Strict string compare.
- Colours are brand tokens only: `--lh-red`, `--lh-green`, `--lh-blue`, `--lh-white`, `--lh-navy`, `--lh-blue-300`, `--lh-slate`, `--lh-slate-200`, `--lh-slate-400`, `--lh-grey-400`. Theme-dependent colours are `light-dark(LIGHT, DARK)` values, never `html[data-theme]` selectors. No gradients beyond the flake dots.
- Every decoration: `aria-hidden="true"`, `pointer-events: none`, hidden in `@media print`, motionless under `prefers-reduced-motion: reduce` but still visible.
- Decoration CSS lives only in `<style is:inline>` inside the `Christmas*.astro` components, with classes prefixed `christmas-`. Any change to `Nav.astro`/`Footer.astro` scoped CSS must be colour-neutral (only `position: relative`).
- Stacking: snow `z-index: 90`, below the sticky nav (100), the skip link (100) and the mobile overlay (200).
- No inline `style=""` attributes. CSS custom properties set from a per-element modifier class are fine.
- Dev server: never kill the user's server. Start your own with `CHRISTMAS_THEME=on SKIP_VOLLEYZONE=true SKIP_BEHOLD=true npm run dev > /tmp/lh-dev.log 2>&1 & MY_DEV_PID=$!`, read its port from the log, and `kill "$MY_DEV_PID"` when done.
- Builds for verification: `SKIP_VOLLEYZONE=true SKIP_BEHOLD=true` with `CHRISTMAS_THEME` set explicitly.

## Review Focus

1. **Taps under decorations:** the hero carousel dots, the tryouts-bar link (under the lights) and `/join` form fields (under the snow) must still respond. Owning task: Task 2 (snow) and Task 3 (lights), with an `elementFromPoint` check.
2. **Mobile menu open in season:** the overlay (z 200) must cover the snow and the hat, and its close button must stay tappable. Owning task: Task 4.
3. **Horizontal overflow at 320px:** the 3000px-wide light strip and the right-anchored baubles must not widen the page. Owning tasks: Task 3 and Task 5, with a `scrollWidth` check.
4. **No-JS OS-dark visitor:** with no `data-theme` and the OS set to dark, the flake edges, the white-bulb outline and the bauble strings must take their dark values. Owning task: Task 6, by emulating `prefers-color-scheme: dark` with the `data-theme` attribute removed.
5. **Homepage with the tryouts bar showing:** the lights hang over the navy bar in the light theme and must still read clearly without hiding its link. Owning task: Task 3. `getUpcomingTryouts` has no fallback data, so force the bar on with a temporary, uncommitted edit in `index.astro` that passes one fake future tryout to `<TryoutsAlertBar>`.

---

### Task 1: Season gate

**Files:**
- Create: `src/lib/season.ts`
- Modify: `src/lib/sheets.ts:254-271` (export `londonParts`)
- Modify: `src/env.d.ts` (add `CHRISTMAS_THEME`)
- Test: `tests/lib/season.test.ts`

**Interfaces:**
- Consumes: `londonParts(instant: Date): { y: number; m: number; d: number; time: string; dow: number }` from `src/lib/sheets.ts` (currently private; export it unchanged).
- Produces: `isChristmasSeason(now: Date, override?: string): boolean` from `src/lib/season.ts`; `ImportMetaEnv.CHRISTMAS_THEME?: string`.

- [ ] **Step 1: Branch, then commit the spec and plan**

```bash
git switch -c feat/christmas-theme
git add docs/superpowers/specs/2026-11-21-christmas-theme-design.md docs/superpowers/plans/2026-11-21-christmas-theme.md
git commit -m "docs(theme): add Christmas theme design spec and plan"
```

- [ ] **Step 2: Write the failing test** in `tests/lib/season.test.ts`

```ts
import { describe, it, expect } from 'vitest';
import { isChristmasSeason } from '../../src/lib/season';

const at = (iso: string) => new Date(iso);

describe('isChristmasSeason', () => {
  it('is off on 30 November', () => {
    expect(isChristmasSeason(at('2026-11-30T12:00:00Z'))).toBe(false);
    expect(isChristmasSeason(at('2026-11-30T23:59:59Z'))).toBe(false);
  });
  it('turns on at the first moment of 1 December, London time', () => {
    expect(isChristmasSeason(at('2026-12-01T00:00:00Z'))).toBe(true);
  });
  it('stays on through Christmas and New Year', () => {
    for (const iso of ['2026-12-25T12:00:00Z', '2026-12-31T23:59:59Z', '2027-01-01T00:00:00Z']) {
      expect(isChristmasSeason(at(iso))).toBe(true);
    }
  });
  it('stays on until the end of 5 January, London time', () => {
    expect(isChristmasSeason(at('2027-01-05T23:59:59Z'))).toBe(true);
  });
  it('is off from 6 January', () => {
    expect(isChristmasSeason(at('2027-01-06T00:00:00Z'))).toBe(false);
  });
  it('is off mid-year', () => {
    expect(isChristmasSeason(at('2026-07-15T12:00:00Z'))).toBe(false);
  });
  it("forces on with 'on'", () => {
    expect(isChristmasSeason(at('2026-07-15T12:00:00Z'), 'on')).toBe(true);
  });
  it("forces off with 'off'", () => {
    expect(isChristmasSeason(at('2026-12-25T12:00:00Z'), 'off')).toBe(false);
  });
  it('falls back to the date for any other override value', () => {
    expect(isChristmasSeason(at('2026-07-15T12:00:00Z'), 'true')).toBe(false);
    expect(isChristmasSeason(at('2026-12-25T12:00:00Z'), 'ON')).toBe(true);
    expect(isChristmasSeason(at('2026-12-25T12:00:00Z'), '')).toBe(true);
  });
});
```

- [ ] **Step 3: Run it to verify it fails**

Run: `npx vitest run tests/lib/season.test.ts`
Expected: FAIL, cannot resolve `../../src/lib/season`.

- [ ] **Step 4: Implement**

- `src/lib/sheets.ts`: add `export` to `londonParts`. No other change.
- `src/lib/season.ts`: `export function isChristmasSeason(now: Date, override?: string): boolean`. Return `true` for `'on'` and `false` for `'off'`; otherwise use `londonParts(now)` and return `m === 12 || (m === 1 && d <= 5)`.
- `src/env.d.ts`: add `readonly CHRISTMAS_THEME?: string;` with a one-line doc comment: `"on"`/`"off"` forces the Christmas theme, unset means by date.

- [ ] **Step 5: Run the tests to verify they pass**

Run: `npm test`
Expected: all suites PASS, including the existing `sheets.test.ts`.

- [ ] **Step 6: Commit**

```bash
git add src/lib/season.ts src/lib/sheets.ts src/env.d.ts tests/lib/season.test.ts
git commit -m "feat(theme): add Christmas season date gate"
```

---

### Task 2: Layout wiring and whole-page snow

**Files:**
- Create: `src/components/ChristmasSnow.astro`
- Modify: `src/layouts/BaseLayout.astro`
- Modify: `src/components/Nav.astro` (Props only)
- Modify: `src/components/Footer.astro` (Props only)
- Modify: `src/pages/sponsors/vinarius.astro:20-24` (pass `festive={false}`)

**Interfaces:**
- Consumes: `isChristmasSeason` (Task 1).
- Produces:
  - `BaseLayout` prop `festive?: boolean` (default `true`).
  - `const christmas = festive && isChristmasSeason(new Date(), import.meta.env.CHRISTMAS_THEME)` in `BaseLayout`.
  - `Nav` and `Footer` accept `christmas?: boolean` (default `false`); `BaseLayout` passes `christmas={christmas}` to both.
  - `<ChristmasSnow />` takes no props.

- [ ] **Step 1: Wire `BaseLayout`.** Add the `festive` prop and the `christmas` const. Pass `christmas` to `<Nav>` and `<Footer>`. Render `{christmas && <ChristmasSnow />}` directly after `<Footer />`. Add `christmas?: boolean` to the `Props` of `Nav` and `Footer` (destructured, unused until Tasks 4 and 5). Add `festive={false}` to the Vinarius page's `<BaseLayout>`.

- [ ] **Step 2: Build `ChristmasSnow.astro`.**
  - One `<div class="christmas-snow" aria-hidden="true">` with two child layers, `christmas-snow__far` and `christmas-snow__near`.
  - The container is `position: fixed; inset: 0; z-index: 90; pointer-events: none; overflow: hidden`.
  - Each layer is `position: absolute; left: 0; right: 0; top: -<tile height>; bottom: 0`, so it's one tile taller than the viewport. Each is painted with `radial-gradient` flake dots on a repeating tile, and animated **only** with `transform: translateY(<tile height>)`, linear, infinite. Never animate `background-position`.
  - Near layer: 260×240 tile, 6 dots with a 1.1–1.8px core, 14s. Far layer: 140×120 tile, 4 dots with a 0.8–1px core, opacity 0.6, 16s. The mockup's `.snow-near`/`.snow-far` in `.superpowers/brainstorm/17545-1795264923/content/bauble-placement.html` give the dot positions.
  - Flake core `var(--lh-white)`. Flake edge `--christmas-flake-edge: light-dark(var(--lh-blue-300), rgb(255 255 255 / 0.55))`. If the light edge is hard to see on the white `/sessions` content, switch to `--lh-slate-400`.
  - Under `prefers-reduced-motion: reduce`: no animation. Under `@media print`: `display: none`.

- [ ] **Step 3: Build verification**

Run: `CHRISTMAS_THEME=on SKIP_VOLLEYZONE=true SKIP_BEHOLD=true npm run build && grep -L "christmas-snow" $(find dist -name '*.html')`
Expected: the only file listed is `dist/sponsors/vinarius/index.html`.

Run: `CHRISTMAS_THEME=off SKIP_VOLLEYZONE=true SKIP_BEHOLD=true npm run build && grep -rl "christmas-" dist | wc -l`
Expected: `0`.

- [ ] **Step 4: Browser check** (your own dev server, `CHRISTMAS_THEME=on`). On `/`, `/sessions` and `/join`, at 375 and 1280, in light and dark:
  - snow falls over content and under the nav
  - `document.elementFromPoint` at the centre of the "Join the Club" button, the first hero dot and the first `/join` input returns that element, not snow
  - scrolling stays smooth: a DevTools performance trace shows no full-viewport repaint per frame

- [ ] **Step 5: Run tests and commit**

```bash
npm test
git add src/layouts/BaseLayout.astro src/components/ChristmasSnow.astro src/components/Nav.astro src/components/Footer.astro src/pages/sponsors/vinarius.astro
git commit -m "feat(theme): add seasonal layout gate and whole-page snow"
```

---

### Task 3: Fairy lights

**Files:**
- Create: `src/components/ChristmasLights.astro`
- Modify: `src/layouts/BaseLayout.astro` (render as `<main>`'s first child)

**Interfaces:**
- Consumes: `christmas` in `BaseLayout` (Task 2).
- Produces: `<ChristmasLights />`, no props.

- [ ] **Step 1: Build `ChristmasLights.astro`.**
  - Outer `<div class="christmas-lights" aria-hidden="true">`: `position: relative; height: 0; z-index: 5`. Inside it, `christmas-lights__strip`: `position: absolute; top: -1px; left: 0; right: 0; overflow: hidden; pointer-events: none`, holding one inline `<svg>` that is **3000px wide** (fixed width attribute, not 100%) and about 22px tall.
  - Generate the geometry in the component frontmatter:
    - bulb spacing `s = 26`; scallop width `2s`; sag `s / 2`
    - wire path `M0 1 Q s (1+sag) 2s 1` followed by `T` segments every `2s` up to 3000
    - bulbs centred at `x = s/2 + i·s` for `i < ceil(3000 / s)`, hung at the quarter-point height `0.625 + 0.375·(1 + sag)`
  - Each bulb is a `<use href="#christmas-bulb">` of a `<symbol>` holding a cap rect (`--lh-grey-400`) and an ellipse (`currentColor`), about 10×15px.
  - Classes cycle `christmas-bulb--blue|red|green|white` by `i % 4` (`--lh-blue`, `--lh-red`, `--lh-green`, `--lh-white`). The white bulb gets `stroke: light-dark(rgb(17 35 75 / 0.3), transparent)`. Wire stroke `--lh-slate`, 1.1px.
  - Twinkle: opacity 0.5 ↔ 1, 1.6s, alternate. Stagger through four delay classes by `i % 4`, offset from the colour cycle (e.g. `(i + 2) % 4`) so the same colour doesn't pulse in unison. `drop-shadow(0 0 2px currentColor)`.
  - Under reduced motion: no animation, opacity 1. In print: hidden.
- [ ] **Step 2: Render it** in `BaseLayout` as `{christmas && <ChristmasLights />}` immediately inside `<main id="main">`, before `<slot />`. Don't add positioning to `<main>`.

- [ ] **Step 3: Browser check** (`CHRISTMAS_THEME=on`). On `/`, `/sessions`, `/fixtures` and `/404` at 320, 375, 414 and 1280, in light and dark:
  - the lights hang directly under the nav and scroll away
  - `document.documentElement.scrollWidth === document.documentElement.clientWidth`
  - on `/` with the tryouts bar showing, the bulbs read over the navy bar and `elementFromPoint` on its "See Dates & Sign Up" link returns the link. To show the bar, temporarily pass `tryouts={[{ ...a fake future Tryout }]}` in `index.astro`, then revert it before committing (`git diff src/pages/index.astro` must be empty).

- [ ] **Step 4: Run tests and commit**

```bash
npm test
git add src/components/ChristmasLights.astro src/layouts/BaseLayout.astro
git commit -m "feat(theme): hang fairy lights under the nav in season"
```

---

### Task 4: Santa hat on the nav crest

**Files:**
- Create: `src/assets/decor/santa-hat.svg`
- Create: `src/components/ChristmasHat.astro`
- Modify: `src/components/Nav.astro:21-23` (render the hat) and `:110-116` (`.nav__logo` gets `position: relative`)

**Interfaces:**
- Consumes: the `christmas` prop on `Nav` (Task 2).
- Produces: `<ChristmasHat />`, no props.

- [ ] **Step 1: Add `santa-hat.svg`.** Use `viewBox="0 0 60 48"` with fixed fills, no wrapper `id`, no `<style>`:
  - body `M8 36 C 12 18, 28 6, 48 8 C 42 14, 40 24, 44 36 Z` in `#c44128`
  - brim `rect x=3 y=32 w=46 h=11 rx=5.5` in white
  - pompom `circle cx=49 cy=9 r=6` in white
  - the brim and pompom take `stroke="rgba(17,35,75,.22)"` at width 1.2
- [ ] **Step 2: Build `ChristmasHat.astro`.** Import the SVG as a component (same pattern as `PrideCircle` in `CommunitySection.astro`) and render it with `class="christmas-hat"` and `aria-hidden="true"`. Style: `position: absolute; width: 27px; top: -9px; left: 12px; transform: rotate(12deg); pointer-events: none`. Print: hidden.
- [ ] **Step 3: Render it** in `Nav.astro` as `{christmas && <ChristmasHat />}` inside `.nav__logo`, after `<BrandLogo>`. Add `position: relative` to `.nav__logo`.
- [ ] **Step 4: Browser check** (`CHRISTMAS_THEME=on`) at 320, 375 and 1280, in light and dark:
  - the hat sits on the crest's head, isn't clipped, and stays within the 68px nav
  - the crest link's bounding box is unchanged from a `CHRISTMAS_THEME=off` run
  - with the mobile menu open at 375, the overlay covers the hat and the snow, and `elementFromPoint` on `.nav__overlay-close` returns the close button
- [ ] **Step 5: Run tests and commit**

```bash
npm test
git add src/assets/decor/santa-hat.svg src/components/ChristmasHat.astro src/components/Nav.astro
git commit -m "feat(theme): put a Santa hat on the nav crest in season"
```

---

### Task 5: Volleyball baubles over the footer

**Files:**
- Create: `src/components/ChristmasBaubles.astro`
- Modify: `src/components/Footer.astro` (render as `<footer>`'s first child; `.footer` gets `position: relative`)

**Interfaces:**
- Consumes: the `christmas` prop on `Footer` (Task 2); `Icon` with `name="session"` (`src/components/Icon.astro`).
- Produces: `<ChristmasBaubles />`, no props.

- [ ] **Step 1: Build `ChristmasBaubles.astro`.**
  - **Structure:** a static block `<div class="christmas-baubles" aria-hidden="true">` that acts as the **spacer** (its height is the extra clearance). Inside it go three `christmas-bauble` elements, absolutely positioned against `.footer` with `top: 0`.
  - **Each bauble:** the string is a `::before` (1px wide, height `var(--christmas-string)`, colour `light-dark(rgb(17 35 75 / 0.4), rgb(255 255 255 / 0.6))`). Below it sits a cap (`--lh-grey-400`, about 6×4px), then the ball. The ball is a circle whose background is the seam colour, holding `<Icon name="session" />` at 100% size, coloured by `color`.
  - **Colourways (right to left):** `--blue` (panels `--lh-blue`, seams white), `--white` (panels white, seams `--lh-navy`), `--red` (panels `--lh-red`, seams white).
  - **Horizontal position:** the rightmost ball centre sits at the content edge, `right: max(var(--page-px), calc((100% - var(--max-width)) / 2 + var(--page-px)))`. The other balls are 48px apart, centre to centre.
  - **Sizes:** ball 34px on desktop, 30px at ≤768px. String lengths come from modifier-class custom properties: desktop 16 / 40 / 26px, ≤768px 10 / 28 / 18px.
  - **Spacer height:** the smallest value that leaves at least **12px** between the lowest ball and the footer's first content (the footer already has a 52px top padding above the spacer). Set it per breakpoint by measuring in the browser, not by calculating.
  - **Motion:** sway ±5° around the top of the string, 3.6s, alternate, staggered with `animation-delay` modifiers. None under reduced motion. Hidden in print.
- [ ] **Step 2: Render it** in `Footer.astro` as `{christmas && <ChristmasBaubles />}` as `<footer>`'s first child. Add `position: relative` to `.footer`.
- [ ] **Step 3: Browser check** (`CHRISTMAS_THEME=on`) at 320, 375, 414, 768, 769 and 1280, in light and dark:
  - the lowest ball's `getBoundingClientRect().bottom` plus 12 is ≤ the top of the first element in `.footer__inner`
  - no ball's box intersects the crest or any link
  - `scrollWidth === clientWidth`
  - the balls look like the designer's volleyball, with clean seams and no halo at the edge
- [ ] **Step 4: Run tests and commit**

```bash
npm test
git add src/components/ChristmasBaubles.astro src/components/Footer.astro
git commit -m "feat(theme): hang volleyball baubles over the footer in season"
```

---

### Task 6: Full verification sweep and docs

**Files:**
- Modify: `CLAUDE.md` (new "Christmas theme" subsection under Design System)

- [ ] **Step 1: Out-of-season build ships nothing.**

Run: `CHRISTMAS_THEME=off SKIP_VOLLEYZONE=true SKIP_BEHOLD=true npm run build && grep -rl "christmas-" dist | wc -l`
Expected: `0`.

- [ ] **Step 2: In-season build covers every page except Vinarius.**

Run: `CHRISTMAS_THEME=on SKIP_VOLLEYZONE=true SKIP_BEHOLD=true npm run build && for c in christmas-snow christmas-lights christmas-hat christmas-baubles; do echo "$c: $(grep -L "$c" $(find dist -name '*.html'))"; done`
Expected: each line lists only `dist/sponsors/vinarius/index.html`.

- [ ] **Step 3: Sweep every page.** That's `/`, `/about`, `/teams`, `/fixtures`, `/sessions`, `/join`, `/join-success`, `/contact`, `/sponsorship` and `/404`, at 320, 375, 414, 768 and 1280, in light and dark. Use Chrome DevTools `emulate` with `viewport: "320x700x2,mobile,touch"` and the matching sizes. Check on every page:
  - no overflow
  - nothing clipped
  - no decoration over a control

- [ ] **Step 4: No-JS OS-dark.** Remove `data-theme` from `<html>` and emulate `prefers-color-scheme: dark`. The flake edges, the white-bulb outline and the bauble strings must show their dark values.

- [ ] **Step 5: Reduced motion.** Emulate `prefers-reduced-motion: reduce`. Every decoration must be visible and nothing animated: `getAnimations().length === 0` on each `christmas-*` element.

- [ ] **Step 6: Vinarius.** With `CHRISTMAS_THEME=on`, `/sponsors/vinarius` shows no decoration.

- [ ] **Step 7: Document it.** Add a "Christmas theme" subsection to `CLAUDE.md` of 6–8 lines covering:
  - the 1 Dec – 5 Jan window and the build-time gate in `src/lib/season.ts`
  - that the nightly rebuild flips it
  - `CHRISTMAS_THEME=on|off` for previews and early switch-off
  - the four `Christmas*.astro` components and their `is:inline` / `christmas-` prefix rule (why: no CSS ships out of season)
  - the Vinarius `festive={false}` opt-out

- [ ] **Step 8: Run tests and commit**

```bash
npm test
git add CLAUDE.md
git commit -m "docs(theme): document the Christmas theme gate and components"
```
