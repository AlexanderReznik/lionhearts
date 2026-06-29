// Dynamic robots.txt so the sitemap URL tracks SITE_URL (single source of
// truth in src/data/club.ts) — no hardcoded domain to update on a domain switch.
import type { APIRoute } from 'astro';
import { SITE_URL } from '../data/club';

const body = `User-agent: *
Allow: /

Sitemap: ${SITE_URL}/sitemap-index.xml
`;

export const GET: APIRoute = () =>
  new Response(body, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
