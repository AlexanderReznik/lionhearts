# Christmas theme — design

**Date:** 2026-11-21
**Status:** Approved, ready for implementation planning

## Summary

A decoration-only festive layer that switches itself on every holiday season and
off again afterwards. It adds atmosphere and nothing else: no new copy, no
announcements, no recolouring of the site. Four decorations appear on every page:

1. A **Santa hat** on the lion crest in the sticky nav.
2. Small **fairy lights** hanging from the bottom edge of the nav.
3. **Snow** falling over the whole page.
4. Three **volleyball baubles** hanging from the top edge of the footer.

The theme is on from **1 December to 5 January inclusive** (London dates), decided
at build time. The existing nightly rebuild (01:00 UTC) turns it on and off.

Mockups the decisions were made from:
`.superpowers/brainstorm/17545-1795264923/content/` (`festive-touches.html`,
`festive-combined.html`, `bauble-placement.html`). They're gitignored and
scaled down, so treat them as direction, not spec.

## Goals

- All four decorations on every page that uses `BaseLayout`, except the Vinarius
  sub-brand page (see Decisions).
- Correct in light, dark, and no-JS OS-dark (the `light-dark()` token model).
- Looks good on phones (320 / 375 / 414) as well as desktop.
- Switches on and off with no manual step.

## Non-goals

- No festive copy ("Season's greetings"), holiday-closure notices or other content.
- No change to accents, buttons, tiles or any existing colour.
- No visitor-facing "turn decorations off" control (reduced motion is handled instead).
- Not a general seasonal-theme engine. One season, one date window.

## Anti-goals (a failure even if it technically works)

- A decoration that **intercepts a click or tap**, or hides a button, link or form
  field. Snow passes over text by design, but must never block interaction.
- **Horizontal overflow** at any width.
- Decoration **markup or CSS shipped outside the season**.
- **Janky scrolling** on phones because of the snow.
- Off-brand colours or gradients. Only brand-book colours are used.
- A **flash** of decorations or a **layout shift** on load.

## Constraints

- Everything in `CLAUDE.md` applies: no inline styles, components use semantic
  `--color-*` tokens or `light-dark()` values, minimal comments, monochrome
  icons via native SVG-component import, `npm test` stays green, mobile
  verification at 320/375/414 via Chrome DevTools `emulate`.
- Brand-book colours only: `--lh-red` `#c44128`, `--lh-green` `#76cd54`,
  `--lh-blue` `#54a4f7`, white, the navy ramp, and the slate/grey neutrals.
  All are already registered in `src/styles/global.css`.
- Static Astro site. Production rebuilds come from the GitHub Actions cron
  (`.github/workflows/daily-rebuild.yml`, 01:00 UTC) hitting the Vercel deploy hook.

## Approaches considered

**How the theme knows it's Christmas** (chosen: 1)

1. **Build-time date gate.** A pure, tested date function decides at build; the
   nightly rebuild flips it. No client JS, no flash, nothing ships out of season,
   same pattern as the build-time fixtures and Instagram fetches. Cost: if a
   nightly build fails, the switch happens a day late.
2. **Client-side date check.** Decorations always shipped, hidden; an inline
   head script reveals them by the visitor's clock. Exact-midnight switching, but
   every visitor downloads unused decoration all year, no-JS visitors never see
   it, and the existing theme boot script gains a second rule.
3. **Manual flag** in `src/data/club.ts`. Simplest, but someone has to remember
   twice a year. Contradicts "shows during the holidays on its own".

**Where the baubles go** (chosen: footer)

- In the top band of each page, next to the lights. Rejected by the user: lights
  plus baubles at the top was too much.
- On the light string, replacing every sixth bulb. Rejected: still all at the top.
- **Hanging from the footer's top edge.** Chosen: gives the baubles their own place.

**Where snow falls** (chosen: whole page)

- Only in each page's top band. Keeps content clear.
- **Over the whole page, as you scroll.** Chosen by the user for atmosphere.

## Design

### 1. Season gate

New `src/lib/season.ts`:

```ts
export function isChristmasSeason(now: Date, override?: string): boolean
```

- **Window:** the Europe/London calendar date is 1–31 December or 1–5 January,
  any year. Compute the London date with `Intl` (`timeZone: 'Europe/London'`).
  `src/lib/sheets.ts` already has a private `londonParts()` helper: export and
  reuse it (or move it to a small shared date module) instead of duplicating it.
- **Override:** env var `CHRISTMAS_THEME`. `'on'` forces the theme on, `'off'`
  forces it off, anything else (including unset) means "by date". Strict string
  compare, like the `SKIP_*` flags. Declare it in `src/env.d.ts` alongside the
  others.
