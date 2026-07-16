import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import { SITE_URL } from './src/data/club.ts';

export default defineConfig({
  site: SITE_URL,
  trailingSlash: 'never',
  integrations: [sitemap({
    // trailingSlash: 'never' emits slash-free locs, so strip any trailing
    // slash before matching to stay robust regardless of build format.
    filter: (page) => page.replace(/\/$/, '') !== `${SITE_URL}/join-success`,
  })],
});
