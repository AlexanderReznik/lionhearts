# Brand Phase 3-A — Vinarius Sub-Brand (Design Spec)

**Date:** 2026-06-06
**Status:** Approved for planning
**Builds on:** Phase 1 + Phase 2 (merged to `main`). Part of Phase 3, which decomposes
into three independent sub-projects: **A · Vinarius sub-brand** (this spec),
B · dual-style section mapping, C · photography. A is built first.

## Overview

The `/sponsors/vinarius` page currently uses an improvised "wine" palette
(near-black `#0e0409` + burgundy `#6b1728` + an off-book **gold** `#c9a43e`) and a
Georgia-serif placeholder. The brand book specifies the Vinarius sub-brand as
**burgundy `#6E0833` + beige `#ECF5D9`**, with **Gentona Semibold** (title) and
**Didot Italic** (sub). This sub-project aligns the page to the book, expresses the
sponsor↔club partnership with a **burgundy→navy connection gradient**, and ships
open-licensed font substitutes — all scoped to this one page.

## Goals

- Replace the page palette with the brand-accurate burgundy/beige set; **drop the gold**.
- Hero uses a **straight burgundy→navy gradient** (the "G1" treatment) — Vinarius
  burgundy `#6E0833` blending into Lionhearts navy `#11234b` — to signal the partnership.
- Type: open substitutes for the brand's commercial faces, **scoped to this page**:
  **Hanken Grotesk** (Gentona role — title/headings) + **Playfair Display** (Didot
  role — the italic Latin line / serif accents).
- Present the **official Vinarius logo** where a light surface allows it.
- Keep everything self-contained: no bleed into the Lionhearts brand; page looks
  identical under global light/dark themes.

## Non-Goals

- The homepage `SponsorsSection` Vinarius card — stays in the Lionhearts theme.
- The Lionhearts women's team *named* "Vinarius" — unrelated; stays Lionhearts-branded.
- Self-hosting the real commercial Gentona/Didot (licence unconfirmed; using substitutes).
- Sub-projects B (section mapping) and C (photography).

## Decisions (from brainstorming)

| Decision | Choice |
|---|---|
| Palette | Brand-book burgundy `#6E0833` + beige `#ECF5D9`; **no gold** |
| Hero treatment | **G1** straight burgundy→navy gradient, beige text |
| Fonts | Open substitutes: **Hanken Grotesk** (title) + **Playfair Display** (serif italic) |
| Font hosting | Self-host via Fontsource (SIL OFL), **scoped to the page** |
| Hero name | Typographic "VINARIUS" wordmark (Hanken Grotesk, beige) |
| Official logo | Shown on a light surface only (no recolour) |
| Scope | `/sponsors/vinarius` page only |

## Design

### Palette tokens (scoped to the page)

