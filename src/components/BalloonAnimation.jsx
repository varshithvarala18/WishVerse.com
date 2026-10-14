import { memo, useCallback, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { getParticleScale, prefersReducedMotion, rand, randInt, pick } from '../utils/animations.js';
import { currentParticleColors } from '../utils/themes.js';

export function BalloonSvg({ color = '#ff6b97', size = 70 }) {
  const id = `bg-${color.replace('#', '')}`;
  return (
    <svg width={size} height={size * 1.75} viewBox="0 0 60 105" aria-hidden="true">
      <defs>
        <radialGradient id={id} cx="35%" cy="30%" r="70%">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.85" />
          <stop offset="25%" stopColor={color} stopOpacity="0.95" />
          <stop offset="100%" stopColor={color} />
        </radialGradient>
      </defs>
      <path d="M30 70 C30 80 26 86 30 94 C34 100 28 104 30 105" stroke="rgba(255,255,255,0.7)" strokeWidth="1" fill="none" />
      <ellipse cx="30" cy="34" rx="25" ry="31" fill={`url(#${id})`} />
      <path d="M26 64 L34 64 L30 70 Z" fill={color} />
      <ellipse cx="21" cy="22" rx="5" ry="9" fill="#fff" opacity="0.35" transform="rotate(-20 21 22)" />
    </svg>
  );
}

/** 8–15 balloons per trigger that rise, sway and are removed once off-screen. */
function BalloonAnimation({ trigger = 0, count }) {
  const [balloons, setBalloons] = useState([]);

  useEffect(() => {
    if (!trigger) return;
    const palette = currentParticleColors();
    const n = Math.max(3, Math.round((count ?? randInt(8, 15)) * Math.max(0.35, getParticleScale())));
    const reduced = prefersReducedMotion();
    const batch = Array.from({ length: n }, (_, i) => ({
      id: `${trigger}-${i}-${Math.random().toString(36).slice(2, 7)}`,
      x: rand(2, 90),
      size: rand(46, 86),
      color: pick(palette),
      delay: rand(0, 1.4),
      duration: reduced ? 3 : rand(5.5, 8.5),
      sway: rand(14, 42),
      tilt: rand(-10, 10),
      reduced,
    }));
    setBalloons((list) => [...list, ...batch].slice(-45));
  }, [trigger, count]);

  const remove = useCallback((id) => setBalloons((list) => list.filter((b) => b.id !== id)), []);

  return (
    <div className="fx-dom" aria-hidden="true">
      {balloons.map((b) => (
        <motion.div
          key={b.id}
          className="fx-balloon"
          style={{ left: `${b.x}vw` }}
          initial={b.reduced ? { opacity: 0, y: '60vh' } : { y: '110vh', x: 0, rotate: b.tilt }}
          animate={
            b.reduced
              ? { opacity: [0, 1, 0], y: '40vh' }
              : { y: '-40vh', x: [0, b.sway, -b.sway, b.sway / 2, 0], rotate: [b.tilt, -b.tilt, b.tilt] }
          }
          transition={{ duration: b.duration, delay: b.delay, ease: 'easeOut' }}
          onAnimationComplete={() => remove(b.id)}
        >
          <BalloonSvg color={b.color} size={b.size} />
        </motion.div>
      ))}
    </div>
  );
}

export default memo(BalloonAnimation);
