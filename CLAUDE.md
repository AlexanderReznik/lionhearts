# Lionhearts Volleyball — Claude Code Notes

## Working Directory

All work happens in `/Users/alex/projects/lionhearts`.

## Git Commands

Run git commands from the project root — do NOT use `git -C <path>`. The working directory is already set correctly between shell calls.

```bash
# WRONG
git -C /Users/alex/projects/lionhearts add src/foo.ts

# RIGHT
git add src/foo.ts
git commit -m "feat: ..."
```

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
  local builds.

## Design System

Brand-compliant theme per the designer's brand book (assets in
`Lionhearts_Website_Assets/`, gitignored). All CSS tokens live in
`src/styles/global.css`, in two layers:

- **Brand tokens** (`--lh-*`, fixed): navy `#11234b`, deep navy `#05122b`,
  white, flat light-blue `#54a4f7`, plus secondary/tint ramps.
- **Semantic tokens** (`--color-*`, theme-dependent): components reference ONLY
  these. `:root` = light (default); `[data-theme="dark"]` = dark. There is also a
  `@media (prefers-color-scheme: dark)` block that **duplicates** the dark values
  for no-JS users — **keep the two dark blocks in sync.**

Typography is **Barlow** (self-hosted via Fontsource) — an open substitute for the
brand's DIN 2014; swap is a `--font-sans` change. Accents are flat brand blue (no
gradients). Official logo/favicon/team-wordmark SVGs live in `public/brand/`.

### Accent TEXT vs accent backgrounds (WCAG AA)

Flat brand blue `#54a4f7` only reaches ~2.2–2.6:1 on white, so it **fails AA as
text** in the light theme. Use the dedicated `--color-accent-text` semantic token
for any accent-coloured **text** (eyebrows, heading `<em>`, links, labels, footer
headings): `:root` = `#0050b8` (~7.5:1), `[data-theme="dark"]` = `var(--lh-blue)`
(`#54a4f7`, passes on navy). Dark surfaces inside the light theme re-assert the
light-blue locally — `.section--feature` sets it, and page-specific dark panels
(`location-info`, `become-sponsor`) carry a local
`--color-accent-text: var(--lh-blue)`. **Backgrounds** (buttons `.btn--accent`,
`.filter-pill--active`, gradients, toggle knob, page-hero radial) keep `#54a4f7`
directly — only text moved. When adding accent-coloured text, reach for
`--color-accent-text`, never `--lh-blue`/`#54a4f7`. (Mirror the token in the no-JS
`@media (prefers-color-scheme: dark)` block too.) The community white-on-`#54a4f7`
headings are a deliberate brand Style-#2 exception (~2.62:1, accepted, commented).

### Theming (light/dark toggle)

- The theme is set on `<html data-theme>` by a no-flash inline `is:inline` boot
  script in `BaseHead.astro` (resolves stored choice → device preference → light;
  mirrors `resolveInitialTheme()` in `src/lib/theme.ts`). The `ThemeToggle`
  pill-slider (in `Nav.astro`, desktop + overlay) flips it and persists to
  `localStorage['lh-theme']`. Knob position is pure-CSS-driven from
  `html[data-theme]`, so instances stay in sync.

### Icons

The designer's brand icon set (`Lionhearts_Website_Assets/Icons_SVG/`, gitignored)
lives in `src/assets/icons/*.svg` (kebab-case) and is rendered through
`src/components/Icon.astro` — `<Icon name="location" />`. It uses Astro's **native
SVG-as-component import** (stable since 5.7): icons inline (no HTTP request), get
SVGO-optimised, and carry `fill="currentColor"`, so they **theme automatically** by
inheriting `color` from a semantic `--color-*` token. Base size is `1em` (global
`.brand-icon` rule), so callers size via the wrapper's `font-size`.

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
attribute**, so scoped selectors don't match it. So for theme overrides on such
elements, use a **plain** selector — `html[data-theme="dark"] .badge-w { ... }` —
NOT `:global(html[data-theme="dark"]) .badge-w`. (In normal scoped style blocks,
the `:global(html[data-theme="dark"]) .my-class` ancestor pattern IS correct.)

### Brand work — specs & plans

Phased rebrand documented under `docs/superpowers/{specs,plans}/`. **Merged:**
Phase 1 (light-led foundation), Phase 2 (dark theme + toggle), Phase 3-B
(dual-style `.section--feature`/`--community` mapping), and the light-theme WCAG
AA pass (`--color-accent-text`). **Removed:** Phase 3-A (the Vinarius
burgundy/cream sub-brand page) and its `.force-light` opt-out utility — the
sponsor tile now links straight to `https://vinarius.london`. **Remaining:**
Phase 3-C — photography (real photos + navy duotone), not yet started.

## Code Conventions (enforced in review)

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
  `value` attrs (Netlify form integrity); keyboard focus uses `:focus-visible`.

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

