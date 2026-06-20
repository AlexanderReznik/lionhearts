# Instagram Feed via Behold JSON — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the client-side `<behold-widget>` Instagram embed with a build-time fetch of Behold's JSON feed, rendered as a site-native static grid that works in light/dark themes and on mobile.

**Architecture:** A pure-logic + IO library (`src/lib/behold.ts`) fetches `https://feeds.behold.so/{BEHOLD_FEED_ID}` once at build time, normalizes the payload into a `BeholdPost[]`, and never throws (degrades to `[]`). `InstagramFeed.astro` calls it in frontmatter and renders a 6-tile grid, or the existing "follow us" fallback panel when there are no posts. This mirrors the existing build-time-fetch pattern in `src/lib/volleyzone.ts`.

**Tech Stack:** Astro 6, TypeScript (strict), Vitest 4. No new dependencies.

---

## File Structure

- **Create** `src/lib/behold.ts` — feed fetch + normalization. Pure helpers (`buildSrcSet`, `mapMediaType`, `firstCaptionLine`, `paletteToRgb`, `normalizePost`, `normalizeFeed`) plus the IO entry point `fetchInstagramPosts()`.
- **Create** `src/lib/__fixtures__/behold-feed.json` — the real example feed (moved from repo root) used as the test fixture.
- **Create** `tests/behold.test.ts` — unit tests for `behold.ts`.
- **Rewrite** `src/components/InstagramFeed.astro` — static grid + fallback (replaces the `<behold-widget>` embed).
- **Modify** `.env.example` — refresh the `BEHOLD_FEED_ID` comment, add `SKIP_BEHOLD`.
- **Modify** `docs/superpowers/plans/lionhearts/03-homepage.md` — replace the old embed code block / Task-5 description.
- **Modify** `CLAUDE.md` — note the build-time JSON-fetch pattern.

**Env access note:** `behold.ts` reads `import.meta.env.BEHOLD_FEED_ID` and `import.meta.env.SKIP_BEHOLD` (same mechanism as `volleyzone.ts`). Tests set these with `vi.stubEnv(...)` and clear with `vi.unstubAllEnvs()`.

---

## Task 1: Relocate the feed fixture

**Files:**
- Create: `src/lib/__fixtures__/behold-feed.json` (moved from `behold-example-feed.json`)

- [ ] **Step 1: Move the example feed into the test tree**

Run:
```bash
mkdir -p src/lib/__fixtures__
git mv behold-example-feed.json src/lib/__fixtures__/behold-feed.json 2>/dev/null || mv behold-example-feed.json src/lib/__fixtures__/behold-feed.json
```
Expected: `src/lib/__fixtures__/behold-feed.json` exists; repo root no longer has `behold-example-feed.json`.

- [ ] **Step 2: Confirm the fixture shape**

Run: `node -e "const f=require('./src/lib/__fixtures__/behold-feed.json'); console.log(Array.isArray(f.posts), f.posts.length, f.posts[0].mediaType, !!f.posts[0].sizes.medium.mediaUrl)"`
Expected: `true 6 IMAGE true`

- [ ] **Step 3: Commit**

```bash
git add src/lib/__fixtures__/behold-feed.json
git commit -m "test(instagram): add Behold feed fixture"
```

---

## Task 2: Pure helpers in `behold.ts`

**Files:**
- Create: `src/lib/behold.ts`
- Test: `tests/behold.test.ts`

- [ ] **Step 1: Write the failing tests for the pure helpers**

