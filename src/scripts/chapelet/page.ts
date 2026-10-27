// Page /chapelet : déroulé de la prière, grains, halo, textes mot à mot et réglages.
import { CL, DAYS, DECADE_COLORS, DEFAULT_CFG, GEO, INTRO_AVE, MX, MY, ORD, ROMAN, SETS, T, VH, VW, beadOf, build, todaySet, type Cfg, type CfgKey, type Step } from './data';

const EASE = 'cubic-bezier(.2,.7,.2,1)';
const KEY = 'bibliae.rosaire.web';
const CFGKEY = 'bibliae.rosaire.cfg';
const sysReduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const $ = <T extends HTMLElement = HTMLElement>(s: string, root: ParentNode = document) => root.querySelector<T>(s)!;
const $$ = <T extends HTMLElement = HTMLElement>(s: string, root: ParentNode = document) => Array.from(root.querySelectorAll<T>(s));
const pct = (v: number, of: number) => `${(v / of) * 100}%`;

const root = $('[data-ch]');
const stage = $('[data-stage]');
const textEl = $('[data-text]');
const halo = $('[data-halo]');
const sheet = $('[data-sheet]');
const cfgBtn = $('[data-cfg-open]');

/* ---------- État (conservé entre les visites) ---------- */

const load = <T,>(k: string): Partial<T> => {
  try {
    return JSON.parse(localStorage.getItem(k) || '{}');
  } catch {
    return {};
  }
};
const save = (k: string, v: unknown) => {
  try {
    localStorage.setItem(k, JSON.stringify(v));
  } catch {
    /* navigation privée */
  }
};

let cfg: Cfg = { ...DEFAULT_CFG, ...load<Cfg>(CFGKEY) };
const saved = load<{ set: number; i: number }>(KEY);
let set = saved.set ?? todaySet(cfg.calendrier);
let i = saved.i ?? 0;
let info = -1;
let steps: Step[] = build(cfg);
let reduce = sysReduce || !cfg.anneau;
let flashTimer = 0;

/* ---------- Rendu ---------- */

function renderSets() {
  const today = todaySet(cfg.calendrier);
  $$('[data-set]').forEach((el, k) => {
    el.classList.toggle('is-on', k === set);
    el.setAttribute('aria-pressed', String(k === set));
    $('[data-set-days]', el).textContent = (k === today ? "Aujourd'hui · " : '') + SETS[k].days;
  });
  $('[data-set-adj]').textContent = SETS[set].adj;
  $$('[data-myst]').forEach((li, k) => {
    const m = SETS[set].m[k];
    $('[data-myst-name]', li).textContent = m[0];
    $('[data-myst-ref]', li).textContent = m[1];
    $('[data-myst-fruit]', li).textContent = m[2];
    $('[data-myst-med]', li).textContent = m[3];
  });
}

function renderCfg() {
  $$('[data-opt]').forEach((el) => el.setAttribute('aria-checked', String(!!cfg[el.dataset.opt as CfgKey])));
  // Environ 120 mots par minute ; un mystère compte pour 40 mots
  const words = steps.reduce((n, x) => n + (x.k === 'myst' ? 40 : T[x.k][1].split(/\s+/).length), 0);
  $('[data-summary]').textContent = `${steps.length} étapes · env. ${Math.max(1, Math.round(words / 120))} min`;
  $('[data-total]').textContent = String(steps.length);
  $('[data-bar]').setAttribute('aria-valuemax', String(steps.length));
  root.classList.toggle('is-calm', reduce);
}

/** Paragraphes découpés en mots, pour l'apparition mot à mot. */
function paras(body: string) {
  const box = $('[data-paras]');
  box.replaceChildren(
    ...(body ? body.split('\n') : []).map((p) => {
      const el = document.createElement('p');
      const ws = p.split(' ');
      ws.forEach((t, k) => {
        const w = document.createElement('span');
        w.className = 'ch-w';
        w.dataset.w = '';
        w.textContent = k < ws.length - 1 ? `${t} ` : t;
        el.append(w);
      });
      return el;
    }),
  );
}

