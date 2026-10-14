import { motion } from 'framer-motion';
import { THEMES } from '../../utils/themes.js';

export default function StepTheme({ draft, update, errors }) {
  function onKeyDown(e, i) {
    const dirs = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 };
    if (!(e.key in dirs)) return;
    e.preventDefault();
    const next = THEMES[(i + dirs[e.key] + THEMES.length) % THEMES.length];
    update({ theme: next.id });
    document.getElementById(`theme-${next.id}`)?.focus();
  }

  return (
    <div className="step-body">
      <h2>Choose the vibe 🎨</h2>
      <p className="muted step-lead">The theme sets colors, fonts and particle effects for the whole surprise. Watch the preview change instantly.</p>
      <div className="theme-grid" role="radiogroup" aria-label="Theme">
        {THEMES.map((t, i) => {
          const selected = draft.theme === t.id;
          return (
            <motion.button
              key={t.id}
              id={`theme-${t.id}`}
              type="button"
              role="radio"
              aria-checked={selected}
              tabIndex={selected ? 0 : -1}
              data-theme={t.id}
              className={`theme-card${selected ? ' selected' : ''}`}
              onClick={() => update({ theme: t.id })}
              onKeyDown={(e) => onKeyDown(e, i)}
              whileHover={{ y: -4 }}
              whileTap={{ scale: 0.97 }}
            >
              <span className="theme-swatch" aria-hidden="true">
                {t.particles.slice(0, 4).map((c) => (
                  <i key={c} style={{ background: c }} />
                ))}
              </span>
              <span className="theme-emoji" aria-hidden="true">
                {t.emoji}
              </span>
              <span className="theme-name">{t.name}</span>
              <span className="theme-desc">{t.description}</span>
              {selected && (
                <span className="theme-check" aria-hidden="true">
                  ✓
                </span>
              )}
            </motion.button>
          );
        })}
      </div>
      {errors.theme && <p className="field-error">{errors.theme}</p>}
    </div>
  );
}