- **Tests** in `tests/lib/season.test.ts`: 30 Nov → off; 1 Dec 00:00 London → on;
  25 Dec, 31 Dec, 1 Jan → on; 5 Jan 23:59 London → on; 6 Jan 00:00 London → off;
  a mid-year date → off; `'on'` in July → on; `'off'` on 25 Dec → off; an
  unrecognised override value → falls back to the date.

`BaseLayout.astro` evaluates it once per render:

```ts
const christmas = festive && isChristmasSeason(new Date(), import.meta.env.CHRISTMAS_THEME);
```

`festive` is a new optional `BaseLayout` prop, default `true`.
`src/pages/sponsors/vinarius.astro` passes `festive={false}`. BaseLayout passes
`christmas` down to `Nav` and `Footer` as a prop and renders the snow and lights
only when it's true.

**Timing.** The 01:00 UTC build on 1 Dec turns it on. The build on 6 Jan turns
it off. Any other deploy re-evaluates too. In December and early January London
is on GMT, so London and UTC dates agree at build time.

### 2. Santa hat (nav crest)

- New asset `src/assets/decor/santa-hat.svg`: body in `--lh-red`, white brim and
  pompom with a faint navy outline so the white parts read on the white
  light-theme nav. It's multi-colour, so it's imported as an SVG component with
  fixed fills, like `pride-circle.svg` in `CommunitySection.astro`, not through
  `Icon.astro`.
- Rendered in `Nav.astro` inside the `.nav__logo` link, absolutely positioned
  over the top of the crest, tilted about 12° (mockup: about 75% of the crest's
  width, sitting on the top-right of the head). `aria-hidden="true"`,
  `pointer-events: none`.
- The crest's layout box must not change. The hat must not be clipped by, or
  stick out of, the 68px nav at any width.
- Applies to the one nav crest, which serves desktop and mobile. The mobile
  overlay has no crest. The footer crest gets no hat.

### 3. Fairy lights (bottom edge of the nav)

- A thin strip (≤ ~22px tall) absolutely positioned at the **top of `<main>`**,
  full width, above the first section's content and below the nav. It looks
  hung from the nav when the page loads, then **scrolls away with the page**
  instead of following the sticky nav. On the homepage it hangs over the
  tryouts bar when that's showing, otherwise over the hero.
- Don't turn `<main>` itself into a positioning context (that could re-anchor
  absolutely positioned page content). Render the lights as `<main>`'s first child
  inside a zero-height `position: relative` wrapper, with the strip absolutely
  positioned inside it.
- A scalloped wire (every scallop sags downward) with bulbs at the quarter points
  of each scallop. On phones, bulbs are about 10×15px and about 26px apart. The
  whole strip scales up 1.25× from 768px and 1.5× from 1280px, so bigger screens
  get bigger lights. Colours cycle blue / red / green / white from the brand tokens.
  In the light theme the white bulb gets a faint outline via `light-dark()` so
  it shows on pale surfaces. The wire uses a dark neutral brand token.
- Twinkle: each bulb fades between about 50% and 100% opacity over about 1.6s,
  staggered so they don't pulse in unison.
- No JS. It must fill any width without gaps or a clipped half-bulb pattern
  that looks broken.
- `aria-hidden="true"`, `pointer-events: none`.

### 4. Snow (whole page)

- One `position: fixed; inset: 0` layer, `pointer-events: none`,
  `aria-hidden="true"`, stacked **above page content but below the sticky nav**
  (`z-index: 100`), the mobile menu overlay (200) and the skip link (100).
- Two depth layers: near (bigger, faster) and far (smaller, fainter, slower). The
  mockup's density and speeds (about 11s and 16s per tile) are the reference:
  gentle, not a blizzard.
- Flake colour: white core with a thin edge, via `light-dark()`. In the light
  theme a pale blue-grey edge (mockup used `#9bb8d9`; prefer a brand token such
  as `--lh-blue-300` or `--lh-slate-200` if it reads as well). In the dark theme
  a translucent white edge. Flakes must stay visible on white content, the pale
  `--lh-blue-100` page-hero band, the hero photo and navy.
- **Performance:** animate `transform` (a compositor-only `translateY` on a
  layer taller than the viewport), **not** `background-position`, which
  repaints the whole viewport every frame.

### 5. Volleyball baubles (footer)

