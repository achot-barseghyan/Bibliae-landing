// Accès à l'API AELF (textes liturgiques officiels, forme ordinaire) et mise en forme des données.
// Tous les textes sortent en texte brut : on ne réinjecte jamais le HTML de l'API dans la page.

const API = 'https://api.aelf.org/v1';
const ZONE = 'france';

export type Info = {
  date: string;
  couleur?: string | null;
  annee?: string | null;
  temps_liturgique?: string | null;
  semaine?: string | null;
  jour?: string | null;
  jour_liturgique_nom?: string | null;
  fete?: string | null;
  degre?: string | null;
  ligne1?: string | null;
  ligne2?: string | null;
  ligne3?: string | null;
};

type RawReading = {
  type: string;
  ref?: string | null;
  titre?: string | null;
  contenu?: string | null;
  intro_lue?: string | null;
  refrain_psalmique?: string | null;
  ref_refrain?: string | null;
  verset_evangile?: string | null;
  ref_verset?: string | null;
};

export type Reading = {
  type: string;
  label: string;
  ref: string;
  intro: string;
  title: string;
  paras: string[];
  refrain: string;
  acclamation: string[];
  acclamationRef: string;
};

export type Mass = { name: string; readings: Reading[] };

export type Step = {
  k: string;
  ref: string;
  ant: string;
  paras: string[];
  sub: string;
};

export type Office = { parts: [string, string][]; steps: Step[] };

export const HOUR_KEYS = ['lectures', 'laudes', 'tierce', 'sexte', 'none', 'vepres', 'complies'] as const;
export type HourKey = (typeof HOUR_KEYS)[number];

const cache = new Map<string, Promise<unknown>>();
function get<T>(path: string): Promise<T> {
  let p = cache.get(path) as Promise<T> | undefined;
  if (!p) {
    p = fetch(`${API}/${path}`).then((r) => (r.ok ? (r.json() as Promise<T>) : Promise.reject(new Error(String(r.status)))));
    p.catch(() => cache.delete(path));
    cache.set(path, p);
  }
  return p;
}

/* ---------- HTML de l'API → texte brut ---------- */

const parser = typeof DOMParser !== 'undefined' ? new DOMParser() : null;

/** Paragraphes de texte brut ; les retours à la ligne internes (versets, strophes) sont gardés en « \n ». */
export function blocks(html: string | null | undefined): string[] {
  if (!html || !parser) return [];
  // Les retours à la ligne du source ne comptent pas : seuls <br> et <p> structurent le texte
  const doc = parser.parseFromString(`<div>${html.replace(/\s*\n\s*/g, ' ')}</div>`, 'text/html');
  const root = doc.body.firstElementChild as HTMLElement;
  root.querySelectorAll('.verse_number, script, style').forEach((n) => n.remove());
  root.querySelectorAll('br').forEach((br) => br.replaceWith('\n'));
  root.querySelectorAll('p, div').forEach((p) => {
    p.prepend('\n\n');
    p.append('\n\n');
  });
  return (root.textContent ?? '')
    .replace(/ /g, ' ')
    .split(/\n\s*\n/)
    .map((b) =>
      b
        .split('\n')
        .map((l) => l.replace(/[ \t]+/g, ' ').trim())
        .filter(Boolean)
        .join('\n')
        .replace(/\bR\/\s*/g, '℟ ')
        .replace(/\bV\/\s*/g, '℣ '),
    )
    .filter(Boolean);
}

/** Texte sur une seule ligne (titres, antiennes). */
export const line = (html: string | null | undefined) => blocks(html).join(' ').replace(/\s*\n\s*/g, ' ').trim();

/* ---------- Messe ---------- */

const LABELS: Record<string, string> = {
  lecture_1: 'Première lecture',
  lecture_2: 'Deuxième lecture',
  lecture_3: 'Troisième lecture',
  lecture_4: 'Quatrième lecture',
  lecture_5: 'Cinquième lecture',
  lecture_6: 'Sixième lecture',
  lecture_7: 'Septième lecture',
  psaume: 'Psaume',
  cantique: 'Cantique',
  sequence: 'Séquence',
  epitre: 'Épître',
  evangile: 'Évangile',
};
const label = (type: string) => LABELS[type] ?? (type.charAt(0).toUpperCase() + type.slice(1)).replace(/_/g, ' ');

export async function getMasses(date: string): Promise<Mass[]> {
  const data = await get<{ messes?: { nom?: string; lectures?: RawReading[] }[] }>(`messes/${date}/${ZONE}`);
  return (data.messes ?? []).map((m) => ({
    name: m.nom ?? 'Messe du jour',
    readings: (m.lectures ?? []).map((l) => ({
      type: l.type,
      label: label(l.type),
      ref: l.ref ?? '',
      intro: l.intro_lue ?? '',
      title: line(l.titre),
      paras: blocks(l.contenu),
      refrain: line(l.refrain_psalmique),
      acclamation: blocks(l.verset_evangile),
      acclamationRef: l.ref_verset ?? '',
    })),
  }));
}

/* ---------- Calendrier ---------- */

export const getInfo = (date: string) => get<{ informations: Info }>(`informations/${date}/${ZONE}`).then((d) => d.informations);

/* ---------- Liturgie des heures ---------- */

type Psalm = { reference?: string; titre?: string; texte?: string; auteur?: string } | [] | null | undefined;
type RawOffice = Record<string, unknown>;

