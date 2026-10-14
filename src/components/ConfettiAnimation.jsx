import { memo, useEffect, useRef } from 'react';
import { createCanvasRunner, getParticleScale, rand, pick } from '../utils/animations.js';
import { currentParticleColors } from '../utils/themes.js';

const MAX_PARTICLES = 700;

/**
 * Canvas confetti. Every change of `trigger` spawns a new batch.
 * direction: "burst" (from a point), "rain" (from the top), "left" / "right" (cannons).
 */
function ConfettiAnimation({ trigger = 0, count = 150, duration = 3000, intensity = 1, direction = 'burst', colors, origin }) {
  const canvasRef = useRef(null);
  const runnerRef = useRef(null);
  const particles = useRef([]);

  useEffect(() => {
    const runner = createCanvasRunner(canvasRef.current, (ctx, w, h, dt, now) => {
      const list = particles.current;
      for (let i = list.length - 1; i >= 0; i -= 1) {
        const p = list[i];
        const age = now - p.born;
        if (age < 0) continue;
        p.vx *= 0.985 ** dt;
        p.vy = p.vy * 0.985 ** dt + p.gravity * dt;
        p.x += (p.vx + Math.sin((now + p.seed) / 300) * p.wobble) * dt;
        p.y += p.vy * dt;
        p.rot += p.vr * dt;
        const fadeStart = p.life * 0.7;
        const alpha = age > fadeStart ? Math.max(0, 1 - (age - fadeStart) / (p.life * 0.3)) : 1;
        if (age > p.life || p.y > h + 40 || alpha <= 0) {
          list.splice(i, 1);
          continue;
        }
        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        ctx.fillStyle = p.color;
        if (p.shape === 'circle') {
          ctx.beginPath();
          ctx.arc(0, 0, p.w / 2.4, 0, Math.PI * 2);
          ctx.fill();
        } else if (p.shape === 'strip') {
          ctx.fillRect(-p.w / 2, -p.h, p.w / 2.5, p.h * 2 * Math.abs(Math.cos(p.rot * 2)));
        } else {
          ctx.fillRect(-p.w / 2, (-p.h / 2) * Math.abs(Math.cos(p.rot)), p.w, p.h * Math.abs(Math.cos(p.rot)) + 1);
        }
        ctx.restore();
      }
      return list.length > 0;
    });
    runnerRef.current = runner;
    return () => {
      runner.destroy();
      particles.current = [];
    };
  }, []);

  useEffect(() => {
    if (!trigger || !runnerRef.current) return;
    const { w, h } = runnerRef.current.size();
    const palette = colors || currentParticleColors();
    const n = Math.max(12, Math.round(count * intensity * getParticleScale()));
    const now = performance.now();
    const ox = origin?.x ?? w / 2;
    const oy = origin?.y ?? h * 0.42;
    const batch = [];
    for (let i = 0; i < n; i += 1) {
      let x;
      let y;
      let vx;
      let vy;
      let delay = 0;
      if (direction === 'rain') {
        x = rand(0, w);
        y = rand(-60, -10);
        vx = rand(-1, 1);
        vy = rand(1.5, 4);
        delay = rand(0, duration * 0.5);
      } else if (direction === 'left' || direction === 'right') {
        const sign = direction === 'left' ? 1 : -1;
        x = direction === 'left' ? -10 : w + 10;
        y = h * rand(0.7, 0.95);
        vx = sign * rand(7, 16) * intensity;
        vy = -rand(9, 17) * Math.min(1.3, intensity);
        delay = rand(0, 250);
      } else {
        const angle = rand(0, Math.PI * 2);
        const speed = rand(4, 13) * intensity;
        x = ox;
        y = oy;
        vx = Math.cos(angle) * speed;
        vy = Math.sin(angle) * speed - rand(3, 6);
      }
      batch.push({
        x,
        y,
        vx,
        vy,
        w: rand(6, 11),
        h: rand(8, 14),
        color: pick(palette),
        rot: rand(0, Math.PI * 2),
        vr: rand(-0.2, 0.2),
        gravity: direction === 'rain' ? 0.04 : rand(0.16, 0.24),
        wobble: rand(0.2, 1.1),
        seed: rand(0, 1000),
        shape: pick(['rect', 'rect', 'circle', 'strip']),
        born: now + delay,
        life: (direction === 'rain' ? duration * 1.6 : duration) * rand(0.8, 1.15),
      });
    }
    const list = particles.current;
    list.push(...batch);
    if (list.length > MAX_PARTICLES) list.splice(0, list.length - MAX_PARTICLES);
    runnerRef.current.start();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trigger]);

  return <canvas ref={canvasRef} className="fx-canvas" aria-hidden="true" />;
}

export default memo(ConfettiAnimation);
