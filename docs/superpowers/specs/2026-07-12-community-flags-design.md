# Community Flag Mosaic — Real Member Flags

**Date:** 2026-07-12
**Status:** Approved

## Problem

The homepage `CommunitySection.astro` flag mosaic renders a 22-country
placeholder list (`src/data/flags.ts`) by hotlinking
`https://flagcdn.com/{iso}.svg`. The real list of member-chosen flags lives in
`flags.txt` (17 entries) and includes two flags that are deliberately not the
current official state flags:

- **Belarus — white-red-white** (1991–95 / opposition flag), not the official
  red-green flag.
- **Iran — lion and sun** (pre-1979 flag), not the current flag.

No ISO-keyed flag CDN serves these, so hotlinking breaks on exactly the flags
members care most about. The club's position: use what people want.

## Decision

Self-host all 17 flags as SVGs committed to the repo. No runtime third-party
requests; unofficial flags are first-class citizens.

## Design

### Assets — `src/assets/flags/`

One SVG per `flags.txt` entry, kebab-case by display name:

| flags.txt entry | File | Source |
| --- | --- | --- |
| Scotland | `scotland.svg` | flag-icons `gb-sct` |
| Hong Kong | `hong-kong.svg` | flag-icons `hk` |
| Thailand | `thailand.svg` | flag-icons `th` |
| Spain | `spain.svg` | flag-icons `es` |
| Vietnam | `vietnam.svg` | flag-icons `vn` |
| Denmark | `denmark.svg` | flag-icons `dk` |
| Italy | `italy.svg` | flag-icons `it` |
| Belgium | `belgium.svg` | flag-icons `be` |
| France | `france.svg` | flag-icons `fr` |
| Australia | `australia.svg` | flag-icons `au` |
| Serbia | `serbia.svg` | flag-icons `rs` |
| UK | `uk.svg` | flag-icons `gb` |
| Lithuania | `lithuania.svg` | flag-icons `lt` |
| Croatia | `croatia.svg` | flag-icons `hr` |
| Turkey | `turkey.svg` | flag-icons `tr` |
| Belarus (white red white) | `belarus-wrw.svg` | Wikimedia Commons (public domain) |
| Iran (flag with the sun and lion) | `iran-lion-sun.svg` | Wikimedia Commons (public domain) |

- flag-icons (<https://github.com/lipis/flag-icons>) is MIT; use the 4×3 crops.
- The two Wikimedia files are public domain; run through SVGO if heavy (the
  lion-and-sun emblem is the only complex file). Their aspect ratios need not
  be 4×3 — the mosaic crops via `object-fit: cover`.
- `flags.txt` stays untouched at the repo root as the member-facing source
  list.

### Data — `src/data/flags.ts`

Full rewrite. Drop `iso`/flagcdn entirely:

```ts
import type { ImageMetadata } from 'astro';
import scotland from '../assets/flags/scotland.svg';
// … one import per flag

export interface Flag {
  name: string;        // display name, used as alt/title
  src: ImageMetadata;  // astro:assets import of the local SVG
}

export const flags: Flag[] = [
  { name: 'Scotland', src: scotland },
  // … flags.txt order
];
```

- Order matches `flags.txt` (reads as "order members added them", matching the
  "Every flag added by a club member" divider).
- Alt text is the plain country/nation name ("Belarus", "Iran", "UK" →
  "United Kingdom" is NOT expanded — keep members' own wording, so "UK"). The
  flag artwork itself carries the unofficial-flag meaning; alt text does not
  editorialize.

### Component — `CommunitySection.astro`

Swap the hotlinked `<img>` for astro:assets `<Image>` with the imported SVG
metadata. Keep the existing 44×32 tile, `object-fit: cover`, border radius,
shadow, and hover scale. No layout or CSS changes. `loading="lazy"`,
`title={name}`, `alt={name}` as today.

## Error handling

None at runtime — assets are local and resolved at build time. A missing or
misnamed file fails the build (import error), which is the desired behavior.

## Testing & verification

1. New vitest: every `flags` entry has a non-empty `name` and a resolvable
   `src` (17 entries, unique names). Catches bad imports at test time.
2. `npm test` stays green.
3. DevTools check of the mosaic at 320/375 mobile widths, light + dark themes
   (per project verification workflow). Dev now renders the mosaic offline,
   where flagcdn previously 404'd.

## Out of scope

- Any pipeline that regenerates `flags.ts` from `flags.txt` (YAGNI — the list
  changes rarely; edits are manual in both files).
- Flags anywhere else on the site.
