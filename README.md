# London Lionhearts Volleyball Club

Website for [London Lionhearts VBC](https://lionheartsvolleyball.com) — East London's volleyball club, founded 1998, based in Shoreditch E2.

## Stack

- **[Astro 6](https://astro.build)** — static site generator, zero JS by default
- **TypeScript** (strict)
- **Vitest** — unit tests for data utilities
- **Netlify** — hosting, Forms, environment variables
- **Vanilla CSS** with custom properties (no framework)

## Pages

| Route | Description |
|---|---|
| `/` | Home — hero carousel, stats, about intro, community, sponsors, Instagram feed, join CTA |
| `/about` | Club history, founders, values |
| `/events` | Open sessions (Google Sheets or fallback), Volleyzone fixture links per team |
| `/teams` | 9-team grid — Women's: Vinarius, Cats, Fury, Beats · Men's: Alpha, Predators, Pride, Roar, Leo |
| `/sponsorship` | Title sponsor, partnership CTA, sponsorship perks |
| `/join` | 3 join pathways + Netlify sign-up form |
| `/contact` | Contact cards, location block, social links |

---

## Development

### Prerequisites

- Node 22+
- npm

### Install

```bash
npm install
```

### Dev server

```bash
npm run dev
```

Opens at `http://localhost:4321`. Hot module replacement is enabled by default.

### Build

```bash
npm run build
```

Output goes to `dist/`. Astro also generates `dist/sitemap-index.xml` and `dist/sitemap-0.xml` from the site's page routes.

### Preview built site

```bash
npm run preview
```

Serves the `dist/` directory locally — useful for checking the 404 page and sitemap before deploying.

### Tests

```bash
npm test
```

Unit tests for the Google Sheets CSV parser (`src/lib/sheets.ts`). Run with Vitest.

---

## Environment variables

Copy `.env.example` to `.env` and fill in values for local development:

```bash
cp .env.example .env
```

| Variable | Required | Description |
|---|---|---|
| `GOOGLE_SHEET_ID` | Optional | Google Sheet ID for live session data. The sheet must be published as CSV (File → Share → Publish to web → CSV). Without it, hardcoded fallback sessions are used. |
| `BEHOLD_FEED_ID` | Optional | [Behold.so](https://behold.so) feed widget ID for the Instagram embed on the homepage. Without it, a placeholder grid is shown. |

On Netlify, set these under **Site settings → Environment variables**.

---

## Deploy

The site deploys to Netlify. `netlify.toml` configures the build automatically:

- **Build command:** `npm run build`
- **Publish directory:** `dist`
- **Node version:** 20
- **404 handling:** unmatched routes return `/404` with HTTP 404 status

To deploy:

1. Push the repo to GitHub
2. Connect the repo in the Netlify dashboard (Add new site → Import from GitHub)
3. Build settings are auto-detected from `netlify.toml`
4. Add environment variables in Netlify dashboard
5. Click **Deploy site**

For the custom domain (`lionheartsvolleyball.com`), add it under **Domain management** in Netlify and update DNS to point to Netlify's nameservers.

---

## Pre-launch checklist

- [ ] Set `GOOGLE_SHEET_ID` in Netlify env vars and publish the Google Sheet as CSV
- [ ] Set `BEHOLD_FEED_ID` from the Behold.so dashboard (linked to `@lionhearts_volleyball`)
- [ ] Verify Volleyzone team URL slugs in `src/data/teams.ts` (current values are unverified guesses)
- [ ] Replace sponsor placeholder data in `src/pages/sponsorship.astro`
- [ ] Supply team photos as `public/images/team-<name>.jpg` (e.g. `team-vinarius.jpg`)
- [ ] Replace `public/images/og-default.jpg` with a real 1200×630 club photo
- [ ] Confirm open session times with club (Mon/Thu 7–9pm, Fri 8–10pm — hardcoded in fallback data and JSON-LD)

---

## Project structure

```
src/
  components/       # Shared UI components (Nav, Footer, Hero, TeamCard, etc.)
  data/             # Static data (teams, flags)
  layouts/          # BaseLayout wrapping every page
  lib/              # Utilities — sheets.ts for Google Sheets CSV parsing
  pages/            # One file per route
  styles/           # global.css — design tokens and base styles
public/
  images/           # Static assets (OG image, team photos when provided)
  robots.txt
tests/              # Vitest unit tests
```

## Design system

Dark navy theme. All CSS tokens are in `src/styles/global.css`:

- Background: `--color-bg: #050d1a`
- Accent gradient: `--color-accent-from: #0050e0` → `--color-accent-to: #0090ff`
- Typography, spacing, and button variants all use custom properties
