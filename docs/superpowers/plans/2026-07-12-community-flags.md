# Community Flag Mosaic Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the placeholder flagcdn.com flag mosaic on the homepage with 17 self-hosted SVGs matching the member list in `flags.txt`, including the two unofficial flags (white-red-white Belarus, lion-and-sun Iran).

**Architecture:** SVG files committed to `src/assets/flags/`; `src/data/flags.ts` maps display name → astro:assets import; `CommunitySection.astro` renders them with `<Image>`. No runtime network requests; a missing file fails the build.

**Tech Stack:** Astro 6 (astro:assets), TypeScript strict, Vitest 4.

**Spec:** `docs/superpowers/specs/2026-07-12-community-flags-design.md`

## Global Constraints

- No inline styles; visual tweaks go in scoped `<style>` blocks (CLAUDE.md).
- Alt/title text uses members' own wording from `flags.txt`: `UK` stays `UK`; the unofficial flags are alt'd plainly `Belarus` / `Iran`.
- Mosaic order = `flags.txt` order (top to bottom).
- `flags.txt` at the repo root stays untouched.
- Run dev/build with `SKIP_VOLLEYZONE=true SKIP_BEHOLD=true` (literal `true`).
- In Astro 6 a `*.svg` default import is typed `SvgComponent & ImageMetadata` (see `node_modules/astro/client.d.ts:113`), so it is a valid `<Image src>`. Under Vitest the same import resolves to a URL string — tests must only assert truthiness of `src`, never its shape.

---

### Task 1: Download and verify the 17 flag SVGs

**Files:**
- Create: `src/assets/flags/*.svg` (17 files, exact names in the table below)

**Interfaces:**
- Produces: 17 files whose exact basenames Task 2's imports rely on:
  `scotland.svg`, `hong-kong.svg`, `thailand.svg`, `spain.svg`, `vietnam.svg`,
  `denmark.svg`, `italy.svg`, `belgium.svg`, `france.svg`, `australia.svg`,
  `serbia.svg`, `uk.svg`, `lithuania.svg`, `croatia.svg`, `turkey.svg`,
  `belarus-wrw.svg`, `iran-lion-sun.svg`

- [ ] **Step 1: Download the 15 official flags from flag-icons (MIT), 4×3 crops**

```bash
mkdir -p src/assets/flags
cd src/assets/flags
for pair in scotland:gb-sct hong-kong:hk thailand:th spain:es vietnam:vn \
            denmark:dk italy:it belgium:be france:fr australia:au serbia:rs \
            uk:gb lithuania:lt croatia:hr turkey:tr; do
  name="${pair%%:*}"; code="${pair##*:}"
  curl -fsSL "https://raw.githubusercontent.com/lipis/flag-icons/main/flags/4x3/${code}.svg" -o "${name}.svg" \
    || echo "FAILED: ${name} (${code})"
done
cd -
```

Expected: no `FAILED:` lines. If one fails, retry; if it 404s, check the code
exists at <https://github.com/lipis/flag-icons/tree/main/flags/4x3>.

- [ ] **Step 2: Download the two unofficial flags from Wikimedia Commons (public domain)**

```bash
curl -fsSL "https://commons.wikimedia.org/wiki/Special:FilePath/Flag_of_Belarus_%281918%2C_1991%E2%80%931995%29.svg" \
  -o src/assets/flags/belarus-wrw.svg
curl -fsSL "https://commons.wikimedia.org/wiki/Special:FilePath/State_flag_of_Iran_%281964%E2%80%931980%29.svg" \
  -o src/assets/flags/iran-lion-sun.svg
```

If either 404s (Commons files get renamed), find the current filename via the
Commons search API and retry with the returned `title` (percent-encode it,
`File:` prefix stripped, in the `Special:FilePath/` URL):

```bash
curl -s "https://commons.wikimedia.org/w/api.php?action=query&list=search&srnamespace=6&format=json&srsearch=Flag+of+Belarus+1991+1995" | head -c 2000
curl -s "https://commons.wikimedia.org/w/api.php?action=query&list=search&srnamespace=6&format=json&srsearch=State+flag+of+Iran+1964+lion+sun" | head -c 2000
```

- [ ] **Step 3: Verify every file is a real SVG and the set is complete**

```bash
ls src/assets/flags/*.svg | wc -l   # expect 17
for f in src/assets/flags/*.svg; do
  head -c 300 "$f" | grep -qi "<svg\|<?xml" || echo "NOT SVG: $f"
done
du -h src/assets/flags/*.svg | sort -rh | head -5
```

