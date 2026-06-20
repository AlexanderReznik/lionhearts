# Instagram feed via Behold.so JSON (build-time fetch) — Design

**Date:** 2026-06-20
**Status:** Approved, ready for implementation plan

## Problem

The homepage embeds a live Instagram feed through Behold.so's **client-side
widget** (`<behold-widget>` + `w.behold.so/widget.js` in
`src/components/InstagramFeed.astro`). Every visitor's page load calls Behold,
so traffic counts against Behold's monthly view cap (free tier ~1,200 views),
and the rendered markup is a generic embed that can't follow the site's brand
styling or light/dark themes.

## Approach

Fetch a Behold **JSON feed** at **build time** (not in the browser) and render
our own static HTML with site-native markup and styling.

```
Astro build (npm run build)
        │
        ▼
InstagramFeed.astro  ──calls──▶  src/lib/behold.ts
                                      │  fetch https://feeds.behold.so/{BEHOLD_FEED_ID}
                                      │  (build-time only, 10s abort timeout)
                                      ▼
                            normalize → BeholdPost[]  (≤6)
        │
        ▼
Render static <img> grid into HTML   ←─ if empty/error/no feed id → "follow us" fallback
```

One `fetch` per build (~30/month regardless of visitor count). Visitors only
ever hit static HTML, so Behold's view cap is never approached. Once-a-day
freshness (via a scheduled rebuild) is acceptable and is **out of scope for this
spec** — see Non-Goals. Behold handles the Instagram Graph API token refresh, so
there is no DIY token maintenance.

This **replaces** the client-side `<behold-widget>` embed. No client-side JS and
no Behold widget script are shipped.

## Decisions (from brainstorming)

- **Scope:** component only — build-time fetch + static rendering + graceful
  fallback. Rebuild scheduling/automation is out of scope.
- **Posts:** show up to 6 (Behold free-tier feed cap), 3×2 grid on desktop,
  **2 columns on mobile**.
- **Tiles:** square thumbnails. Caption revealed on **hover/focus** (desktop)
  via a navy overlay, 3-line clamp. On touch devices there is no overlay —
  tapping a tile opens the post on Instagram.
- **Media badge:** small corner badge for video / album (carousel) posts only.
- **Images:** plain `<img>` with a `srcset` built from Behold's `sizes` object
  (`behold.pictures` CDN — stable URLs). **Never** use the post's top-level
  `mediaUrl`: that is the raw Instagram CDN URL and carries an `oe=` expiry
  token that would rot between rebuilds. **No** build-time download or
  `astro:assets` re-optimization.
  Rationale: the `astro:assets` project rule targets images we own in
  `src/assets`; remote Instagram CDN images resolved at build are a documented
  exception, and re-optimizing would add a build-time network dependency that
  can fail the build for no benefit (Behold already serves optimized sizes).
- **Styling:** scoped CSS, **BEM modifier classes only — no inline styles**.
  Colours via semantic `--color-*` tokens so light/dark work automatically with
  **no theme-specific hardcoding**.

## Components

### `src/lib/behold.ts` (new)

Mirrors the established build-time-fetch shape of `src/lib/volleyzone.ts`.

```ts
export type BeholdMediaType = 'image' | 'video' | 'album';

export interface BeholdPost {
  id: string;
  permalink: string;
  mediaType: BeholdMediaType;
  thumbnailSrc: string;   // default <img> src — sizes.medium.mediaUrl
  srcSet: string;         // built from sizes.{small,medium,large}
  caption: string;        // prunedCaption || caption — for hover overlay
  altText: string;        // altText || first caption line || generic fallback
  bgColor: string | null; // rgb() from colorPalette.dominant, placeholder tint
  timestamp: string;      // ISO 8601 string, as Behold returns it
}

export async function fetchInstagramPosts(): Promise<BeholdPost[]>;
```

`fetchInstagramPosts()`:

- Returns `[]` immediately if `BEHOLD_FEED_ID` is unset, or if
  `SKIP_BEHOLD === 'true'` (local-dev escape hatch mirroring `SKIP_VOLLEYZONE`).
- Fetches `https://feeds.behold.so/{BEHOLD_FEED_ID}` with an `AbortController`
  10s timeout.
- **Never throws and never fails the build.** On any failure (non-OK response,
  invalid JSON, unexpected shape) it `console.warn`s and returns `[]`, so the
  component degrades to the fallback panel — the same degrade-don't-fail policy
  `fetchAllFixtures()` uses.
- **Parsing (shape confirmed against a real feed —
  `behold-example-feed.json`):** the feed is a top-level object
  `{ username, biography, …profile fields…, posts: [...] }`. Read `data.posts`;
  if it is not an array, return `[]`. Per post:
  - `thumbnailSrc` ← `sizes.medium.mediaUrl` (fallback `large`/`small`).
  - `srcSet` ← `sizes.small` (400w) + `sizes.medium` (~700w) + `sizes.large`
    (~1000w). `full` (2000w) is skipped — overkill for grid tiles. `sizes`
    is present for video/album posts too (poster frame), so it's the single
    source for the thumbnail regardless of media type.
  - `caption` ← `prunedCaption` (hashtag block stripped) `|| caption`.
  - `altText` ← post `altText` (optional — absent on most posts) `||`
    first line of caption `||` `"Instagram post by @lionhearts_volleyball"`.
  - `bgColor` ← `rgb(colorPalette.dominant)` if present, else `null`.
  - `mediaType` ← mapped from `IMAGE|VIDEO|CAROUSEL_ALBUM`.
  - Skip any post missing `permalink` or a usable `sizes` entry. Clamp to 6.

