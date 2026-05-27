# Fixtures Feature Design — Lionhearts Website

**Date:** 2026-05-27
**Scope:** Build-time Volleyzone fixture fetch + client-side timeline UI on the Events page

---

## Decisions

| Question | Decision |
|---|---|
| Teams covered | All 9 (7 LVA + 2 NVL) |
| Match scope | 3 recent results + 3 upcoming fixtures per team |
| Data freshness | Build-time fetch; manual rebuild at season start |
| "Upcoming" logic | Client-side date filter against `Date.now()` |
| Layout | Vertical timeline within each existing team section |

---

## Data Layer

### New file: `src/lib/volleyzone.ts`

Exports:

```ts
interface Match {
  fixtureId: string;
  fixtureDate: number;           // Unix timestamp (seconds)
  fixtureStatus: 'result' | 'fixture' | 'postponed';
  homeTeam: string;
  awayTeam: string;
  homeScore: string;             // e.g. "3;"
  awayScore: string;             // e.g. "0;"
  homeResult: 'win' | 'lose' | 'draw' | '';
  awayResult: 'win' | 'lose' | 'draw' | '';
  venue: string;
  metaData: { scores: { home: Record<string,string>; away: Record<string,string> } };
}

interface TeamFixtures {
  teamName: string;
  matches: Match[];
  error: boolean;
}

async function fetchTeamFixtures(compId: string, seasonId: string, userId: string, lastSegment: string): Promise<Match[]>
async function fetchAllFixtures(): Promise<Record<string, TeamFixtures>>
```

`fetchAllFixtures` iterates all teams that have a `compId` defined, calls `fetchTeamFixtures` for each in parallel (`Promise.allSettled`), and returns a map keyed by `team.name`. Failed fetches set `error: true` and `matches: []` rather than throwing.

The LVA endpoint and NVL endpoint differ only in `userId` and `lastSegment` — `fetchTeamFixtures` is agnostic and takes them as parameters.

Double-encoded response parsing (per API doc):
```ts
const outer = await res.json();
const inner = JSON.parse(outer.debug);
const matches: Match[] = inner.data.fixtures;
```

Wrap in try/catch — `outer.debug` may change without warning.

### Changes to `src/data/teams.ts`

Add four optional fields to `Team`:

```ts
compId?: string;           // Volleyzone fix_compID for this team's division
seasonId?: string;         // e.g. '3881' (LVA 2025-26), '3852' (NVL 2025-26)
volleyzoneUserId?: string; // '298568' LVA | '279580' NVL
volleyzoneSegment?: 'lva' | 'nvl';
```

Populated values (from `docs/volleyzone-api.md`):

| Team | compId | seasonId | userId | segment |
|---|---|---|---|---|
| Vinarius | 206206 | 3852 | 279580 | nvl | Super League only — National Cup (207487) excluded from fixtures display |
| Fury | 209503 | 3881 | 298568 | lva |
| Cats | 209502 | 3881 | 298568 | lva |
| Beats | 209506 | 3881 | 298568 | lva |
| Alpha | 209508 | 3881 | 298568 | lva |
| Predators | 209510 | 3881 | 298568 | lva |
| Pride | 209511 | 3881 | 298568 | lva |
| Roar | 209513 | 3881 | 298568 | lva |
| Leo | 206204 | 3852 | 279580 | nvl |

---

## Events Page Changes (`src/pages/events.astro`)

### Build-time

```ts
import { fetchAllFixtures } from '../lib/volleyzone';
const fixturesMap = await fetchAllFixtures();
const buildTimestamp = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
```

### JSON data islands

Inside each `.team-fixture-section`, immediately after the header, emit:

```html
<script
  type="application/json"
  data-fixtures={team.name}
  set:html={JSON.stringify(fixturesMap[team.name] ?? { matches: [], error: true })
    .replace(/<\//g, '<\\/')}
/>
```

The existing `.team-fixture-section__header` stays unchanged. Below it, add a `.team-fixtures` div as the render target (initially empty, populated by client JS).

Add `data-updated={buildTimestamp}` to the `.team-fixture-section` element so client JS can read it for the footer.

---

## Client-Side Rendering

A single `<script>` block in `events.astro` runs after DOM ready. For each `.team-fixture-section`:

