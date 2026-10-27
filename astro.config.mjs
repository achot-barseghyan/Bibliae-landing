// @ts-check
import { defineConfig, envField } from 'astro/config';
import sitemap, { ChangeFreqEnum } from '@astrojs/sitemap';
import vercel from '@astrojs/vercel';

export default defineConfig({
  site: 'https://bibliae.app',
  trailingSlash: 'ignore',
  // Tout reste statique, sauf /api/contact et les pages /liturgie (textes du jour rendus pour Google, cache jusqu'à minuit)
  adapter: vercel(),
  integrations: [
    sitemap({
      // Pages des heures : route dynamique /liturgie/[heure], que le plugin ne peut pas énumérer seul
      customPages: ['office-des-lectures', 'laudes', 'tierce', 'sexte', 'none', 'vepres', 'complies'].map((p) => `https://bibliae.app/liturgie/${p}`),
      // Mêmes URL que les balises canonical (sans « / » final, sauf l'accueil)
      serialize: (item) => {
        const url = item.url.replace(/(\.app\/.+)\/$/, '$1');
        // Le contenu change chaque jour
        return url.includes('/liturgie') ? { ...item, url, changefreq: ChangeFreqEnum.DAILY, priority: url.endsWith('/messe') ? 0.9 : 0.8 } : { ...item, url };
      },
    }),
  ],
  build: { inlineStylesheets: 'auto' },
  env: {
    schema: {
      // Formulaire de contact : clé API Resend et expéditeur (domaine vérifié chez Resend)
      RESEND_API_KEY: envField.string({ context: 'server', access: 'secret', optional: true }),
      CONTACT_FROM: envField.string({ context: 'server', access: 'secret', default: 'Bibliae <formulaire@bibliae.app>' }),
      // Anti-robots du formulaire : Cloudflare Turnstile (clé du site publique, clé secrète vérifiée côté serveur)
      PUBLIC_TURNSTILE_SITE_KEY: envField.string({ context: 'client', access: 'public', optional: true }),
      TURNSTILE_SECRET_KEY: envField.string({ context: 'server', access: 'secret', optional: true }),
    },
  },
});
