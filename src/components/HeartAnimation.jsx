import { memo, useCallback, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { getParticleScale, prefersReducedMotion, rand, pick } from '../utils/animations.js';

const HEART_COLORS = ['#ff4d6d', '#ff8fab', '#ff6b97', '#c9184a', '#ffb3c6', '#ff006e'];

function Heart({ color, size }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 29" aria-hidden="true">
      <path
        d="M16 28.5 13.7 26.4C5.6 19 0.3 14.2 0.3 8.3 0.3 3.5 4 0 8.8 0c2.7 0 5.3 1.3 7.2 3.3C17.9 1.3 20.5 0 23.2 0 28 0 31.7 3.5 31.7 8.3c0 5.9-5.3 10.7-13.4 18.1L16 28.5z"
        fill={color}
      />
      <ellipse cx="9" cy="7.5" rx="3" ry="4" fill="#fff" opacity="0.35" transform="rotate(-30 9 7.5)" />
    </svg>
  );
}

/** Hearts rise from the bottom with a slight rotation and fade out. */
function HeartAnimation({ trigger = 0, count = 18 }) {
  const [hearts, setHearts] = useState([]);

  useEffect(() => {
    if (!trigger) return;
    const reduced = prefersReducedMotion();
    const n = Math.max(4, Math.round(count * Math.max(0.3, getParticleScale())));
    const batch = Array.from({ length: n }, (_, i) => ({
      id: `${trigger}-${i}-${Math.random().toString(36).slice(2, 7)}`,
      x: rand(4, 92),
      size: rand(18, 46),
      color: pick(HEART_COLORS),
      delay: rand(0, 1.6),
      duration: reduced ? 2.4 : rand(3.6, 5.6),
      drift: rand(-50, 50),
      rot: rand(-25, 25),
      reduced,
    }));
    setHearts((list) => [...list, ...batch].slice(-60));
  }, [trigger, count]);

  const remove = useCallback((id) => setHearts((list) => list.filter((h) => h.id !== id)), []);

  return (
    <div className="fx-dom" aria-hidden="true">
      {hearts.map((h) => (
        <motion.div
          key={h.id}
          className="fx-heart"
          style={{ left: `${h.x}vw` }}
          initial={h.reduced ? { y: '70vh', opacity: 0 } : { y: '104vh', opacity: 0, rotate: 0, scale: 0.6 }}
          animate={
            h.reduced
              ? { opacity: [0, 1, 0] }
              : { y: '25vh', x: h.drift, opacity: [0, 1, 1, 0], rotate: h.rot, scale: [0.6, 1.1, 1] }
          }
          transition={{ duration: h.duration, delay: h.delay, ease: 'easeOut' }}
          onAnimationComplete={() => remove(h.id)}
        >
          <Heart color={h.color} size={h.size} />
        </motion.div>
      ))}
    </div>
  );
}

export default memo(HeartAnimation);
