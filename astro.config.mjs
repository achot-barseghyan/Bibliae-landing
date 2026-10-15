// @ts-check
import { defineConfig, envField } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import vercel from '@astrojs/vercel';

export default defineConfig({
  site: 'https://bibliae.app',
  trailingSlash: 'ignore',
  // Tout reste statique ; seule /api/contact tourne côté serveur (fonction Vercel)
  adapter: vercel(),
  integrations: [
    sitemap({
      // Mêmes URL que les balises canonical (sans « / » final, sauf l'accueil)
      serialize: (item) => ({ ...item, url: item.url.replace(/(\.app\/.+)\/$/, '$1') }),
    }),
  ],
  build: { inlineStylesheets: 'auto' },
  env: {
    schema: {
      // Formulaire de contact : clé API Resend et expéditeur (domaine vérifié chez Resend)
      RESEND_API_KEY: envField.string({ context: 'server', access: 'secret', optional: true }),
      CONTACT_FROM: envField.string({ context: 'server', access: 'secret', default: 'Bibliae <formulaire@bibliae.app>' }),
    },
  },
});