function render() {
  i = Math.min(i, steps.length - 1);
  const st = steps[i];
  const S = SETS[set];
  const curBead = beadOf(st);

  // Première et dernière étape de chaque grain
  const range: Record<string, [number, number]> = {};
  steps.forEach((s, j) => {
    const b = beadOf(s);
    if (!range[b]) range[b] = [j, j];
    else range[b][1] = j;
  });
  const status = (id: string) => (id === curBead ? 'on' : range[id] && range[id][1] < i ? 'done' : 'todo');

  $$('[data-bead]').forEach((el) => {
    const s = status(el.dataset.bead!);
    el.classList.toggle('is-on', s === 'on');
    el.classList.toggle('is-done', s === 'done');
  });
  const medal = $('[data-medal]');
  medal.classList.toggle('is-on', status('medal') === 'on');
  medal.classList.toggle('is-done', status('medal') === 'done');
  $('[data-cross]').classList.toggle('is-on', status('cross') === 'on');

  // Halo sur le grain en cours
  const hp = curBead === 'medal' ? { x: MX, y: MY, w: 110 } : curBead === 'cross' ? { x: 336, y: 729, w: 140 } : { ...GEO.pos[curBead], w: GEO.pos[curBead].big ? 80 : 54 };
  halo.style.left = pct(hp.x, VW);
  halo.style.top = pct(hp.y, VH);
  halo.style.width = pct(hp.w, VW);

  // Fil doré : part parcourue du pendentif puis de la boucle
  let pf = 0;
  let lf = 0;
  if (st.d === -1) pf = curBead === 'cross' ? 0 : curBead === 'medal' ? 1 : GEO.pos[curBead].pf!;
  else {
    pf = 1;
    lf = st.d === 5 ? 1 : curBead === 'medal' ? (st.d === 4 ? 1 : 0) : GEO.frac[curBead];
  }
  $('[data-loop]').setAttribute('stroke-dasharray', lf <= 0.001 ? '0 1' : `${lf} ${1.01 - lf}`);
  $('[data-pend]').setAttribute('stroke-dasharray', pf <= 0.001 ? '0 1' : `${pf} 1`);

  // Texte de l'étape
  const d = Math.max(0, Math.min(4, st.d));
  const M = S.m[d];
  let eyebrow: string;
  let title: string;
  let body: string;
  let fruit: string | null = null;
  if (st.k === 'myst') {
    eyebrow = `${ORD[st.d]} mystère ${S.adj}${cfg.evangile ? ` · ${M[1]}` : ''}`;
    title = M[0];
    body = cfg.evangile ? M[3] : '';
    fruit = cfg.fruit ? M[2] : null;
  } else {
    [title, body] = T[st.k];
    eyebrow = title;
    if (st.k === 'ave') eyebrow = st.d === -1 ? INTRO_AVE[st.n! - 1] : `Ave · ${st.n} sur 10`;
    if (st.k === 'ave' && st.d >= 0 && cfg.clausule) body = body.replace('et Jésus, le fruit de vos entrailles, est béni.', `et Jésus, ${CL[set][st.d][st.n! - 1]}, est béni.`);
    if (cfg.abrege && st.k === 'ave' && st.n! > 1) body = 'Je vous salue, Marie, pleine de grâce…';
  }
  $('[data-eyebrow]').textContent = eyebrow;
  $('[data-badge]').textContent = st.d === -1 ? 'Ouverture' : st.d === 5 ? 'Conclusion' : `Dizaine ${ROMAN[st.d]}`;
  $('[data-title]').textContent = title;
  paras(body);
  const fruitEl = $('[data-fruit]');
  fruitEl.hidden = !fruit;
  $('[data-fruit-v]').textContent = fruit ?? '';

  // Mystère annoncé en grand au centre du chapelet
  $('[data-flash-num]').textContent = ROMAN[d];
  $('[data-flash-name]').textContent = M[0];

  // Progression
  $('[data-num]').textContent = String(i + 1);
  $('[data-bar]').setAttribute('aria-valuenow', String(i + 1));
  $('[data-bar-fill]').style.width = pct(i + 1, steps.length);
  $$('[data-decade]').forEach((el, k) => {
    const idx = steps.flatMap((s, j) => (s.d === k ? [j] : []));
    el.style.width = pct(idx.filter((j) => j <= i).length, idx.length);
    el.style.background = DECADE_COLORS[k];
  });

  // Liste des mystères
  $$('[data-myst]').forEach((li, k) => {
    li.classList.toggle('is-on', k === st.d);
    li.classList.toggle('is-done', st.d > k);
    $('.ch-myst-info', li).hidden = info !== k;
  });
  $('[data-info]').textContent = info === -1 ? 'Méditer le mystère' : 'Refermer';
  $('[data-next-label]').textContent = i === steps.length - 1 ? 'Amen' : st.k === 'myst' ? 'Commencer la dizaine' : 'Suivante';

  save(KEY, { set, i });
}

/* ---------- Animations ---------- */

function animateText(first: boolean) {
  if (reduce) return;
  const ws = $$('[data-title], [data-w], [data-fruit]:not([hidden])', textEl);
  const step = Math.min(16, 700 / Math.max(1, ws.length));
  ws.forEach((w, k) =>
    w.animate([{ opacity: 0, transform: 'translateY(8px)', filter: 'blur(4px)' }, { opacity: 1, transform: 'none', filter: 'blur(0)' }], {
      duration: 620,
      delay: (first ? 400 : 0) + k * step,
      easing: EASE,
      fill: 'backwards',
    }),
  );
}

function pop() {
  if (reduce) return;
  halo.animate([{ transform: 'translate(-50%,-50%) scale(1.6)', opacity: 0.4 }, { transform: 'translate(-50%,-50%) scale(1)', opacity: 1 }], { duration: 700, easing: EASE });
}