Small pure helpers are exported for unit testing:

- `buildSrcSet(sizes)` — assembles a `srcset` string from `sizes.{small,medium,large}`.
- `mapMediaType(raw)` — `IMAGE|VIDEO|CAROUSEL_ALBUM` → `image|video|album`.
- `firstCaptionLine(caption)` — first line, for the alt-text fallback.
- `paletteToRgb(dominant)` — `"212,220,140"` → `"rgb(212,220,140)"`.

### `src/components/InstagramFeed.astro` (rewrite)

- Calls `fetchInstagramPosts()` in the component frontmatter.
- Keeps the existing section header ("Follow @lionhearts_volleyball" +
  "View on Instagram →") and the existing `.instagram__follow-panel` fallback
  **verbatim**.
- When `posts.length > 0`, renders a `<ul class="ig-grid">` of up to 6
  `<li class="ig-tile">`. Each tile is an `<a>` to `post.permalink`
  (`target="_blank" rel="noopener noreferrer"`) containing:
  - `<img src={post.thumbnailSrc} srcset={post.srcSet} sizes="(max-width:640px) 50vw, 33vw" loading="lazy" alt={post.altText}>`
    on a `<li>` whose background is `post.bgColor` (when present) so the tile
    shows a branded tint instead of a grey flash before the lazy image paints.
  - `.ig-tile__badge` (`aria-hidden="true"`) shown only for `video` / `album`.
  - `.ig-tile__overlay` containing the 3-line-clamped caption, `aria-hidden="true"`
    (the alt text already conveys the content), revealed on hover/focus.
- When `posts.length === 0`, renders the fallback panel.

### Styling

- Scoped `<style>` block, BEM classes (`ig-grid`, `ig-tile`, `ig-tile__img`,
  `ig-tile__badge`, `ig-tile__overlay`). No inline styles.
- All colours via semantic `--color-*` tokens. The overlay gradient uses a navy
  surface token; accent text uses `--color-accent-text` (never `--lh-blue`
  directly), per the WCAG AA token rules in CLAUDE.md.
- Grid: `repeat(3, 1fr)` desktop → `repeat(2, 1fr)` at `max-width: 640px`.
- Hover zoom + caption overlay guarded by `@media (hover: hover)` so touch
  devices simply open the link with no overlay.
- Focus-visible state on tiles for keyboard users.

## Config & docs

- `.env.example`: keep `BEHOLD_FEED_ID`, update its comment to "Behold JSON feed,
  fetched at build time". Add `SKIP_BEHOLD` alongside `SKIP_VOLLEYZONE`.
- Update docs that describe the old client-embed approach:
  - `docs/superpowers/plans/lionhearts/03-homepage.md` — Task 5 and the embedded
    `InstagramFeed.astro` code block.
  - The header comment in `src/components/InstagramFeed.astro`.
  - A short note in `CLAUDE.md` recording the build-time JSON-fetch pattern.

## Error handling

| Condition | Result |
|---|---|
| `BEHOLD_FEED_ID` unset | `[]` → fallback panel (no network call) |
| `SKIP_BEHOLD=true` | `[]` → fallback panel (no network call) |
| Fetch times out / non-OK / network error | `console.warn`, `[]` → fallback panel |
| Invalid JSON or unexpected shape | `console.warn`, `[]` → fallback panel |
| Fewer than 6 posts returned | render what's available |

The build never fails because of Behold.

## Testing

- **Vitest** unit tests for `behold.ts` pure logic, using the real
  `behold-example-feed.json` as a fixture (relocated into the test tree, e.g.
  `src/lib/__fixtures__/behold-feed.json`):
  - `buildSrcSet`, `mapMediaType`, `firstCaptionLine`, `paletteToRgb`.
  - Parsing the real fixture → 6 normalized `BeholdPost`s with stable
    `behold.pictures` srcset URLs (not the expiring IG `mediaUrl`),
    `prunedCaption` preferred, `altText` fallback when absent.
  - Malformed / missing `posts` → `[]`; 6-item clamp; missing
    `BEHOLD_FEED_ID` → `[]`; `SKIP_BEHOLD` → `[]`.
- **Manual:** build with a real feed id; verify in Chrome DevTools MCP at
  320 / 375 / 414 widths in **both light and dark themes** (per the responsive
  verification rule).

## Non-Goals

- Scheduled/automated daily rebuild (build hook + cron). The component is built
  to be refreshed by a rebuild, but configuring that trigger on the host is
  handled separately.
- Client-side fetching, pagination, or "load more".
- `astro:assets` optimization of the remote Instagram images.
- Per-post pages or lightbox/modal viewing.
