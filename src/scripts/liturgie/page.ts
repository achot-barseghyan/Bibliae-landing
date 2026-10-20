// Page /liturgie : charge le jour (AELF), remplit les sections, pilote le défilement et les liseuses.
import { getInfo, getMasses, getOffice, HOUR_KEYS, type Info, type Mass, type Office, type Reading } from './aelf';
import { COL, TINT, addDays, iso, liturgicalYear, monday, monthName, parse, roman, title, todayIso, weekdayName, weekdayShort, type Title } from './calendar';
import { HOURS, arcU, arcXY, nowIndex } from './hours';

const EASE = 'cubic-bezier(.2,.7,.2,1)';
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
const $ = <T extends HTMLElement = HTMLElement>(s: string, root: ParentNode = document) => root.querySelector<T>(s);
const $$ = <T extends HTMLElement = HTMLElement>(s: string, root: ParentNode = document) => Array.from(root.querySelectorAll<T>(s));
const clamp = (v: number) => Math.max(0, Math.min(1, v));

/** Petit constructeur d'éléments : le texte passe toujours par textContent. */
function h<K extends keyof HTMLElementTagNameMap>(tag: K, attrs: Record<string, string> = {}, ...kids: (Node | string | null | false)[]) {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) k === 'class' ? (el.className = v) : el.setAttribute(k, v);
  for (const c of kids) if (c) el.append(c);
  return el;
}

/* ---------- État ---------- */

const today = todayIso();
const qs = new URLSearchParams(location.search).get('date');
let date = qs && /^\d{4}-\d{2}-\d{2}$/.test(qs) && !Number.isNaN(parse(qs).getTime()) ? qs : today;
const week = Array.from({ length: 7 }, (_, i) => iso(addDays(monday(parse(date)), i)));
const nowI = nowIndex();

let t: Title | null = null;
let masses: Mass[] = [];
let massI = 0;
let hi = -1; // heure affichée dans la section des heures
let activeCard = -1;

/* ---------- Libellés de l'heure courante ---------- */

$$('[data-now-call]').forEach((el) => (el.textContent = HOURS[nowI].call));
$$('[data-now-name]').forEach((el) => (el.textContent = HOURS[nowI].name));
$$('[data-hour-dot]').forEach((el, i) => el.classList.toggle('is-now', i === nowI));
$$('[data-o-hour]').forEach((el, i) => el.classList.toggle('is-now', i === nowI));

/* ---------- Jour ---------- */

const shortDate = (d: Date) => `${weekdayName(d)} ${d.getUTCDate()} ${monthName(d)}`;
const psalter = (i: Info) => {
  const m = `${i.jour_liturgique_nom ?? ''} ${i.ligne1 ?? ''}`.match(/semaine (IV|I{1,3}) du Psautier/i);
  if (m) return `Semaine ${m[1].toUpperCase()} du psautier`;
  const n = Number.parseInt(i.semaine ?? '', 10);
  return n ? `Semaine ${roman(((n - 1) % 4) + 1)} du psautier` : '';
};

function renderDay(i: Info) {
  const d = parse(date);
  t = title(i, d);
  const color = i.couleur ?? 'vert';
  const set = (s: string, v: string) => $$(s).forEach((el) => (el.textContent = v));

  set('[data-day-date]', `${shortDate(d)} ${d.getUTCFullYear()}${i.couleur ? ` · ${i.couleur}` : ''}`);
  set('[data-day-l1]', t.l1);
  set('[data-day-sup]', t.sup);
  set('[data-day-l2]', t.l2);
  set('[data-day-rank]', t.rank);
  $('#day-title')?.classList.toggle('long', t.l1.length + t.l2.length > 44);
  const mem = $('[data-day-memorial]');
  if (mem) {
    mem.textContent = t.memorial;
    mem.hidden = !t.memorial;
  }
  const dot = $('[data-day-color]');
  if (dot) dot.style.background = COL[color] ?? COL.vert;
  const tint = $('[data-day-tint]');
  if (tint) tint.style.backgroundColor = TINT[color] ?? TINT.vert;

  set('[data-mass-short]', `${shortDate(d)} · ${t.rank.split(' · ')[0] || 'Messe'}`);
  set('[data-m-short]', `${shortDate(d)} · ${t.rank.split(' · ')[0] || 'Messe'}`);
  set('[data-hours-sub]', [shortDate(d), psalter(i)].filter(Boolean).join(' · '));
  set('[data-o-sub]', [shortDate(d), psalter(i)].filter(Boolean).join(' · '));
  document.title = `${t.l1}${t.sup} ${t.l2} — Liturgie du jour · Bibliae`.replace(/\s+—/, ' —');

  renderWheel(d);
}

