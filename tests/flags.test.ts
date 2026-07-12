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
