import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useTimeouts } from '../hooks/useTimers.js';
import useReducedMotion from '../hooks/useReducedMotion.js';
import { useEffects } from '../context/EffectsContext.jsx';

const TYPE_MS = 35;

/** Stage 6 – envelope opens, the paper slides up, the message types itself out. */
export default function BirthdayLetter({ message, senderName, name, onNext }) {
  const reduced = useReducedMotion();
  const { fire } = useEffects();
  const { schedule } = useTimeouts();
  const [phase, setPhase] = useState('closed'); // closed -> opening -> letter
  const [count, setCount] = useState(0);
  const text = message || '';
  const done = count >= text.length;

  function open() {
    setPhase('opening');
    fire('sparkles', { count: 40 });
    schedule(() => setPhase('letter'), reduced ? 200 : 1300);
  }

  useEffect(() => {
    if (phase !== 'letter' || done) return undefined;
    if (reduced) {
      setCount(text.length);
      return undefined;
    }
    const id = setInterval(() => {
      setCount((c) => {
        if (c >= text.length) {
          clearInterval(id);
          return c;
        }
        return c + 1;
      });
    }, TYPE_MS);
    return () => clearInterval(id);
  }, [phase, done, reduced, text.length]);

  useEffect(() => {
    if (phase === 'letter' && done) fire('hearts', { count: 12 });
  }, [phase, done, fire]);

  return (
    <div className="stage-inner letter-stage">
      <AnimatePresence mode="wait">
        {phase !== 'letter' ? (
          <motion.div key="envelope" className="envelope-wrap" exit={{ opacity: 0, y: -40, transition: { duration: 0.4 } }}>
            <p className="letter-intro">Someone wrote something special for you…</p>
            <div className={`envelope${phase === 'opening' ? ' open' : ''}`} aria-hidden="true">
              <div className="envelope-back" />
              <motion.div
                className="envelope-paper"
                animate={phase === 'opening' ? { y: -90 } : { y: 0 }}
                transition={{ delay: 0.45, duration: 0.8, ease: 'easeOut' }}
              >
                <span>Dear {name}…</span>
              </motion.div>
              <div className="envelope-front" />
              <motion.div
                className="envelope-flap"
                animate={phase === 'opening' ? { rotateX: 180 } : { rotateX: 0 }}
                transition={{ duration: 0.55, ease: 'easeInOut' }}
              />
              <div className="envelope-seal">💌</div>
            </div>
            <button type="button" className="btn btn-primary btn-xl" onClick={open} disabled={phase !== 'closed'} autoFocus>
              OPEN LETTER 💌
            </button>
          </motion.div>
        ) : (
          <motion.div
            key="letter"
            className="letter-paper"
            initial={{ opacity: 0, y: 80, scale: 0.92 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          >
            <p className="letter-greeting">Dear {name},</p>
            <div className="sr-only" aria-live="polite">
              {text}
              {senderName ? ` — ${senderName}` : ''}
            </div>
            <div className="letter-text" aria-hidden="true">
              {text.slice(0, count)}
              {!done && <span className="caret" />}
            </div>
            {done && senderName && (
              <motion.p className="letter-sign" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} aria-hidden="true">
                — {senderName}
              </motion.p>
            )}
            <div className="btn-row center letter-actions">
              {!done ? (
                <button type="button" className="btn btn-ghost btn-sm" onClick={() => setCount(text.length)}>
                  Skip typing ⏩
                </button>
              ) : (
                <button type="button" className="btn btn-primary" onClick={onNext}>
                  Continue →
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
