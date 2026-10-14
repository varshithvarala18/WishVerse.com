import { motion, AnimatePresence } from 'framer-motion';
import useCountdown from '../hooks/useCountdown.js';
import StarsBackground from './StarsBackground.jsx';
import { formatDate } from '../utils/animations.js';

const pad = (n) => String(n).padStart(2, '0');

/** Stage 0 – the surprise stays locked until the birthday arrives. */
export default function Countdown({ birthdayDate, name, onEnter, showStars = true }) {
  const c = useCountdown(birthdayDate);
  const ready = c.state !== 'locked';
  const units = [
    { label: 'Days', value: c.days },
    { label: 'Hours', value: c.hours },
    { label: 'Minutes', value: c.minutes },
    { label: 'Seconds', value: c.seconds },
  ];

  return (
    <div className="stage-inner countdown">
      <div className="intro-dark" aria-hidden="true">
        {showStars && <StarsBackground />}
        <div className="intro-glow" />
      </div>
      <div className="countdown-content">
        <AnimatePresence mode="wait">
          {!ready ? (
            <motion.div key="locked" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, scale: 0.95 }}>
              <p className="eyebrow">A surprise for {name || 'you'} 🔒</p>
              <h1 className="countdown-title">YOUR SURPRISE UNLOCKS IN...</h1>
              <div className="countdown-grid" role="timer" aria-live="off">
                {units.map((u) => (
                  <div key={u.label} className="cd-unit glass">
                    <span className="cd-value">
                      <AnimatePresence mode="popLayout" initial={false}>
                        <motion.span
                          key={u.value}
                          initial={{ y: -18, opacity: 0 }}
                          animate={{ y: 0, opacity: 1 }}
                          exit={{ y: 18, opacity: 0 }}
                          transition={{ duration: 0.3 }}
                        >
                          {pad(u.value)}
                        </motion.span>
                      </AnimatePresence>
                    </span>
                    <span className="cd-label">{u.label}</span>
                  </div>
                ))}
              </div>
              <p className="sr-only">
                {c.days} days, {c.hours} hours and {c.minutes} minutes to go.
              </p>
              {c.target && (
                <p className="muted countdown-date">
                  Come back on {formatDate(c.target.toISOString(), { day: 'numeric', month: 'long' })} 🎂
                </p>
              )}
              <button type="button" className="link-btn" onClick={onEnter}>
                Creator? Open anyway
              </button>
            </motion.div>
          ) : (
            <motion.div
              key="ready"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ type: 'spring', stiffness: 160, damping: 16 }}
              aria-live="polite"
            >
              <h1 className="countdown-title glow-text">TODAY IS YOUR SPECIAL DAY! 🎂</h1>
              <button type="button" className="btn btn-primary btn-xl glow-pulse" onClick={onEnter} autoFocus>
                Enter ✨
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
