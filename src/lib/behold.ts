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
