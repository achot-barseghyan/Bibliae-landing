// Calendrier liturgique (forme ordinaire) : dates en heure de Paris, temps de l'année, intitulés du jour.
import type { Info } from './aelf';

export const TZ = 'Europe/Paris';
const DAY = 86400000;

/** « 2026-10-20 » du jour, à Paris */
export const todayIso = () => new Intl.DateTimeFormat('en-CA', { timeZone: TZ }).format(new Date());

/** Dates manipulées à midi UTC : pas de piège d'heure d'été. */
export const parse = (iso: string) => new Date(`${iso}T12:00:00Z`);
export const iso = (d: Date) => d.toISOString().slice(0, 10);
export const addDays = (d: Date, n: number) => new Date(d.getTime() + n * DAY);
const diff = (a: Date, b: Date) => Math.round((a.getTime() - b.getTime()) / DAY);

const fmt = (o: Intl.DateTimeFormatOptions) => new Intl.DateTimeFormat('fr-FR', { ...o, timeZone: 'UTC' });
export const weekdayName = (d: Date) => cap(fmt({ weekday: 'long' }).format(d));
export const weekdayShort = (d: Date) => fmt({ weekday: 'short' }).format(d).replace('.', '');
export const monthName = (d: Date) => fmt({ month: 'long' }).format(d);

export const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

export function roman(n: number) {
  const map: [string, number][] = [['C', 100], ['XC', 90], ['L', 50], ['XL', 40], ['X', 10], ['IX', 9], ['V', 5], ['IV', 4], ['I', 1]];
  let out = '';
  for (const [r, v] of map) while (n >= v) (out += r), (n -= v);
  return out;
}

/** Lundi de la semaine civile qui contient d */
export const monday = (d: Date) => addDays(d, -((d.getUTCDay() + 6) % 7));

/* ---------- Année liturgique ---------- */

function easter(y: number) {
  // Algorithme de Meeus / Jones / Butcher
  const a = y % 19, b = Math.floor(y / 100), c = y % 100, d = Math.floor(b / 4), e = b % 4;
  const f = Math.floor((b + 8) / 25), g = Math.floor((b - f + 1) / 3), h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4), k = c % 4, l = (32 + 2 * e + 2 * i - h - k) % 7, m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31), day = ((h + l - 7 * m + 114) % 31) + 1;
  return new Date(Date.UTC(y, month - 1, day, 12));
}
/** 1er dimanche de l'Avent : 4e dimanche avant Noël */
function advent(y: number) {
  const xmas = new Date(Date.UTC(y, 11, 25, 12));
  return addDays(xmas, -(((xmas.getUTCDay() + 6) % 7) + 1) - 21);
}
/** Baptême du Seigneur (France : Épiphanie le dimanche entre le 2 et le 8 janvier) */
function baptism(y: number) {
  const jan2 = new Date(Date.UTC(y, 0, 2, 12));
  const epiphany = addDays(jan2, (7 - jan2.getUTCDay()) % 7);
  return epiphany.getUTCDate() >= 7 ? addDays(epiphany, 1) : addDays(epiphany, 7);
}

export type Season = { t: string; c: string; start: Date; len: number };

export function liturgicalYear(d: Date) {
  let y = d.getUTCFullYear();
  if (d >= advent(y)) y += 1; // l'année liturgique porte le nom de l'année civile où elle s'achève
  const start = advent(y - 1), next = advent(y);
  const e = easter(y), ash = addDays(e, -46), pentecost = addDays(e, 49), bapt = baptism(y);
  const xmas = new Date(Date.UTC(y - 1, 11, 25, 12));
  const seg = (t: string, c: string, a: Date, b: Date): Season => ({ t, c, start: a, len: diff(b, a) });
  const seasons = [
    seg('Avent', 'violet', start, xmas),
    seg('Noël', 'blanc', xmas, addDays(bapt, 1)),
    seg('T.O.', 'vert', addDays(bapt, 1), ash),
    seg('Carême', 'violet', ash, e),
    seg('Pâques', 'blanc', e, addDays(pentecost, 1)),
    seg('Temps ordinaire', 'vert', addDays(pentecost, 1), next),
  ];
  return {
    seasons,
    length: diff(next, start),
    index: diff(d, start),
    cycle: 'ABC'[(y + 2) % 3],
    parity: y % 2 === 0 ? 'paire' : 'impaire',
  };
}

/* ---------- Intitulés ---------- */

