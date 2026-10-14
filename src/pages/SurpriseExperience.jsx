import { useCallback, useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { MusicProvider } from '../context/MusicContext.jsx';
import { useEffects } from '../context/EffectsContext.jsx';
import useSound from '../hooks/useSound.js';
import { useTimeouts } from '../hooks/useTimers.js';
import { getBirthdayStatus } from '../hooks/useCountdown.js';
import { applyRootTheme } from '../utils/themes.js';
import { stageVariants } from '../utils/animations.js';
import Countdown from '../components/Countdown.jsx';
import MysteryIntro from '../components/MysteryIntro.jsx';
import GiftBox from '../components/GiftBox.jsx';
import BirthdayReveal from '../components/BirthdayReveal.jsx';
import MemoryGallery from '../components/MemoryGallery.jsx';
import PhotoMosaic from '../components/PhotoMosaic.jsx';
import BirthdayLetter from '../components/BirthdayLetter.jsx';
import FriendshipMeter from '../components/FriendshipMeter.jsx';
import CelebrationPanel from '../components/CelebrationPanel.jsx';
import BirthdayCake from '../components/BirthdayCake.jsx';
import BirthdayQuiz from '../components/BirthdayQuiz.jsx';
import MemoryLock from '../components/MemoryLock.jsx';
import GiftSurprise from '../components/GiftSurprise.jsx';
import FinalCelebration from '../components/FinalCelebration.jsx';
import MusicPlayer from '../components/MusicPlayer.jsx';
import StarsBackground from '../components/StarsBackground.jsx';
import '../styles/Experience.css';

/** Memories stage items: memories, then loose photos not already used, then videos. */
function buildMemoryItems(data) {
  const items = [];
  const used = new Set();
  (data.memories || []).forEach((m, i) => {
    if (m.mediaId) used.add(m.mediaId);
    items.push({ key: `mem-${m.id || i}`, kind: 'photo', mediaId: m.mediaId, caption: m.caption, date: m.date, description: m.description });
  });
  (data.photos || []).forEach((p, i) => {
    if (used.has(p.mediaId)) return;
    used.add(p.mediaId);
    items.push({ key: `photo-${p.mediaId}-${i}`, kind: 'photo', mediaId: p.mediaId, caption: p.caption });
  });
  (data.videos || []).forEach((v, i) => {
    items.push({ key: `video-${v.mediaId}-${i}`, kind: 'video', mediaId: v.mediaId, caption: v.caption });
  });
  return items;
}

/** Unique photos for the mosaic. */
function buildMosaic(data) {
  const seen = new Set();
  const out = [];
  [...(data.photos || []), ...(data.memories || [])].forEach((p) => {
    if (p.mediaId && !seen.has(p.mediaId)) {
      seen.add(p.mediaId);
      out.push({ mediaId: p.mediaId, caption: p.caption });
    }
  });
  return out;
}

function quizReady(q) {
  return q?.enabled && q.question?.trim() && q.options?.every((o) => o?.trim());
}

function lockReady(l) {
  return l?.enabled && l.secretWord?.trim() && (l.text?.trim() || l.mediaId);
}

const STAGE_NAMES = {
  countdown: 'Countdown',
  intro: 'Intro',
  gift: 'Gift box',
  reveal: 'Birthday reveal',
  memories: 'Memories',
  mosaic: 'Mosaic',
  letter: 'Letter',
  meter: 'Friendship meter',
  celebrate: 'Celebration',
  cake: 'Cake',
  quiz: 'Quiz',
  lock: 'Memory lock',
  hidden: 'Hidden surprises',
  final: 'Finale',
};

function GiftStage({ name, onOpened }) {
  const { fire } = useEffects();
  const sound = useSound();
  const { schedule } = useTimeouts();

  function open() {
    sound.play(); // the click is the user gesture that unlocks audio
    fire('confetti', { count: 200, intensity: 1.2 });
    fire('sparkles', { count: 100 });
    schedule(onOpened, 1900);
  }

  return (
    <div className="stage-inner gift-stage">
      <p className="eyebrow">For {name}</p>
      <h2 className="gift-title">A gift is waiting for you…</h2>
      <GiftBox onOpen={open} label="OPEN 🎁" hint="Turn your sound on 🔊" />
    </div>
  );
}

function Experience({ data, mode, topBar }) {
  const navigate = useNavigate();
  const effects = useEffects();
  const sound = useSound();
  const cel = data.celebrations || {};
  const ex = data.extras || {};
  const showStars = cel.stars !== false;

  // Theme + allowed effects for the whole experience.
  useEffect(() => applyRootTheme(data.theme), [data.theme]);
  useEffect(() => {
    effects.setEnabled(cel);
    return () => effects.setEnabled(null);
  }, [cel, effects]);

  const [gated] = useState(() => mode === 'live' && getBirthdayStatus(data.birthdayDate).state === 'locked');
  const memoryItems = useMemo(() => buildMemoryItems(data), [data]);
  const mosaic = useMemo(() => buildMosaic(data), [data]);
  const hidden = useMemo(
    () =>
      (ex.hiddenSurprises || []).filter((h) => (h.type === 'message' ? h.text?.trim() : h.mediaId)).slice(0, 2),
    [ex.hiddenSurprises]
  );

  const stages = useMemo(() => {
    const s = [];
    if (gated) s.push('countdown');
    s.push('intro', 'gift', 'reveal');
    if (memoryItems.length) s.push('memories');
    if (mosaic.length >= 2) s.push('mosaic');
    if (data.message?.trim()) s.push('letter');
    if (ex.friendshipMeter?.enabled) s.push('meter');
    s.push('celebrate');
    if (cel.cake !== false) s.push('cake');
    if (quizReady(ex.quiz)) s.push('quiz');
    if (lockReady(ex.memoryLock)) s.push('lock');
    if (hidden.length) s.push('hidden');
    s.push('final');
    return s;
  }, [gated, memoryItems.length, mosaic.length, data.message, ex.friendshipMeter, ex.quiz, ex.memoryLock, cel.cake, hidden.length]);

  const [index, setIndex] = useState(0);
  const [returnTo, setReturnTo] = useState(null);
  const [run, setRun] = useState(0); // bumps on replay so stages remount
  const stage = stages[index];
  const giftIndex = stages.indexOf('gift');
  const started = index > giftIndex;

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'auto' });
  }, [index]);

  const next = useCallback(() => {
    if (returnTo !== null) {
      setIndex(returnTo);
      setReturnTo(null);
      return;
    }
    setIndex((i) => Math.min(i + 1, stages.length - 1));
  }, [returnTo, stages.length]);

  const goTo = useCallback(
    (name) => {
      const i = stages.indexOf(name);
      if (i >= 0) setIndex(i);
    },
    [stages]
  );

  const visitMemories = useCallback(() => {
    setReturnTo(index);
    goTo('memories');
  }, [index, goTo]);

  const visitCake = useCallback(() => {
    goTo('cake');
  }, [goTo]);

  const replay = useCallback(() => {
    sound.stop();
    setReturnTo(null);
    setRun((r) => r + 1);
    setIndex(stages.indexOf('intro'));
  }, [sound, stages]);

  const nextName = (offset = 1) => stages[index + offset];
  const revealLabel = { memories: 'See your memories →', letter: 'Read your letter 💌', mosaic: 'See your memories →' }[nextName()] || 'Continue →';

  function renderStage() {
    switch (stage) {
      case 'countdown':
        return <Countdown birthdayDate={data.birthdayDate} name={data.name} onEnter={next} showStars={showStars} />;
      case 'intro':
        return <MysteryIntro onNext={next} showStars={showStars} />;
      case 'gift':
        return <GiftStage name={data.name} onOpened={next} />;
      case 'reveal':
        return <BirthdayReveal name={data.name} onNext={next} nextLabel={revealLabel} />;
      case 'memories':
        return (
          <MemoryGallery items={memoryItems} onNext={next} continueLabel={returnTo !== null ? '← Back to the party' : 'Continue →'} />
        );
      case 'mosaic':
        return <PhotoMosaic photos={mosaic} onNext={next} />;
      case 'letter':
        return <BirthdayLetter message={data.message} senderName={data.senderName} name={data.name} onNext={next} />;
      case 'meter':
        return <FriendshipMeter label={ex.friendshipMeter?.label} onNext={next} />;
      case 'celebrate':
        return (
          <CelebrationPanel
            name={data.name}
            celebrations={cel}
            hasCake={stages.includes('cake')}
            hasMemories={stages.includes('memories')}
            onCake={visitCake}
            onMemories={visitMemories}
            onNext={next}
          />
        );
      case 'cake':
        return <BirthdayCake name={data.name} onNext={next} />;
      case 'quiz':
        return <BirthdayQuiz quiz={ex.quiz} onNext={next} />;
      case 'lock':
        return <MemoryLock lock={ex.memoryLock} onNext={next} />;
      case 'hidden':
        return <GiftSurprise surprises={hidden} onNext={next} />;
      case 'final':
        return (
          <FinalCelebration
            name={data.name}
            senderName={data.senderName}
            showStars={showStars}
            onReplay={replay}
            onHome={() => navigate(mode === 'preview' ? (data.editingSlug ? `/edit/${data.editingSlug}` : '/create') : '/')}
            homeLabel={mode === 'preview' ? '← Back to Edit' : 'Back to home'}
          />
        );
      default:
        return null;
    }
  }

  const dark = stage === 'countdown' || stage === 'intro';

  return (
    <div className={`experience${topBar ? ' has-topbar' : ''}${dark ? ' is-dark' : ''}`} data-stage={stage}>
      {topBar}
      {showStars && !dark && stage !== 'final' && (
        <div className="experience-ambient" aria-hidden="true">
          <StarsBackground density={0.45} />
        </div>
      )}
      <p className="sr-only" aria-live="polite">
        {STAGE_NAMES[stage]}
      </p>
      <AnimatePresence mode="wait">
        <motion.section
          key={`${run}-${stage}`}
          className={`stage stage-${stage}`}
          variants={stageVariants}
          initial="initial"
          animate="animate"
          exit="exit"
          aria-label={STAGE_NAMES[stage]}
        >
          {renderStage()}
        </motion.section>
      </AnimatePresence>

      {started && <MusicPlayer />}
      {started && stage !== 'final' && (
        <button type="button" className="skip-next" onClick={next} aria-label={`Skip to next: ${STAGE_NAMES[nextName()] || 'next'}`}>
          Skip <span aria-hidden="true">⏭</span>
        </button>
      )}
    </div>
  );
}

/**
 * Shared stage engine used by /surprise/:slug (mode "live"), /preview and /demo.
 * data: a normalized surprise record (or draft).
 */
export default function SurpriseExperience({ data, mode = 'live', topBar = null }) {
  return (
    <MusicProvider music={data.music}>
      <Experience data={data} mode={mode} topBar={topBar} />
    </MusicProvider>
  );
}
