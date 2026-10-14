import { useId, useState } from 'react';
import { AnimatePresence, motion, useAnimationControls } from 'framer-motion';
import { MediaImage } from './MediaImage.jsx';
import { useEffects } from '../context/EffectsContext.jsx';

const normalize = (s) => String(s || '').trim().toLowerCase();

/** Stage 10b – a memory protected by a secret word. */
export default function MemoryLock({ lock, onNext }) {
  const { fire } = useEffects();
  const inputId = useId();
  const controls = useAnimationControls();
  const [value, setValue] = useState('');
  const [tries, setTries] = useState(0);
  const [error, setError] = useState('');
  const [unlocked, setUnlocked] = useState(false);

  function submit(e) {
    e.preventDefault();
    if (!value.trim()) {
      setError('Type the secret word first 🙂');
      return;
    }
    if (normalize(value) === normalize(lock.secretWord)) {
      setUnlocked(true);
      setError('');
      fire('sparkles', { count: 120 });
      fire('hearts', { count: 18 });
    } else {
      setTries((t) => t + 1);
      setError('Not quite… try again 😄');
      controls.start({ x: [0, -12, 12, -8, 8, 0], transition: { duration: 0.45 } });
    }
  }

  return (
    <div className="stage-inner lock-stage">
      <AnimatePresence mode="wait">
        {!unlocked ? (
          <motion.div key="locked" className="lock-card glass" exit={{ opacity: 0, scale: 0.9 }} animate={controls}>
            <motion.div className="lock-icon" aria-hidden="true" animate={{ rotate: [0, -6, 6, 0] }} transition={{ repeat: Infinity, duration: 2.4 }}>
              🔐
            </motion.div>
            <h2>This memory is locked.</h2>
            <p className="muted">Enter the secret word to unlock it.</p>
            <form onSubmit={submit} className="lock-form" noValidate>
              <label htmlFor={inputId} className="sr-only">
                Secret word
              </label>
              <input
                id={inputId}
                className="input"
                type="text"
                autoComplete="off"
                autoCapitalize="off"
                spellCheck={false}
                placeholder="Secret word…"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                aria-invalid={!!error}
                aria-describedby={`${inputId}-msg`}
              />
              <button type="submit" className="btn btn-primary">
                Unlock 🔓
              </button>
            </form>
            <div id={`${inputId}-msg`} aria-live="polite">
              {error && <p className="field-error">{error}</p>}
              {tries >= 2 && lock.hint && <p className="lock-hint">💡 Hint: {lock.hint}</p>}
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="open"
            className="lock-card glass unlocked"
            initial={{ opacity: 0, scale: 0.8, rotateY: 90 }}
            animate={{ opacity: 1, scale: 1, rotateY: 0 }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            aria-live="polite"
          >
            <p className="lock-unlocked glow-text">Memory unlocked! ❤️</p>
            {lock.mediaId && (
              <div className="lock-photo">
                <MediaImage mediaId={lock.mediaId} alt="The secret memory" loading="eager" />
              </div>
            )}
            {lock.text && <p className="lock-text">{lock.text}</p>}
            <button type="button" className="btn btn-primary" onClick={onNext}>
              Continue →
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