Expected: count 17, no `NOT SVG:` lines. (A Commons 404 saved via
`Special:FilePath` can be an HTML error page — this catches it.)

- [ ] **Step 4: Optimize any heavy file (>100KB — in practice `iran-lion-sun.svg`)**

```bash
npx --yes svgo --multipass src/assets/flags/iran-lion-sun.svg
du -h src/assets/flags/iran-lion-sun.svg
```

Also run svgo on `belarus-wrw.svg` if Step 3 showed it above 100KB. Accept the
result if it renders correctly in Step 5; if svgo mangles the emblem (visual
check), re-download and commit the unoptimized file instead — correctness
beats bytes.

*(Post-review note: Astro passes SVGs through unoptimized, so svgo every
downloaded flag regardless of size — the >100KB heuristic mispredicted;
serbia/spain were the heavy ones.)*

- [ ] **Step 5: Visually verify the two unofficial flags are the RIGHT flags**

Open both files in Chrome (DevTools MCP: `navigate_page` to
`file:///Users/alex/projects/lionhearts/src/assets/flags/belarus-wrw.svg`,
screenshot, then same for `iran-lion-sun.svg`). Confirm:

- `belarus-wrw.svg` = three horizontal stripes, white-red-white. NOT the
  official red-green flag with ornament.
- `iran-lion-sun.svg` = green-white-red tricolour WITH the gold lion-and-sun
  emblem in the centre. NOT the current flag (red emblem/tulip).

This is the point of the whole feature — do not skip.

- [ ] **Step 6: Commit**

```bash
git add src/assets/flags
git commit -m "feat(community): add 17 self-hosted member flag SVGs

flag-icons (MIT) for official flags; Wikimedia Commons (public domain)
for white-red-white Belarus and lion-and-sun Iran.

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 2: Rewrite `src/data/flags.ts` (TDD)

**Files:**
- Create: `tests/flags.test.ts`
- Modify: `src/data/flags.ts` (full rewrite — placeholder iso/flagcdn list goes away)

**Interfaces:**
- Consumes: the 17 SVG files from Task 1 (exact basenames listed there).
- Produces: `export interface Flag { name: string; src: ImageMetadata }` and
  `export const flags: Flag[]` (17 entries, flags.txt order) — Task 3 renders
  `flags.map(f => ...)` using `f.src` and `f.name`.

- [ ] **Step 1: Write the failing test**

Create `tests/flags.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { flags } from '../src/data/flags';

// flags.txt order, members' own wording (spec: alt text does not editorialize).
const EXPECTED_NAMES = [
  'Scotland', 'Hong Kong', 'Thailand', 'Spain', 'Vietnam', 'Denmark',
  'Italy', 'Belgium', 'France', 'Australia', 'Serbia', 'UK',
  'Lithuania', 'Croatia', 'Turkey', 'Belarus', 'Iran',
];

