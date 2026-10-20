// Côté serveur : date demandée, cache jusqu'à minuit (heure de Paris), métadonnées SEO des pages /liturgie.
import { SITE_URL } from '../../config';
import type { HourKey, Mass, Reading } from './aelf';
import { TZ, parse, todayIso } from './calendar';

/** Adresse de chaque heure ; l'ordre est celui de la journée. */
export const HOUR_PAGES: { key: HourKey; slug: string; name: string; title: string; window: string; tag: string }[] = [
  { key: 'lectures', slug: 'office-des-lectures', name: 'Office des lectures', title: "l'office des lectures", window: 'Avant l’aube ou à toute heure', tag: "Veiller avec l'Église en méditant la Parole et les Pères." },
  { key: 'laudes', slug: 'laudes', name: 'Laudes', title: 'les laudes', window: 'Prière du matin', tag: 'Louer le Seigneur pour la lumière qui revient.' },
  { key: 'tierce', slug: 'tierce', name: 'Tierce', title: 'tierce', window: 'Milieu de matinée · 9 h', tag: "L'heure où l'Esprit descendit sur les apôtres." },
  { key: 'sexte', slug: 'sexte', name: 'Sexte', title: 'sexte', window: 'Midi', tag: 'Au plus fort du jour, une halte pour Dieu.' },
  { key: 'none', slug: 'none', name: 'None', title: 'none', window: 'Après-midi · 15 h', tag: "L'heure où le Christ remit son esprit." },
  { key: 'vepres', slug: 'vepres', name: 'Vêpres', title: 'les vêpres', window: 'Prière du soir', tag: 'Rendre grâce pour le jour reçu.' },
  { key: 'complies', slug: 'complies', name: 'Complies', title: 'les complies', window: 'Avant le sommeil', tag: 'Remettre sa nuit entre les mains de Dieu.' },
];

/** Date de la page : ?date=AAAA-MM-JJ (jours voisins seulement), sinon aujourd'hui à Paris. */
export function pageDate(url: URL) {
  const today = todayIso();
  const q = url.searchParams.get('date');
  const ok = !!q && /^\d{4}-\d{2}-\d{2}$/.test(q) && !Number.isNaN(parse(q).getTime());
  const date = ok ? q : today;
  return { date, d: parse(date), today, isToday: date === today };
}

/** Le jour change à minuit, heure de Paris : le cache du CDN ne doit pas le dépasser. */
function secondsToParisMidnight() {
  const now = new Date();
  const [h, m, s] = new Intl.DateTimeFormat('en-GB', { timeZone: TZ, hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23' })
    .format(now)
    .split(':')
    .map(Number);
  return Math.max(60, 86400 - (h * 3600 + m * 60 + s));
}
export function cache(headers: Headers, ok: boolean) {
  const ttl = ok ? Math.min(3600, secondsToParisMidnight()) : 60;
  headers.set('Cache-Control', `public, max-age=0, s-maxage=${ttl}, stale-while-revalidate=${ok ? 300 : 0}`);
}

const fmt = new Intl.DateTimeFormat('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' });
/** « mardi 20 octobre 2026 » */
export const longDate = (d: Date) => fmt.format(d);
/** Minuit du jour à Paris, au format ISO avec décalage (« 2026-10-20T00:00:00+02:00 ») */
export function isoDateTime(date: string) {
  const tz = new Intl.DateTimeFormat('en-US', { timeZone: TZ, timeZoneName: 'longOffset' }).formatToParts(parse(date)).find((p) => p.type === 'timeZoneName')?.value;
  return `${date}T00:00:00${tz?.replace('GMT', '') || '+00:00'}`;
}

/** Coupe proprement à ~n caractères (descriptions pour Google). */
export function clip(s: string, n = 158) {
  const t = s.replace(/\s+/g, ' ').trim();
  if (t.length <= n) return t;
  return t.slice(0, t.lastIndexOf(' ', n - 1)).replace(/[,;:·—–-]+$/, '') + '…';
}

export const unquote = (s: string) => s.replace(/^«\s*/, '').replace(/\s*»$/, '').trim();

export function gospelOf(m: Mass | undefined): Reading | undefined {
  return m?.readings.filter((r) => r.type === 'evangile').at(-1);
}

/** Fil d'Ariane + page web (schema.org) */
export function schema(opts: { url: string; name: string; description: string; date: string; crumbs: [string, string][] }) {
  const url = new URL(opts.url, SITE_URL).href;
  return [
    {
      '@context': 'https://schema.org',
      '@type': 'WebPage',
      '@id': url,
      url,
      name: opts.name,
      description: opts.description,
      inLanguage: 'fr',
      datePublished: isoDateTime(opts.date),
      dateModified: isoDateTime(opts.date),
      isPartOf: { '@type': 'WebSite', name: 'Bibliae', url: `${SITE_URL}/` },
      publisher: { '@type': 'Organization', name: 'Bibliae', url: `${SITE_URL}/`, logo: `${SITE_URL}/icon-512.png` },
    },
    {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: opts.crumbs.map(([name, path], i) => ({ '@type': 'ListItem', position: i + 1, name, item: new URL(path, SITE_URL).href })),
    },
  ];
}
