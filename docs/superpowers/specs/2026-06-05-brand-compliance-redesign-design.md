# Brand-Compliance Redesign — Design Spec

**Date:** 2026-06-05
**Status:** Approved for planning
**Source of truth:** `Lionhearts_Website_Assets/` (Brand Book `Lionhearts_Brand Assets_compressed.pdf`, 45pp; asset guide `Lionhearts_Website Assets_Guide.pptx`)

## Overview

The London Lionhearts site must be brought into compliance with the official brand
book delivered by the designer (Conway). Today the site is a generic near-black
"SaaS" theme (`#050d1a`) with a bright-blue gradient (`#0050e0 → #0090ff`), system
fonts, a PNG logo, an emoji favicon, and grey placeholders. Almost none of the
supplied brand assets are wired in.

We will rebuild the visual system around the brand: **Barlow** typography (an
open-licensed stand-in for the brand's DIN 2014 — see Typography), the
**Lionhearts navy / white / flat light-blue** palette, official logo + graphic
elements, and the brand book's **light-led, alternating** layout rhythm. We will
ship a **light theme first**, but author **both light and dark theme token sets
together** so the **on-brand navy dark theme** and a **light/dark toggle** drop in
without token rework.

Photography is explicitly **out of scope** for now (placeholders remain) per the
project owner; it becomes a later phase once real photos are selected/optimised.

## Goals

- Replace the ad-hoc colour system with brand-accurate tokens.
- Adopt Barlow (and Barlow Condensed) as the typefaces now, as an open-licensed
  substitute for the brand's DIN 2014; structured so DIN can be swapped in later.
- Use the official logo, submark favicon, team wordmarks, and graphic elements.
- Implement the brand's **light-led, alternating** section rhythm.
- Make the site **themeable** (light default, on-brand navy dark) via a single
  `data-theme` attribute, with a persisted toggle and device-preference default.
- Apply the Vinarius **sub-brand** to its sponsor page.

## Non-Goals

- New photography or duotone photo treatment (placeholders stay for now).
- Information-architecture / content changes, new pages, or copy rewrites beyond
  tone-of-voice alignment where trivially adjacent.
- Any change to data sources, forms backend, or build tooling.

## Brand reference (extracted from the brand book)

### Colours
**Primary:** Lionhearts Navy `#11234B`, White `#FFFFFF`.
**Deepest navy ("Black"):** `#05122B`.
**Secondary:** Light Blue `#54A4F7`, Red `#C44128`, Pink `#D75EB1`, Green `#76CD54`.
> Note: the PDF "Lionhearts Red" swatch prints the hex `#05122B` in error; the actual
> swatch is `R196 G65 B40` = **`#C44128`**. We use `#C44128` for red.

**Extended ramp (Colour Guide page):** deep blue `#002D72`, light blues `#8FC5F7`
`#B1D8F9` `#E0EEFB`; reds `#CF634D` `#D88578` `#EFD4CE`; pinks `#DC7CBF` `#E399CE`
`#F3DBED`; greens `#8BD871` `#C0EAB3` `#DDF3D7`; neutrals `#374155` `#7587AE`
`#B9C3DD`, `#9BA0AA` `#CDD0D5`.

### Typography
**Brand main:** DIN 2014. **Brand alternative:** DIN 2014 Condensed.
Weights present in the supplied family: Extra Light, Light, Regular, Demi, Bold,
Extra Bold (+ italics, Narrow, Condensed). Fonts in
`Lionhearts_Website_Assets/Font/din-2014-font-family.zip`.

**Interim substitute (this build): Barlow.** DIN 2014 is a commercial face and its
web-embedding licence is unconfirmed, so we ship **Barlow** now — an open-licensed
(SIL OFL) low-contrast grotesque that closely matches DIN's geometry and athletic
feel. **Barlow Condensed** covers the condensed alternative. Because all type is
referenced through the `--font-sans` token, switching to DIN 2014 later (if licensed)
is a token-level change.

### Logo
Official SVGs in `Logos_SVG/`: `Lionhearts_Logo_Main.svg` (white),
`Lionhearts_Logo_Main_Base.svg` (navy), `Lionhearts_Logo_Submark.svg` /
`_Submark_Base.svg`, `Lionhearts_Slogan_TGWR.svg`, and team wordmarks
`Lionhearts_Team_Wordmark_{Leo,Predators,Beats,Vinarius,Fury,Pride,Alpha,Cats,Roar}.svg`.
**Usage:** full wordmark for official/standalone + on darker backgrounds; submark for
friendly content, small sizes, favicons. **Don'ts:** never recolour, outline, rotate,
skew, crop, change the logo's font, or detach elements. Respect `x / 3x` clear-space.

### Graphic elements
`Graphic Elements_SVG/`: `Claw Mark_1–3.svg` (the "speed line" motif — strong, bold,
forward-moving), `Pride Circle_1–2.svg` (inclusive, diverse, friendly), and the Ball.

### Two graphic styles (moods)
- **Style #1 — navy, "Strong / Bold / Proud / Professional / Trustworthy":** regular
  season, game results, highlights, official announcements, teams.
- **Style #2 — light blue `#54A4F7`, "Friendly / Joyful / Fun / Inclusive / Community":**
  open sessions, beginners, juniors.

### Voice
Passionate-not-arrogant, encouraging-not-intimidating, clear & human.

### Vinarius sub-brand
Burgundy `#6E0833`, Beige `#ECF5D9`; title font **Gentona Semibold**, sub-font
**Didot Italic** (`Font/Gentona Semi Bold.otf`, `Font/DidotLTPro-Italic.ttf`,
`-BoldItalic.ttf`); logo `Logos_SVG/Vinarius_Sponsor_Logo_Burgundy.svg`.

## Architecture: the theming system

### Token layers (in `src/styles/global.css`)
**Layer 1 — Brand tokens** (fixed, theme-independent), e.g.:

```
--lh-navy:#11234B;  --lh-navy-deep:#05122B;  --lh-white:#fff;
--lh-blue:#54A4F7;  --lh-blue-deep:#002D72;  --lh-blue-300:#8FC5F7;  --lh-blue-100:#E0EEFB;
--lh-red:#C44128;   --lh-pink:#D75EB1;       --lh-green:#76CD54;
--lh-slate:#374155; --lh-slate-400:#7587AE;  --lh-slate-200:#B9C3DD;
--lh-grey-400:#9BA0AA; --lh-grey-200:#CDD0D5;
```

**Layer 2 — Semantic tokens** (flip per theme). Components reference *only* these.

| Semantic            | Light (`:root`, default)     | Dark (`[data-theme="dark"]`) |
|---------------------|------------------------------|------------------------------|
| `--bg`              | `#fff`                       | `var(--lh-navy)`             |
| `--bg-alt`          | `var(--lh-blue-100)` #E0EEFB | `var(--lh-navy-deep)` #05122B|
| `--surface`         | `#fff`                       | `#1b2f5c`                    |
| `--surface-2`       | `#F4F8FD`                    | `#0c1d40`                    |
| `--text`            | `var(--lh-navy)`             | `#fff`                       |
| `--text-muted`      | `#5a6b86`                    | `var(--lh-slate-200)`        |
| `--accent`          | `var(--lh-blue)`             | `var(--lh-blue)`             |
| `--accent-contrast` | `var(--lh-navy)`             | `var(--lh-navy)`             |
| `--border`          | `rgba(17,35,75,.12)`         | `rgba(255,255,255,.10)`      |
| `--btn-primary-bg`  | `var(--lh-navy)`             | `var(--lh-blue)`             |
| `--btn-primary-text`| `#fff`                       | `var(--lh-navy)`             |
| `--logo-variant`    | navy (`_Base`)               | white                        |

The theme switch is a single attribute on `<html>`; the entire UI re-themes from it.
**Both theme blocks are authored together in Phase 1** even though the toggle ships in
Phase 2, so no token rework is needed later.

### Section-tone system (the "alternating" rhythm)
A section wrapper accepts a `tone`:

- **`neutral`** → `--bg` / `--text` — *theme-dependent* (white in light, navy in dark).
- **`alt`** → `--bg-alt` — *theme-dependent* (soft tint in light, deep navy in dark).
- **`feature`** → fixed `--lh-navy` bg, white text — **same in both themes** (Style #1).
- **`community`** → fixed `--lh-blue` bg, white text — **same in both themes** (Style #2),
  used for Sessions / beginners / juniors.

Rationale: neutral/alt are *surfaces* and should flip with the theme; feature/community
are brand *moods* and stay constant, which keeps the brand book's rhythm coherent in
dark mode. Implemented as scoped CSS classes (`.section--feature`, etc.) — **no inline
styles**.

### Theme toggle
- A pill **slider** control in `Nav.astro` (accessible `<button>`, `aria-pressed`,
  keyboard-operable, visible focus ring). Toggles `data-theme` between `light`/`dark`.
- **Persistence:** choice saved to `localStorage` (`lh-theme`).
- **First-load default:** follow `prefers-color-scheme` — dark only if the device is
  dark, otherwise light. Stored preference always wins over device.
- **No-flash boot:** a tiny inline script in `BaseHead.astro` sets `data-theme` from
  `localStorage` (falling back to the media query) **before first paint**. This is the
  single sanctioned inline script; everything else uses scoped CSS classes.
- **No-JS:** site renders in the device-preferred theme via a `@media
  (prefers-color-scheme: dark)` fallback block; the toggle is a progressive enhancement.

## Typography implementation

- Self-host **Barlow** via `@font-face` (woff2) from `public/fonts/` — no external
  Google Fonts request. Ship only the weights used: ExtraBold (display), Bold,
  SemiBold (the "Demi" role), Regular, Light. **Barlow Condensed** for tight
  labels/stats.
- `--font-sans` becomes `'Barlow', system-ui, sans-serif` and `--font-condensed`
  becomes `'Barlow Condensed', 'Barlow', sans-serif`. Swapping to DIN 2014 later is a
  change to these two tokens plus the `@font-face` files.
- Type scale mapped to brand hierarchy: display/headings ExtraBold/Bold uppercase;
  body Regular/SemiBold. Preserve existing semantic heading levels (h2/h3) per project
  convention — no headings demoted to styled `<p>`.

## Per-file impact (initial map)

- `src/styles/global.css` — token layers (both themes), Barlow `@font-face`, type scale,
  rewritten `.btn`, `.eyebrow`, `.filter-pill`, `.gradient-*` removed/replaced,
  `.section--{neutral,alt,feature,community}`, `.page-hero`.
- `src/components/BaseHead.astro` — font preloads, no-flash theme boot script.
- `src/components/Nav.astro` — official logo (theme-aware variant), theme toggle slider.
- `src/components/Footer.astro` — official logo, token colours.
- `src/components/Hero.astro` + section components (`AboutIntro`, `CommunitySection`,
  `SessionsStrip`, `ClubBridge`, `JoinCTA`, `SponsorsSection`, `InstagramFeed`,
  `OverheardArchive`, `FilterPills`, `TeamCard`) — retoned to tokens + section tones.
- `src/pages/*` — apply section tones (Sessions/juniors → `community`; Teams/results →
  `feature`/navy); `sponsors/vinarius.astro` → Vinarius sub-brand (Phase 3).
- `public/` — `favicon.svg`/`favicon.ico` → official submark; `images/logo*.png` retired
  in favour of SVGs under (e.g.) `src/assets/brand/`; `public/fonts/` added.
- `src/data/teams.ts` — reference team wordmark assets.

## Phasing

**Phase 1 — Light-led foundation (ship first)**
Token layers for **both** themes; Barlow typography; official logo (navy on light) + submark
favicon; section-tone system; re-skin all components/pages to tokens (remove gradient +
system font + ad-hoc colours); graphic-element accents (claws/pride/ball); team
wordmarks on cards. Photos remain placeholders.

**Phase 2 — Dark theme + toggle**
Wire the dark token block to a `data-theme="dark"` switch; build the toggle slider;
boot script + persistence + device-preference default; a11y/contrast pass in **both**
themes; verify every section tone and component in dark.

**Phase 3 — Sub-brand + polish (later)**
Vinarius sub-brand page (burgundy/beige, Gentona/Didot); finalise dual-style mapping
across all sections; photography pass once assets are chosen.

## Accessibility & constraints

- WCAG AA contrast verified for text on every surface in **both** themes (notably
  `#54A4F7` community blocks and muted text).
- All external links keep `rel="noopener noreferrer"`.
- No inline styles except the documented theme-boot script; everything else is scoped
  CSS classes / BEM modifiers.
- Semantic heading hierarchy preserved.
- Toggle is fully keyboard-operable with a visible focus state; respects
  `prefers-reduced-motion` for the slider animation.

## Testing

- Visual regression via Chrome DevTools MCP screenshots of every page in **light** and
  **dark** at desktop + mobile widths.
- Existing Vitest suite stays green; add tests for any new pure logic (e.g. a
  `resolveInitialTheme()` helper if extracted).
- Manual: toggle persists across reloads; correct first-load theme for light/dark
  device preference; no theme flash on load.

## Open questions / risks

- **Font:** shipping Barlow (OFL) avoids the DIN 2014 web-licensing question for now.
  If/when DIN 2014 is licensed for web, swapping in is a `--font-sans` token + font-file
  change. Subset Barlow to woff2 to control payload.
- **Submark favicon legibility** at 16px on both light and dark browser chrome — verify.
- **Logo "don'ts":** the theme-aware logo must swap *pre-rendered* navy/white SVGs, not
  CSS-recolour the artwork (recolouring violates the brand guidance).

## Asset index (in repo)

- Fonts (this build): **Barlow** + **Barlow Condensed** (SIL OFL, self-hosted woff2).
- Fonts (brand target / later): `Lionhearts_Website_Assets/Font/din-2014-font-family.zip`.
- Fonts (Vinarius sub-brand): `Gentona Semi Bold.otf`, `DidotLTPro-Italic.ttf`,
  `DidotLTPro-BoldItalic.ttf`.
- Logos: `Lionhearts_Website_Assets/Logos_SVG/` (main, submark, team wordmarks, slogan,
  Vinarius), `Logos_PNG/`.
- Graphic elements: `Lionhearts_Website_Assets/Graphic Elements_SVG/`.
- Photos (future): `Lionhearts_Website_Assets/Images/`,
  `From Andy/Pictures for Conway/`.