const ORD = /(\d+)(?:ème|ère|er|e)\b/i;
const lowerSeason = (s: string) => s.replace(/Temps (\w+)/g, (_, w: string) => `Temps ${w.toLowerCase()}`);
/** « DÉDICACE DES ÉGLISES consacrées » → « Dédicace des églises consacrées » */
const unshout = (s: string) => {
  const t = s.replace(/\b[A-ZÀ-Ý]{3,}(?:\s+[A-ZÀ-Ý]{2,})*\b/g, (m) => m.toLowerCase());
  return cap(t);
};
const clean = (s: string) =>
  s
    .replace(/\s*\((?:semaine|[^)]*psautier)[^)]*\)/gi, '')
    .replace(/\s*\[[^\]]*\]/g, '')
    .replace(/,?\s+on peut choisir.*$/i, '')
    .replace(/\s+-\s+France$/i, '')
    .trim();

export type Title = { l1: string; sup: string; l2: string; rank: string; memorial: string };

/** « Ste Thérèse de Jésus [d'Avila], vierge » → l1 / l2 */
function split(name: string) {
  const n = name.replace(/\[([^\]]+)\]/g, '($1)');
  const comma = n.indexOf(', ');
  return comma > 0 ? { l1: n.slice(0, comma), l2: n.slice(comma + 2) } : { l1: n, l2: '' };
}

export function title(info: Info, d: Date): Title {
  const y = liturgicalYear(d);
  const raw = clean(info.ligne1 || info.jour_liturgique_nom || '');
  const sunday = d.getUTCDay() === 0;
  const feria = (info.jour_liturgique_nom ?? '').trim() === 'de la férie';
  const degree = info.degre || (sunday ? 'Dimanche' : feria ? 'Férie' : '');
  const year = sunday || /Solennité/.test(degree) ? `année ${y.cycle}` : `année ${y.parity}`;
  const rank = (r: string) => [r, year].filter(Boolean).join(' · ');

  // Mémoire obligatoire : AELF la range parmi les féries, avec « Mémoire » en ligne 3
  if (feria && info.ligne2 && info.ligne3 === 'Mémoire') return { ...split(info.ligne2), sup: '', rank: rank('Mémoire'), memorial: '' };

  let memorial = '';
  if (feria) {
    const text = [info.ligne2, info.ligne3].filter((s): s is string => !!s && s !== 'de la férie' && !/^[([]/.test(s)).join('. ');
    const names = text
      .replace(/Mémoires? facultatives?/g, '')
      .split(/(?<!\b(?:S|Ste|Sts|Stes|Bx|Bse|Bses|Bx))\.(?:\s+|$)/)
      .map((s) => s.trim().replace(/\[([^\]]+)\]/g, '($1)'))
      .filter(Boolean);
    if (names.length) memorial = `${names.length > 1 ? 'Mémoires facultatives' : 'Mémoire facultative'} : ${names.join(' · ')}`;
  }
  const r = rank(degree);

  // « mardi, 29ème Semaine du Temps Ordinaire »
  let m = raw.match(/^(\p{L}+), (\d+)(?:ème|ère|er|e) Semaine (.+)$/iu);
  if (m) return { l1: `${cap(m[1])} de la ${roman(+m[2])}`, sup: 'e', l2: lowerSeason(`semaine ${m[3]}`), rank: r, memorial };
  // « 29ème dimanche du Temps Ordinaire »
  m = raw.match(/^(\d+)(?:ème|ère|er|e) [Dd]imanche (.+)$/u);
  if (m) return { l1: roman(+m[1]), sup: m[1] === '1' ? 'er' : 'e', l2: lowerSeason(`dimanche ${m[2]}`), rank: r, memorial };

  return { ...split(unshout(raw)), sup: '', rank: r, memorial };
}

export const weekLabel = (info: Info) => {
  const m = (info.semaine ?? '').match(ORD);
  return m ? `${roman(+m[1])}` : '';
};

/* ---------- Couleurs ---------- */

export const COL: Record<string, string> = { vert: '#5E6A3A', blanc: '#C9BFA6', violet: '#5B4A6B', rouge: '#8C2F28', rose: '#C98A9B', noir: '#3A342C' };
export const TINT: Record<string, string> = { vert: '#3E5A2E', blanc: '#8A7A52', violet: '#4A3A6B', rouge: '#7A2420', rose: '#8A4E62', noir: '#2A2620' };
