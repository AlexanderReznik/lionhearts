# Lionhearts Volleyball — Claude Code Notes

All work happens in `/Users/alex/projects/lionhearts`.

## Commands

```bash
npm test        # Vitest — must stay green before claiming a fix is done
npm run dev     # local dev server
npm run build   # production build (runs the build-time fetches unless skipped)
SKIP_VOLLEYZONE=true SKIP_BEHOLD=true npm run dev   # skip slow fetches (see Project Stack)
```

## Git

Run git from the project root — do NOT use `git -C <path>`. The working directory is
already correct between shell calls.

```bash
git add src/foo.ts        # RIGHT
git -C /path add src/foo.ts   # WRONG
```

**Commit messages** — conventional commits, matching the repo's 400+ commit history:
`type(scope): imperative subject`.

- Types: `feat` `fix` `style` `refactor` `docs` `chore` `perf` `test`.
- Scope = page/area: `copy` `seo` `a11y` `events` `community` `about` `teams` `join`
  `sponsors` `instagram` `theme` `footer` `hero` …
- Body explains the **why** and notes verification (e.g. "Verified no overflow at 320/375"),
  matching the density of recent `git log` bodies.
- Commit only when asked; branch first if on `main`.

## Project Stack

- Astro 6 (static site)
- TypeScript strict
- Vitest for unit tests
- `@astrojs/sitemap` integration
- No framework (vanilla Astro components)
- **Build-time data fetches:** `src/lib/volleyzone.ts` (fixtures) and
  `src/lib/behold.ts` (Instagram via Behold JSON) fetch at build time and
  degrade to `[]` on any failure (never fail the build). Each has a
  `SKIP_*` env escape hatch (`SKIP_VOLLEYZONE`, `SKIP_BEHOLD`) for fast
  local builds. **When you're NOT working on the fixtures or Instagram
  sections, run dev/build with both flags so the slow network fetches are
  skipped:** `SKIP_VOLLEYZONE=true SKIP_BEHOLD=true npm run dev`. The guards
  are strict string compares (`import.meta.env.SKIP_* === 'true'`), so the
  value MUST be the literal `true` — `SKIP_*=1` silently does NOT skip and
  still fetches.
- **Content data** lives in `src/data/` as the single source of truth —
  `sponsors.ts`, `teams.ts`, `flags.ts`, `club.ts` (items render in array order).
  Live sessions come from a Google Sheet via `src/lib/sheets.ts`; keep its
  `FALLBACK_CSV` in sync with the real schedule so pages never render an empty one.

## Design System

Brand-compliant theme per the designer's brand book (assets in
`Lionhearts_Website_Assets/`, gitignored). All CSS tokens live in
`src/styles/global.css`, in two layers:

- **Brand tokens** (`--lh-*`, fixed): navy `#11234b`, deep navy `#05122b`,
  white, flat light-blue `#54a4f7`, plus secondary/tint ramps.
- **Semantic tokens** (`--color-*`, theme-dependent): components reference ONLY
  these. Each is declared **once** as `light-dark(LIGHT, DARK)` in `:root`; the
  active side follows `color-scheme`. Theme selection is the only place light vs
  dark is chosen: `:root[data-theme="dark"]` sets `color-scheme: dark`, and a
  `@media (prefers-color-scheme: dark)` block does the same for no-JS users who
  haven't explicitly picked light. There is **no second copy of the dark values
  to keep in sync** — re-point a token once and both themes follow.
- The single flat brand accent is `--color-accent` (one blue, theme-independent).
  `.headline-accent` colours the highlighted word of a display headline on dark
  surfaces; for accent **text** on light surfaces use `--color-accent-text` (below).

Typography is **Barlow** (self-hosted via Fontsource) — an open substitute for the
brand's DIN 2014; swap is a `--font-sans` change. Accents are flat brand blue (no
gradients). Official logo/favicon/team-wordmark SVGs live in `public/brand/`.

### Accent TEXT vs accent backgrounds (WCAG AA)

Flat brand blue `#54a4f7` only reaches ~2.2–2.6:1 on white, so it **fails AA as
text** in the light theme. Use the dedicated `--color-accent-text` semantic token
for any accent-coloured **text** (eyebrows, heading `<em>`, links, labels, footer
headings): `light-dark(#0050b8, var(--lh-blue))` — light `#0050b8` (~7.5:1), dark
`#54a4f7` (passes on navy). Dark surfaces inside the light theme re-assert the
light-blue locally — `.section--feature` sets it, and page-specific dark panels
(`location-info`, `become-sponsor`) carry a local
`--color-accent-text: var(--lh-blue)`. **Backgrounds** (buttons `.btn--accent`,
`.filter-pill--active`, toggle knob, page-hero radial) keep `#54a4f7` directly —
only text moved. When adding accent-coloured text, reach for
`--color-accent-text`, never `--lh-blue`/`#54a4f7`. The community white-on-`#54a4f7`
headings are a deliberate brand Style-#2 exception (~2.62:1, accepted, commented).

