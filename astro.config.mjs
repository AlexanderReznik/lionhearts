import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import { SITE_URL } from './src/data/club.ts';

// Pages reachable only by direct URL — kept out of sitemap.xml. Each also
// sets noindex={true} on BaseLayout; omission here is not on its own a
// crawl barrier.
const UNLISTED_PATHS = new Set([
  `${SITE_URL}/join-success`,
  `${SITE_URL}/sponsors/vinarius`,
]);

export default defineConfig({
  site: SITE_URL,
  trailingSlash: 'never',
  integrations: [sitemap({
    // trailingSlash: 'never' emits slash-free locs, so strip any trailing
    // slash before matching to stay robust regardless of build format.
    filter: (page) => !UNLISTED_PATHS.has(page.replace(/\/$/, '')),
  })],
});