Create `tests/behold.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import {
  mapMediaType,
  firstCaptionLine,
  paletteToRgb,
  buildSrcSet,
} from '../src/lib/behold';

describe('mapMediaType', () => {
  it('maps Behold media types to the normalized union', () => {
    expect(mapMediaType('IMAGE')).toBe('image');
    expect(mapMediaType('VIDEO')).toBe('video');
    expect(mapMediaType('CAROUSEL_ALBUM')).toBe('album');
  });

  it('defaults unknown/missing types to image', () => {
    expect(mapMediaType(undefined)).toBe('image');
    expect(mapMediaType('SOMETHING_NEW')).toBe('image');
  });
});

describe('firstCaptionLine', () => {
  it('returns the first non-empty line, trimmed', () => {
    expect(firstCaptionLine('Photo credit: X\n\nmore text')).toBe('Photo credit: X');
  });

  it('returns empty string for empty caption', () => {
    expect(firstCaptionLine('')).toBe('');
  });
});

describe('paletteToRgb', () => {
  it('wraps a Behold "r,g,b" string in rgb()', () => {
    expect(paletteToRgb('212,220,140')).toBe('rgb(212,220,140)');
  });

  it('returns null for missing or malformed input', () => {
    expect(paletteToRgb(undefined)).toBeNull();
    expect(paletteToRgb('not,a,color,x')).toBeNull();
    expect(paletteToRgb('1,2')).toBeNull();
  });
});

describe('buildSrcSet', () => {
  it('builds a srcset from small/medium/large, skipping full', () => {
    const sizes = {
      small: { width: 400, height: 400, mediaUrl: 's.jpg' },
      medium: { width: 700, height: 700, mediaUrl: 'm.jpg' },
      large: { width: 1000, height: 1000, mediaUrl: 'l.jpg' },
      full: { width: 2000, height: 2000, mediaUrl: 'f.jpg' },
    };
    expect(buildSrcSet(sizes)).toBe('s.jpg 400w, m.jpg 700w, l.jpg 1000w');
  });

  it('returns empty string when sizes is missing', () => {
    expect(buildSrcSet(undefined)).toBe('');
  });
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npx vitest run tests/behold.test.ts`
Expected: FAIL — `Cannot find module '../src/lib/behold'`.

- [ ] **Step 3: Implement the types and pure helpers**

Create `src/lib/behold.ts`:

```ts
// src/lib/behold.ts
// Behold.so JSON feed, fetched ONCE at build time (not in the browser).
// Visitors hit static HTML, so Behold's per-view cap is never approached.
// Behold handles the Instagram Graph API token refresh.
// Set BEHOLD_FEED_ID in the environment (see .env.example); unset → fallback.

const FEED_BASE = 'https://feeds.behold.so';
const MAX_POSTS = 6;
const TIMEOUT_MS = 10_000;
const FALLBACK_ALT = 'Instagram post by @lionhearts_volleyball';

export type BeholdMediaType = 'image' | 'video' | 'album';

export interface BeholdPost {
  id: string;
  permalink: string;
  mediaType: BeholdMediaType;
  thumbnailSrc: string;   // default <img> src — sizes.medium.mediaUrl
  srcSet: string;         // built from sizes.{small,medium,large}
  caption: string;        // prunedCaption || caption — for the hover overlay
  altText: string;        // altText || first caption line || generic fallback
  bgColor: string | null; // rgb() from colorPalette.dominant, placeholder tint
  timestamp: string;      // ISO 8601 string, as Behold returns it
}

// --- Raw payload shapes (only the fields we rely on) ---
interface BeholdSize { width: number; height: number; mediaUrl: string; }
interface BeholdSizes {
  small?: BeholdSize; medium?: BeholdSize; large?: BeholdSize; full?: BeholdSize;
}
export interface BeholdRawPost {
  id?: string;
  permalink?: string;
  mediaType?: string;
  caption?: string;
  prunedCaption?: string;
  altText?: string;
  timestamp?: string;
  colorPalette?: { dominant?: string };
  sizes?: BeholdSizes;
}
interface BeholdFeed { posts?: BeholdRawPost[]; }

export function mapMediaType(raw: string | undefined): BeholdMediaType {
  switch (raw) {
    case 'VIDEO': return 'video';
    case 'CAROUSEL_ALBUM': return 'album';
    default: return 'image';
  }
}

export function firstCaptionLine(caption: string): string {
  return caption.split('\n')[0]?.trim() ?? '';
}

export function paletteToRgb(dominant: string | undefined): string | null {
  if (!dominant) return null;
  const parts = dominant.split(',').map((s) => s.trim());
  if (parts.length !== 3 || parts.some((p) => !/^\d{1,3}$/.test(p))) return null;
  return `rgb(${parts.join(',')})`;
}

export function buildSrcSet(sizes: BeholdSizes | undefined): string {
  if (!sizes) return '';
  const entries: string[] = [];
  if (sizes.small) entries.push(`${sizes.small.mediaUrl} ${sizes.small.width}w`);
  if (sizes.medium) entries.push(`${sizes.medium.mediaUrl} ${sizes.medium.width}w`);
  if (sizes.large) entries.push(`${sizes.large.mediaUrl} ${sizes.large.width}w`);
  return entries.join(', ');
}
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `npx vitest run tests/behold.test.ts`
Expected: PASS — all `mapMediaType`, `firstCaptionLine`, `paletteToRgb`, `buildSrcSet` tests green.

- [ ] **Step 5: Commit**

```bash
git add src/lib/behold.ts tests/behold.test.ts
git commit -m "feat(instagram): add Behold feed pure helpers"
```

---

## Task 3: Normalization (`normalizePost` / `normalizeFeed`)

**Files:**
- Modify: `src/lib/behold.ts`
- Test: `tests/behold.test.ts`

- [ ] **Step 1: Write the failing tests**

Append to `tests/behold.test.ts`:

```ts
import { normalizePost, normalizeFeed } from '../src/lib/behold';
import type { BeholdRawPost } from '../src/lib/behold';
import feedFixture from '../src/lib/__fixtures__/behold-feed.json';