### Theming (light/dark toggle)

- The theme is set on `<html data-theme>` by a no-flash inline `is:inline` boot
  script in `BaseHead.astro` (resolves stored choice → device preference → light;
  mirrors `resolveInitialTheme()` in `src/lib/theme.ts`). The `ThemeToggle`
  pill-slider (in `Nav.astro`, desktop + overlay) flips it and persists to
  `localStorage['lh-theme']`. Knob position is pure-CSS-driven, so instances
  stay in sync.
- **Per-page light opt-out:** wrap content in `.force-light` (re-asserts light
  semantic tokens). Its only consumer is the Vinarius sub-brand page.
- **Component-level dark overrides:** prefer a `light-dark(LIGHT, DARK)` value so
  the override follows `color-scheme` and reaches no-JS OS-dark users for free —
  do NOT gate a colour on a bare `html[data-theme="dark"]` selector (it only
  applies when the boot script ran). The **only** exceptions are non-colour
  properties `light-dark()` can't express (e.g. `display` swaps in `BrandLogo`,
  the knob's `left` in `ThemeToggle`): those key on `html[data-theme="dark"]` AND
  must **mirror** the `@media (prefers-color-scheme: dark) { html:not([data-theme="light"]) … }`
  guard so no-JS dark users get them too.

### Icons

The designer's brand icon set (`Lionhearts_Website_Assets/Icons_SVG/`, gitignored)
lives in `src/assets/icons/*.svg` (kebab-case) and is rendered through
`src/components/Icon.astro` — `<Icon name="location" />`. It uses Astro's **native
SVG-as-component import** (stable since 5.7): icons inline (no HTTP request), get
SVGO-optimised, and carry `fill="currentColor"`, so they **theme automatically** by
inheriting `color` from a semantic `--color-*` token. Base size is `1em` (global
`.brand-icon` rule), so callers size via the wrapper's `font-size`.