- Three baubles hanging from the footer's top border, on the right.
- Ball: the designer's volleyball icon `src/assets/icons/session.svg` (six panels,
  `currentColor`, knocked-out seams) rendered through `Icon.astro`, over a
  backing circle in the seam colour. Colourways (mockup order, right to left):
  blue panels / white seams, white panels / navy seams, red panels / white
  seams. Cap in `--lh-grey-400`. String 1px, `light-dark(navy ~40%, white ~60%)`.
- Size: ball about 30px on phones, about 34px on desktop. Strings of differing
  lengths (mockup values were 26 / 58 / 36px; phones go shorter, see below).
- Gentle sway of ±5° around the string's top, about 3.6s, staggered.
- They must **not overlap any footer text, link or the crest at any width**. On
  phones the footer crest is centred (≤768px), not top-left as the mockup showed,
  so at 320px a bauble hanging beside it would clip it. So at **every** width the
  baubles get their own clearance: while the theme is on, a spacer rendered in the
  static HTML at the top of the footer pushes the footer content down just enough,
  and nothing shifts. Phones use shorter strings to keep the added height small.
- `aria-hidden="true"`, `pointer-events: none`.

### 6. Reduced motion, print, accessibility

- `prefers-reduced-motion: reduce`: the snow doesn't fall (flakes stay still),
  bulbs stay at full opacity, and the baubles don't sway. The decorations stay.
- `@media print`: hide all decorations.
- Nothing is focusable, announced or clickable. Every decoration is
  `aria-hidden="true"` with `pointer-events: none`.
- All decorations are absolutely or fixed positioned, so they cause no layout shift.

### 7. Not shipping outside the season

When `christmas` is false the HTML must contain none of the decoration markup,
and the built CSS should contain none of its rules. Astro may bundle a
component's scoped `<style>` from the module graph even when the component isn't
rendered. Check the out-of-season build output (grep `dist/` for the decoration
class names). If the rules are there, emit the decoration styles so they only
appear when rendered, for example `<style is:inline>` inside the conditional with
`christmas-`-prefixed class names.

### 8. Docs

Add a short "Christmas theme" note to `CLAUDE.md`: what it is, where the season
gate lives, the `CHRISTMAS_THEME=on|off` override, and that the Vinarius page opts
out.

## Verification

1. `npm test` green, including the new season tests.
2. `CHRISTMAS_THEME=on SKIP_VOLLEYZONE=true SKIP_BEHOLD=true npm run dev`, then
   check every page in light and dark at 320 / 375 / 414 / 768 / 1280:
   - no horizontal overflow (`scrollWidth > clientWidth`)
   - the hat isn't clipped
   - the lights fill the width cleanly
   - the baubles don't touch footer text
   - the mobile menu overlay and the skip link sit above the snow
   - buttons and form fields under the snow are still clickable
3. Emulate `prefers-reduced-motion: reduce`: nothing moves, everything is still visible.
4. `CHRISTMAS_THEME=off` build: no decoration markup or CSS in `dist/`.
5. `/sponsors/vinarius` with `CHRISTMAS_THEME=on`: no decorations.

## Rollout

- Safe to merge any time. It stays invisible until the 01:00 UTC build on
  1 December (today is 21 Nov 2026, so first live on 1 Dec 2026).
- Preview on Vercel by setting `CHRISTMAS_THEME=on` for Preview deployments.
- Turn it off early by setting `CHRISTMAS_THEME=off` in Production and redeploying. Remove the
  variable once the season is over: while set it overrides every future season. Likewise `on` in
  Preview shows the decorations all year there.

## Who decided what

**Decided by the user:** decoration only; every page; Santa hat; smaller fairy
lights; volleyball baubles using an existing SVG (`session.svg`), hanging over
the footer; snow over the whole page; the build-time (nightly rebuild) approach;
mobile must look good.

**My calls, open to correction:**
- dates 1 Dec to 5 Jan (Twelfth Night)
- lights attached to the top of `<main>` so they scroll away
- snow below the nav
- snow over the whole homepage too, not just the hero photo
- reduced-motion behaviour
- flake edge colour
- hidden from screen readers and in print
- Vinarius page opts out
- the `CHRISTMAS_THEME` override values
- extra footer space at all widths for the baubles

## Left to the builder

- Exact hat shape and offsets; bauble sizes and string lengths within the ranges above.
- The fairy-light technique: repeating SVG tile(s), CSS background or pattern,
  as long as the stagger works and there's no JS.
- Flake pattern, density and exact speeds; the wire and flake-edge tokens.
- Component split: one `ChristmasDecor.astro` or separate snow/lights components,
  plus where the hat and baubles markup lives.
- How `londonParts()` is shared.
