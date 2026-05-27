# Volleyzone API — Fetching Results & Fixtures

The [London League page](https://londonvolleyball.org.uk/london-league/) embeds a widget from
`competitions.volleyzone.co.uk`. The widget uses two undocumented WordPress AJAX endpoints that
can be called directly with `fetch` or `curl` — no authentication or browser session required.

---

## Endpoints

### 1. List divisions

Returns an HTML `<select>` fragment listing every division in a season.

```
POST https://competitions.volleyzone.co.uk/wp-admin/admin-ajax.php?action=fetch_fixture_by_competitiongrp
Content-Type: application/x-www-form-urlencoded
X-Requested-With: XMLHttpRequest
Origin: https://competitions.volleyzone.co.uk

seasonidgrp=3881&fix_compgrpID=&pageTitle=Fixture+and+Results&userId=298568&lastSegment=lva
```

Response is raw HTML — parse the `<option>` values to get `fix_compID` values for the next call.

### 2. Fetch all matches for a division

Returns every match (past results **and** upcoming fixtures) for one division.

```
POST https://competitions.volleyzone.co.uk/wp-admin/admin-ajax.php?action=fetch_fixture_by_competition
Content-Type: application/x-www-form-urlencoded
X-Requested-With: XMLHttpRequest
Origin: https://competitions.volleyzone.co.uk

seasonidgrp=3881&fix_compID=209509&pageTitle=Fixture+and+Results&userId=298568&lastSegment=lva
```

---

## Parameters

| Parameter | Description |
|---|---|
| `seasonidgrp` | Season ID. See per-league tables below. |
| `fix_compID` | Division ID (see tables below). |
| `pageTitle` | Always `Fixture+and+Results`. |
| `userId` | Depends on the league — `298568` for LVA, `279580` for NVL. |
| `lastSegment` | Depends on the league — `lva` or `nvl`. |

---

## London League (LVA)

`userId=298568` · `lastSegment=lva`

| Season | `seasonidgrp` |
|---|---|
| 2025-2026 | `3881` |
| 2024-2025 | `3484` |
| 2023-2024 | `3402` |

### Lionhearts teams — LVA 2025-2026

| Team | Division | `fix_compID` |
|---|---|---|
| Lionhearts Alpha | Men's Premier Division | `209508` |
| Lionhearts Predators | Men's Division 1B | `209510` |
| Lionhearts Pride | Men's Division 2A | `209511` |
| Lionhearts Roar | Men's Division 3A | `209513` |
| Lionhearts Cats | Women's Division 1A | `209502` |
| Lionhearts Fury | Women's Division 1B | `209503` |
| Lionhearts Beats | Women's Division 2C | `209506` |

---

## National Volleyball League (NVL)

`userId=279580` · `lastSegment=nvl`

| Season | `seasonidgrp` |
|---|---|
| 2025-2026 | `3852` |
| 2024-2025 | `3422` |
| 2023-2024 | `3346` |

### Lionhearts teams — NVL 2025-2026

| Team | Division | `fix_compID` |
|---|---|---|
| London Lionhearts | Men's Division 3 South East | `206204` |
| Lionhearts Vinarius | MAAREE Women's Super League | `206206` |
| Lionhearts Vinarius | Women's National Cup | `207487` |

### All division IDs — 2025-2026 season (`seasonidgrp=3881`)

| ID | Division |
|---|---|
| `209501` | Women's Premier Division |
| `209502` | Women's Division 1A |
| `209503` | Women's Division 1B |
| `209504` | Women's Division 2A |
| `209505` | Women's Division 2B |
| `209506` | Women's Division 2C |
| `209507` | Women's Division 3 |
| `209508` | Men's Premier Division |
| `209509` | Men's Division 1A |
| `209510` | Men's Division 1B |
| `209511` | Men's Division 2A |
| `209512` | Men's Division 2B |
| `209513` | Men's Division 3A |
| `209515` | Men's Division 3B |
| `209516` | Men's Division 3C |
| `215449` | London League Playoffs M |
| `215450` | London League Playoffs W |
| `215451` | London League Playoffs W2 |

---

## Response format

The response is JSON with a single `debug` key whose **value is itself a JSON string** — parse
twice:

```js
const outer = await res.json();            // { debug: "..." }
const inner = JSON.parse(outer.debug);     // { data: { fixtures: [...] } }
const fixtures = inner.data.fixtures;
```

### Match object fields

```ts
interface Match {
  fixtureId: string;
  fixtureDate: number;        // Unix timestamp (seconds)
  fixtureStatus: "result" | "fixture" | "postponed";
  homeTeam: string;
  awayTeam: string;
  homeClub: string;
  awayClub: string;
  homeTeamId: string;
  awayTeamId: string;
  homeScore: string;          // e.g. "3;" — sets won
  awayScore: string;          // e.g. "0;"
  homeResult: "win" | "lose" | "draw" | "";
  awayResult: "win" | "lose" | "draw" | "";
  metaData: {
    scores: {
      home: { goals: string; "1": string; "2": string; "3": string; "4": string; "5": string };
      away: { goals: string; "1": string; "2": string; "3": string; "4": string; "5": string };
    };
  };
  venue: string;
  venuePostalCode: string;
  venuelat: string;
  venuelng: string;
  competitionName: string;
  competitionShortName: string;
  officials: Record<string, string>;  // e.g. { "1st Referee": "...", "2nd Referee": "..." }
}
```

---

## Filtering by team

The endpoint returns all teams in the division. Filter client-side:

```js
const teamMatches = fixtures.filter(
  f => f.homeTeam.includes("Lionhearts") || f.awayTeam.includes("Lionhearts")
);
```

To get only completed results:

```js
const results = teamMatches.filter(f => f.fixtureStatus === "result");
```

---

## Example: fetch Lionhearts results (Node.js / Astro)

```ts
const ENDPOINT =
  "https://competitions.volleyzone.co.uk/wp-admin/admin-ajax.php?action=fetch_fixture_by_competition";

const STATIC_PARAMS = {
  pageTitle: "Fixture+and+Results",
  userId: "298568",
  lastSegment: "lva",
};

export async function fetchTeamResults(
  seasonId: string,
  compId: string,
  teamName: string
) {
  const body = new URLSearchParams({
    seasonidgrp: seasonId,
    fix_compID: compId,
    ...STATIC_PARAMS,
  });

  const res = await fetch(ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      "X-Requested-With": "XMLHttpRequest",
      Origin: "https://competitions.volleyzone.co.uk",
    },
    body,
  });

  const outer = await res.json();
  const inner = JSON.parse(outer.debug);
  const fixtures: Match[] = inner.data.fixtures;

  return fixtures.filter(
    f =>
      f.fixtureStatus === "result" &&
      (f.homeTeam.includes(teamName) || f.awayTeam.includes(teamName))
  );
}

// Usage — Men's Division 1A, 2025-26 season
const results = await fetchTeamResults("3881", "209509", "Lionhearts");
```

---

## curl one-liner (for testing)

```bash
curl -s -X POST \
  'https://competitions.volleyzone.co.uk/wp-admin/admin-ajax.php?action=fetch_fixture_by_competition' \
  -H 'Content-Type: application/x-www-form-urlencoded' \
  -H 'X-Requested-With: XMLHttpRequest' \
  -H 'Origin: https://competitions.volleyzone.co.uk' \
  --data 'seasonidgrp=3881&fix_compID=209509&pageTitle=Fixture+and+Results&userId=298568&lastSegment=lva' \
  | python3 -c "
import json, sys
outer = json.load(sys.stdin)
fixtures = json.loads(outer['debug'])['data']['fixtures']
team = 'Lionhearts'
for f in fixtures:
    if team in f['homeTeam'] or team in f['awayTeam']:
        date = f['fixtureDate']
        print(f['homeTeam'], f['homeScore'], 'vs', f['awayScore'], f['awayTeam'])
"
```

---

## Notes

- **No authentication needed** — the server only checks `X-Requested-With: XMLHttpRequest` and
  `Origin`. Both headers must be present.
- **CORS** — verified by testing: the server only returns `access-control-allow-origin` when the
  `Origin` header is exactly `https://competitions.volleyzone.co.uk`. Any other origin (including
  `londonvolleyball.org.uk`) receives no CORS headers, so browser `fetch` will be blocked. Call
  this from an Astro server route or a build-time data fetch — both run server-side and are not
  subject to browser CORS.
- **Caching** — the server sends `no-store` headers. For production, add your own short-lived
  cache (e.g. revalidate every hour in an Astro server route).
- **Double-encoded response** — the `debug` wrapper is not a documented feature; it may change.
  Add a try/catch around `JSON.parse(outer.debug)`.
- **Division IDs may change each season** — re-check `seasonidgrp` and `fix_compID` values at
  the start of each new season by inspecting the network tab on the London League page.
