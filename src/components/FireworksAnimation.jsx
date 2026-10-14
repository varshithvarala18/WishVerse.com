import { memo, useEffect, useRef } from 'react';
import { createCanvasRunner, getParticleScale, rand, pick } from '../utils/animations.js';
import { currentParticleColors } from '../utils/themes.js';

const MAX_PARTICLES = 400;
const GRAVITY = 0.11;

/**
 * Canvas fireworks engine.
 * mode "sky": rockets climb high and burst into big shells.
 * mode "crackers": low, fast ground-level bursts with bright flashes.
 */
function FireworksAnimation({ trigger = 0, rockets = 7, duration = 3200, mode = 'sky', colors }) {
  const canvasRef = useRef(null);
  const runnerRef = useRef(null);
  const world = useRef({ rockets: [], sparks: [], flashes: [] });
  const timers = useRef([]);

  useEffect(() => {
    const runner = createCanvasRunner(canvasRef.current, (ctx, w, h, dt) => {
      const { rockets: rs, sparks, flashes } = world.current;
      ctx.globalCompositeOperation = 'lighter';

      for (let i = rs.length - 1; i >= 0; i -= 1) {
        const r = rs[i];
        r.vy += GRAVITY * dt;
        r.x += r.vx * dt;
        r.y += r.vy * dt;
        r.trail.push([r.x, r.y]);
        if (r.trail.length > 8) r.trail.shift();
        ctx.strokeStyle = r.color;
        ctx.lineWidth = 2;
        ctx.beginPath();
        r.trail.forEach(([tx, ty], k) => (k ? ctx.lineTo(tx, ty) : ctx.moveTo(tx, ty)));
        ctx.stroke();
        if (r.vy >= -0.5 || r.y <= r.targetY) {
          explode(r, w);
          rs.splice(i, 1);
        }
      }

      for (let i = sparks.length - 1; i >= 0; i -= 1) {
        const p = sparks[i];
        p.age += dt;
        p.vx *= 0.975 ** dt;
        p.vy = p.vy * 0.975 ** dt + p.g * dt;
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        const a = 1 - p.age / p.life;
        if (a <= 0 || p.y > h + 20) {
          sparks.splice(i, 1);
          continue;
        }
        ctx.globalAlpha = a;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * (0.6 + a * 0.4), 0, Math.PI * 2);
        ctx.fill();
      }

      for (let i = flashes.length - 1; i >= 0; i -= 1) {
        const f = flashes[i];
        f.age += dt;
        const a = 1 - f.age / f.life;
        if (a <= 0) {
          flashes.splice(i, 1);
          continue;
        }
        const g = ctx.createRadialGradient(f.x, f.y, 0, f.x, f.y, f.radius);
        g.addColorStop(0, `rgba(255,255,240,${0.9 * a})`);
        g.addColorStop(0.4, `rgba(255,220,150,${0.35 * a})`);
        g.addColorStop(1, 'rgba(255,200,120,0)');
        ctx.globalAlpha = 1;
        ctx.fillStyle = g;
        ctx.fillRect(f.x - f.radius, f.y - f.radius, f.radius * 2, f.radius * 2);
      }

      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = 'source-over';
      return rs.length + sparks.length + flashes.length > 0;
    });

    function explode(r) {
      const { sparks, flashes } = world.current;
      const crackers = r.mode === 'crackers';
      const want = Math.round((crackers ? 36 : 80) * getParticleScale()) + 6;
      const n = Math.min(want, MAX_PARTICLES - sparks.length);
      const shape = crackers ? 'burst' : pick(['ring', 'burst', 'burst', 'willow']);
      for (let k = 0; k < n; k += 1) {
        const angle = (k / n) * Math.PI * 2 + rand(-0.08, 0.08);
        let speed;
        if (shape === 'ring') speed = 4.2;
        else if (shape === 'willow') speed = rand(1, 3.2);
        else speed = crackers ? rand(2, 6.5) : rand(1.2, 5.2);
        sparks.push({
          x: r.x,
          y: r.y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          g: shape === 'willow' ? 0.05 : crackers ? 0.09 : 0.045,
          age: 0,
          life: crackers ? rand(26, 44) : shape === 'willow' ? rand(80, 110) : rand(50, 85),
          size: crackers ? rand(1.4, 2.4) : rand(1.6, 2.8),
          color: Math.random() < 0.15 ? '#ffffff' : r.color,
        });
      }
      flashes.push({ x: r.x, y: r.y, age: 0, life: crackers ? 10 : 14, radius: crackers ? 90 : 130 });
    }

    runnerRef.current = runner;
    return () => {
      runner.destroy();
      timers.current.forEach(clearTimeout);
      timers.current = [];
      world.current = { rockets: [], sparks: [], flashes: [] };
    };
  }, []);

  useEffect(() => {
    if (!trigger || !runnerRef.current) return;
    const palette = colors || currentParticleColors();
    const count = Math.max(2, Math.round(rockets * Math.max(0.4, getParticleScale())));
    for (let i = 0; i < count; i += 1) {
      const delay = count === 1 ? 0 : (i / (count - 1)) * duration * 0.75 + rand(0, 120);
      const t = setTimeout(() => {
        timers.current = timers.current.filter((x) => x !== t);
        if (!runnerRef.current) return;
        const { w, h } = runnerRef.current.size();
        const crackers = mode === 'crackers';
        const targetY = crackers ? h * rand(0.62, 0.86) : h * rand(0.12, 0.42);
        const startY = h + 8;
        const vy = -Math.sqrt(2 * GRAVITY * (startY - targetY)) * rand(0.98, 1.05);
        world.current.rockets.push({
          x: w * rand(0.12, 0.88),
          y: startY,
          vx: rand(-1.2, 1.2),
          vy,
          targetY,
          color: pick(palette),
          trail: [],
          mode,
        });
        runnerRef.current.start();
      }, delay);
      timers.current.push(t);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trigger]);

  return <canvas ref={canvasRef} className="fx-canvas" aria-hidden="true" />;
}

export default memo(FireworksAnimation);