const RAW: BeholdRawPost = {
  id: '1',
  permalink: 'https://www.instagram.com/p/ABC/',
  mediaType: 'IMAGE',
  caption: 'Full caption\n\n#tag1 #tag2',
  prunedCaption: 'Full caption',
  altText: 'A descriptive alt',
  timestamp: '2020-09-04T22:26:14+0000',
  colorPalette: { dominant: '10,20,30' },
  sizes: {
    small: { width: 400, height: 400, mediaUrl: 's.jpg' },
    medium: { width: 700, height: 700, mediaUrl: 'm.jpg' },
    large: { width: 1000, height: 1000, mediaUrl: 'l.jpg' },
  },
};

describe('normalizePost', () => {
  it('normalizes a full raw post', () => {
    const post = normalizePost(RAW)!;
    expect(post.permalink).toBe('https://www.instagram.com/p/ABC/');
    expect(post.mediaType).toBe('image');
    expect(post.thumbnailSrc).toBe('m.jpg');           // medium preferred
    expect(post.srcSet).toBe('s.jpg 400w, m.jpg 700w, l.jpg 1000w');
    expect(post.caption).toBe('Full caption');         // prunedCaption preferred
    expect(post.altText).toBe('A descriptive alt');
    expect(post.bgColor).toBe('rgb(10,20,30)');
  });

  it('falls back to first caption line when altText is absent', () => {
    const post = normalizePost({ ...RAW, altText: undefined })!;
    expect(post.altText).toBe('Full caption');
  });

  it('falls back to the generic alt when there is no caption or altText', () => {
    const post = normalizePost({ ...RAW, altText: undefined, caption: undefined, prunedCaption: undefined })!;
    expect(post.altText).toBe('Instagram post by @lionhearts_volleyball');
  });

  it('returns null when permalink is missing', () => {
    expect(normalizePost({ ...RAW, permalink: undefined })).toBeNull();
  });

  it('returns null when there is no usable thumbnail', () => {
    expect(normalizePost({ ...RAW, sizes: undefined })).toBeNull();
  });
});

