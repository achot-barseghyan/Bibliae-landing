// Animations pilotées par le JS : apparitions, parallaxe, progression, nav, inclinaison,
// téléphone fixe des fonctionnalités. Les boucles décoratives sont en CSS (global.css).

const EASE = 'cubic-bezier(.2,.7,.2,1)';
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
const narrowMq = matchMedia('(max-width: 899px)');
const $$ = <T extends Element = HTMLElement>(s: string) => Array.from(document.querySelectorAll<T & HTMLElement>(s));

/* ---------- Apparitions au défilement ---------- */
function setupReveal() {
  const els = $$('[data-reveal]');
  if (reduced || !('IntersectionObserver' in window)) {
    els.forEach((el) => (el.style.opacity = '1'));
    return;
  }
  const io = new IntersectionObserver(
    (entries) => {
      for (const e of entries) {
        if (!e.isIntersecting) continue;
        const el = e.target as HTMLElement;
        io.unobserve(el);
        const a = el.animate(
          [
            { opacity: 0, transform: 'translateY(36px)', filter: 'blur(8px)' },
            { opacity: 1, transform: 'none', filter: 'blur(0)' },
          ],
          { duration: 1100, delay: Number(el.dataset.delay) || 0, easing: EASE, fill: 'both' },
        );
        a.onfinish = () => {
          el.style.opacity = '1';
          a.cancel();
        };
      }
    },
    { threshold: 0.12 },
  );
  els.forEach((el) => io.observe(el));
}

/* ---------- Téléphone fixe des fonctionnalités ---------- */
function setupFeatures() {
  const section = document.querySelector<HTMLElement>('[data-features]');
  if (!section) return null;
  const steps = $$('[data-step]');
  const screens = $$('[data-screen]');
  let current = 0;
  let timer = 0;

  const setStep = (n: number) => {
    if (n === current) return;
    current = n;
    section.dataset.active = String(n);
    steps.forEach((el, i) => el.classList.toggle('is-active', i === n));
    screens.forEach((el, i) => {
      el.classList.toggle('is-active', i === n);
      el.classList.toggle('is-past', i < n);
    });
  };

  const fromScroll = () => {
    if (narrowMq.matches) return;
    const mid = innerHeight * 0.5;
    let step = 0;
    steps.forEach((el, i) => {
      if (el.getBoundingClientRect().top < mid) step = i;
    });
    setStep(step);
  };

  // Mobile : les écrans défilent tout seuls toutes les 3.2 s, seulement quand la section est visible
  let visible = false;
  const syncTimer = () => {
    const run = narrowMq.matches && visible && !reduced;
    if (run && !timer) timer = window.setInterval(() => setStep((current + 1) % screens.length), 3200);
    if (!run && timer) {
      clearInterval(timer);
      timer = 0;
    }
  };
  new IntersectionObserver(([e]) => {
    visible = e.isIntersecting;
    syncTimer();
  }).observe(section);
  narrowMq.addEventListener('change', () => {
    syncTimer();
    fromScroll();
  });

  return fromScroll;
}

/* ---------- Défilement : progression, nav, parallaxe, étapes ---------- */
function setupScroll(onFeatures: (() => void) | null) {
  const bar = document.querySelector<HTMLElement>('[data-progress]');
  const nav = document.querySelector<HTMLElement>('[data-nav]');
  const par = reduced ? [] : $$('[data-par]');
  let ticking = false;

  const update = () => {
    ticking = false;
    const y = scrollY;
    const h = document.documentElement.scrollHeight - innerHeight;
    if (bar) bar.style.transform = `scaleX(${h > 0 ? y / h : 0})`;
    nav?.classList.toggle('scrolled', y > 30);
    // La parallaxe ne concerne que le hero : inutile de la calculer plus bas
    if (y < innerHeight * 1.5) par.forEach((el) => (el.style.translate = `0 ${y * Number(el.dataset.par)}px`));
    onFeatures?.();
  };
  const onScroll = () => {
    if (!ticking) {
      ticking = true;
      requestAnimationFrame(update);
    }
  };
  addEventListener('scroll', onScroll, { passive: true });
  addEventListener('resize', onScroll, { passive: true });
  update();
}

/* ---------- Inclinaison du téléphone du hero (souris uniquement) ---------- */
function setupTilt() {
  if (reduced || !matchMedia('(hover: hover) and (pointer: fine)').matches) return;
  const hero = document.querySelector<HTMLElement>('[data-hero]');
  const tilt = document.querySelector<HTMLElement>('[data-tilt]');
  const glare = document.querySelector<HTMLElement>('[data-glare]');
  if (!hero || !tilt) return;
  let frame = 0;
  hero.addEventListener('pointermove', (e) => {
    cancelAnimationFrame(frame);
    frame = requestAnimationFrame(() => {
      const r = hero.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width - 0.5;
      const y = (e.clientY - r.top) / r.height - 0.5;
      tilt.style.transform = `rotateY(${x * 16}deg) rotateX(${-y * 12}deg)`;
      if (glare)
        glare.style.background = `radial-gradient(circle at ${30 + x * 60}% ${20 + y * 50}%,rgba(255,255,255,0.2),transparent 45%)`;
    });
  });
  hero.addEventListener('pointerleave', () => {
    cancelAnimationFrame(frame);
    tilt.style.transform = 'none';
  });
}

setupReveal();
setupScroll(setupFeatures());
setupTilt();
