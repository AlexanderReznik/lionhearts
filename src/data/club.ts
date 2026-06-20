// src/data/club.ts
// Central constants for the club. Venue/price are used as defaults when the
// Google Sheet leaves those columns blank; the social/contact handles are the
// single source of truth for links rendered across the site.
// Editorial copy across the site still hardcodes the venue name in context
// (page descriptions, address blocks, JSON-LD schemas) — those are kept
// inline because they often appear inside larger sentences.

export const DEFAULT_VENUE = 'Mulberry Academy Shoreditch';
export const DEFAULT_PRICE = '£8 cash / £10 card';

/** Public Instagram profile + handle — used for every "follow us" link. */
export const INSTAGRAM_URL = 'https://instagram.com/lionhearts_volleyball';
export const INSTAGRAM_HANDLE = '@lionhearts_volleyball';

/** Primary contact inbox — used for mailto links and displayed addresses. */
export const CONTACT_EMAIL = 'allanzelion@gmail.com';