function renderWheel(d: Date) {
  const y = liturgicalYear(d);
  const arcs = $('[data-arcs]');
  const labels = $('[data-wheel-labels]');
  if (!arcs || !labels) return;
  const NS = 'http://www.w3.org/2000/svg';
  arcs.replaceChildren();
  labels.replaceChildren();
  let acc = 0;
  y.seasons.forEach((s, i) => {
    const a0 = (acc / y.length) * 360;
    const L = (s.len / y.length) * 360;
    const on = y.index >= acc && y.index < acc + s.len;
    acc += s.len;
    const c = document.createElementNS(NS, 'circle');
    for (const [k, v] of Object.entries({
      cx: '140', cy: '140', r: '113', fill: 'none', stroke: COL[s.c], 'stroke-width': on ? '8' : '3.5', pathLength: '360',
      'stroke-dasharray': `${Math.max(0, L - 1.4).toFixed(2)} 360`, 'stroke-dashoffset': (-a0).toFixed(2), transform: 'rotate(-90 140 140)',
    }))
      c.setAttribute(k, v);
    arcs.append(c);
    if (!reduced) c.animate([{ strokeDasharray: '0 360' }, { strokeDasharray: `${Math.max(0, L - 1.4).toFixed(2)} 360` }], { duration: 900, delay: 300 + i * 150, easing: EASE, fill: 'backwards' });
    // Noël et le temps ordinaire d'hiver sont trop courts pour porter un libellé
    if (i === 1 || i === 2) return;
    const mid = ((a0 + L / 2 - 90) * Math.PI) / 180;
    labels.append(h('div', { class: 'season-label', style: `left:${((140 + 146 * Math.cos(mid)) / 2.8).toFixed(2)}%;top:${((140 + 146 * Math.sin(mid)) / 2.8).toFixed(2)}%` }, s.t));
  });
  const marker = $('[data-marker]');
  const rot = `rotate(${((y.index / y.length) * 360).toFixed(1)}deg)`;
  if (marker) {
    marker.style.transform = rot;
    if (!reduced) marker.animate([{ transform: 'rotate(0deg)', opacity: 0 }, { opacity: 1, offset: 0.2 }, { transform: rot }], { duration: 2200, delay: 300, easing: EASE, fill: 'backwards' });
  }
  const num = $('[data-day-num]');
  if (num) countUp(num, d.getUTCDate());
  const month = $('[data-day-month]');
  if (month) month.textContent = monthName(d);
  const year = $('[data-day-year]');
  if (year) year.textContent = `Année ${y.cycle} · ${y.parity}`;
}

let cu = 0;
function countUp(el: HTMLElement, to: number) {
  cancelAnimationFrame(cu);
  if (reduced) return void (el.textContent = String(to));
  const t0 = performance.now();
  const step = (now: number) => {
    const k = clamp((now - t0 - 300) / 1500);
    el.textContent = String(Math.max(1, Math.round((1 - Math.pow(1 - k, 3)) * to)));
    if (k < 1) cu = requestAnimationFrame(step);
  };
  cu = requestAnimationFrame(step);
}

/* ---------- Semaine ---------- */

const weekInfo = new Map<string, Info>();

function renderWeek() {
  const box = $('[data-week]');
  if (!box) return;
  box.replaceChildren(
    ...week.map((w) => {
      const d = parse(w);
      const i = weekInfo.get(w);
      const feast = !!i && (!!i.degre || (i.jour_liturgique_nom === 'de la férie' && i.ligne3 === 'Mémoire'));
      const dot = h('span', { class: `wd-dot${feast ? ' feast' : ''}`, 'aria-hidden': 'true' });
      if (i?.couleur && !feast) dot.style.background = COL[i.couleur] ?? '';
      const b = h(
        'button',
        { type: 'button', 'aria-pressed': String(w === date), 'aria-label': `${shortDate(d)}${w === today ? " (aujourd'hui)" : ''}` },
        dot,
        h('span', { class: 'wd-n' }, String(d.getUTCDate())),
        h('span', { class: 'wd-d' }, weekdayShort(d)),
      );
      b.addEventListener('click', () => selectDay(w));
      return b;
    }),
  );
}

async function selectDay(w: string, first = false) {
  if (w === date && !first) return;
  date = w;
  renderWeek();
  const url = new URL(location.href);
  if (w === today) url.searchParams.delete('date');
  else url.searchParams.set('date', w);
  history.replaceState(null, '', url);
  if (!first) dayChangeAnim();
  loadMass();
  prefetchOffices();
  try {
    const i = weekInfo.get(w) ?? (await getInfo(w));
    if (w !== date) return;
    renderDay(i);
    renderMassTitle();
  } catch {
    const rank = $('[data-day-rank]');
    if (rank) rank.textContent = "Le calendrier liturgique n'a pas pu être chargé.";
  }
}

function dayChangeAnim() {
  if (reduced) return;
  $$('[data-day-id] [data-in]').forEach((n) => n.animate([{ opacity: 0, transform: 'translateY(10px)' }, { opacity: 1, transform: 'none' }], { duration: 700, easing: EASE }));
  animLines(0);
  $('[data-day-num]')?.animate([{ opacity: 0, transform: 'translateY(24px) scale(.9)', filter: 'blur(8px)' }, { opacity: 1, transform: 'none', filter: 'blur(0)' }], { duration: 900, easing: EASE });
}

