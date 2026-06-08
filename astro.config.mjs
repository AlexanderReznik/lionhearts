import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://lionhearts.vercel.app',
  integrations: [sitemap({
    filter: (page) => !page.endsWith('/join-success/'),
  })],
});
