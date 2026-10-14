import { memo, useEffect, useRef } from 'react';
import { createCanvasRunner, getParticleScale, rand, pick } from '../utils/animations.js';
import { currentParticleColors } from '../utils/themes.js';

function drawStar(ctx, x, y, r) {
  ctx.beginPath();
  ctx.moveTo(x, y - r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.quadraticCurveTo(x, y, x, y + r);
  ctx.quadraticCurveTo(x, y, x - r, y);
  ctx.quadraticCurveTo(x, y, x, y - r);
  ctx.fill();
}

/** Lightweight twinkling sparkle shower. */
function SparkleAnimation({ trigger = 0, count = 90, duration = 2800 }) {
  const canvasRef = useRef(null);
  const runnerRef = useRef(null);
  const sparkles = useRef([]);

  useEffect(() => {
    const runner = createCanvasRunner(canvasRef.current, (ctx, w, h, dt, now) => {
      const list = sparkles.current;
      for (let i = list.length - 1; i >= 0; i -= 1) {
        const s = list[i];
        const age = now - s.born;
        if (age < 0) continue;
        if (age > s.life) {
          list.splice(i, 1);
          continue;
        }
        s.y += s.vy * dt;
        s.x += Math.sin((now + s.seed) / 400) * 0.4 * dt;
        const t = age / s.life;
        const twinkle = 0.55 + 0.45 * Math.sin(now / 90 + s.seed);
        const alpha = Math.sin(Math.PI * t) * twinkle;
        ctx.globalAlpha = Math.max(0, alpha);
        ctx.fillStyle = s.color;
        ctx.shadowColor = s.color;
        ctx.shadowBlur = 8;
        drawStar(ctx, s.x, s.y, s.r * (0.7 + 0.3 * twinkle));
      }
      ctx.shadowBlur = 0;
      ctx.globalAlpha = 1;
      return list.length > 0;
    });
    runnerRef.current = runner;
    return () => {
      runner.destroy();
      sparkles.current = [];
    };
  }, []);

  useEffect(() => {
    if (!trigger || !runnerRef.current) return;
    const { w, h } = runnerRef.current.size();
    const palette = ['#ffffff', '#fff6c9', ...currentParticleColors()];
    const n = Math.max(15, Math.round(count * getParticleScale()));
    const now = performance.now();
    for (let i = 0; i < n; i += 1) {
      sparkles.current.push({
        x: rand(0, w),
        y: rand(-20, h * 0.7),
        vy: rand(0.3, 1.4),
        r: rand(3, 9),
        color: pick(palette),
        seed: rand(0, 1000),
        born: now + rand(0, duration * 0.6),
        life: rand(900, 1800),
      });
    }
    if (sparkles.current.length > 400) sparkles.current.splice(0, sparkles.current.length - 400);
    runnerRef.current.start();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trigger]);

  return <canvas ref={canvasRef} className="fx-canvas" aria-hidden="true" />;
}

export default memo(SparkleAnimation);