function animLines(delay: number) {
  if (reduced) return;
  $$('[data-line]').forEach((n) => n.animate([{ transform: 'translateY(105%)' }, { transform: 'none' }], { duration: 1100, delay: delay + Number(n.dataset.line) * 130, easing: EASE, fill: 'backwards' }));
}

/* ---------- Messe ---------- */

const MARKS: Record<string, string> = { lecture_1: 'I', lecture_2: 'II', lecture_3: 'III', lecture_4: 'IV', lecture_5: 'V', lecture_6: 'VI', lecture_7: 'VII', psaume: '℟', cantique: '℟' };

function splitMass(m: Mass) {
  const evI = m.readings.map((r) => r.type).lastIndexOf('evangile');
  const ev = evI >= 0 ? m.readings[evI] : null;
  const rest = m.readings.filter((_, i) => i !== evI);
  return { ev, rest };
}
const quote = (r: Reading) => {
  const q = r.type === 'psaume' || r.type === 'cantique' ? r.refrain : r.title;
  return q || r.paras[0]?.split('\n')[0] || '';
};

async function loadMass() {
  const status = $('[data-mass-status]');
  const want = date;
  if (status) status.textContent = 'Chargement des lectures…';
  $('[data-cards]')?.replaceChildren();
  const gospel = $('[data-read]#r-ev');
  if (gospel) gospel.hidden = true;
  $('[data-toc]')?.replaceChildren();
  ($('[data-open-mass]') as HTMLButtonElement | null)?.setAttribute('disabled', '');
  try {
    const ms = await getMasses(want);
    if (want !== date) return;
    masses = ms.filter((m) => m.readings.length);
    massI = 0;
    if (!masses.length) throw new Error('vide');
    if (status) status.textContent = '';
    renderMassChoice();
    renderMass();
  } catch {
    if (want !== date || !status) return;
    status.replaceChildren(
      "Les lectures n'ont pas pu être chargées. ",
      h('a', { href: `https://www.aelf.org/${want}/romain/messe`, rel: 'noopener' }, 'Les lire sur aelf.org'),
    );
  }
}

function renderMassChoice() {
  const box = $('[data-mass-choice]');
  if (!box) return;
  box.hidden = masses.length < 2;
  box.replaceChildren(
    ...masses.map((m, i) => {
      const b = h('button', { type: 'button', 'aria-pressed': String(i === massI) }, m.name);
      b.addEventListener('click', () => {
        massI = i;
        renderMassChoice();
        renderMass();
      });
      return b;
    }),
  );
}

function renderMass() {
  const m = masses[massI];
  if (!m) return;
  const { ev, rest } = splitMass(m);
  const cards = $('[data-cards]');
  cards?.replaceChildren(
    ...rest.map((r, i) =>
      h(
        'article',
        { class: 'card', id: `r-${i}`, 'data-read': '', 'data-rv': '0' },
        MARKS[r.type] ? h('span', { class: 'c-mark', 'aria-hidden': 'true' }, MARKS[r.type]) : null,
        h('div', { class: 'c-head' }, h('span', { class: 'c-label' }, r.label), h('span', { class: 'c-ref' }, r.ref)),
        h('p', { class: 'c-q' }, quote(r)),
      ),
    ),
  );
  const gospel = $<HTMLElement>('#r-ev');
  if (gospel) {
    gospel.hidden = !ev;
    if (ev) {
      $('[data-gospel-ref]', gospel)!.textContent = ev.ref;
      const words = quote(ev)
        .replace(/« /g, '« ')
        .replace(/ ([?!:;»])/g, ' $1')
        .split(/\s+/)
        .filter(Boolean);
      $('[data-gospel-words]', gospel)!.replaceChildren(...words.map((w) => h('span', {}, w)));
    }
  }
  const all = ev ? [...rest, ev] : rest;
  $('[data-toc]')?.replaceChildren(
    ...all.map((r, i) =>
      h(
        'li',
        {},
        h('a', { href: i === rest.length ? '#r-ev' : `#r-${i}` }, h('span', { class: 't-dot', 'aria-hidden': 'true' }), h('span', { class: 't-label' }, r.label), h('span', { class: 't-ref' }, r.ref)),
      ),
    ),
  );
  $('[data-open-mass]')?.removeAttribute('disabled');
  activeCard = -1;
  observe();
  renderMassReader();
  tick();
}

/* ---------- Apparitions ---------- */