Replace the existing `:root` `--vin-*` block inside `vinarius.astro` with a
brand-accurate set (the page's styles are scoped, so these stay page-local):

```css
--vin-burgundy: #6E0833;   /* Vinarius primary */
--vin-beige:    #ECF5D9;   /* Vinarius secondary (text on dark) */
--vin-navy:     #11234B;   /* Lionhearts navy — gradient far end */
--vin-plum:     #3a1442;   /* optional burgundy↔navy midpoint */
--vin-burgundy-deep: #4a0622; /* darker burgundy for depth/sections */
```

All existing references to `--vin-gold`, `--vin-mid`, `--vin-bright`, `--vin-dark`,
`--vin-cream` are removed and re-pointed to the new tokens (gold → beige or burgundy;
near-black → burgundy-deep/navy). No `#c9a43e` / `#0e0409` remain.

### Hero — burgundy→navy gradient (G1)

```css
.vin-hero { background: linear-gradient(125deg, #6E0833 0%, #5a1338 38%, #1c2a55 75%, #11234b 100%); }
```

- Remove the gold accent stripe (`.vin-hero__stripe`) and the gold badge styling →
  beige badge (`background: rgba(236,245,217,.12); border: 1px solid rgba(236,245,217,.4); color: var(--vin-beige)`).
- `.vin-hero__name` "VINARIUS": solid beige `var(--vin-beige)` in `--vin-font-display`
  (Hanken Grotesk), uppercase — replace the white→gold gradient-text treatment.
- `.vin-hero__latin` "vinarius, n. — …": `--vin-font-serif` (Playfair Display), italic,
  beige.
- `.vin-hero__sub` and CTA: beige text; primary CTA is beige fill with burgundy text.

### Other sections

Recolour the remaining sections (manifesto, about, stockist/visit, footer-of-page)
from the old gold/near-black scheme to burgundy/beige/navy so the whole page is on-book.
Dark sections use `--vin-burgundy-deep` / `--vin-navy`; light sections use beige/white
with burgundy text. Replace every `--vin-gold` accent with beige or burgundy.

### Type (scoped, Fontsource)

- Install `@fontsource/hanken-grotesk` and `@fontsource/playfair-display` (both OFL).
- Import the needed weights in `vinarius.astro` frontmatter (e.g. Hanken 600/700/800;
  Playfair 400-italic/600-italic) — imports in a page frontmatter scope the CSS to that
  page's bundle.
- Define page-local font tokens so they're swappable and don't touch global `--font-*`:
  ```css
  --vin-font-display: 'Hanken Grotesk', system-ui, sans-serif;
  --vin-font-serif:   'Playfair Display', Georgia, serif;
  ```
- Apply `--vin-font-display` to the title/headings; `--vin-font-serif` (italic) to the
  Latin line and any serif accents. Remove the `font-family: Georgia, serif` placeholder.

### Official Vinarius logo

- Copy `Lionhearts_Website_Assets/Logos_SVG/Vinarius_Sponsor_Logo_Burgundy.svg` to
  `public/brand/vinarius-logo-burgundy.svg`.
- Place it on a **light** surface (beige/white) within the page — e.g. the "Visit
  Vinarius London" / stockist card or the page's closing band — where the burgundy
  artwork is legible. Do not recolour the logo; do not place it on the dark gradient.
- The hero keeps the typographic "VINARIUS" wordmark (not the logo).

### Theme independence

The page keeps its Phase-2 `.force-light` wrapper. Because the sub-brand uses its own
explicit `--vin-*` colours (not the global `--color-*` semantic tokens) for its themed
surfaces, the page renders identically under global light and dark. `.force-light`
neutralises any incidental `--color-*` usage so nothing flips.

## Files touched

- `package.json` — add `@fontsource/hanken-grotesk`, `@fontsource/playfair-display`.
- `src/pages/sponsors/vinarius.astro` — font imports (frontmatter), `--vin-*` palette +
  font tokens, G1 hero gradient, recolour all sections (drop gold), official logo on a
  light surface, remove the Georgia placeholder.
- `public/brand/vinarius-logo-burgundy.svg` — copied asset.

## Testing

- **Build** passes; `npx astro check` shows no new errors.
- **Visual (Chrome DevTools MCP):**
  - Hero shows the burgundy→navy G1 gradient, beige Hanken "VINARIUS", Playfair italic
    Latin line; no gold anywhere on the page (grep the source for `c9a43e`/`gold` → none).
  - The official Vinarius logo renders legibly on its light surface.
  - The page looks identical with global `data-theme="light"` and `data-theme="dark"`.
- **No leakage:** Hanken/Playfair and `--vin-*` are confined to this page; other pages
  still use Barlow + the Lionhearts palette (spot-check `/` is unchanged).
- **AA:** beige `#ECF5D9` on burgundy `#6E0833` and on navy `#11234b` both pass
  (beige is near-white → high contrast); spot-check any light sections' burgundy text.

## Open questions / risks

- **Substitute fidelity:** Hanken Grotesk ≈ Gentona and Playfair Display ≈ Didot are
  close but not exact; acceptable per the substitute decision (mirrors Barlow↔DIN).
- **Logo surface:** if no suitable light surface exists in the current layout, add a
  small beige "title sponsor" band for the logo rather than recolouring it.
