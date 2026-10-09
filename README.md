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

Le site est en mode pré-lancement (« Bientôt disponible · début 2027 », boutons stores désactivés).
Le jour de la sortie : dans `src/config.ts`, passer `PRELAUNCH` à `false`, renseigner les liens stores, puis rebuilder.

Pour un texte qui dépend du mode, utiliser `ModeText` :

```astro
<ModeText>
  <Fragment slot="live">Télécharger</Fragment>
  <Fragment slot="soon">Début 2027</Fragment>
</ModeText>
```

## Où modifier quoi

- `src/config.ts` : `PRELAUNCH`, liens et identifiants des stores, date de sortie, URL du site, e-mail de contact.
- `astro.config.mjs` et `public/robots.txt` : domaine (`https://bibliae.app`).
- `src/components/` : une section par fichier ; `src/styles/global.css` : tokens, polices et boucles d'animation.
- `src/scripts/motion.ts` : apparitions, parallaxe, barre de progression, nav, inclinaison, téléphone fixe.
- `scripts/gen-icons.mjs` : regénère `public/favicon.ico` et `public/og-image.jpg` à partir de `assets/icone/icon-1024.png`.

## Reste à fournir avant la mise en ligne

- Capture de l'écran de lecture / annotation (hero et étape I sont encore des maquettes HTML).
- Captures haute résolution (≥ 1170 px de large) dans `src/assets/screens/`.
- Badges officiels App Store et Google Play (remplacer les dessins de `StoreButtons.astro`).
- Identifiants stores.
- Pages légales (`/confidentialite`, `/en/privacy`, `/mentions-legales`, `/en/legal-notice`) : textes dans `src/content/privacy/` et `src/content/legal/`, mise en page dans `src/components/LegalLayout.astro`. Vérifier l'adresse privacy@bibliae.app, la rétention des logs Vercel (30 jours), la certification DPF et l'adresse postale de Vercel ; faire relire par un juriste.
- Après la mise en ligne : valider le domaine dans Google Search Console et y envoyer `https://bibliae.app/sitemap-index.xml`.
