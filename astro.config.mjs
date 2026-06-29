import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import { SITE_URL } from './src/data/club.ts';

export default defineConfig({
  site: SITE_URL,
  integrations: [sitemap({
    filter: (page) => !page.endsWith('/join-success/'),
  })],
});
