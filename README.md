# London Lionhearts Volleyball Club

Website for [London Lionhearts VBC](https://lionheartslondon.com) — East London's volleyball club, founded 1998, based in Shoreditch E2.

## Stack

- **[Astro 6](https://astro.build)** — static site generator, zero JS by default
- **TypeScript** (strict)
- **Vitest** — unit tests for the build-time data utilities
- **Vercel** — hosting and environment variables
- **[Web3Forms](https://web3forms.com)** — sign-up form submissions
- **Vanilla CSS** with custom properties (no framework)

## Pages

| Route | Description |
|---|---|
| `/` | Home — hero carousel, stats, about intro, community, sponsors, Instagram feed, join CTA |
| `/about` | Club history, founders, values |
| `/events` | Open sessions (live Google Sheet or fallback), Volleyzone fixture links per team |
| `/teams` | 9-team grid — NVL: Vinarius (W), London Lionhearts (M) · LVA: Alpha, Fury (Premier), Cats, Beats, Predators (Div 1), Pride (Div 2), Roar (Div 3) |
| `/sponsorship` | Sponsors, partnership CTA, sponsorship perks |
| `/join` | 3 join pathways + Web3Forms sign-up form |
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

> **Peer-dependency note:** `@vercel/analytics` lists `@sveltejs/kit` as an
> optional peer, which pulls a Vite 8 beta that clashes with this project's
> Vite 7. It's harmless for Astro, but strict peer resolution would fail a
> plain `npm install`. A committed `.npmrc` sets `legacy-peer-deps=true` so
> installs (locally and on Vercel) just work — no extra flags needed.

### Dev server

```bash
npm run dev
```

Opens at `http://localhost:4321`. Hot module replacement is enabled by default.

The `/` and `/events` pages fetch fixtures and the Instagram feed at build time.
When you aren't working on those sections, skip the slow network calls with the
literal `true` (a `1` will **not** skip):

```bash
SKIP_VOLLEYZONE=true SKIP_BEHOLD=true npm run dev
```

### Build

```bash
npm run build
```

Output goes to `dist/`. Astro also generates `dist/sitemap-index.xml` and `dist/sitemap-0.xml` from the site's page routes. Build-time data fetches degrade to empty on any failure, so a network hiccup never fails the build.

### Preview built site

```bash
npm run preview
```

Serves the `dist/` directory locally — useful for checking the 404 page and sitemap before deploying.

### Tests

```bash
npm test
```

Vitest unit tests for the build-time data utilities: the Google Sheets CSV
parser (`sheets.ts`), the Volleyzone fixtures fetch (`volleyzone.ts`), the
Behold Instagram feed (`behold.ts`), the theme resolver (`lib/theme.ts`), and
the flag data (`flags.ts`).

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

On Vercel, set these under **Project Settings → Environment Variables**.

---

## Deploy

The site deploys to Vercel. Vercel auto-detects Astro — no config file needed.

- **Build command:** `npm run build` (auto-detected)
- **Output directory:** `dist` (auto-detected)
- **404 handling:** Vercel automatically serves `dist/404.html` for unmatched routes

### Sign-up form (Web3Forms)

The join form (`/join`) submits to [Web3Forms](https://web3forms.com). The
`access_key` in `src/pages/join.astro` ties submissions to the club inbox, and a
`botcheck` honeypot filters spam. Web3Forms emails each submission and redirects
to `/join-success` on completion. To point the form at a different inbox, swap
the `access_key` for one issued to that email address.

### Deploy steps

1. Push the repo to GitHub
2. Import the project at [vercel.com/new](https://vercel.com/new)
3. Add environment variables under **Project Settings → Environment Variables**
4. Click **Deploy**

For the custom domain (`lionheartslondon.com`), add it under **Project Settings → Domains** in Vercel and follow the DNS instructions.

To rebuild automatically when the Google Sheet schedule changes, wire a Vercel
Deploy Hook to the sheet's Apps Script trigger — see `human-todo.md`.

---

## Project structure

```
src/
  assets/           # Images served via astro:assets (hero, teams, icons, flags)
  components/       # Shared UI components (Nav, Footer, Hero, TeamCard, etc.)
  data/             # Static data — club constants, teams, sponsors, flags
  layouts/          # BaseLayout wrapping every page
  lib/              # Build-time utilities — sheets, volleyzone, behold, theme
  pages/            # One file per route
  styles/           # global.css — design tokens and base styles
public/
  brand/            # Logo / favicon / wordmark SVGs
  images/           # OG image and other static raster assets
tests/              # Vitest unit tests
```

## Design system

Light-led brand theme with a light/dark toggle. All CSS tokens live in
`src/styles/global.css`, in two layers:

- **Brand tokens** (`--lh-*`, fixed): navy `#11234b`, deep navy `#05122b`, white, flat brand blue `#54a4f7`, plus secondary/tint ramps.
- **Semantic tokens** (`--color-*`): each declared once as `light-dark(LIGHT, DARK)`, so a single `color-scheme` flip drives the whole theme. `:root[data-theme="dark"]` and a `prefers-color-scheme: dark` fallback (for no-JS users) select the dark side.

The accent is a single flat brand blue (`--color-accent`, no gradients).
Accent-coloured **text** uses `--color-accent-text` (a darker blue in light
theme) so it passes WCAG AA. Typography is **Barlow**, self-hosted via
Fontsource. See `CLAUDE.md` for the full theming and accessibility conventions.
