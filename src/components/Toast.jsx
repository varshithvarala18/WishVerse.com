import { AnimatePresence, motion } from 'framer-motion';

const ICONS = { success: '✓', error: '!', info: 'i' };

/** Stackable, auto-dismissing toasts announced to screen readers. */
export default function Toast({ toasts, onDismiss }) {
  return (
    <div className="toast-region" aria-live="polite" aria-relevant="additions">
      <AnimatePresence initial={false}>
        {toasts.map((t) => (
          <motion.div
            key={t.id}
            layout
            className={`toast toast-${t.type}`}
            role={t.type === 'error' ? 'alert' : 'status'}
            initial={{ opacity: 0, y: -24, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -12, scale: 0.95, transition: { duration: 0.2 } }}
          >
            <span className="toast-icon" aria-hidden="true">
              {ICONS[t.type] || 'i'}
            </span>
            <span className="toast-msg">{t.message}</span>
            <button type="button" className="toast-close" onClick={() => onDismiss(t.id)} aria-label="Dismiss notification">
              ×
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
