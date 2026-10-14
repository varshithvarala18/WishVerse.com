import { motion } from 'framer-motion';
import StarsBackground from './StarsBackground.jsx';
import { useEffects } from '../context/EffectsContext.jsx';
import { useTimeline } from '../hooks/useTimers.js';

/** Stage 12 – the grand finale with replay. */
export default function FinalCelebration({ name, senderName, showStars = true, onReplay, onHome, homeLabel = 'Back to home' }) {
  const { fire, flashScreen } = useEffects();
  const upper = String(name || '').toUpperCase();

  useTimeline([
    [200, () => {
      flashScreen();
      fire('confetti', { count: 240, intensity: 1.3 });
    }],
    [700, () => fire('fireworks', { rockets: 10, duration: 4000 })],
    [1200, () => fire('balloons', { count: 14 })],
    [1700, () => fire('hearts', { count: 22 })],
    [2300, () => fire('sparkles', { count: 120 })],
    [3200, () => fire('crackers', { rockets: 8 })],
    [4200, () => {
      fire('confetti', { direction: 'left', count: 110 });
      fire('confetti', { direction: 'right', count: 110 });
    }],
    [6500, () => fire('fireworks', { rockets: 8, duration: 3500 })],
    [9000, () => fire('confetti', { direction: 'rain', count: 160, duration: 5000 })],
  ]);

  return (
    <div className="stage-inner final-stage">
      <div className="intro-dark subtle" aria-hidden="true">
        {showStars && <StarsBackground density={0.8} />}
      </div>
      <motion.h1
        className="final-title glow-text"
        initial={{ scale: 0.4, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 120, damping: 10, delay: 0.3 }}
      >
        HAPPY BIRTHDAY {upper} ❤️🎂🎉
      </motion.h1>
      <motion.p className="final-sub" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.4 }}>
        Made with love{senderName ? ` by ${senderName}` : ''}. Here&apos;s to your best year yet ✨
      </motion.p>
      <motion.div className="btn-row center" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 2 }}>
        <button type="button" className="btn btn-primary btn-lg" onClick={onReplay}>
          ↺ Replay from the start
        </button>
        <button type="button" className="btn btn-ghost btn-lg" onClick={onHome}>
          {homeLabel}
        </button>
      </motion.div>
    </div>
  );
}