- **Social marks**: `facebook.svg` and `whatsapp.svg` (the /contact "Follow Us"
  row) are the designer's `Icons_SVG/Facebook_2.svg` / `Whatsapp_2.svg` — badge
  marks in the flat single-path-with-knockout style. The footer's separate
  `footer-facebook.svg` / `footer-whatsapp.svg` are still **hand-drawn to match**
  that style (the designer's `Footer_*.svg` were never adopted). When importing a
  designer SVG, strip its wrapper `id` and `<defs><style>.cls-1{…}</style></defs>`
  — those generic ids/classnames collide once several icons are inlined on a page.
  Social icons use the site accent (`--color-accent-text`, themed), like every
  other icon — not per-platform brand colours.
- This is the deliberate exception to the "serve via `astro:assets`" rule below:
  monochrome icons that must recolour with the theme use native SVG-component import
  + `currentColor`, NOT `<Image>` (which can't recolour). **Photos still use
  `<Picture>`/`<Image>`.**
- **Colour-per-surface** (so both themes pass AA): light cards →
  `var(--color-accent-text)`; dark `.section--feature` band → also accent-text;
  blue accent boxes (`.contact-card__icon`, `.about-intro__pin`) →
  `var(--btn-accent-text)` (navy-on-blue, matching `.btn--accent`);
  `.section--community` blue surface → inherits navy; photo cards → white.
- **`set:html` exception:** the `/events` fixture timeline renders client-side as
  HTML strings, so `<Icon>` can't be used — the pin is imported as a raw string
  (`location.svg?raw`) inside the client `<script>` and sized by a plain `.tl-pin`
  rule in the page's `is:global` block.
- No icon exists for the `⚡` Super League badge (`teams.ts`) or the `⚠️`
  fallback notice, so those stay. Arrows (→ ← ↗ ↓) and nav `☰`/`✕` are UI glyphs,
  not emoji — leave them.

### GOTCHA — dark overrides in `is:global` / `set:html` blocks

Astro's `:global(...)` directive is only processed inside **scoped** `<style>`
blocks. In a `<style is:global>` block it is emitted **verbatim as an invalid
selector** and silently ignored. Likewise, markup injected via `set:html`
(e.g. the fixtures/result badges in `events.astro`) carries **no Astro scope
attribute**, so scoped selectors don't match it. Colour overrides here should
still be a `light-dark()` value (the badges do this) — but if you ever need a
`data-theme` **selector** in such a block, use a **plain** one —
`html[data-theme="dark"] .badge-w { ... }` — NOT
`:global(html[data-theme="dark"]) .badge-w`. (In normal scoped style blocks, the
`:global(html[data-theme="dark"]) .my-class` ancestor pattern IS correct.)

### Brand work — specs & plans

Phased rebrand documented under `docs/superpowers/{specs,plans}/`. **Merged:**
Phase 1 (light-led foundation), Phase 2 (dark theme + toggle), Phase 3-B
(dual-style `.section--feature`/`--community` mapping), and the light-theme WCAG
AA pass (`--color-accent-text`). **Remaining:** Phase 3-C — photography (real
photos + navy duotone), not yet started.

Phase 3-A (the Vinarius burgundy/cream sub-brand page) was removed, then
restored as an **unlisted** page: `/sponsors/vinarius` is reachable by direct
URL only. Nothing links to it — the sponsor tile and sponsorship hero both point
at `https://vinarius.london` — it carries `noindex={true}`, and its path sits in
the `UNLISTED_PATHS` set that drives the sitemap filter in `astro.config.mjs`.
It uses Barlow rather than its original Hanken Grotesk / Playfair Display (those
packages were uninstalled in the interim); `--vin-font-serif` is a system serif
stack because no Barlow italic face is loaded.

## Code Conventions (enforced in review)

- **Minimize comments.** Only keep comments that add value — don't state the
  obvious or narrate what the code already says. Prefer self-explanatory code;
  reserve comments for non-obvious rationale ("why", not "what").
- **No inline styles.** Never write `style="..."` on elements. Any spacing/visual
  override goes in a scoped `<style>` block — create a BEM modifier class
  (e.g. `.section-eyebrow--spaced`) even for one-off margins.
- **External links:** every `target="_blank"` gets `rel="noopener noreferrer"`
  (both tokens, not just `noopener`). For dynamic links use the spread pattern:
  `{...(href.startsWith('http') ? { target: '_blank', rel: 'noopener noreferrer' } : {})}`.
- **Heading hierarchy:** use real semantic elements, never `<p style="...">` as a
  heading. Section eyebrows → `<h2 class="eyebrow section-eyebrow">`; card titles
  within a section → `<h3>`; presentational CTA taglines → `<p>`. `.section-eyebrow`
  (+ `--spaced`/`--tight`) is defined locally per page's scoped `<style>`.
- **Site-native tiles:** keep card/panel **containers** on semantic `--color-*`
  tokens and `.btn--accent` so they read as the navy/blue site in both themes.
  Brand/sponsor colour lives only in the logo or a contained chip — never fill a
  whole tile with an off-brand colour (it clashes badly in light theme). When the
  visual direction is open, build quick browser mockups and show options first.
- **Images:** serve photos via `astro:assets` `<Picture>`/`<Image>` from
  `src/assets/` (AVIF/WebP, responsive `srcset`, width/height) — never drop
  pre-resized files in `public/`. Mirror `Hero.astro`/`TeamCard.astro`. (Icons are
  the exception — see Icons above.)
- Other established patterns: `noindex={true}` on BaseLayout for 404/join-success;
  sitemap filter excludes `/join-success/`; `<select>` options carry explicit
  `value` attrs (Web3Forms submission integrity); keyboard focus uses
  `:focus-visible`; `BaseLayout` renders a `.skip-link` → `<main id="main">` as
  the first focusable element on every page.

## Verifying UI / responsive changes

Before claiming a UI fix is done:

1. `npm test` (vitest) — must stay green.
2. Check the change in Chrome DevTools MCP at **real** mobile widths (320/375/414).
   Chrome's window min is ~500px, so `resize_page` can't reach mobile — use
   `emulate` with `viewport: "320x700x2,mobile,touch"`. Detect overflow via
   `document.documentElement.scrollWidth > clientWidth`, then enumerate elements
   whose `getBoundingClientRect().right` exceeds the viewport to find the offender.
   Don't trust a one-line CSS fix from reading code alone — a symptom can have more
   than one cause; measure and fix every offender. (In dev the InstagramFeed shows
   its **fallback panel** because `BEHOLD_FEED_ID` is unset.)

### Don't kill the user's dev server

The user often has their own `npm run dev` running. **Never** clean up with
`pkill -f "astro dev"` (or any broad pattern kill) — it matches by command line
and takes down *their* server too, not just one you launched.

Instead:

1. **Reuse a running server first.** Check the default port before spawning —
   `curl -s -o /dev/null http://localhost:4321` — and if it answers, just point
   Chrome DevTools at it. Start nothing, kill nothing.
2. **If you must start your own, kill only your PID.** Capture it when you
   background the process and kill that one process, never a name pattern:
   ```bash
   SKIP_VOLLEYZONE=true SKIP_BEHOLD=true npm run dev > /tmp/lh-dev.log 2>&1 &
   MY_DEV_PID=$!
   # … work …
   kill "$MY_DEV_PID"
   ```
   (Astro auto-picks the next free port, e.g. 4322, so your server never
   collides with theirs — grep the log for the `http://localhost:PORT` line.)

