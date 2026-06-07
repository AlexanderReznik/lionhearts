# Light-Theme WCAG AA Pass (Design Spec)

**Date:** 2026-06-07
**Status:** Approved for planning
**Builds on:** Phases 1, 2, 3-A, 3-B (merged to `main`).

## Overview

Phase 2's contrast sweep covered only the **dark** theme; the **light** theme was never
audited. A full light-theme audit of every page found a site-wide WCAG AA failure: the
flat brand blue `#54a4f7` is used as **text** on white/light surfaces (eyebrows, links,
labels, footer headings, heading accents) where it only reaches ~2.2–2.6:1. Plus four
smaller issues. This pass fixes the light theme to AA without changing the dark theme.

## Audit findings (light theme, all pages)

False positives (white/beige/blue text on photo, gradient, or dark-navy panels — verified
10–15:1) are excluded.

| # | Category | Examples | Ratio | Fix |
|---|---|---|---|---|
| ① | Brand blue `#54a4f7` as small text on light | eyebrows, `page-hero__eyebrow`, heading `<em>`, `footer__col h4`, footer email link, `about-intro__link`/`__postcode`, `sponsors__link`, `contact-card__tag`/`__link`, `team-card__gender`, `nav__overlay-link` | 2.2–2.6 | theme-aware accent-text token |
| ② | Community white headings on `#54a4f7` | `.section--community :is(h1,h2,h3)` (ClubBridge "Connect", `/join` pathway title, JoinCTA headline) | 2.62 | **accepted exception** (brand Style #2) |
| ③ | Footer social pill labels (network colours on light footer) | Instagram/Facebook/YouTube labels | 1.9–2.85 | label → token, network colour on icon |
| ④ | `.btn--ghost` white text on light surface | a `/join` pathway ghost button | ~1 | use `--color-text` |
| ⑤ | Faint muted text on white | `team-card__photo-fallback`, `join-form__optional`, some fixtures muted | 3.4–3.8 | darken light `--color-text-faint` |

Pages `/`, `/about`, `/teams`, `/events`, `/join`, `/sponsorship`, `/contact` hit ① + ③
plus their own ②/④/⑤. The Vinarius page's own content is clean (its own palette); only
the global footer (③, ①) affects it. `/404` and `/join-success` carry only global chrome.

## Decisions (from brainstorming)

| Decision | Choice |
|---|---|
| Accent text colour on light | **`#0050b8`** (~7.5:1; clearly blue, good margin) |
| Accent text in dark | **`#54a4f7`** (unchanged; passes on navy) |
| Community headings | **Keep white** — documented brand-book exception (fails AA, accepted) |
| Footer pills | Label → `--color-text-muted`; network colour on **icon** only |
| `.btn--ghost` | Colour/border from `--color-text` tokens (adapts per surface) |
| Faint muted (light) | Darken to ~`#5e6c88` (≥4.5:1) |
| Dark theme | **Unchanged** (already AA from Phase 2) |

## Design

### 1. `--color-accent-text` token (category ①)

A dedicated semantic token for accent **text**, separate from the accent
backgrounds/buttons/knob/gradients that legitimately use `#54a4f7`:

```css
:root            { --color-accent-text: #0050b8; }   /* light */
[data-theme="dark"] { --color-accent-text: var(--lh-blue); }   /* #54a4f7 */
/* + mirror in the @media (prefers-color-scheme: dark) :root:not([data-theme="light"]) block */

/* dark surfaces inside the light theme: accent text stays light-blue (passes on navy) */
.section--feature { --color-accent-text: var(--lh-blue); }
```

Page-specific dark panels that carry accent text — `sponsor-hero`, `become-sponsor`
(sponsorship.astro) and `location-info` (contact.astro) — get a local
`--color-accent-text: var(--lh-blue);` on the panel root (same pattern as `.section--feature`).

**Repoint accent text** (NOT backgrounds) to `var(--color-accent-text)`:
- `global.css`: `.eyebrow` colour + `.eyebrow::before` background; `.page-hero__eyebrow`
  colour + `::before` background; `.page-hero__title em`.
- Component/page accent text: `.about-intro__link`, `.about-intro__postcode`,
  `.sponsors__link`, `.contact-card__tag`, `.contact-card__link`, `.team-card__gender`,
  `.footer__col h4`, the footer email `<a>` (contact link list), `.nav__overlay-link`
  (base/active accent), and any other small accent-blue text the implementation audit
  flags.

> Leave `--color-accent-to` / `--color-accent-from` / `--color-highlight-1` as-is where
> they drive **backgrounds** (buttons `.btn--accent`, `.filter-pill--active`,
> `.gradient-bg`, the theme-toggle knob, the page-hero radial). Those are correct at
> `#54a4f7`. Only **text** usages move to `--color-accent-text`.

### 2. Footer social pills (category ③)

In `Footer.astro`: remove the per-network **label** colour (`.footer__social-pill--*`
`color: rgba(network)`), letting the label use the base `.footer__social-pill` colour =
`var(--color-text-muted)` (AA in both themes). Apply the network colour to the **icon**
instead: `.footer__social-pill--instagram .footer__social-icon { color: #e1306c; }`
(and facebook `#4a9ef5`, youtube `#ff4444`). Keep the hover (border tint + icon
brighten). This supersedes the Phase-2 dark label overrides (remove those — the token
label is AA in dark too).

### 3. `.btn--ghost` (category ④)

In `global.css`, change `.btn--ghost` from hardcoded `rgba(255,255,255,…)` to:
```css
.btn--ghost { background: transparent; color: var(--color-text); border: 1px solid color-mix(in srgb, var(--color-text) 30%, transparent); }
.btn--ghost:hover { border-color: color-mix(in srgb, var(--color-text) 55%, transparent); }
```
On light surfaces `--color-text` is navy (AA); on the hero/`.section--feature` (which
force `--color-text` white) it's white — adapts automatically.

### 4. Faint muted text (category ⑤)

In `:root` (light only), change `--color-text-faint` from `var(--lh-slate-400)` (#7587ae,
3.8:1) to `#5e6c88` (≥4.5:1 on white). Dark `--color-text-faint` (`#94a1c0`, set in
Phase 2) is unchanged.

### 5. Community white headings (category ②) — exception

No code change. Add a comment on `.section--community :is(h1,h2,h3)` noting white
headings on `#54a4f7` are a deliberate brand-book Style-#2 exception (≈2.62:1). The
verification audit annotates/excludes these rather than failing.

## Files touched

- `src/styles/global.css` — `--color-accent-text` token (light/dark/no-JS + `.section--feature`); repoint `.eyebrow`/`.page-hero__*`/em; `.btn--ghost` tokens; light `--color-text-faint`; community-heading exception comment.
- `src/components/Footer.astro` — pill label → token, network colour on icon; remove Phase-2 dark label overrides; repoint `.footer__col h4` + email link to accent-text.
- `src/components/AboutIntro.astro` — `__link`, `__postcode` → accent-text.
- `src/components/SponsorsSection.astro` — `.sponsors__link` → accent-text.
- `src/components/TeamCard.astro` — `.team-card__gender` → accent-text.
- `src/components/Nav.astro` — `.nav__overlay-link` accent → accent-text.
- `src/pages/contact.astro` — `.contact-card__tag`/`__link` → accent-text; `location-info` panel local `--color-accent-text: var(--lh-blue)`.
- `src/pages/sponsorship.astro` — `sponsor-hero` / `become-sponsor` panel local `--color-accent-text: var(--lh-blue)`.
- Any other component the implementation audit flags using `#54a4f7`/accent tokens as small text on a light surface.

## Testing

- Re-run the light-theme AA audit (composite-alpha, gradient/`.hero`/`.force-light`-aware,
  skips `aria-hidden`) on **every** page → clean **except** the documented community
  white-heading exception (category ②).
- Re-run the **dark** AA audit on every page → still clean (accent text = `#54a4f7` on
  navy passes; feature panels keep light-blue accents) — confirm no regression.
- Visual spot-check (Chrome DevTools, light): eyebrows/links/labels read as a deeper,
  confident blue; footer pills legible (navy labels, coloured icons); ghost buttons
  visible on light cards; faint text legible.
- `npm run build`, `npx astro check` (2 pre-existing), `npm test` (56) green.

## Open questions / risks

- **Accent text on mixed surfaces:** a few accent-text elements sit on dark panels even in
  light theme; handled by the `.section--feature` + per-panel `--color-accent-text`
  overrides. The implementation audit must catch any panel missed (symptom: a too-dark
  `#0050b8` link on navy).
- **Community exception** is intentional; the AA tooling/report should mark it as an
  accepted exception, not a failure, to avoid confusion later.