describe('community flags', () => {
  it('lists the 17 member flags in flags.txt order', () => {
    expect(flags.map((f) => f.name)).toEqual(EXPECTED_NAMES);
  });

  it('every flag resolves a local asset', () => {
    // Under Vitest an .svg import is a URL string; under Astro it is
    // ImageMetadata. Assert truthiness only — never the shape.
    for (const f of flags) {
      expect(f.src, `missing asset for ${f.name}`).toBeTruthy();
    }
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/flags.test.ts`
Expected: FAIL — current `flags` entries have `country`/`iso`, not `name`/`src`
(first assertion gets an array of `undefined`s). A different failure (e.g.
cannot resolve `../assets/flags/...`) means Task 1 file names don't match —
fix that first.

- [ ] **Step 3: Rewrite `src/data/flags.ts`**

Replace the entire file with:

```ts
// src/data/flags.ts — member-chosen flags for the community mosaic.
//
// Source of truth: flags.txt (repo root), in the order members added them.
// Two entries are deliberately NOT the current official state flag — the
// white-red-white Belarus flag and the lion-and-sun Iran flag. We show what
// members asked for, so these are self-hosted like every other flag (no
// ISO-keyed CDN carries them). Assets live in src/assets/flags/.
import type { ImageMetadata } from 'astro';

import scotland from '../assets/flags/scotland.svg';
import hongKong from '../assets/flags/hong-kong.svg';
import thailand from '../assets/flags/thailand.svg';
import spain from '../assets/flags/spain.svg';
import vietnam from '../assets/flags/vietnam.svg';
import denmark from '../assets/flags/denmark.svg';
import italy from '../assets/flags/italy.svg';
import belgium from '../assets/flags/belgium.svg';
import france from '../assets/flags/france.svg';
import australia from '../assets/flags/australia.svg';
import serbia from '../assets/flags/serbia.svg';
import uk from '../assets/flags/uk.svg';
import lithuania from '../assets/flags/lithuania.svg';
import croatia from '../assets/flags/croatia.svg';
import turkey from '../assets/flags/turkey.svg';
import belarusWrw from '../assets/flags/belarus-wrw.svg';
import iranLionSun from '../assets/flags/iran-lion-sun.svg';

export interface Flag {
  /** Display name in members' own wording — used as alt and title text. */
  name: string;
  /** Local SVG asset (astro:assets). */
  src: ImageMetadata;
}

export const flags: Flag[] = [
  { name: 'Scotland', src: scotland },
  { name: 'Hong Kong', src: hongKong },
  { name: 'Thailand', src: thailand },
  { name: 'Spain', src: spain },
  { name: 'Vietnam', src: vietnam },
  { name: 'Denmark', src: denmark },
  { name: 'Italy', src: italy },
  { name: 'Belgium', src: belgium },
  { name: 'France', src: france },
  { name: 'Australia', src: australia },
  { name: 'Serbia', src: serbia },
  { name: 'UK', src: uk },
  { name: 'Lithuania', src: lithuania },
  { name: 'Croatia', src: croatia },
  { name: 'Turkey', src: turkey },
  { name: 'Belarus', src: belarusWrw },
  { name: 'Iran', src: iranLionSun },
];
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm test`
Expected: all suites PASS, including `tests/flags.test.ts` (2 tests). The
other 101 tests must stay green.

- [ ] **Step 5: Commit**

```bash
git add tests/flags.test.ts src/data/flags.ts
git commit -m "feat(community): flags data now maps member list to local SVGs

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 3: Render local flags in `CommunitySection.astro` and verify

**Files:**
- Modify: `src/components/CommunitySection.astro:3` (frontmatter) and `:22-32` (mosaic loop)

**Interfaces:**
- Consumes: `flags: Flag[]` (`{ name, src }`) from Task 2.
- Produces: user-visible mosaic; no exports.

- [ ] **Step 1: Swap the hotlinked `<img>` for astro:assets `<Image>`**

In `src/components/CommunitySection.astro`, change the frontmatter:

```astro
---
// src/components/CommunitySection.astro
import { Image } from 'astro:assets';
import { flags } from '../data/flags';
import OverheardArchive from './OverheardArchive.astro';
---
```

and replace the mosaic loop body (the whole `{flags.map(...)}` expression):

```astro
      {flags.map(f => (
        <Image
          class="community__flag"
          src={f.src}
          alt={f.name}
          title={f.name}
          width={44}
          height={32}
          loading="lazy"
        />
      ))}
```

Keep everything else — CSS, divider, `aria-label` — untouched. (Astro appends
the style scope hash to a `class` passed to a component, so the scoped
`.community__flag` rules still apply to the rendered `<img>`.)

- [ ] **Step 2: Tests and production build**

```bash
npm test
SKIP_VOLLEYZONE=true SKIP_BEHOLD=true npm run build
```

Expected: tests green; build succeeds (a bad svg path would fail it here) with
no `flagcdn` requests. Then confirm nothing references flagcdn anymore:

```bash
grep -rn "flagcdn" src/ dist/ | grep -v node_modules
```

Expected: no output.

- [ ] **Step 3: Browser verification (per CLAUDE.md workflow)**

```bash
SKIP_VOLLEYZONE=true SKIP_BEHOLD=true npm run dev
```

In Chrome DevTools MCP, `emulate` with `viewport: "375x760x2,mobile,touch"`,
navigate to `http://localhost:<port>/`, scroll to the Community section and
screenshot. Check:

1. All 17 flags render (count the tiles), no broken-image icons.
2. Belarus tile is white-red-white; Iran tile shows the lion-and-sun emblem
   (44×32 crop keeps the centred emblem visible via `object-fit: cover`).
3. Toggle dark theme (`document.documentElement.setAttribute('data-theme','dark')`)
   — tiles unchanged, ring/hover intact.
4. Repeat at `320x700x2,mobile,touch` — no horizontal overflow:
   `document.documentElement.scrollWidth <= document.documentElement.clientWidth`.

Kill the dev server when done.

- [ ] **Step 4: Commit**

```bash
git add src/components/CommunitySection.astro
git commit -m "feat(community): render self-hosted member flags in mosaic

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```
