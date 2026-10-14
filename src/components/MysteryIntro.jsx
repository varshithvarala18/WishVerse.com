import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import StarsBackground from './StarsBackground.jsx';
import { useTimeline } from '../hooks/useTimers.js';

/** Stage 1 – dark, quiet, mysterious build-up. */
export default function MysteryIntro({ onNext, showStars = true }) {
  const [phase, setPhase] = useState(0);

  useTimeline([
    [500, () => setPhase(1)],
    [3400, () => setPhase(2)],
    [5200, () => setPhase(3)],
  ]);

  return (
    <div className="stage-inner intro">
      <div className="intro-dark" aria-hidden="true">
        {showStars && <StarsBackground density={1.2} />}
        <div className="intro-glow" />
      </div>
      <div className="intro-content" aria-live="polite">
        <AnimatePresence mode="wait">
          {phase === 1 && (
            <motion.p
              key="l1"
              className="intro-line"
              initial={{ opacity: 0, y: 16, filter: 'blur(6px)' }}
              animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
              exit={{ opacity: 0, y: -12, filter: 'blur(6px)' }}
              transition={{ duration: 1.2 }}
            >
              Someone has prepared something special for you…
            </motion.p>
          )}
          {phase >= 2 && (
            <motion.p
              key="l2"
              className="intro-line intro-big"
              initial={{ opacity: 0, scale: 0.9, filter: 'blur(8px)' }}
              animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
              transition={{ duration: 1.2 }}
            >
              Are you ready?
            </motion.p>
          )}
        </AnimatePresence>
        <AnimatePresence>
          {phase >= 3 && (
            <motion.button
              type="button"
              className="btn btn-primary btn-xl glow-pulse"
              onClick={onNext}
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.96 }}
              autoFocus
            >
              OPEN YOUR SURPRISE 🎁
            </motion.button>
          )}
        </AnimatePresence>
        {phase < 3 && (
          <button type="button" className="link-btn intro-skip" onClick={() => setPhase(3)}>
            Skip intro
          </button>
        )}
      </div>
    </div>
  );
}