const GLORIA = 'Gloire au Père, et au Fils et au Saint-Esprit, pour les siècles des siècles. Amen.';
const PATER =
  "Notre Père, qui es aux cieux, que ton nom soit sanctifié, que ton règne vienne, que ta volonté soit faite sur la terre comme au ciel. Donne-nous aujourd'hui notre pain de ce jour. Pardonne-nous nos offenses, comme nous pardonnons aussi à ceux qui nous ont offensés. Et ne nous laisse pas entrer en tentation, mais délivre-nous du Mal. Amen.";

const asPsalm = (v: unknown) => (v && typeof v === 'object' && !Array.isArray(v) ? (v as Exclude<Psalm, [] | null | undefined>) : null);
const str = (v: unknown) => (typeof v === 'string' ? v : '');

/** « 23 » → « Ps 23 » ; « CANTIQUE de Tobie (Tb 13) » → « Tb 13 » */
function psalmRef(ref: string): [string, string] {
  const r = ref.trim();
  const inParens = r.match(/\(([^)]+)\)\s*$/);
  if (/^cantique/i.test(r)) return ['Cantique', inParens ? inParens[1] : r.replace(/^cantique\s*/i, '')];
  if (/^\d/.test(r)) return ['Psaume', `Ps ${r}`];
  return ['Psaume', r];
}

export async function getOffice(key: HourKey, date: string): Promise<Office> {
  const data = await get<Record<string, RawOffice>>(`${key}/${date}/${ZONE}`);
  const o = data[key] ?? {};
  const steps: Step[] = [];
  const parts: [string, string][] = [];
  const push = (s: Partial<Step> & { k: string }) => steps.push({ ref: '', ant: '', paras: [], sub: '', ...s });

  const intro = blocks(str(o.introduction));
  if (intro.length) push({ k: 'Introduction', paras: intro });

  const inv = asPsalm(o.psaume_invitatoire);
  if (inv?.texte) {
    push({ k: 'Invitatoire', ref: `Ps ${inv.reference ?? ''}`.trim(), ant: line(str(o.antienne_invitatoire)), paras: blocks(inv.texte), sub: GLORIA });
  }

  const hymn = asPsalm(o.hymne);
  if (hymn?.texte) push({ k: 'Hymne', ref: hymn.titre ?? '', paras: blocks(hymn.texte) });

  for (const i of [1, 2, 3]) {
    const ps = asPsalm(o[`psaume_${i}`]);
    if (!ps?.texte) continue;
    const [k, ref] = psalmRef(ps.reference ?? '');
    parts.push([k, ref]);
    push({ k, ref, ant: line(str(o[`antienne_${i}`])), paras: blocks(ps.texte), sub: GLORIA });
  }

  // Office des lectures
  if (o.verset_psaume) push({ k: 'Verset', paras: blocks(str(o.verset_psaume)) });
  const reading = asPsalm(o.lecture);
  if (reading?.texte) {
    parts.push(['Lecture biblique', reading.reference ?? '']);
    push({ k: 'Lecture', ref: [reading.reference, reading.titre].filter(Boolean).join(' · '), paras: blocks(reading.texte) });
  }
  if (o.repons_lecture) push({ k: 'Répons', paras: blocks(str(o.repons_lecture)) });
  if (o.texte_patristique) {
    const title = line(str(o.titre_patristique));
    parts.push(['Lecture patristique', title.length > 42 ? title.slice(0, 40).trim() + '…' : title]);
    push({ k: 'Lecture patristique', ref: title, paras: blocks(str(o.texte_patristique)) });
  }
  if (o.repons_patristique) push({ k: 'Répons', paras: blocks(str(o.repons_patristique)) });
  const teDeum = asPsalm(o.te_deum);
  if (teDeum?.texte) push({ k: 'Te Deum', paras: blocks(teDeum.texte) });

  // Parole de Dieu (laudes, heures du jour, vêpres, complies)
  const pericope = asPsalm(o.pericope);
  if (pericope?.texte) {
    if (parts.length < 4) parts.push(['Lecture brève', pericope.reference ?? '']);
    push({ k: 'Parole de Dieu', ref: pericope.reference ?? '', paras: blocks(pericope.texte) });
  }
  if (o.repons) push({ k: 'Répons', paras: blocks(str(o.repons)) });

  const canticles: [string, string, string][] = [
    ['cantique_zacharie', 'antienne_zacharie', 'Benedictus'],
    ['cantique_mariale', 'antienne_magnificat', 'Magnificat'],
    ['cantique_symeon', 'antienne_symeon', 'Nunc dimittis'],
  ];
  for (const [ck, ak, name] of canticles) {
    const c = asPsalm(o[ck]);
    if (!c?.texte) continue;
    const ref = `${name} · ${c.reference ?? ''}`.trim();
    if (parts.length >= 4) parts.pop();
    parts.push(['Cantique', ref]);
    push({ k: c.titre || `Cantique · ${name}`, ref: c.reference ?? '', ant: line(str(o[ak])), paras: blocks(c.texte), sub: GLORIA });
  }

  if (o.intercession) push({ k: 'Intercession', paras: blocks(str(o.intercession)) });
  if (o.notre_pere) push({ k: 'Notre Père', paras: [PATER] });
  if (o.oraison) push({ k: 'Oraison', paras: blocks(str(o.oraison)) });
  if (o.benediction) push({ k: 'Bénédiction', paras: blocks(str(o.benediction)) });
  const marian = asPsalm(o.hymne_mariale);
  if (marian?.texte) push({ k: 'Antienne mariale', ref: marian.titre ?? '', paras: blocks(marian.texte) });

  return { parts: parts.slice(0, 4), steps };
}
