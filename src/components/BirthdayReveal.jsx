import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useEffects } from '../context/EffectsContext.jsx';
import { useTimeline } from '../hooks/useTimers.js';

const TEXT = 'HAPPY BIRTHDAY';
const LETTER_DELAY = 0.09;

/** Stage 3 – letter-by-letter reveal, then the name with a big glow. */
export default function BirthdayReveal({ name, onNext, nextLabel = 'Continue →' }) {
  const { fire } = useEffects();
  const [showName, setShowName] = useState(false);
  const [showNext, setShowNext] = useState(false);
  const total = TEXT.length * LETTER_DELAY * 1000;

  useTimeline([
    [300, () => fire('sparkles', { count: 70 })],
    [total + 500, () => {
      setShowName(true);
      fire('confetti', { count: 200, intensity: 1.15 });
      fire('balloons');
    }],
    [total + 1400, () => fire('confetti', { direction: 'left', count: 90 })],
    [total + 1500, () => fire('confetti', { direction: 'right', count: 90 })],
    [total + 2300, () => setShowNext(true)],
  ]);

  return (
    <div className="stage-inner reveal">
      <div className="reveal-glow" aria-hidden="true" />
      <h1 className="reveal-title" aria-label="Happy Birthday">
        {TEXT.split(' ').map((word, w, words) => {
          const offset = words.slice(0, w).join(' ').length + (w ? 1 : 0);
          return (
            <span key={word} className="reveal-word" aria-hidden="true">
              {word.split('').map((ch, i) => (
                <motion.span
                  key={i}
                  className="reveal-letter"
                  initial={{ opacity: 0, y: 50, rotateX: -90, scale: 0.6 }}
                  animate={{ opacity: 1, y: 0, rotateX: 0, scale: 1 }}
                  transition={{ delay: (offset + i) * LETTER_DELAY, type: 'spring', stiffness: 220, damping: 14 }}
                >
                  {ch}
                </motion.span>
              ))}
            </span>
          );
        })}
      </h1>
      <AnimatePresence>
        {showName && (
          <motion.p
            className="reveal-name glow-text"
            initial={{ opacity: 0, scale: 0.6, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ type: 'spring', stiffness: 160, damping: 12 }}
            aria-live="polite"
          >
            HAPPY BIRTHDAY, {String(name || '').toUpperCase()}! 🎂
          </motion.p>
        )}
      </AnimatePresence>
      <AnimatePresence>
        {showNext && (
          <motion.button
            type="button"
            className="btn btn-primary btn-lg"
            onClick={onNext}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            whileTap={{ scale: 0.96 }}
          >
            {nextLabel}
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
}