describe('normalizeFeed', () => {
  it('normalizes the real fixture into 6 posts with stable behold.pictures URLs', () => {
    const posts = normalizeFeed(feedFixture);
    expect(posts).toHaveLength(6);
    expect(posts[0].thumbnailSrc).toContain('behold.pictures');
    expect(posts[0].thumbnailSrc).not.toContain('cdninstagram.com');
    expect(posts[0].srcSet).toContain('400w');
  });

  it('returns [] when posts is missing or not an array', () => {
    expect(normalizeFeed({})).toEqual([]);
    expect(normalizeFeed({ posts: 'nope' })).toEqual([]);
    expect(normalizeFeed(null)).toEqual([]);
  });

  it('clamps to 6 posts', () => {
    const many = { posts: Array.from({ length: 12 }, () => RAW) };
    expect(normalizeFeed(many)).toHaveLength(6);
  });
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npx vitest run tests/behold.test.ts`
Expected: FAIL — `normalizePost`/`normalizeFeed` are not exported.

- [ ] **Step 3: Implement the normalizers**

Append to `src/lib/behold.ts` (before `fetchInstagramPosts`, which is added in Task 4):

```ts
function thumbnailFrom(sizes: BeholdSizes | undefined): string | null {
  return sizes?.medium?.mediaUrl ?? sizes?.large?.mediaUrl ?? sizes?.small?.mediaUrl ?? null;
}

export function normalizePost(raw: BeholdRawPost): BeholdPost | null {
  if (!raw.permalink) return null;
  const thumbnailSrc = thumbnailFrom(raw.sizes);
  if (!thumbnailSrc) return null;

  const caption = (raw.prunedCaption ?? raw.caption ?? '').trim();
  const altText = raw.altText?.trim() || firstCaptionLine(caption) || FALLBACK_ALT;

  return {
    id: raw.id ?? raw.permalink,
    permalink: raw.permalink,
    mediaType: mapMediaType(raw.mediaType),
    thumbnailSrc,
    srcSet: buildSrcSet(raw.sizes),
    caption,
    altText,
    bgColor: paletteToRgb(raw.colorPalette?.dominant),
    timestamp: raw.timestamp ?? '',
  };
}

export function normalizeFeed(data: unknown): BeholdPost[] {
  const posts = (data as BeholdFeed | null)?.posts;
  if (!Array.isArray(posts)) return [];
  return posts
    .map(normalizePost)
    .filter((p): p is BeholdPost => p !== null)
    .slice(0, MAX_POSTS);
}
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `npx vitest run tests/behold.test.ts`
Expected: PASS — all normalization tests green.

- [ ] **Step 5: Commit**

```bash
git add src/lib/behold.ts tests/behold.test.ts
git commit -m "feat(instagram): normalize Behold feed into BeholdPost[]"
```

---

## Task 4: `fetchInstagramPosts` (build-time IO)

**Files:**
- Modify: `src/lib/behold.ts`
- Test: `tests/behold.test.ts`

- [ ] **Step 1: Write the failing tests**

Append to `tests/behold.test.ts`:

```ts
import { vi, afterEach } from 'vitest';
import { fetchInstagramPosts } from '../src/lib/behold';

describe('fetchInstagramPosts', () => {
  const realFetch = globalThis.fetch;
  afterEach(() => {
    globalThis.fetch = realFetch;
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it('returns [] without fetching when BEHOLD_FEED_ID is unset', async () => {
    vi.stubEnv('BEHOLD_FEED_ID', '');
    globalThis.fetch = vi.fn();
    const posts = await fetchInstagramPosts();
    expect(posts).toEqual([]);
    expect(globalThis.fetch).not.toHaveBeenCalled();
  });

  it('returns [] without fetching when SKIP_BEHOLD=true', async () => {
    vi.stubEnv('BEHOLD_FEED_ID', 'abc123');
    vi.stubEnv('SKIP_BEHOLD', 'true');
    globalThis.fetch = vi.fn();
    const posts = await fetchInstagramPosts();
    expect(posts).toEqual([]);
    expect(globalThis.fetch).not.toHaveBeenCalled();
  });

  it('fetches the feed URL and returns normalized posts', async () => {
    vi.stubEnv('BEHOLD_FEED_ID', 'abc123');
    const feed = {
      posts: [{
        id: '1', permalink: 'https://www.instagram.com/p/ABC/', mediaType: 'IMAGE',
        prunedCaption: 'Hi', sizes: { medium: { width: 700, height: 700, mediaUrl: 'm.jpg' } },
      }],
    };
    globalThis.fetch = vi.fn().mockResolvedValue({ ok: true, json: async () => feed } as Response);

    const posts = await fetchInstagramPosts();

    const url = (globalThis.fetch as ReturnType<typeof vi.fn>).mock.calls[0][0];
    expect(url).toBe('https://feeds.behold.so/abc123');
    expect(posts).toHaveLength(1);
    expect(posts[0].thumbnailSrc).toBe('m.jpg');
  });

  it('returns [] and warns on a non-OK response', async () => {
    vi.stubEnv('BEHOLD_FEED_ID', 'abc123');
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    globalThis.fetch = vi.fn().mockResolvedValue({ ok: false, status: 500 } as Response);
    expect(await fetchInstagramPosts()).toEqual([]);
  });

  it('returns [] and warns when fetch throws', async () => {
    vi.stubEnv('BEHOLD_FEED_ID', 'abc123');
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    globalThis.fetch = vi.fn().mockRejectedValue(new Error('network'));
    expect(await fetchInstagramPosts()).toEqual([]);
  });
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npx vitest run tests/behold.test.ts`
Expected: FAIL — `fetchInstagramPosts` is not exported.

- [ ] **Step 3: Implement `fetchInstagramPosts`**

Append to the end of `src/lib/behold.ts`:

```ts
/**
 * Fetch the Behold JSON feed at build time. Never throws and never fails the
 * build: on any error (no feed id, timeout, non-OK, bad JSON, unexpected
 * shape) it warns and returns [], so InstagramFeed.astro degrades to its
 * "follow us" fallback panel. Mirrors fetchAllFixtures() in volleyzone.ts.
 */
export async function fetchInstagramPosts(): Promise<BeholdPost[]> {
  const feedId = import.meta.env.BEHOLD_FEED_ID;
  if (!feedId || import.meta.env.SKIP_BEHOLD === 'true') return [];

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const res = await fetch(`${FEED_BASE}/${feedId}`, { signal: controller.signal });
    if (!res.ok) {
      console.warn(`[behold] HTTP ${res.status} fetching Instagram feed`);
      return [];
    }
    return normalizeFeed(await res.json());
  } catch (err) {
    console.warn('[behold] Failed to fetch Instagram feed:', err);
    return [];
  } finally {
    clearTimeout(timeout);
  }
}
```

- [ ] **Step 4: Run the full test file to verify it passes**

Run: `npx vitest run tests/behold.test.ts`
Expected: PASS — every describe block green.

- [ ] **Step 5: Commit**

```bash
git add src/lib/behold.ts tests/behold.test.ts
git commit -m "feat(instagram): fetch Behold feed at build time with graceful fallback"
```

---

## Task 5: Rewrite `InstagramFeed.astro`

**Files:**
- Rewrite: `src/components/InstagramFeed.astro`

Note: the section header and the `.instagram__follow-panel` fallback (and their styles) are preserved from the current component. The only changes are: frontmatter now calls `fetchInstagramPosts()`, the `<behold-widget>` block is replaced by the grid, and grid styles are added.

The per-tile placeholder colour is passed as a CSS custom property (`--tile-bg`), not a static style — a static class can't carry six different per-post colours. The actual `background` declaration lives in the scoped CSS.

- [ ] **Step 1: Replace the whole file**

Overwrite `src/components/InstagramFeed.astro` with:

```astro
---
// src/components/InstagramFeed.astro
// Build-time Behold.so JSON feed → static, site-native Instagram grid.
// See src/lib/behold.ts. When the feed is empty/unavailable (or BEHOLD_FEED_ID
// is unset), this renders the "follow us" fallback panel instead.
import { fetchInstagramPosts } from '../lib/behold';

const posts = await fetchInstagramPosts();
const hasPosts = posts.length > 0;
---

<section class="instagram" aria-labelledby="instagram-heading">
  <div class="instagram__header">
    <div>
      <h2 class="instagram__heading" id="instagram-heading">
        Follow <a href="https://instagram.com/lionhearts_volleyball" target="_blank" rel="noopener noreferrer">
          @lionhearts_volleyball
        </a>
      </h2>
    </div>
    <a
      href="https://instagram.com/lionhearts_volleyball"
      class="instagram__view-all"
      target="_blank"
      rel="noopener noreferrer"
    >
      View on Instagram →
    </a>
  </div>

  {hasPosts ? (
    <ul class="ig-grid" role="list">
      {posts.map((post) => (
        <li class="ig-tile" style={post.bgColor ? `--tile-bg:${post.bgColor}` : undefined}>
          <a
            class="ig-tile__link"
            href={post.permalink}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={post.altText}
          >
            <img
              class="ig-tile__img"
              src={post.thumbnailSrc}
              srcset={post.srcSet}
              sizes="(max-width: 640px) 50vw, 33vw"
              loading="lazy"
              decoding="async"
              width="400"
              height="400"
              alt={post.altText}
            />
            {post.mediaType === 'video' && (
              <span class="ig-tile__badge" aria-hidden="true">
                <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor"><path d="M8 5v14l11-7z" /></svg>
              </span>
            )}
            {post.mediaType === 'album' && (
              <span class="ig-tile__badge" aria-hidden="true">
                <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2"><rect x="7" y="7" width="12" height="12" rx="2" /><path d="M3 15V5a2 2 0 0 1 2-2h10" /></svg>
              </span>
            )}
            {post.caption && (
              <span class="ig-tile__overlay" aria-hidden="true">
                <span class="ig-tile__caption">{post.caption}</span>
              </span>
            )}
          </a>
        </li>
      ))}
    </ul>
  ) : (
    <div class="instagram__follow-panel">
      <p class="instagram__follow-body">
        Match day photos, training moments, and community highlights —
        follow us to see it all.
      </p>
      <a
        href="https://instagram.com/lionhearts_volleyball"
        class="instagram__follow-btn"
        target="_blank"
        rel="noopener noreferrer"
      >
        Follow @lionhearts_volleyball →
      </a>
    </div>
  )}
</section>

<style>
  .instagram {
    padding: 64px var(--page-px);
    border-top: 1px solid var(--color-border);
  }

  .instagram__header {
    display: flex;
    align-items: flex-end;
    justify-content: space-between;
    margin-bottom: 24px;
  }

  .instagram__heading {
    font-size: var(--text-lg);
    font-weight: var(--weight-black);
    text-transform: uppercase;
    letter-spacing: var(--tracking-display);
    overflow-wrap: anywhere;
  }

  .instagram__heading a {
    color: var(--color-accent-text);
    text-decoration: none;
  }

  .instagram__heading a:hover { text-decoration: underline; }

  .instagram__view-all {
    color: var(--color-text-muted);
    font-size: var(--text-note);
    font-weight: var(--weight-semibold);
    text-decoration: none;
  }

  .instagram__view-all:hover { color: var(--color-text); }

  /* --- Post grid --- */
  .ig-grid {
    list-style: none;
    margin: 0;
    padding: 0;
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 8px;
  }

  .ig-tile {
    position: relative;
    aspect-ratio: 1 / 1;
    border-radius: 8px;
    overflow: hidden;
    background: var(--tile-bg, var(--color-bg-alt));
  }

  .ig-tile__link {
    display: block;
    width: 100%;
    height: 100%;
  }

  .ig-tile__link:focus-visible {
    outline: 2px solid var(--color-accent-to);
    outline-offset: 2px;
  }

  .ig-tile__img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
    transition: transform 0.3s ease;
  }

  .ig-tile__badge {
    position: absolute;
    top: 6px;
    right: 6px;
    width: 22px;
    height: 22px;
    border-radius: 6px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #fff;
    background: rgba(5, 18, 43, 0.6);
  }

  .ig-tile__overlay {
    position: absolute;
    inset: 0;
    display: flex;
    align-items: flex-end;
    padding: 10px;
    opacity: 0;
    transition: opacity 0.2s ease;
    background: linear-gradient(
      to top,
      var(--lh-navy-deep) 0%,
      rgba(5, 18, 43, 0.1) 55%,
      transparent 100%
    );
  }

  .ig-tile__caption {
    color: #fff;
    font-size: var(--text-note);
    line-height: var(--leading-snug);
    display: -webkit-box;
    -webkit-line-clamp: 3;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }

  /* Hover/focus reveal — pointer devices only; touch just opens the link. */
  @media (hover: hover) {
    .ig-tile__link:hover .ig-tile__overlay,
    .ig-tile__link:focus-visible .ig-tile__overlay { opacity: 1; }
    .ig-tile__link:hover .ig-tile__img,
    .ig-tile__link:focus-visible .ig-tile__img { transform: scale(1.05); }
  }

  /* --- Fallback panel (unchanged) --- */
  .instagram__follow-panel {
    background: rgba(255,255,255,0.02);
    border: 1px solid var(--color-border);
    border-radius: 12px;
    padding: 48px 40px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 32px;
  }

  .instagram__follow-body {
    color: var(--color-text-muted);
    font-size: var(--text-body);
    line-height: var(--leading-relaxed);
    max-width: 480px;
  }

  .instagram__follow-btn {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    background: linear-gradient(90deg, var(--color-accent-from), var(--color-accent-to));
    color: #fff;
    font-size: var(--text-note);
    font-weight: var(--weight-bold);
    letter-spacing: var(--tracking-wide);
    text-transform: uppercase;
    text-decoration: none;
    padding: 12px 24px;
    border-radius: 4px;
    white-space: nowrap;
    flex-shrink: 0;
    transition: opacity 0.15s;
  }

  .instagram__follow-btn:hover { opacity: 0.85; }
  .instagram__follow-btn:focus-visible { outline: 2px solid var(--color-accent-to); outline-offset: 3px; }

  @media (max-width: 640px) {
    .instagram__header {
      flex-direction: column;
      align-items: flex-start;
      gap: 8px;
    }

    .ig-grid {
      grid-template-columns: repeat(2, 1fr);
    }

    .instagram__follow-panel {
      flex-direction: column;
      align-items: flex-start;
      gap: 20px;
      padding: 28px 24px;
    }

    .instagram__follow-btn {
      max-width: 100%;
      white-space: normal;
      overflow-wrap: anywhere;
    }
  }
</style>
```

- [ ] **Step 2: Type-check and build with the feed skipped (fallback path)**

Run: `SKIP_BEHOLD=true npm run build`
Expected: Build succeeds. The homepage renders the `.instagram__follow-panel` fallback (no network call).

- [ ] **Step 3: Commit**

```bash
git add src/components/InstagramFeed.astro
git commit -m "feat(instagram): render build-time Behold grid, drop client widget"
```

---

## Task 6: Env example and docs

**Files:**
- Modify: `.env.example`
- Modify: `docs/superpowers/plans/lionhearts/03-homepage.md`
- Modify: `CLAUDE.md`

- [ ] **Step 1: Update `.env.example`**

Replace the `BEHOLD_FEED_ID=your_behold_feed_id_here` line with:

```
# Behold.so JSON feed ID — fetched ONCE at build time and rendered as a static
# Instagram grid (src/lib/behold.ts). Unset → the homepage shows the "follow us"
# fallback panel instead of the grid.
BEHOLD_FEED_ID=your_behold_feed_id_here
# Local-dev escape hatch: skip the Behold fetch (renders the fallback panel).
SKIP_BEHOLD=false
```

- [ ] **Step 2: Update the homepage plan doc**

In `docs/superpowers/plans/lionhearts/03-homepage.md`, find the InstagramFeed section (Task 5 / "Step 3: Create InstagramFeed.astro", around lines 793 and 1004–1141) describing the `<behold-widget>` embed. Replace that description and code block with a short pointer:

```markdown
### InstagramFeed (build-time Behold JSON)

InstagramFeed now fetches Behold's JSON feed at build time and renders a
static, site-native 6-post grid (light/dark, 2-col on mobile) with a
"follow us" fallback. See `docs/superpowers/specs/2026-06-20-instagram-behold-json-design.md`
and `src/lib/behold.ts`. The old client-side `<behold-widget>` embed has
been removed.
```

- [ ] **Step 3: Add a note to `CLAUDE.md`**

Under the "Project Stack" section in `CLAUDE.md`, add this bullet:

```markdown
- **Build-time data fetches:** `src/lib/volleyzone.ts` (fixtures) and
  `src/lib/behold.ts` (Instagram via Behold JSON) fetch at build time and
  degrade to `[]` on any failure (never fail the build). Each has a
  `SKIP_*` env escape hatch (`SKIP_VOLLEYZONE`, `SKIP_BEHOLD`) for fast
  local builds.
```

- [ ] **Step 4: Commit**

```bash
git add .env.example docs/superpowers/plans/lionhearts/03-homepage.md CLAUDE.md
git commit -m "docs(instagram): document build-time Behold feed; add SKIP_BEHOLD"
```

---

## Task 7: Final verification

**Files:** none (verification only)

- [ ] **Step 1: Full unit-test suite**

Run: `npm test`
Expected: PASS — all suites green, including `tests/behold.test.ts`.

- [ ] **Step 2: Type-check**

Run: `npx astro check`
Expected: 0 errors.

- [ ] **Step 3: Build with a real feed (manual)**

With a real `BEHOLD_FEED_ID` set in `.env.local`, run `npm run build && npm run preview`. Confirm the homepage grid shows real posts, video/album badges appear where expected, and image `srcset` URLs point at `behold.pictures`.

- [ ] **Step 4: Responsive + theme check (Chrome DevTools MCP)**

Per the project's responsive-verification rule, view the homepage at 320 / 375 / 414 px widths and toggle the theme. Confirm:
- 3-col desktop → 2-col at ≤640px.
- Hover overlay reveals the caption on pointer devices; tiles open Instagram in a new tab.
- Both light and dark themes look correct (overlay scrim + caption legible, accent heading uses `--color-accent-text`).

- [ ] **Step 5: Stop the brainstorm visual-companion server (cleanup)**

Run: `/Users/alex/.claude/plugins/cache/claude-plugins-official/superpowers/5.1.0/skills/brainstorming/scripts/stop-server.sh /Users/alex/projects/lionhearts/.superpowers/brainstorm/9099-1781971725 2>/dev/null || true`
Expected: Server stopped (or already exited).
