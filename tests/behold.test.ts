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