function flash() {
  const el = $('[data-flash]');
  clearTimeout(flashTimer);
  const on = steps[i]?.k === 'myst';
  el.classList.toggle('is-on', on);
  if (on) flashTimer = window.setTimeout(() => el.classList.remove('is-on'), 2600);
}

function reveal() {
  $$('[data-reveal]', root).forEach((el) => {
    if (reduce) {
      el.style.opacity = '1';
      return;
    }
    const a = el.animate([{ opacity: 0, transform: 'translateY(24px)', filter: 'blur(6px)' }, { opacity: 1, transform: 'none', filter: 'blur(0)' }], {
      duration: 1000,
      delay: Number(el.dataset.delay) || 0,
      easing: EASE,
      fill: 'both',
    });
    a.onfinish = () => {
      el.style.opacity = '1';
      a.cancel();
    };
  });
}

/** Après un changement d'étape ou de mystères. */
function moved() {
  render();
  animateText(false);
  flash();
  pop();
}

/* ---------- Actions ---------- */

const go = (dir: number) => {
  const n = Math.max(0, Math.min(steps.length - 1, i + dir));
  if (n === i) return;
  i = n;
  moved();
};
const jumpTo = (n: number) => {
  i = n;
  moved();
};

function setCfg(next: Cfg) {
  cfg = next;
  save(CFGKEY, cfg);
  steps = build(cfg);
  reduce = sysReduce || !cfg.anneau;
  renderCfg();
  renderSets();
  render();
}

function openCfg(open: boolean) {
  root.classList.toggle('is-cfg', open);
  sheet.inert = !open;
  cfgBtn.setAttribute('aria-expanded', String(open));
  if (open) $('[data-opt]', sheet).focus({ preventScroll: true });
  else cfgBtn.focus({ preventScroll: true });
}

$$('[data-set]').forEach((el, k) =>
  el.addEventListener('click', () => {
    if (k === set) return;
    set = k;
    renderSets();
    moved();
  }),
);
$$('[data-bead]').forEach((el) =>
  el.addEventListener('click', () => {
    const id = el.dataset.bead!;
    const j = steps.findIndex((s) => beadOf(s) === id);
    if (j >= 0) jumpTo(j);
  }),
);
$('[data-medal]').addEventListener('click', () => jumpTo(Math.max(0, steps.findIndex((s) => beadOf(s) === 'medal'))));
$('[data-cross]').addEventListener('click', () => jumpTo(0));
$$('[data-myst-jump]').forEach((el, k) =>
  el.addEventListener('click', () => {
    if (info !== -1) info = k;
    jumpTo(steps.findIndex((s) => s.d === k));
  }),
);
$('[data-info]').addEventListener('click', () => {
  const st = steps[i];
  info = info === -1 ? Math.max(0, Math.min(4, st.d)) : -1;
  render();
});
$('[data-prev]').addEventListener('click', () => go(-1));
$('[data-next]').addEventListener('click', () => go(1));
$('[data-reset]').addEventListener('click', () => jumpTo(0));

cfgBtn.addEventListener('click', () => openCfg(true));
$$('[data-cfg-close]').forEach((el) => el.addEventListener('click', () => openCfg(false)));
$$('[data-opt]').forEach((el) =>
  el.addEventListener('click', () => {
    const k = el.dataset.opt as CfgKey;
    setCfg({ ...cfg, [k]: !cfg[k] });
  }),
);
$('[data-cfg-reset]').addEventListener('click', () => setCfg({ ...DEFAULT_CFG }));

addEventListener('keydown', (e) => {
  const t = e.target as HTMLElement;
  if (/INPUT|TEXTAREA|SELECT/.test(t.tagName) || e.metaKey || e.ctrlKey || e.altKey) return;
  const open = root.classList.contains('is-cfg');
  if (e.key === 'Escape' && open) return openCfg(false);
  if (open) return;
  // Espace sur un bouton : laisser le bouton réagir
  if (e.key === ' ' && t.tagName === 'BUTTON') return;
  if (e.key === 'ArrowRight' || e.key === 'ArrowDown' || e.key === ' ') {
    e.preventDefault();
    go(1);
  } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
    e.preventDefault();
    go(-1);
  }
});

// Légère inclinaison du chapelet sous la souris
const col = stage.parentElement!;
col.addEventListener('mousemove', (e) => {
  if (reduce) return;
  const r = col.getBoundingClientRect();
  const x = (e.clientX - r.left) / r.width - 0.5;
  const y = (e.clientY - r.top) / r.height - 0.5;
  stage.style.transform = `perspective(1200px) rotateY(${x * 5}deg) rotateX(${-y * 4}deg)`;
});
col.addEventListener('mouseleave', () => (stage.style.transform = 'none'));

/* ---------- Démarrage ---------- */

$('[data-day]').textContent = `Le chapelet · ${DAYS[new Date().getDay()]}`;
renderCfg();
renderSets();
render();
reveal();
animateText(true);
flash();
