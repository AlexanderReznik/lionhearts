import { describe, it, expect, vi, afterEach } from 'vitest';
import {
  mapMediaType,
  firstCaptionLine,
  paletteToRgb,
  buildSrcSet,
  normalizePost,
  normalizeFeed,
  fetchInstagramPosts,
} from '../src/lib/behold';
import type { BeholdRawPost } from '../src/lib/behold';
import feedFixture from '../src/lib/__fixtures__/behold-feed.json';

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