let io: IntersectionObserver | null = null;
/** Observe les [data-rv] pas encore vus (les cartes de lecture arrivent après le chargement). */
function observe() {
  if (reduced || !('IntersectionObserver' in window)) return;
  io ??= new IntersectionObserver(
    (es) =>
      es.forEach((e) => {
        if (!e.isIntersecting) return;
        const n = e.target as HTMLElement;
        const d = Number(n.dataset.rv || 0) * 110;
        n.style.transition = `opacity 1000ms ${d}ms, translate 1100ms ${EASE} ${d}ms, transform .5s ${EASE}, box-shadow .5s`;
        n.style.opacity = '1';
        n.style.translate = '0 0';
        io?.unobserve(n);
      }),
    { threshold: 0.12 },
  );
  $$('[data-rv]').forEach((n) => {
    if (n.dataset.shown) return;
    n.dataset.shown = '1';
    n.style.opacity = '0';
    n.style.translate = '0 34px';
    io!.observe(n);
  });
}

/* ---------- Défilement ---------- */

const hex = (c: string) => [1, 3, 5].map((i) => parseInt(c.slice(i, i + 2), 16));
const mix = (a: string, b: string, f: number) => {
  const A = hex(a), B = hex(b);
  return A.map((v, i) => Math.round(v + (B[i] - v) * f));
};
const toHex = (c: number[]) => '#' + c.map((v) => v.toString(16).padStart(2, '0')).join('');
const rgb = (c: number[], a?: number) => (a == null ? `rgb(${c})` : `rgba(${c},${a})`);
/** Contraste WCAG entre deux couleurs RVB */
const lum = (c: number[]) => {
  const [r, g, b] = c.map((v) => ((v /= 255) <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
const contrast = (a: number[], b: number[]) => {
  const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p);
  return (x + 0.05) / (y + 0.05);
};

const el = {
  // Seul l'anneau tourne au défilement : la date au centre reste droite
  wheel: $('[data-wheel]') as unknown as HTMLElement | null,
  read: $('[data-readings]'),
  thread: $('[data-thread]'),
  words: $('[data-gospel-words]'),
  hours: $('[data-hours]'),
  stage: $('[data-stage]'),
  sky: $('[data-sky]'),
  stars: $('[data-stars]'),
  halo: $('[data-halo]'),
  orb: $('[data-orb]'),
  ground: $('[data-ground]'),
  horizon: $('[data-horizon]'),
  hint: $('[data-hint]'),
  prog: $('[data-arc-prog]') as unknown as SVGPolylineElement | null,
};

function tick() {
  const vh = innerHeight;
  if (el.wheel && !reduced) el.wheel.style.rotate = `${(scrollY * 0.03).toFixed(2)}deg`;

  if (el.read && el.thread) {
    const r = el.read.getBoundingClientRect();
    el.thread.style.transform = `scaleY(${clamp((vh * 0.55 - r.top) / r.height).toFixed(3)})`;
    const cards = $$('[data-read]:not([hidden])', el.read);
    let act = 0;
    cards.forEach((c, i) => c.getBoundingClientRect().top < vh * 0.55 && (act = i));
    if (act !== activeCard) {
      activeCard = act;
      $$('[data-toc] li').forEach((li, i) => {
        li.classList.toggle('on', i <= act);
        li.classList.toggle('cur', i === act);
      });
    }
  }

  if (el.words) {
    const r = el.words.getBoundingClientRect();
    const q = reduced ? 1 : clamp((vh * 0.85 - r.top) / (r.height + vh * 0.25));
    const ws = el.words.children;
    for (let i = 0; i < ws.length; i++) ws[i].classList.toggle('on', (i + 1) / ws.length <= q + 0.001);
  }

  if (!el.hours) return;
  const N = HOURS.length;
  const r = el.hours.getBoundingClientRect();
  const p = clamp(-r.top / (r.height - vh));
  const tt = p * (N - 1);
  const i0 = Math.floor(tt), i1 = Math.min(N - 1, i0 + 1), f = tt - i0;
  const A = HOURS[i0].sky, B = HOURS[i1].sky;
  const top = mix(A[0], B[0], f), bot = mix(A[1], B[1], f), orb = mix(A[4], B[4], f);
  const st = A[3] + (B[3] - A[3]) * f;
  // Encre crème ou sombre selon le ciel réellement affiché (là où passent les noms d'heures) :
  // un mélange des deux donnerait un gris illisible entre deux heures
  const pick = (bg: number[]) => (contrast(hex('#F4EDDC'), bg) >= contrast(hex('#23201A'), bg) ? hex('#F4EDDC') : hex('#23201A'));
  const ink = pick(top.map((v, i) => v + (bot[i] - v) * 0.6));
  // La barre du haut repose sur le haut du ciel, souvent plus sombre que l'arc
  const topInk = pick(top.map((v, i) => v + (bot[i] - v) * 0.15));
  if (el.sky) el.sky.style.background = `linear-gradient(180deg,${rgb(top)} 0%,${rgb(bot)} 46%)`;
  if (el.stage) {
    el.stage.style.setProperty('--sky-ink', rgb(ink));
    el.stage.style.setProperty('--sky-sub', rgb(ink, 0.7));
    el.stage.style.setProperty('--sky-top-ink', rgb(topInk));
    el.stage.style.setProperty('--sky-top-sub', rgb(topInk, 0.7));
  }
  if (el.ground) el.ground.style.background = `linear-gradient(180deg,${rgb(mix(toHex(bot), '#0F1526', 0.72))} 0%,#0F1526 100%)`;
  if (el.stars) el.stars.style.opacity = st.toFixed(3);
  const [x, y] = arcXY(arcU(tt, N));
  if (el.orb) {
    el.orb.style.left = `${x}%`;
    el.orb.style.top = `${y}%`;
    el.orb.style.background = `radial-gradient(circle at 40% 38%,#FFFDF4,${rgb(orb)} 62%)`;
    el.orb.style.boxShadow = `0 0 46px 14px ${rgb(orb, 0.65)}`;
  }
  if (el.halo) {
    el.halo.style.left = `${x}%`;
    el.halo.style.top = `${y}%`;
    el.halo.style.background = `radial-gradient(circle,${rgb(orb, 0.4 - st * 0.25)},transparent 60%)`;
  }
  el.prog?.setAttribute('stroke-dashoffset', (1 - arcU(tt, N)).toFixed(4));
  if (el.horizon) el.horizon.style.background = `linear-gradient(90deg,transparent,${rgb(orb, 0.9)} ${x}%,transparent)`;
  if (el.hint) el.hint.style.opacity = p < 0.03 ? '1' : '0';
  const nhi = Math.round(tt);
  if (nhi !== hi) {
    hi = nhi;
    renderHourPanel(true);
  }
}

let raf = 0;
const onScroll = () => {
  if (!raf)
    raf = requestAnimationFrame(() => {
      raf = 0;
      tick();
    });
};
addEventListener('scroll', onScroll, { passive: true });
addEventListener('resize', onScroll, { passive: true });

/* ---------- Heures ---------- */

const offices = new Map<string, Promise<Office>>();
const office = (k: number, d = date) => {
  const key = `${d}/${HOUR_KEYS[k]}`;
  let p = offices.get(key);
  if (!p) {
    p = getOffice(HOUR_KEYS[k], d);
    p.catch(() => offices.delete(key));
    offices.set(key, p);
  }
  return p;
};
function prefetchOffices() {
  // L'heure courante d'abord, les autres ensuite
  const want = date;
  office(nowI, want).then(() => {
    if (want === date) renderHourPanel(false);
  }, () => {});
  HOURS.forEach((_, i) => i !== nowI && office(i, want).then(() => want === date && i === hi && renderHourPanel(false), () => {}));
}

function renderHourPanel(animate: boolean) {
  const k = Math.max(0, hi);
  const hr = HOURS[k];
  const set = (s: string, v: string) => $$(s).forEach((n) => (n.textContent = v));
  set('[data-hr-window]', hr.window);
  set('[data-hr-name]', hr.name);
  set('[data-hr-tag]', hr.tag);
  set('[data-hr-call]', hr.call);
  set('[data-counter]', `${String(k + 1).padStart(2, '0')} / ${String(HOURS.length).padStart(2, '0')}`);
  $$('[data-hour-dot]').forEach((b, i) => b.classList.toggle('is-on', i === k));
  const parts = $('[data-hr-parts]');
  if (parts) {
    const want = date;
    office(k).then(
      (o) => {
        if (want !== date || k !== Math.max(0, hi)) return;
        parts.replaceChildren(...o.parts.map(([a, b]) => h('div', {}, h('dt', {}, a), h('dd', {}, b))));
      },
      () => parts.replaceChildren(),
    );
  }
  if (animate && !reduced) $('[data-panel]')?.animate([{ opacity: 0, transform: 'translateY(16px)', filter: 'blur(6px)' }, { opacity: 1, transform: 'none', filter: 'blur(0)' }], { duration: 650, easing: EASE });
}

function scrollToHour(i: number) {
  if (!el.hours) return;
  const top = el.hours.getBoundingClientRect().top + scrollY;
  scrollTo({ top: top + (i / (HOURS.length - 1)) * (el.hours.offsetHeight - innerHeight) + 2, behavior: reduced ? 'auto' : 'smooth' });
}
$$('[data-hour-dot]').forEach((b, i) => b.addEventListener('click', () => scrollToHour(i)));
$$('[data-go-now]').forEach((b) => b.addEventListener('click', () => scrollToHour(nowI)));
$('[data-pray]')?.addEventListener('click', () => openOffice(Math.max(0, hi), 'guide'));
$('[data-full]')?.addEventListener('click', () => openOffice(Math.max(0, hi), 'full'));

/* ---------- Liseuses ---------- */

const mReader = $('[data-mreader]');
const oReader = $('[data-oreader]');
let opener: HTMLElement | null = null;
let fs = 1;
try {
  const v = Number(localStorage.getItem('bibliae-liturgie-fs'));
  if (v === 0 || v === 1 || v === 2) fs = v;
} catch {
  /* stockage indisponible : taille par défaut */
}
function applyFs() {
  [mReader, oReader].forEach((r) => {
    if (!r) return;
    r.classList.remove('fs-0', 'fs-1', 'fs-2');
    r.classList.add(`fs-${fs}`);
  });
  $$<HTMLButtonElement>('[data-fs="down"]').forEach((b) => (b.disabled = fs === 0));
  $$<HTMLButtonElement>('[data-fs="up"]').forEach((b) => (b.disabled = fs === 2));
}
$$('[data-fs]').forEach((b) =>
  b.addEventListener('click', () => {
    fs = Math.max(0, Math.min(2, fs + (b.dataset.fs === 'up' ? 1 : -1)));
    try {
      localStorage.setItem('bibliae-liturgie-fs', String(fs));
    } catch {
      /* rien */
    }
    applyFs();
  }),
);
applyFs();

function openReader(r: HTMLElement) {
  opener = document.activeElement as HTMLElement | null;
  [mReader, oReader].forEach((x) => x && (x.hidden = x !== r));
  document.documentElement.style.overflow = 'hidden';
  if (!reduced) r.animate([{ opacity: 0, transform: 'translateY(24px)' }, { opacity: 1, transform: 'none' }], { duration: 600, easing: EASE });
  $<HTMLButtonElement>('[data-close]', r)?.focus();
}
function closeReader() {
  [mReader, oReader].forEach((x) => x && (x.hidden = true));
  document.documentElement.style.overflow = '';
  opener?.focus();
}
$$('[data-close]').forEach((b) => b.addEventListener('click', closeReader));

addEventListener('keydown', (e) => {
  const open = [mReader, oReader].find((r) => r && !r.hidden);
  if (!open) return;
  if (e.key === 'Escape') return closeReader();
  if (open === oReader && oMode === 'guide' && !(e.target instanceof HTMLButtonElement && e.key === ' ')) {
    if (e.key === 'ArrowRight') go(1);
    if (e.key === 'ArrowLeft') go(-1);
  }
  if (e.key === 'Tab') {
    // Garde le focus dans la liseuse ouverte
    const f = $$('button:not([disabled]), a[href]', open).filter((n) => n.offsetParent !== null);
    if (!f.length) return;
    const first = f[0], last = f[f.length - 1];
    if (e.shiftKey && document.activeElement === first) (e.preventDefault(), last.focus());
    else if (!e.shiftKey && document.activeElement === last) (e.preventDefault(), first.focus());
  }
});

/* Messe */

function renderMassTitle() {
  const tEl = $('[data-m-title]');
  const rank = $('[data-m-rank]');
  if (!t || !tEl || !rank) return;
  rank.textContent = t.rank;
  tEl.replaceChildren(t.l1, t.sup ? h('sup', {}, t.sup) : '', t.l2 ? ' ' : '', t.l2 ? h('em', {}, t.l2) : '');
}

const closing = (a: string, b: string) => h('div', { class: 'ms-close' }, h('span', {}, `— ${a}`), h('span', {}, h('b', {}, '℟'), ` ${b}`));
const paras = (ps: string[]) => h('div', { class: 'ms-text' }, ...ps.map((p) => h('p', {}, p)));

function renderMassReader() {
  const m = masses[massI];
  const body = $('[data-m-body]');
  if (!m || !body) return;
  const { ev, rest } = splitMass(m);
  const sections: HTMLElement[] = rest.map((r, i) => {
    const psalm = r.type === 'psaume' || r.type === 'cantique';
    return h(
      'section',
      { class: 'ms', id: `m-${i}`, 'data-ms': '' },
      h('div', { class: 'ms-head' }, h('span', { class: 'ms-label' }, r.label), h('span', { class: 'ms-ref' }, r.ref)),
      r.intro ? h('p', { class: 'ms-intro' }, r.intro) : null,
      psalm && r.refrain ? h('div', { class: 'ms-refrain' }, h('span', { class: 'ms-r', 'aria-hidden': 'true' }, '℟'), h('p', {}, r.refrain)) : null,
      paras(r.paras),
      !psalm && r.type !== 'sequence' ? closing('Parole du Seigneur.', 'Nous rendons grâce à Dieu.') : null,
    );
  });
  if (ev)
    sections.push(
      h(
        'section',
        { class: 'ms ms-ev', id: 'm-ev', 'data-ms': '' },
        h('span', { class: 'ms-cross', 'aria-hidden': 'true' }, '✝'),
        ev.acclamation.length ? h('p', { class: 'ms-acc-k' }, `Acclamation${ev.acclamationRef ? ` · ${ev.acclamationRef}` : ''}`) : null,
        ev.acclamation.length ? h('p', { class: 'ms-acc' }, ev.acclamation.join('\n')) : null,
        h('div', { class: 'ms-head' }, h('span', { class: 'ms-label' }, ev.label), h('span', { class: 'ms-ref' }, ev.ref)),
        ev.intro ? h('p', { class: 'ms-intro' }, ev.intro) : null,
        paras(ev.paras),
        closing('Acclamons la Parole de Dieu.', 'Louange à toi, Seigneur Jésus.'),
      ),
    );
  body.replaceChildren(...sections);
  const all = ev ? [...rest, ev] : rest;
  $('[data-m-toc]')?.replaceChildren(
    ...all.map((r, i) => {
      const b = h('button', { type: 'button' }, h('span', { class: 't-dot', 'aria-hidden': 'true' }), h('span', { class: 't-label' }, r.label), h('span', { class: 't-ref' }, r.ref));
      b.addEventListener('click', () => scrollMesseTo(i === rest.length && ev ? 'm-ev' : `m-${i}`));
      return h('li', {}, b);
    }),
  );
  onMesseScroll();
}

function scrollMesseTo(id: string, behavior: ScrollBehavior = reduced ? 'auto' : 'smooth') {
  const target = mReader && $(`#${id}`, mReader);
  if (mReader && target) mReader.scrollTo({ top: mReader.scrollTop + target.getBoundingClientRect().top - 110, behavior });
}
function onMesseScroll() {
  if (!mReader) return;
  const pr = $('[data-m-prog]', mReader);
  if (pr) pr.style.width = `${(clamp(mReader.scrollTop / Math.max(1, mReader.scrollHeight - mReader.clientHeight)) * 100).toFixed(2)}%`;
  let a = 0;
  $$('[data-ms]', mReader).forEach((n, i) => n.getBoundingClientRect().top < innerHeight * 0.45 && (a = i));
  $$('[data-m-toc] li', mReader).forEach((li, i) => {
    li.classList.toggle('on', i <= a);
    li.classList.toggle('cur', i === a);
  });
}
mReader?.addEventListener('scroll', onMesseScroll, { passive: true });

function openMesse(anchor?: string) {
  if (!mReader || !masses.length) return;
  openReader(mReader);
  mReader.scrollTop = 0;
  onMesseScroll();
  if (anchor) setTimeout(() => scrollMesseTo(anchor, 'auto'), 20);
}
$('[data-open-mass]')?.addEventListener('click', () => openMesse());
$('[data-open-gospel]')?.addEventListener('click', () => openMesse('m-ev'));
$('[data-m-to-hours]')?.addEventListener('click', () => {
  closeReader();
  setTimeout(() => openOffice(nowI, 'guide'), 50);
});

/* Office */

let oKey = nowI;
let oMode: 'guide' | 'full' = 'guide';
let oStep = 0;
let oData: Office | null = null;

function openOffice(k: number, mode: 'guide' | 'full') {
  if (!oReader) return;
  oKey = k;
  oMode = mode;
  oStep = 0;
  openReader(oReader);
  loadOffice();
}

function loadOffice() {
  const want = `${date}/${oKey}`;
  oData = null;
  renderOffice();
  office(oKey).then(
    (o) => {
      if (want !== `${date}/${oKey}`) return;
      oData = o;
      renderOffice();
    },
    () => {
      if (want !== `${date}/${oKey}`) return;
      const st = $('[data-o-step]');
      st?.replaceChildren(
        h('p', { class: 's-sub' }, "L'office n'a pas pu être chargé. "),
        h('a', { href: `https://www.aelf.org/${date}/romain/${HOUR_KEYS[oKey]}`, rel: 'noopener', class: 's-sub' }, 'Le lire sur aelf.org'),
      );
    },
  );
}

function renderOffice() {
  if (!oReader) return;
  const hr = HOURS[oKey];
  const sk = hr.sky;
  oReader.style.background = `radial-gradient(130% 80% at 50% -10%,${rgb(mix(sk[1], '#0F1526', 0.55))} 0%,${rgb(mix(sk[0], '#0F1526', 0.6))} 40%,#0F1526 100%)`;
  const stars = $('[data-o-stars]', oReader);
  if (stars) stars.style.opacity = String(sk[3] * 0.9 + 0.1);
  const glow = $('[data-o-glow]', oReader);
  if (glow) glow.style.background = `radial-gradient(circle,${rgb(hex(sk[4]), 0.32)},transparent 62%)`;
  $('[data-o-window]', oReader)!.textContent = hr.window;
  $$('[data-mode]', oReader).forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.mode === oMode)));
  $$('[data-o-hour]', oReader).forEach((b, i) => b.setAttribute('aria-pressed', String(i === oKey)));
  const guide = $('[data-o-guide]', oReader)!, full = $('[data-o-full]', oReader)!;
  guide.hidden = oMode !== 'guide';
  full.hidden = oMode !== 'full';

  const steps = oData?.steps ?? [];
  if (oMode === 'guide') {
    const st = $('[data-o-step]', oReader)!;
    const s = steps[Math.min(oStep, steps.length - 1)];
    if (!s) st.replaceChildren(h('p', { class: 's-hour' }, hr.name), h('p', { class: 's-sub' }, "Chargement de l'office…"));
    else {
      const big = s.paras.length === 1 && s.paras[0].length < 140;
      st.replaceChildren(
        h('p', { class: 's-hour' }, hr.name),
        h('p', { class: 's-k' }, s.k),
        s.ref ? h('p', { class: 's-ref' }, s.ref) : '',
        s.ant ? h('p', { class: 's-ant' }, `Ant. ${s.ant}`) : '',
        big ? h('p', { class: 's-big' }, s.paras[0]) : h('div', { class: 's-long' }, ...s.paras.map((p) => h('p', {}, p))),
        s.sub ? h('p', { class: 's-sub' }, s.sub) : '',
      );
      if (st.parentElement) st.parentElement.scrollTop = 0;
      if (!reduced) st.animate([{ opacity: 0, transform: 'translateY(14px)', filter: 'blur(6px)' }, { opacity: 1, transform: 'none', filter: 'blur(0)' }], { duration: 650, easing: EASE });
    }
    $('[data-o-dots]', oReader)!.replaceChildren(
      ...steps.map((x, i) => {
        const b = h('button', { type: 'button', class: i < oStep ? 'done' : '', 'aria-label': `Étape ${i + 1} : ${x.k}` });
        if (i === oStep) b.setAttribute('aria-current', 'step');
        b.addEventListener('click', () => {
          oStep = i;
          renderOffice();
        });
        return b;
      }),
    );
    ($('[data-o-prev]', oReader) as HTMLButtonElement).disabled = oStep === 0;
    $('[data-o-next-label]', oReader)!.textContent = steps.length && oStep >= steps.length - 1 ? 'Amen' : 'Suivant';
  } else {
    $('[data-o-name]', oReader)!.textContent = hr.name;
    $('[data-o-tag]', oReader)!.textContent = hr.tag;
    $('[data-o-steps]', oReader)!.replaceChildren(
      ...(steps.length
        ? steps.map((s) =>
            h(
              'div',
              { class: 'f-step' },
              h('div', { class: 'f-meta' }, h('span', { class: 'f-k' }, s.k), s.ref ? h('span', { class: 'f-ref' }, s.ref) : null),
              h('div', { class: 'f-body' }, s.ant ? h('p', { class: 'f-ant' }, `Ant. ${s.ant}`) : null, ...s.paras.map((p) => h('p', {}, p)), s.sub ? h('span', { class: 'f-sub' }, s.sub) : null),
            ),
          )
        : [h('p', { class: 'f-sub' }, "Chargement de l'office…")]),
    );
    $('[data-o-full]', oReader)!.scrollTop = 0;
  }
}

