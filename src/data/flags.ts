// src/data/flags.ts
export interface Flag {
  iso: string;       // ISO 3166-1 alpha-2, lowercase — used for flagcdn.com SVG
  country: string;
}

export const flags: Flag[] = [
  { iso: 'gb', country: 'United Kingdom' },
  { iso: 'br', country: 'Brazil' },
  { iso: 'fr', country: 'France' },
  { iso: 'pt', country: 'Portugal' },
  { iso: 'de', country: 'Germany' },
  { iso: 'jp', country: 'Japan' },
  { iso: 'ng', country: 'Nigeria' },
  { iso: 'au', country: 'Australia' },
  { iso: 'it', country: 'Italy' },
  { iso: 'es', country: 'Spain' },
  { iso: 'us', country: 'United States' },
  { iso: 'za', country: 'South Africa' },
  { iso: 'pl', country: 'Poland' },
  { iso: 'ro', country: 'Romania' },
  { iso: 'se', country: 'Sweden' },
  { iso: 'ca', country: 'Canada' },
  { iso: 'ar', country: 'Argentina' },
  { iso: 'gr', country: 'Greece' },
  { iso: 'nl', country: 'Netherlands' },
  { iso: 'tr', country: 'Turkey' },
  { iso: 'kr', country: 'South Korea' },
  { iso: 'cn', country: 'China' },
];
