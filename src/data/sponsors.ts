// src/data/sponsors.ts
// Single source of truth for the club's sponsors. Rendered on the homepage
// (SponsorsSection) and the sponsorship page — keep both in sync via this list.
// Order matters: sponsors render in array order (higher tier first).
//
// Logos live in public/brand/ as SVGs and are referenced via <img src>. Each
// sits on a white "chip" in the UI, so dark-on-white wordmarks stay legible in
// both the light and dark themes.

export interface Sponsor {
  /** Stable slug — used for per-sponsor CSS modifier hooks. */
  slug: string;
  /** Display name, also used for the logo alt text. */
  name: string;
  /** Sponsorship tier — shown on the tile badge. */
  tier: string;
  /** Short one-liner shown under the logo on the homepage. */
  tagline: string;
  /** 1–2 sentence blurb shown on the sponsorship page. */
  description: string;
  /** External site — opened in a new tab. */
  url: string;
  /** Logo path under public/. */
  logo: string;
  /** CTA label; rendered as `${cta} ↗`. */
  cta: string;
}

export const SPONSORS: Sponsor[] = [
  {
    slug: 'vinarius',
    name: 'Vinarius London',
    tier: 'NVL Super League Sponsor',
    tagline: "East London's Independent Wine Merchant",
    description:
      "East London's independent wine merchant — curating small-production wines from 15+ countries, hosting tastings and supper clubs in Shoreditch.",
    url: 'https://vinarius.london',
    logo: '/brand/vinarius-logo-burgundy.svg',
    cta: 'Visit Vinarius',
  },
  {
    slug: 'taste-catering',
    name: 'Taste Catering',
    tier: 'Club Sponsor',
    tagline: 'Good taste, always focused on the flavour',
    description:
      'Vibrant, fresh and culturally diverse catering — home of the Kokoro Korean kitchens and sushi bars at Imperial College London, serving campus dining, conferences, hospitality and events across the city.',
    url: 'https://tastecatering.co.uk',
    logo: '/brand/taste-catering-logo.svg',
    cta: 'Visit Taste Catering',
  },
];
