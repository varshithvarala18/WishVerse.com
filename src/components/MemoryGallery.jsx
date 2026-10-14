import { useCallback, useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { MediaImage, MediaVideo } from './MediaImage.jsx';
import useSound from '../hooks/useSound.js';
import useReducedMotion from '../hooks/useReducedMotion.js';
import { formatDate } from '../utils/animations.js';

const AUTOPLAY_MS = 5000;

// Cycle through three transition styles: flip, zoom, slide.
const TRANSITIONS = [
  {
    enter: (d) => ({ rotateY: d * 75, opacity: 0, scale: 0.9 }),
    center: { rotateY: 0, x: 0, opacity: 1, scale: 1 },
    exit: (d) => ({ rotateY: -d * 75, opacity: 0, scale: 0.9 }),
  },
  {
    enter: () => ({ scale: 0.6, opacity: 0, rotate: -6 }),
    center: { scale: 1, opacity: 1, rotate: 0, x: 0 },
    exit: () => ({ scale: 1.25, opacity: 0, rotate: 4 }),
  },
  {
    enter: (d) => ({ x: d * 320, opacity: 0, rotate: d * 8 }),
    center: { x: 0, opacity: 1, rotate: 0 },
    exit: (d) => ({ x: -d * 320, opacity: 0, rotate: -d * 8 }),
  },
];
const FADE = { enter: { opacity: 0 }, center: { opacity: 1 }, exit: { opacity: 0 } };

function FilmThumb({ item, active, index, onSelect }) {
  return (
    <button
      type="button"
      className={`film-thumb${active ? ' active' : ''}`}
      onClick={() => onSelect(index)}
      aria-label={`Go to memory ${index + 1}: ${item.caption || (item.kind === 'video' ? 'video' : 'photo')}`}
      aria-current={active ? 'true' : undefined}
    >
      {item.kind === 'video' ? (
        <span className="film-video" aria-hidden="true">
          🎬
        </span>
      ) : (
        <MediaImage mediaId={item.mediaId} thumb alt="" />
      )}
    </button>
  );
}

/** Stage 4 – 3D Polaroid memories with film strip, swipe, keys and auto-play. */
export default function MemoryGallery({ items, onNext, continueLabel = 'Continue →' }) {
  const sound = useSound();
  const reduced = useReducedMotion();
  const [index, setIndex] = useState(0);
  const [dir, setDir] = useState(1);
  const [auto, setAuto] = useState(false);
  const item = items[index];
  const isLast = index === items.length - 1;
  const variants = reduced ? FADE : TRANSITIONS[index % TRANSITIONS.length];

  const go = useCallback(
    (delta) => {
      setIndex((i) => {
        const next = Math.max(0, Math.min(items.length - 1, i + delta));
        if (next !== i) setDir(delta > 0 ? 1 : -1);
        return next;
      });
    },
    [items.length]
  );

  const select = useCallback((i) => {
    setIndex((cur) => {
      setDir(i >= cur ? 1 : -1);
      return i;
    });
  }, []);

  useEffect(() => {
    function onKey(e) {
      const tag = (e.target.tagName || '').toLowerCase();
      if (tag === 'input' || tag === 'textarea' || tag === 'video') return;
      if (e.key === 'ArrowRight') go(1);
      if (e.key === 'ArrowLeft') go(-1);
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [go]);

  useEffect(() => {
    if (!auto) return undefined;
    if (isLast) {
      setAuto(false);
      return undefined;
    }
    if (item?.kind === 'video') return undefined;
    const t = setTimeout(() => go(1), AUTOPLAY_MS);
    return () => clearTimeout(t);
  }, [auto, index, isLast, item, go]);

  // Make sure music comes back if we leave while a video plays.
  const unduckRef = useRef(sound.unduck);
  unduckRef.current = sound.unduck;
  useEffect(() => () => unduckRef.current(), []);

  if (!item) return null;

  return (
    <div className="stage-inner memories">
      <header className="stage-head">
        <p className="eyebrow">Our memories</p>
        <p className="memory-counter" aria-live="polite">
          Memory {index + 1} of {items.length}
        </p>
      </header>

      <div className="polaroid-stage">
        <AnimatePresence mode="wait" custom={dir} initial={false}>
          <motion.article
            key={item.key}
            className={`polaroid${item.kind === 'video' ? ' polaroid-video' : ''}`}
            custom={dir}
            variants={variants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: reduced ? 0.2 : 0.55, ease: [0.22, 1, 0.36, 1] }}
            drag={item.kind === 'video' ? false : 'x'}
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.5}
            onDragEnd={(_, info) => {
              if (info.offset.x < -60 || info.velocity.x < -400) go(1);
              else if (info.offset.x > 60 || info.velocity.x > 400) go(-1);
            }}
            style={{ rotate: index % 2 ? 1.5 : -1.5 }}
          >
            <div className="polaroid-photo">
              {item.kind === 'video' ? (
                <MediaVideo mediaId={item.mediaId} label={item.caption || 'Birthday video'} onPlay={sound.duck} onPause={sound.unduck} />
              ) : (
                <MediaImage mediaId={item.mediaId} alt={item.caption || `Memory ${index + 1}`} loading="eager" />
              )}
            </div>
            <div className="polaroid-caption">
              {item.caption && <h2>{item.caption}</h2>}
              {item.date && <time dateTime={item.date}>{formatDate(item.date, { day: 'numeric', month: 'long', year: 'numeric' })}</time>}
              {item.description && <p>{item.description}</p>}
            </div>
          </motion.article>
        </AnimatePresence>
      </div>

      <div className="memory-controls">
        <button type="button" className="btn btn-ghost" onClick={() => go(-1)} disabled={index === 0}>
          ← Previous
        </button>
        <button
          type="button"
          className={`btn btn-icon btn-ghost${auto ? ' is-on' : ''}`}
          onClick={() => setAuto((a) => !a)}
          aria-pressed={auto}
          aria-label={auto ? 'Stop auto-play' : 'Auto-play memories'}
          title={auto ? 'Stop auto-play' : 'Auto-play (5s each)'}
        >
          {auto ? '⏸' : '▶'}
        </button>
        {isLast ? (
          <button type="button" className="btn btn-primary" onClick={onNext}>
            {continueLabel}
          </button>
        ) : (
          <button type="button" className="btn btn-primary" onClick={() => go(1)}>
            NEXT MEMORY →
          </button>
        )}
      </div>

      {items.length > 1 && (
        <nav className="film-strip" aria-label="Memory film strip">
          {items.map((it, i) => (
            <FilmThumb key={it.key} item={it} index={i} active={i === index} onSelect={select} />
          ))}
        </nav>
      )}
      <p className="swipe-hint muted" aria-hidden="true">
        Swipe or use ← → keys
      </p>
    </div>
  );
}
