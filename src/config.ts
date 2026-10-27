/**
 * Sorties par plateforme. Le jour d'une sortie : passer `live` à true, renseigner l'identifiant du store, puis rebuilder.
 * `label` est la date affichée tant que la version n'est pas sortie.
 */
export const IOS = { live: true, label: '22 octobre' };
export const ANDROID = { live: false, label: 'prochainement' };
/** true tant qu'aucune version n'est disponible (« Sur iPhone le 22 octobre »). */
export const PRELAUNCH = !IOS.live && !ANDROID.live;
export const APP_STORE_ID = '6822832756';
export const APP_STORE_URL = `https://apps.apple.com/app/id${APP_STORE_ID}`;
export const PLAY_STORE_URL = 'https://play.google.com/store/apps/details?id=XXX';
export const SITE_URL = 'https://bibliae.app';
export const CONTACT_EMAIL = 'contact@bibliae.app';
/** Page web de la liturgie du jour (lectures de la messe, liturgie des heures). Ancres : #lecture, #heures, #jour. */
export const LITURGY_URL = '/liturgie';
/** Page web du chapelet guidé. */
export const ROSARY_URL = '/chapelet';
