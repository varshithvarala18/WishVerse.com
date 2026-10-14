import { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { MediaImage } from './MediaImage.jsx';
import { useEffects } from '../context/EffectsContext.jsx';
import { useTimeline } from '../hooks/useTimers.js';
import useReducedMotion from '../hooks/useReducedMotion.js';
import { rand } from '../utils/animations.js';

const MAX_TILES = 30;

/** Stage 5 – every photo flies in from a random spot into a collage. */
export default function PhotoMosaic({ photos, onNext }) {
  const { fire } = useEffects();
  const reduced = useReducedMotion();
  const [revealed, setRevealed] = useState(false);
  const tiles = useMemo(() => {
    const w = typeof window !== 'undefined' ? window.innerWidth : 800;
    const h = typeof window !== 'undefined' ? window.innerHeight : 600;
    return photos.slice(0, MAX_TILES).map((p, i) => ({
      ...p,
      from: { x: rand(-w * 0.7, w * 0.7), y: rand(-h * 0.8, h * 0.8), rotate: rand(-60, 60) },
      tilt: rand(-4, 4),
      big: i % 7 === 0,
    }));
  }, [photos]);

  const landing = tiles.length * 90 + 900;

  useTimeline([
    [landing, () => {
      setRevealed(true);
      fire('hearts', { count: 16 });
      fire('sparkles', { count: 60 });
    }],
  ]);

  return (
    <div className="stage-inner mosaic">
      <div className={`mosaic-grid count-${Math.min(tiles.length, 12)}`}>
        {tiles.map((t, i) => (
          <motion.figure
            key={`${t.mediaId}-${i}`}
            className={`mosaic-tile${t.big ? ' big' : ''}`}
            initial={reduced ? { opacity: 0 } : { opacity: 0, scale: 0.3, ...t.from }}
            animate={{ opacity: 1, scale: 1, x: 0, y: 0, rotate: t.tilt }}
            transition={{ delay: i * 0.09, duration: reduced ? 0.3 : 0.9, type: reduced ? 'tween' : 'spring', stiffness: 90, damping: 15 }}
            whileHover={{ scale: 1.06, rotate: 0, zIndex: 2 }}
          >
            <MediaImage mediaId={t.mediaId} thumb alt={t.caption || ''} />
          </motion.figure>
        ))}
      </div>
      <AnimatePresence>
        {revealed && (
          <motion.div
            className="mosaic-overlay"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
          >
            <h2 className="mosaic-title glow-text">MEMORIES THAT LAST FOREVER ❤️</h2>
            <button type="button" className="btn btn-primary btn-lg" onClick={onNext}>
              Continue →
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
