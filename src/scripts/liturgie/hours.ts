// Les sept heures de la liturgie des heures (forme ordinaire), dans l'ordre du jour.
import type { HourKey } from './aelf';

/** sky : haut du ciel, bas du ciel, encre (indicative : page.ts la choisit d'après le contraste réel), étoiles (0 → 1), astre */
export type Hour = { key: HourKey; slug: string; name: string; call: string; window: string; tag: string; sky: [string, string, number, number, string] };

export const HOURS: Hour[] = [
  { key: 'lectures', slug: 'office-des-lectures', name: 'Lectures', call: "l'office des lectures", window: 'Office des lectures · avant l’aube', tag: "Veiller avec l'Église en méditant la Parole.", sky: ['#070B18', '#1C2442', 0, 1, '#E8E2CF'] },
  { key: 'laudes', slug: 'laudes', name: 'Laudes', call: 'les laudes', window: 'Au lever du jour', tag: 'Louer le Seigneur pour la lumière qui revient.', sky: ['#1E2348', '#E0946A', 0, 0.35, '#FFC98A'] },
  { key: 'tierce', slug: 'tierce', name: 'Tierce', call: 'tierce', window: 'Milieu de matinée · 9 h', tag: "L'heure où l'Esprit descendit sur les apôtres.", sky: ['#6F98BE', '#F2DEB8', 1, 0, '#FFF1C9'] },
  { key: 'sexte', slug: 'sexte', name: 'Sexte', call: 'sexte', window: 'Midi', tag: 'Au plus fort du jour, une halte pour Dieu.', sky: ['#5D8FBF', '#EEF0E4', 1, 0, '#FFF8E0'] },
  { key: 'none', slug: 'none', name: 'None', call: 'none', window: 'Après-midi · 15 h', tag: "L'heure où le Christ remit son esprit.", sky: ['#8AA3B8', '#EBC98F', 1, 0, '#FFE3A0'] },
  { key: 'vepres', slug: 'vepres', name: 'Vêpres', call: 'les vêpres', window: 'Quand le jour décline · 18 h', tag: 'Rendre grâce pour le jour reçu.', sky: ['#2B2140', '#D46A3E', 0, 0.25, '#FFB070'] },
  { key: 'complies', slug: 'complies', name: 'Complies', call: 'les complies', window: 'Avant le sommeil', tag: 'Remettre sa nuit entre les mains de Dieu.', sky: ['#0B1022', '#2A2238', 0, 1, '#E8E2CF'] },
];

/** Heure en cours, selon l'horloge du visiteur */
export const nowIndex = (h = new Date().getHours()) => (h < 6 ? 0 : h < 9 ? 1 : h < 12 ? 2 : h < 14 ? 3 : h < 17 ? 4 : h < 21 ? 5 : 6);

/** Position sur l'arc du ciel (en % de la scène) */
export const arcU = (i: number, n = HOURS.length) => 0.05 + (i * 0.9) / (n - 1);
export const arcXY = (u: number): [number, number] => [6 + 88 * u, 44 - 16 * Math.sin(Math.PI * u)];

/** Petites étoiles à position pseudo-aléatoire (même graine = même ciel au rendu serveur) */
export function stars(seed: number, n: number, h: number) {
  let s = seed;
  const rnd = () => (s = (s * 9301 + 49297) % 233280) / 233280;
  return Array.from({ length: n }, () => {
    const z = 1 + rnd() * 1.6;
    return { x: rnd() * 100, y: rnd() * h, z, d: 2 + rnd() * 3, delay: -rnd() * 4 };
  });
}
