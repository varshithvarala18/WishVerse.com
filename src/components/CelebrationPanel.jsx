import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useEffects } from '../context/EffectsContext.jsx';
import useSound from '../hooks/useSound.js';
import { useTimeouts } from '../hooks/useTimers.js';
import { WISH_LINES, pick } from '../utils/animations.js';

/** Stage 8 – a playground of celebration buttons + the CELEBRATE EVERYTHING finale. */
export default function CelebrationPanel({ name, celebrations = {}, hasCake, hasMemories, onCake, onMemories, onNext }) {
  const { fire, flashScreen } = useEffects();
  const sound = useSound();
  const { schedule } = useTimeouts();
  const [count, setCount] = useState(null);
  const [running, setRunning] = useState(false);
  const [finale, setFinale] = useState(false);
  const [cakePop, setCakePop] = useState(false);
  const [wish, setWish] = useState(null);
  const [lastPressed, setLastPressed] = useState(null);
  const [celebratedOnce, setCelebratedOnce] = useState(false);
  const on = (k) => celebrations[k] !== false;
  const upperName = String(name || '').toUpperCase();

  const buttons = [
    { id: 'confetti', icon: '🎉', label: 'Celebrate', show: on('confetti'), run: () => fire('confetti', { count: 220, intensity: 1.2 }) },
    { id: 'balloons', icon: '🎈', label: 'Balloons', show: on('balloons'), run: () => fire('balloons', { count: 14 }) },
    { id: 'crackers', icon: '🧨', label: 'Crackers', show: on('crackers'), run: () => { fire('crackers'); flashScreen(); } },
    { id: 'sparkles', icon: '✨', label: 'Magic', show: on('sparkles'), run: () => fire('sparkles', { count: 140 }) },
    { id: 'hearts', icon: '❤️', label: 'Love', show: on('hearts'), run: () => fire('hearts', { count: 26 }) },
    { id: 'cake', icon: '🎂', label: 'Cake', show: hasCake, run: onCake },
    {
      id: 'gift',
      icon: '🎁',
      label: 'Gift',
      show: on('gift'),
      run: () => {
        setWish({ text: pick(WISH_LINES), key: Date.now() });
        fire('sparkles', { count: 40 });
      },
    },
    { id: 'fireworks', icon: '🎆', label: 'Fireworks', show: on('fireworks'), run: () => fire('fireworks', { rockets: 8 }) },
    { id: 'memories', icon: '📸', label: 'Memories', show: hasMemories, run: onMemories },
  ].filter((b) => b.show);

  function press(b) {
    setLastPressed({ id: b.id, key: Date.now() });
    b.run();
  }

  function celebrateEverything() {
    if (running) return;
    setWish(null);
    setRunning(true);
    setFinale(false);
    setCakePop(false);
    setCount(3);
    schedule(() => setCount(2), 1000);
    schedule(() => setCount(1), 2000);
    schedule(() => {
      setCount(null);
      flashScreen();
    }, 3000);
    schedule(() => fire('confetti', { count: 260, intensity: 1.35 }), 3150);
    schedule(() => fire('balloons', { count: 15 }), 3600);
    schedule(() => fire('hearts', { count: 26 }), 4000);
    schedule(() => fire('sparkles', { count: 150 }), 4400);
    schedule(() => fire('crackers', { rockets: 10 }), 4800);
    schedule(() => fire('fireworks', { rockets: 12, duration: 4500 }), 5300);
    schedule(() => setCakePop(on('cake')), 5900);
    schedule(() => sound.swell(9000), 6100);
    schedule(() => {
      setFinale(true);
      fire('confetti', { direction: 'left', count: 120, intensity: 1.2 });
      fire('confetti', { direction: 'right', count: 120, intensity: 1.2 });
    }, 6400);
    schedule(() => fire('fireworks', { rockets: 8, duration: 3000 }), 8200);
    schedule(() => {
      setRunning(false);
      setCelebratedOnce(true);
    }, 9500);
  }

  return (
    <div className="stage-inner celebrate">
      <motion.h2 className="celebrate-title glow-text" initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: 'spring', stiffness: 160, damping: 12 }}>
        LET&apos;S CELEBRATE! 🎉
      </motion.h2>
      <p className="muted">Tap anything. Tap everything. It&apos;s your day!</p>

      <div className="celebrate-grid">
        {buttons.map((b, i) => (
          <motion.button
            key={b.id}
            type="button"
            className={`celebrate-btn glass cb-${b.id}`}
            onClick={() => press(b)}
            disabled={running}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 * i }}
            whileHover={{ y: -4, scale: 1.04 }}
            whileTap={{ scale: 0.92 }}
          >
            <motion.span
              key={lastPressed?.id === b.id ? lastPressed.key : 'idle'}
              className="cb-icon"
              aria-hidden="true"
              animate={lastPressed?.id === b.id ? ANIMS[b.id] || ANIMS.default : {}}
              transition={{ duration: 0.7 }}
            >
              {b.icon}
            </motion.span>
            <span className="cb-label">{b.label}</span>
          </motion.button>
        ))}
      </div>

      <motion.button
        type="button"
        className="btn btn-primary btn-xl celebrate-all glow-pulse"
        onClick={celebrateEverything}
        disabled={running}
        whileHover={{ scale: 1.03 }}
        whileTap={{ scale: 0.96 }}
      >
        🔥 CELEBRATE EVERYTHING 🔥
      </motion.button>

      <button type="button" className={`btn ${celebratedOnce ? 'btn-primary' : 'btn-ghost'} celebrate-next`} onClick={onNext} disabled={running}>
        Continue →
      </button>

      {/* Mini gift wish */}
      <AnimatePresence>
        {wish && (
          <motion.div
            key={wish.key}
            className="wish-pop glass"
            role="status"
            initial={{ opacity: 0, scale: 0.5, y: 40 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ type: 'spring', stiffness: 220, damping: 16 }}
          >
            <motion.span className="wish-gift" aria-hidden="true" initial={{ rotate: -20, scale: 0.6 }} animate={{ rotate: [0, -12, 12, 0], scale: 1 }} transition={{ duration: 0.7 }}>
              🎁✨
            </motion.span>
            <p>{wish.text}</p>
            <button type="button" className="btn btn-sm btn-ghost" onClick={() => setWish(null)}>
              Close
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 3-2-1 countdown + finale overlay */}
      <AnimatePresence>
        {(count !== null || finale) && (
          <motion.div className="finale-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} aria-live="assertive">
            <AnimatePresence mode="popLayout">
              {count !== null && (
                <motion.span
                  key={count}
                  className="finale-count"
                  initial={{ scale: 2.4, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.4, opacity: 0 }}
                  transition={{ duration: 0.5 }}
                >
                  {count}
                </motion.span>
              )}
            </AnimatePresence>
            {cakePop && (
              <motion.div className="finale-cake" aria-hidden="true" initial={{ scale: 0, rotate: -30 }} animate={{ scale: 1, rotate: 0 }} transition={{ type: 'spring', stiffness: 200, damping: 10 }}>
                🎂
              </motion.div>
            )}
            {finale && (
              <motion.div className="finale-text" initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: 'spring', stiffness: 140, damping: 11 }}>
                <p className="finale-big glow-text">HAPPY BIRTHDAY {upperName}! 🎂🎉❤️</p>
                {!running && (
                  <button type="button" className="btn btn-primary btn-lg" onClick={() => setFinale(false)}>
                    Back to the party
                  </button>
                )}
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

const ANIMS = {
  confetti: { scale: [1, 1.6, 1], rotate: [0, -20, 20, 0] },
  balloons: { y: [0, -26, 0] },
  crackers: { x: [0, -5, 5, -5, 5, 0], scale: [1, 1.3, 1] },
  sparkles: { rotate: [0, 180, 360], scale: [1, 1.4, 1] },
  hearts: { scale: [1, 1.5, 0.9, 1.3, 1] },
  gift: { rotate: [0, -15, 15, -10, 0], y: [0, -10, 0] },
  fireworks: { scale: [1, 1.7, 1], opacity: [1, 0.6, 1] },
  default: { scale: [1, 1.3, 1] },
};
