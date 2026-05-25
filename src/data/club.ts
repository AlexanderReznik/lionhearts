// src/data/club.ts
// Central constants for the club venue and standard session pricing.
// Used as defaults when the Google Sheet leaves venue/price columns blank.
// Editorial copy across the site still hardcodes the venue name in context
// (page descriptions, address blocks, JSON-LD schemas) — those are kept
// inline because they often appear inside larger sentences.

export const DEFAULT_VENUE = 'Mulberry Academy Shoreditch';
export const DEFAULT_PRICE = '£8 cash / £10 card';
