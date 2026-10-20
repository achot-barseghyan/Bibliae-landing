# Bibliae — site vitrine

Astro (HTML statique) + CSS natif + un petit script d'animation en vanilla TS.

## Commandes

```bash
npm install
npm run dev               # http://localhost:4321
npm run build             # → dist/
npm run preview
npm run check
```

## Pré-lancement / sortie

Le site est en mode pré-lancement (« Sur iPhone le 22 octobre », boutons stores désactivés).
Chaque plateforme a son interrupteur dans `src/config.ts` : le jour de la sortie iOS, passer `IOS.live` à `true` et renseigner `APP_STORE_ID` ; idem plus tard pour `ANDROID` (et `PLAY_STORE_URL`), puis rebuilder. `PRELAUNCH` en découle (vrai tant qu'aucune version n'est sortie) ; chaque bouton de store s'active seul.

Pour un texte qui dépend du mode, utiliser `ModeText` :

```astro
<ModeText>
  <Fragment slot="live">Télécharger</Fragment>
  <Fragment slot="soon">Fin 2026</Fragment>
</ModeText>
```

## Où modifier quoi

- `src/config.ts` : sorties `IOS` / `ANDROID` (statut et date affichée), liens et identifiants des stores, URL du site, e-mail de contact.
- `astro.config.mjs` et `public/robots.txt` : domaine (`https://bibliae.app`).
- `src/components/` : une section par fichier ; `src/styles/global.css` : tokens, polices et boucles d'animation.
- `src/scripts/motion.ts` : apparitions, parallaxe, barre de progression, nav, inclinaison, téléphone fixe.
- `/liturgie` (`src/pages/liturgie.astro`, `src/components/liturgie/`, `src/scripts/liturgie/`) : liturgie du jour, messe et liturgie des heures (forme ordinaire). Les textes sont chargés dans le navigateur depuis l'API AELF (`api.aelf.org`, zone France) ; `?date=AAAA-MM-JJ` ouvre un autre jour.
- `scripts/gen-icons.mjs` : regénère `public/favicon.ico` et `public/og-image.jpg` à partir de `assets/icone/icon-1024.png`.

## Formulaire de contact

`/contact` et `/en/contact` envoient vers `/api/contact` (`src/pages/api/contact.ts`), la seule route rendue côté serveur (fonction Vercel via `@astrojs/vercel`). Le message part vers `CONTACT_EMAIL` (`src/config.ts`) par l'API Resend, avec l'adresse du visiteur en « répondre à ».

- Variables (voir `.env.example`) : `RESEND_API_KEY` (obligatoire), `CONTACT_FROM` (facultatif). En local dans `.env`, en production dans Vercel › Settings › Environment Variables.
- Le domaine de `CONTACT_FROM` (bibliae.app) doit être vérifié chez Resend (enregistrements DNS).
- Anti-spam : champ caché « pot de miel » et refus des requêtes d'un autre domaine.

## Reste à fournir avant la mise en ligne

- Capture de l'écran de lecture / annotation (hero et étape I sont encore des maquettes HTML).
- Captures haute résolution (≥ 1170 px de large) dans `src/assets/screens/`.
- Badges officiels App Store et Google Play (remplacer les dessins de `StoreButtons.astro`).
- Identifiants stores.
- Pages légales (`/confidentialite`, `/en/privacy`, `/mentions-legales`, `/en/legal-notice`) : textes dans `src/content/privacy/` et `src/content/legal/`, mise en page dans `src/components/LegalLayout.astro`. Vérifier l'adresse privacy@bibliae.app, la rétention des logs Vercel (30 jours), la certification DPF et l'adresse postale de Vercel ; faire relire par un juriste.
- Après la mise en ligne : valider le domaine dans Google Search Console et y envoyer `https://bibliae.app/sitemap-index.xml`.
