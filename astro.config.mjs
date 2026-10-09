// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://bibliae.app',
  trailingSlash: 'ignore',
  integrations: [
    sitemap({
      // Mêmes URL que les balises canonical (sans « / » final, sauf l'accueil)
      serialize: (item) => ({ ...item, url: item.url.replace(/(\.app\/.+)\/$/, '$1') }),
    }),
  ],
  build: { inlineStylesheets: 'auto' },
});