1. Read the JSON data island (`script[data-fixtures]`)
2. Compute today's midnight: `new Date(); today.setHours(0,0,0,0)`
3. Split matches:
   - **results**: `fixtureStatus === 'result'`, sorted newest-first, take 3
   - **upcoming**: `fixtureStatus === 'fixture'` AND `fixtureDate * 1000 >= today.getTime()`, sorted oldest-first, take 3
4. Determine home/away: `match.homeTeam.includes('Lionhearts') ? 'Home' : 'Away'`
5. Format date: `new Date(match.fixtureDate * 1000).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })` → "3 May"
6. Format score from Lionhearts perspective:
   - Parse `homeScore` / `awayScore` by stripping trailing `";"` → `homeScore.replace(';', '')`
   - If home: result = homeResult, score = `${parsedHome}–${parsedAway}`
   - If away: result = awayResult, score = `${parsedAway}–${parsedHome}`
7. Format match time for upcoming: extract hours/minutes from `fixtureDate` timestamp. If time is 00:00 (time not yet set), omit the time portion and show venue only.
8. Build HTML string for `.team-fixtures` and set `innerHTML`
9. If `error: true` or both results and upcoming are empty: render fallback (see Error States)

The script reads `dataset.updated` from the section element for the footer timestamp.

**No framework, no dependencies** — vanilla DOM manipulation matching the existing events.astro pattern.

---

## UI Structure (per team section)

```
.team-fixture-section
  .team-fixture-section__header        ← unchanged
  script[type=application/json]        ← data island (hidden)
  .team-fixtures                       ← client JS render target
    .tl-section-label  "Recent Results"
    .tl-row × 3
      .tl-date
      .tl-opponent  (.tl-vs + team name)
      .badge-w / .badge-l  "W 3–0" / "L 1–3"
    .tl-section-label  "Upcoming Fixtures"
    .tl-row-up.tl-row-up--next         ← first upcoming only
      .tl-date
      .tl-up-meta
        .tl-up-opp
        .tl-up-venue  "📍 Venue · HH:MM"
      .tl-right
        .next-pill  "Next"
        .home-away
    .tl-row-up × 2
      .tl-date
      .tl-up-meta
        .tl-up-opp
        .tl-up-venue
      .tl-right
        .home-away
    .tl-footer
      .tl-updated  "Updated 27 May 2026"
      a.vz-link  "Full schedule on Volleyzone →"
```

---

## Edge / Error States

| Condition | Behaviour |
|---|---|
| API fetch failed | Show: "Fixtures unavailable — [Full schedule on Volleyzone →]" |
| No results yet (pre-season) | Omit "Recent Results" section entirely |
| No upcoming fixtures (season complete / postponed) | Omit "Upcoming Fixtures" section; show "Season complete" text |
| Only 1–2 results/upcoming | Show however many exist; no empty placeholders |
| `fixtureStatus === 'postponed'` | Exclude from both results and upcoming |

---

## CSS

New classes added to `events.astro` `<style>` block (scoped). No global CSS changes.

Key classes: `.tl-section-label`, `.tl-row`, `.tl-row-up`, `.tl-row-up--next`, `.tl-up-meta`, `.tl-up-opp`, `.tl-up-venue`, `.tl-right`, `.next-pill`, `.home-away`, `.badge-w`, `.badge-l`, `.tl-footer`, `.tl-updated`, `.vz-link`.

Mobile (≤640px): the three-column grid (`62px 1fr auto`) collapses — date moves above opponent, right column remains. No horizontal scroll.

---

## "Last Updated" Display

`buildTimestamp` is a string rendered at build time into `data-updated` on each `.team-fixture-section`. Client JS copies it into `.tl-updated` in the footer. This way the timestamp is always the actual build date, not a JS `Date.now()` call at runtime.

---

## Files Changed

| File | Change |
|---|---|
| `src/lib/volleyzone.ts` | New — API fetch + parse |
| `src/data/teams.ts` | Add `compId`, `seasonId`, `volleyzoneUserId`, `volleyzoneSegment` fields |
| `src/pages/events.astro` | Build-time fetch, JSON islands, client JS, new CSS classes |

No new pages. No SSR adapter. No new dependencies.

---

## Season Maintenance

At the start of each new season: update `seasonId` values in `teams.ts` (check Volleyzone network tab for new `seasonidgrp`), then redeploy. The `compId` values may also change — see `docs/volleyzone-api.md § Notes`.
