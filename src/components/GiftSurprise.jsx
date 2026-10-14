import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import GiftBox from './GiftBox.jsx';
import { MediaImage, MediaVideo } from './MediaImage.jsx';
import { useEffects } from '../context/EffectsContext.jsx';
import useSound from '../hooks/useSound.js';
import { useTimeouts } from '../hooks/useTimers.js';

const INTROS = ['Wait... there’s one more thing 👀', 'Okay... maybe one LAST surprise 😄'];

/** Stage 11 – "one more thing" → mysterious gift → reveal, up to two times. */
export default function GiftSurprise({ surprises, onNext }) {
  const { fire } = useEffects();
  const sound = useSound();
  const { schedule } = useTimeouts();
  const [index, setIndex] = useState(0);
  const [opened, setOpened] = useState(false);
  const unduckRef = useRef(sound.unduck);
  unduckRef.current = sound.unduck;
  useEffect(() => () => unduckRef.current(), []);

  const s = surprises[index];
  const isLast = index === surprises.length - 1;

  function open() {
    fire('sparkles', { count: 90 });
    fire('confetti', { count: 140 });
    schedule(() => setOpened(true), 900);
  }

  function next() {
    sound.unduck();
    if (isLast) onNext();
    else {
      setOpened(false);
      setIndex((i) => i + 1);
    }
  }

  if (!s) return null;

  return (
    <div className="stage-inner hidden-stage">
      <AnimatePresence mode="wait">
        <motion.div key={`${index}-${opened}`} className="hidden-inner" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
          <h2 className="hidden-intro">{INTROS[index] || INTROS[1]}</h2>
          {!opened ? (
            <GiftBox size="md" onOpen={open} label="OPEN 🎁" />
          ) : (
            <motion.div
              className="hidden-reveal glass"
              initial={{ scale: 0.6, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring', stiffness: 180, damping: 14 }}
              aria-live="polite"
            >
              {s.type === 'photo' && s.mediaId && (
                <div className="hidden-media">
                  <MediaImage mediaId={s.mediaId} alt={s.text || 'Surprise photo'} loading="eager" />
                </div>
              )}
              {s.type === 'video' && s.mediaId && (
                <div className="hidden-media">
                  <MediaVideo mediaId={s.mediaId} label={s.text || 'Surprise video'} onPlay={sound.duck} onPause={sound.unduck} />
                </div>
              )}
              {s.text && <p className={s.type === 'message' ? 'hidden-message' : 'hidden-caption'}>{s.text}</p>}
              <button type="button" className="btn btn-primary" onClick={next}>
                {isLast ? 'Continue →' : 'Wait, there’s more →'}
              </button>
            </motion.div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
