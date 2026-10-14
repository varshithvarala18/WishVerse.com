import { memo, useEffect, useRef } from 'react';
import { rand, prefersReducedMotion } from '../utils/animations.js';

/**
 * Slowly drifting, twinkling star field that fills its positioned parent.
 * Pauses when the tab is hidden; draws a single static frame for reduced motion.
 */
function StarsBackground({ density = 1, className = '' }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const reduced = prefersReducedMotion();
    let raf = 0;
    let w = 0;
    let h = 0;
    let stars = [];

    function build() {
      const rect = canvas.parentElement.getBoundingClientRect();
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      w = Math.max(1, rect.width);
      h = Math.max(1, rect.height);
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const lowPower = navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 4;
      const n = Math.min(240, Math.round(((w * h) / 4200) * density * (lowPower ? 0.6 : 1)));
      stars = Array.from({ length: n }, () => ({
        x: rand(0, w),
        y: rand(0, h),
        r: Math.random() < 0.08 ? rand(1.4, 2.2) : rand(0.4, 1.2),
        speed: rand(0.02, 0.12),
        phase: rand(0, Math.PI * 2),
        tw: rand(0.6, 2),
        hue: Math.random() < 0.2 ? 'rgba(255,220,170,' : 'rgba(255,255,255,',
      }));
    }

    function draw(now) {
      ctx.clearRect(0, 0, w, h);
      for (const s of stars) {
        if (!reduced) {
          s.y -= s.speed;
          s.x += s.speed * 0.3;
          if (s.y < -4) s.y = h + 4;
          if (s.x > w + 4) s.x = -4;
        }
        const a = reduced ? 0.8 : 0.35 + 0.65 * Math.abs(Math.sin(now / 1000 / s.tw + s.phase));
        ctx.fillStyle = `${s.hue}${a.toFixed(3)})`;
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    function loop(now) {
      draw(now);
      raf = requestAnimationFrame(loop);
    }

    function start() {
      cancelAnimationFrame(raf);
      if (reduced) draw(0);
      else raf = requestAnimationFrame(loop);
    }

    function onVisibility() {
      if (document.hidden) cancelAnimationFrame(raf);
      else start();
    }

    build();
    start();
    const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(() => build()) : null;
    ro?.observe(canvas.parentElement);
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      cancelAnimationFrame(raf);
      ro?.disconnect();
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [density]);

  return <canvas ref={canvasRef} className={`stars-bg ${className}`} aria-hidden="true" />;
}

export default memo(StarsBackground);
