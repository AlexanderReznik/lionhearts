# Add Taste Catering as a second sponsor — Design

Date: 2026-06-21

## Goal

The club now has two sponsors. Add **Taste Catering** everywhere the site
currently shows the single sponsor, and re-tier the sponsors:

- **Vinarius London** — was "Title Sponsor", now **NVL Super League Sponsor**.
- **Taste Catering** — new, **Club Sponsor**.

Links to `https://tastecatering.co.uk`. The logo must stay legible on both the
light and dark themes.

## Scope

Two files change, plus one new asset. Out of scope: `src/data/teams.ts` (the
women's team *named* "Vinarius" is unrelated to sponsor tiering) and the
sponsorship perks copy.

### New asset

Copy `Lionhearts_Website_Assets/Logos_SVG/Taste Catering_Logo_Alternative.svg`
(horizontal lockup — bowl mark + "TASTE CATERING" on one line) to
`public/brand/taste-catering-logo.svg`.

Follows the existing brand-logo convention: brand/sponsor SVGs live in
`public/brand/` and are referenced via a plain `<img src="/brand/...">`, exactly
like `vinarius-logo-burgundy.svg`. (The astro:assets `<Picture>` rule is for
content photos, not brand logos.)

The Taste logo uses a dark grey wordmark (`#4f4f4f`) that would disappear on the
dark navy theme, so it sits on the same **white "chip"** the Vinarius logo
already uses — this guarantees legibility in both themes with no theme-specific
logic.

## Data shape

Replace the single `sponsor` object (in both files) with a `sponsors` array:

```ts
const sponsors = [
  {
    name: 'Vinarius London',
    tier: 'NVL Super League Sponsor',
    tagline: "East London's Independent Wine Merchant",
    description: "East London's independent wine merchant — curating small-production wines from 15+ countries, hosting tastings and supper clubs in Shoreditch.",
    url: 'https://vinarius.london',
    logo: '/brand/vinarius-logo-burgundy.svg',
    cta: 'Visit Vinarius',
  },
  {
    name: 'Taste Catering',
    tier: 'Club Sponsor',
    tagline: 'Good taste, always focused on the flavour',
    description: 'Vibrant, fresh and culturally diverse catering — home of the Kokoro Korean kitchens and sushi bars at Imperial College London, serving campus dining, conferences, hospitality and events across the city.',
    url: 'https://tastecatering.co.uk',
    logo: '/brand/taste-catering-logo.svg',
    cta: 'Visit Taste Catering',
  },
];
```

`tagline` is used on the homepage section; `description` on the sponsorship page.

## Homepage — `src/components/SponsorsSection.astro`

- Keep the "Proudly supported by" eyebrow heading.
- Render the two sponsors as **equal tiles in a 2-column grid**, reusing the
  existing `.sponsors__title-card` tile styling (tier badge → logo-on-white-chip
  → tagline → CTA). Vinarius first, Taste second.
- Collapse to a single column on mobile.
- The per-tile badge text comes from `sponsor.tier`; CTA text from
  `sponsor.cta` ("Visit X ↗").

## Sponsorship page — `src/pages/sponsorship.astro`

- Change the section eyebrow `Title Sponsor` → **"Our Sponsors"**.
- Replace the single `.sponsor-hero` panel with the **two tiles side by side**,
  reusing the existing `.sponsor-hero` styling (tier badge, logo chip,
  description, CTA), 1 column on mobile.
- "Become a Sponsor" CTA and the perks grid are unchanged.

## Theme handling

White logo chip handles both themes (existing approach). Responsive grids stack
on mobile. No new semantic tokens needed.

## Verification

- `npm run build` succeeds (no broken asset references).
- Visual check at desktop + mobile widths (375px) in both light and dark themes:
  two tiles render, logos legible, links point to the correct URLs.
