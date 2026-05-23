import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://lionheartsvolleyball.com',
  integrations: [sitemap({
    filter: (page) => !page.endsWith('/join-success/'),
  })],
});
