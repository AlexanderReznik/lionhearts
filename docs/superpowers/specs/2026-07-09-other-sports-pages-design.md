# Other Sports pages (Football & Netball) — Design

**Date:** 2026-07-09
**Status:** Approved for planning

## Problem

Lionhearts is a multi-sport club, but the site is entirely volleyball. The club
also fields a **football** side and a **netball** side. Volleyball is by far the
largest and stays the site's identity; football and netball need a real presence
without being promoted to equal billing.

## Positioning

**Volleyball-first, sports as satellites.** The site remains "London Lionhearts
Volleyball Club." Football and netball get their own pages that reuse the exact
navy/blue design system, so they read as part of the same club — but they are
never given equal top-level nav billing and the homepage is left untouched.

## Scope

In scope:

- Two new pages: `/football` and `/netball`, from one shared template.
- An "Other Sports" dropdown in the main nav (desktop + mobile overlay).
- Two footer links.

Explicitly **out** of scope (decided during brainstorming):

- No homepage band / section. Discovery is nav + footer only.
- No per-sport multi-page sections (no separate teams/sessions pages per sport).
- No Google Sheet / live data. Each sport has **one team** and a **fixed
  schedule**, both hardcoded in a data file.
- No per-sport visual identity or off-brand colour.

## The pages

`/football` and `/netball` are the same template with different data. Sections,
top to bottom:

1. **Hero (branded panel).** Since real photos are not expected at launch, the
   hero is an intentional-looking navy panel — not a greyed-out photo
   placeholder. It reuses the existing `.page-hero` treatment (as `/teams` and
   `/about` do): `page-hero__eyebrow`, a `page-hero__title` with an accent
   `<em>`, and a `page-hero__sub` intro line, over the same tinted radial. A
   `GraphicAccent` flourish provides visual interest in place of a photo. The
   data model still carries an **optional `heroImage`**; when a real photo is
   supplied later, the template swaps the panel for an `astro:assets`
   `<Picture>` hero (mirroring `Hero.astro`) with no structural change.
2. **Intro.** 2–3 sentences on the side.
3. **The team.** A single team + its league/division, shown as a compact facts
   line/card (not a card grid — there is only one team per sport).
4. **Training & matches.** Fixed weekly training day/time/venue and match
   day/venue, hardcoded.
5. **Join CTA.** Contact method — email / WhatsApp / sign-up form URL — reusing
   the existing button styles (`.btn--accent`).

## Data model

New `src/data/sports.ts`, mirroring the shape and conventions of
`src/data/teams.ts` / `src/data/club.ts`:

```ts
export interface OtherSport {
  slug: 'football' | 'netball';
  name: string;              // "Lionhearts Football"
  eyebrow: string;           // "Lionhearts · Football"
  titleLead: string;         // hero title, plain part
  titleEm: string;           // hero title, accented <em> part
  intro: string;             // 2–3 sentence intro
  team: { name: string; league: string };
  schedule: {
    training: { day: string; time: string; venue: string };
    matches:  { day: string; venue: string };
  };
  join: { label: string; href: string };   // email:/https:/wa.me
  heroImage?: ImageMetadata;                // optional; enables photo hero later
  alt?: string;
}

export const otherSports: OtherSport[] = [ /* football, netball */ ];
```

## Implementation shape

- **Shared component** `src/components/SportPage.astro` renders one `OtherSport`
  entry (all five sections above).
- **Two route files** `src/pages/football.astro` and `src/pages/netball.astro`,
  each a thin wrapper that looks up its entry and passes it to `SportPage`.
  (Explicit files over a `[sport].astro` dynamic route, to match the site's
  one-file-per-route convention.)
- Both use `BaseLayout` with a proper `title`/`description`. **No `noindex`** —
  they are included in the sitemap (no change to the sitemap exclude filter,
  which only drops `/join-success/`).
- The `join.href` external-link handling uses the established spread pattern:
  `{...(href.startsWith('http') ? { target: '_blank', rel: 'noopener noreferrer' } : {})}`.

## Navigation & discovery

**Nav — "Other Sports" dropdown** (`src/components/Nav.astro`):

- Desktop: a new nav item "Other Sports" that opens a dropdown listing
  **Football** and **Netball**. Keyboard-accessible (`:focus-visible`,
  `aria-expanded`, Escape to close), consistent with the existing hamburger/
  overlay patterns already in this file.
- Mobile overlay: the two links appear as a small labelled subgroup within the
  existing `nav__overlay-links` list.
- This is the only structurally new UI. It must not regress the existing
  992px collapse behaviour.

**Footer** (`src/components/Footer.astro`): add Football and Netball to the
existing link arrays (the "Club" column's `clubLinks`), reusing current footer
link styles. No new column.

## Design-system compliance (hard requirement)

- **No hardcoded values.** All colour, spacing, type, weight, and tracking use
  the existing semantic/scale tokens from `src/styles/global.css`:
  `--color-*` (never `--lh-*`/hex in components), `--space-*`, `--text-*`,
  `--weight-*`, `--tracking-*`, `--font-*`. Accent **text** uses
  `--color-accent-text`, never `--lh-blue`/`#54a4f7` (per the AA rule in
  CLAUDE.md).
- **No inline styles.** Any override is a scoped BEM class.
- **Reuse existing components/classes** wherever they fit: `.page-hero*`,
  `Section`, `GraphicAccent`, `.btn--accent`, footer/nav classes.
- **Icons** (if any needed, e.g. for the join CTA or schedule) come via
  `Icon.astro` (native SVG-component import, `currentColor`), not `<Image>`.

## Light/dark theme (hard requirement)

- Both pages and the nav dropdown must work in **light and dark**. Because they
  reference only semantic `--color-*` tokens, they theme automatically — this is
  verified, not assumed.
- Any theme-specific override for a scoped element follows the established
  `:global(html[data-theme="dark"]) .my-class` pattern; any override on
  `set:html`/`is:global` content uses the plain
  `html[data-theme="dark"] .class` selector (per the GOTCHA in CLAUDE.md). The
  new pages should not need `set:html`.
- No new tokens are expected. If a genuinely new semantic token is required, it
  is added to **all** theme blocks in `global.css` — `:root`,
  `[data-theme="dark"]`, and the no-JS `@media (prefers-color-scheme: dark)`
  block (kept in sync).

## Owner-supplied content (post-implementation, à la human-todo.md)

Per sport: a 2–3 sentence intro, team name + league, training day/time/venue,
match day/venue, a contact method (email / WhatsApp / form URL), and — later,
optional — one hero photo. Until a photo is supplied the branded hero panel is
the finished design, not a stopgap.

## Testing / verification

- `npm test` (vitest) stays green.
- Build succeeds with `SKIP_VOLLEYZONE=true SKIP_BEHOLD=true npm run build`.
- Verify `/football` and `/netball` at real mobile widths (320/375/414) via
  Chrome DevTools MCP `emulate`, checking no horizontal overflow.
- Verify both pages **and** the nav dropdown in light and dark themes.
- Verify the nav still collapses correctly at 992px with the extra item.
```
