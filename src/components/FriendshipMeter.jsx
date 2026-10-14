import { useEffect, useState } from 'react';
import { animate, motion, AnimatePresence } from 'framer-motion';
import { useEffects } from '../context/EffectsContext.jsx';
import useReducedMotion from '../hooks/useReducedMotion.js';

/** Stage 7 – a bar that fills 0 → 100% with a counting number. */
export default function FriendshipMeter({ label = 'Friendship Level', onNext }) {
  const { fire } = useEffects();
  const reduced = useReducedMotion();
  const [value, setValue] = useState(0);
  const [done, setDone] = useState(false);

  useEffect(() => {
    const controls = animate(0, 100, {
      duration: reduced ? 0.5 : 3,
      delay: 0.6,
      ease: [0.45, 0, 0.2, 1],
      onUpdate: (v) => setValue(Math.round(v)),
      onComplete: () => {
        setDone(true);
        fire('hearts', { count: 22 });
        fire('confetti', { count: 90 });
      },
    });
    return () => controls.stop();
  }, [reduced, fire]);

  return (
    <div className="stage-inner meter-stage">
      <p className="eyebrow">Measuring…</p>
      <h2 className="meter-label">{label}</h2>
      <div className="meter glass">
        <div
          className="meter-track"
          role="progressbar"
          aria-label={label}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={value}
        >
          <div className="meter-fill" style={{ width: `${value}%` }}>
            <span className="meter-shine" />
          </div>
        </div>
        <div className="meter-value" aria-hidden="true">
          {value}%
        </div>
      </div>
      <AnimatePresence>
        {done && (
          <motion.div
            className="meter-done"
            initial={{ opacity: 0, scale: 0.6 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: 'spring', stiffness: 200, damping: 12 }}
          >
            <p className="meter-result glow-text">❤️ 100%</p>
            <p className="muted">Off the charts. Literally.</p>
            <button type="button" className="btn btn-primary btn-lg" onClick={onNext}>
              Continue →
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
