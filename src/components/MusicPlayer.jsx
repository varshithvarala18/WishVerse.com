import { useContext, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import useSound from '../hooks/useSound.js';
import { MusicTimeContext } from '../context/MusicContext.jsx';

const fmt = (s) => {
  if (!Number.isFinite(s) || s < 0) return '0:00';
  const m = Math.floor(s / 60);
  return `${m}:${String(Math.floor(s % 60)).padStart(2, '0')}`;
};

/** Floating, collapsible music pill. */
export default function MusicPlayer() {
  const sound = useSound();
  const { current, duration } = useContext(MusicTimeContext);
  const [expanded, setExpanded] = useState(false);
  const progress = duration ? (current / duration) * 100 : 0;
  const vol = sound.muted ? 0 : sound.volume;

  return (
    <motion.div
      className={`music-player glass${expanded ? ' expanded' : ''}`}
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      role="region"
      aria-label="Music player"
    >
      <button
        type="button"
        className="btn btn-icon mp-play"
        onClick={sound.toggle}
        aria-label={sound.playing ? 'Pause music' : 'Play music'}
      >
        {sound.playing ? '⏸' : '▶'}
      </button>

      <div className="mp-info">
        <span className={`mp-eq${sound.playing ? ' on' : ''}`} aria-hidden="true">
          <i />
          <i />
          <i />
        </span>
        <span className="mp-title" title={sound.label}>
          {sound.label}
        </span>
      </div>

      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            className="mp-extra"
            initial={{ opacity: 0, width: 0 }}
            animate={{ opacity: 1, width: 'auto' }}
            exit={{ opacity: 0, width: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div className="mp-seek">
              <span className="mp-time">{fmt(current)}</span>
              <input
                type="range"
                min={0}
                max={duration || 1}
                step={0.1}
                value={Math.min(current, duration || 1)}
                onChange={(e) => sound.seek(Number(e.target.value))}
                aria-label="Seek"
                style={{ '--fill': `${progress}%` }}
              />
              <span className="mp-time">{fmt(duration)}</span>
            </div>
            <div className="mp-volume">
              <button
                type="button"
                className="btn btn-icon btn-ghost"
                onClick={sound.toggleMute}
                aria-label={sound.muted ? 'Unmute' : 'Mute'}
                aria-pressed={sound.muted}
              >
                {sound.muted || sound.volume === 0 ? '🔇' : sound.volume < 0.5 ? '🔉' : '🔊'}
              </button>
              <input
                type="range"
                min={0}
                max={1}
                step={0.01}
                value={vol}
                onChange={(e) => sound.setVolume(Number(e.target.value))}
                aria-label="Volume"
                style={{ '--fill': `${vol * 100}%` }}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <button
        type="button"
        className="btn btn-icon btn-ghost mp-expand"
        onClick={() => setExpanded((e) => !e)}
        aria-expanded={expanded}
        aria-label={expanded ? 'Collapse music controls' : 'Expand music controls'}
      >
        {expanded ? '›' : '‹'}
      </button>
    </motion.div>
  );
}
