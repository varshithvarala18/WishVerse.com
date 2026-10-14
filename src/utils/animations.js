export const rand = (min, max) => min + Math.random() * (max - min);
export const randInt = (min, max) => Math.floor(rand(min, max + 1));
export const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
export const clamp = (v, min, max) => Math.min(max, Math.max(min, v));

export function prefersReducedMotion() {
  return typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
}

/**
 * Multiplier for particle counts: reduced motion cuts ~75%, small screens and
 * low-core devices get fewer particles too.
 */
export function getParticleScale() {
  let s = 1;
  if (prefersReducedMotion()) s *= 0.25;
  if (typeof window !== 'undefined' && window.innerWidth < 640) s *= 0.6;
  if (typeof navigator !== 'undefined' && navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 4) s *= 0.65;
  return s;
}

export const scaled = (n, min = 1) => Math.max(min, Math.round(n * getParticleScale()));

/**
 * Full-screen canvas runner shared by the particle effects.
 * frame(ctx, width, height, dt, now) returns true to keep animating.
 * The loop sleeps when there is nothing to draw and wakes on start().
 */
export function createCanvasRunner(canvas, frame) {
  const ctx = canvas.getContext('2d');
  let raf = 0;
  let last = 0;
  let w = 0;
  let h = 0;

  function resize() {
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    w = window.innerWidth;
    h = window.innerHeight;
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    canvas.style.width = `${w}px`;
    canvas.style.height = `${h}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function tick(now) {
    const dt = last ? Math.min(3, (now - last) / 16.667) : 1;
    last = now;
    ctx.clearRect(0, 0, w, h);
    const keep = frame(ctx, w, h, dt, now);
    if (keep) {
      raf = requestAnimationFrame(tick);
    } else {
      raf = 0;
      last = 0;
      ctx.clearRect(0, 0, w, h);
    }
  }

  resize();
  window.addEventListener('resize', resize);

  return {
    start() {
      if (!raf) {
        last = 0;
        raf = requestAnimationFrame(tick);
      }
    },
    size: () => ({ w, h }),
    destroy() {
      cancelAnimationFrame(raf);
      raf = 0;
      window.removeEventListener('resize', resize);
    },
  };
}

/* ---------- Framer Motion variants ---------- */

// No filter here: a lingering filter/transform on the stage would become the
// containing block for position:fixed overlays inside it (finale, wish pop).
export const stageVariants = {
  initial: { opacity: 0, scale: 0.97 },
  animate: { opacity: 1, scale: 1, transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] } },
  exit: { opacity: 0, scale: 1.03, transition: { duration: 0.45, ease: 'easeIn' } },
};

export const fadeUp = {
  hidden: { opacity: 0, y: 28 },
  show: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, delay: i * 0.08, ease: [0.22, 1, 0.36, 1] },
  }),
};

export const stepVariants = {
  enter: (dir) => ({ opacity: 0, x: dir > 0 ? 60 : -60 }),
  center: { opacity: 1, x: 0, transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] } },
  exit: (dir) => ({ opacity: 0, x: dir > 0 ? -60 : 60, transition: { duration: 0.25 } }),
};

export const WISH_LINES = [
  'May your year be as bright as your smile ✨',
  'Wishing you endless laughter and zero bad hair days 😄',
  'May every dream you whisper tonight come true 🌙',
  'More adventures, more cake, more you! 🎂',
  'You make the world sparkle — never stop shining 💫',
  'Here’s to a year of sunshine and good surprises ☀️',
  'May your coffee be strong and your days be magical ☕',
  'Sending a hug the size of the universe 🤗',
  'Level up unlocked: one more year of awesome 🎮',
  'May happiness follow you everywhere you go 🌈',
];

export function formatDate(iso, opts = { day: 'numeric', month: 'short', year: 'numeric' }) {
  if (!iso) return '';
  const d = new Date(iso.length === 10 ? `${iso}T00:00:00` : iso);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleDateString('en-GB', opts);
}