function go(d: number) {
  const n = oData?.steps.length ?? 0;
  const s = oStep + d;
  if (s >= n) return n ? closeReader() : undefined;
  if (s >= 0) {
    oStep = s;
    renderOffice();
  }
}
$('[data-o-prev]')?.addEventListener('click', () => go(-1));
$('[data-o-next]')?.addEventListener('click', () => go(1));
$('[data-o-to-guide]')?.addEventListener('click', () => {
  oMode = 'guide';
  oStep = 0;
  renderOffice();
});
$$('[data-mode]').forEach((b) =>
  b.addEventListener('click', () => {
    oMode = b.dataset.mode === 'full' ? 'full' : 'guide';
    renderOffice();
  }),
);
$$('[data-o-hour]').forEach((b, i) =>
  b.addEventListener('click', () => {
    oKey = i;
    oStep = 0;
    loadOffice();
  }),
);

/* ---------- Lumière du curseur (hero) ---------- */

const hero = $('[data-day]');
const light = $('[data-day-light]');
if (hero && light && !reduced && matchMedia('(hover: hover) and (pointer: fine)').matches) {
  hero.addEventListener('pointermove', (e) => {
    const b = hero.getBoundingClientRect();
    light.style.background = `radial-gradient(420px circle at ${e.clientX - b.left}px ${e.clientY - b.top}px,rgba(240,213,142,0.13),transparent 70%)`;
  });
}

/* ---------- Démarrage ---------- */

if (!reduced) {
  $$('[data-in]').forEach((n) => n.animate([{ opacity: 0, transform: 'translateY(22px)', filter: 'blur(6px)' }, { opacity: 1, transform: 'none', filter: 'blur(0)' }], { duration: 1100, delay: 250 + Number(n.dataset.in) * 140, easing: EASE, fill: 'backwards' }));
  animLines(300);
}
renderWheel(parse(date));
renderWeek();
observe();
tick();
selectDay(date, true);
Promise.all(week.map((w) => getInfo(w).then((i) => weekInfo.set(w, i), () => {}))).then(renderWeek);

// Arrivée par une ancre (#lecture, #heures) : le navigateur a défilé avant que le contenu ne soit rempli
if (location.hash) requestAnimationFrame(() => document.getElementById(location.hash.slice(1))?.scrollIntoView());
