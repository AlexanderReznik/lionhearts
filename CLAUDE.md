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
