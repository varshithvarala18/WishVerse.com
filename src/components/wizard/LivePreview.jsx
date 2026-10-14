import { memo } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { MediaImage } from '../MediaImage.jsx';
import { getTheme } from '../../utils/themes.js';
import { formatDate } from '../../utils/animations.js';

/** Theme-aware mini card that mirrors the draft while you type. */
function LivePreview({ draft, stepId }) {
  const theme = getTheme(draft.theme);
  const name = draft.name.trim() || 'Someone special';
  const thumbs = [...draft.photos, ...draft.memories.filter((m) => m.mediaId)].slice(0, 4);
  const showLetter = stepId === 'message' || (!thumbs.length && draft.message.trim());

  return (
    <aside className="live-preview" data-theme={theme.id} aria-label="Live preview">
      <div className="lp-bg" aria-hidden="true">
        {theme.particles.slice(0, 5).map((c, i) => (
          <span key={c} className="lp-orb" style={{ background: c, left: `${10 + i * 19}%`, animationDelay: `${i * 0.7}s` }} />
        ))}
      </div>
      <div className="lp-content">
        <span className="lp-tag">
          Live preview · {theme.emoji} {theme.name}
        </span>
        <AnimatePresence mode="wait">
          <motion.h3 key={name} className="lp-title" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}>
            Happy Birthday, {name}! 🎂
          </motion.h3>
        </AnimatePresence>
        {draft.birthdayDate && <p className="lp-date">🎈 {formatDate(draft.birthdayDate, { day: 'numeric', month: 'long' })}</p>}

        {showLetter ? (
          <div className="lp-letter">
            <p className="lp-letter-text">{draft.message.trim() || 'Your heartfelt message will appear here…'}</p>
            {draft.senderName.trim() && <p className="lp-sign">— {draft.senderName.trim()}</p>}
          </div>
        ) : thumbs.length ? (
          <div className="lp-photos">
            {thumbs.map((p, i) => (
              <div key={`${p.mediaId}-${i}`} className="lp-photo" style={{ rotate: `${(i - 1.5) * 4}deg` }}>
                <MediaImage mediaId={p.mediaId} thumb alt="" />
              </div>
            ))}
          </div>
        ) : (
          <div className="lp-gift" aria-hidden="true">
            🎁
          </div>
        )}

        <div className="lp-stats">
          <span>📸 {draft.photos.length}</span>
          <span>🧡 {draft.memories.length}</span>
          <span>🎬 {draft.videos.length}</span>
          <span>{draft.music ? '🎧 Song' : '🎹 Melody'}</span>
        </div>
        <span className="lp-btn" aria-hidden="true">
          OPEN YOUR SURPRISE 🎁
        </span>
      </div>
    </aside>
  );
}

export default memo(LivePreview);
