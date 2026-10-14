import { useCallback, useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import StepProgress from '../components/StepProgress.jsx';
import Modal from '../components/Modal.jsx';
import SuccessScreen from '../components/SuccessScreen.jsx';
import LivePreview from '../components/wizard/LivePreview.jsx';
import StepPerson from '../components/wizard/StepPerson.jsx';
import StepMessage from '../components/wizard/StepMessage.jsx';
import StepPhotos from '../components/wizard/StepPhotos.jsx';
import StepMemories from '../components/wizard/StepMemories.jsx';
import StepVideos from '../components/wizard/StepVideos.jsx';
import StepMusic from '../components/wizard/StepMusic.jsx';
import StepTheme from '../components/wizard/StepTheme.jsx';
import StepCelebrations from '../components/wizard/StepCelebrations.jsx';
import StepExtras from '../components/wizard/StepExtras.jsx';
import StepReview from '../components/wizard/StepReview.jsx';
import { STEPS, STEP_IDS } from '../components/wizard/steps.js';
import { useToast } from '../context/ToastContext.jsx';
import { clearDraft, commitDraft, emptyDraft, getBirthday, getDraft, saveDraft } from '../utils/storage.js';
import { firstInvalidStep, validateStep } from '../utils/validation.js';
import { errorMessage } from '../utils/errors.js';
import { stepVariants } from '../utils/animations.js';
import NotFound from './NotFound.jsx';
import '../styles/Wizard.css';

const STEP_COMPONENTS = {
  person: StepPerson,
  message: StepMessage,
  photos: StepPhotos,
  memories: StepMemories,
  videos: StepVideos,
  music: StepMusic,
  theme: StepTheme,
  celebrations: StepCelebrations,
  extras: StepExtras,
};

function hasContent(d) {
  return !!(d && (d.name || d.message || d.photos.length || d.memories.length || d.videos.length));
}

export default function CreateSurprise() {
  const { slug } = useParams();
  const editing = !!slug;
  const location = useLocation();
  const navigate = useNavigate();
  const toast = useToast();
  const created = location.state?.created;

  const [draft, setDraft] = useState(null);
  const [missing, setMissing] = useState(false);
  const [errors, setErrors] = useState({});
  const [dir, setDir] = useState(1);
  const [saving, setSaving] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);
  const saveWarned = useRef(false);
  const welcomed = useRef(false);
  const autosaveTimer = useRef(null);
  const headingRef = useRef(null);

  // Load (or start) the draft for this mode.
  useEffect(() => {
    let cancelled = false;
    async function init() {
      setMissing(false);
      setErrors({});
      const existing = getDraft();
      if (editing) {
        const rec = getBirthday(slug);
        if (!rec) {
          setMissing(true);
          return;
        }
        if (existing && existing.editingSlug === slug) {
          setDraft(existing);
          return;
        }
        if (existing) await clearDraft();
        if (!cancelled) setDraft({ ...rec, step: 0, editingSlug: slug });
      } else {
        if (existing && !existing.editingSlug) {
          setDraft(existing);
          if (hasContent(existing) && !created && !welcomed.current) {
            welcomed.current = true;
            toast.info('Welcome back! Your draft was restored ✨');
          }
          return;
        }
        if (existing) await clearDraft();
        if (!cancelled) setDraft(emptyDraft());
      }
    }
    init();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug, editing]);

  // Autosave the draft text (media is already in IndexedDB).
  useEffect(() => {
    if (!draft) return undefined;
    const t = setTimeout(() => {
      autosaveTimer.current = null;
      try {
        saveDraft(draft);
        saveWarned.current = false;
      } catch (err) {
        if (!saveWarned.current) {
          toast.error(errorMessage(err));
          saveWarned.current = true;
        }
      }
    }, 350);
    autosaveTimer.current = t;
    return () => clearTimeout(t);
  }, [draft, toast]);

  const update = useCallback((patch) => {
    setDraft((d) => (typeof patch === 'function' ? patch(d) : { ...d, ...patch }));
  }, []);

  // Re-validate the current step live once errors are showing.
  useEffect(() => {
    if (!draft || !Object.keys(errors).length) return;
    setErrors(validateStep(STEP_IDS[draft.step], draft).errors);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draft]);

  if (created) {
    return (
      <SuccessScreen
        slug={created}
        edited={!!location.state?.edited}
        onCreateAnother={() => navigate('/create', { replace: true, state: null })}
      />
    );
  }

  if (missing) {
    return <NotFound title="Surprise not found 🔍" message="We couldn’t find that surprise in this browser, so it can’t be edited here." />;
  }

  if (!draft) {
    return (
      <div className="page-loader" role="status">
        <span className="loader-gift" aria-hidden="true">
          🎁
        </span>
        <span>Preparing your workspace…</span>
      </div>
    );
  }

  const step = Math.min(Math.max(0, draft.step || 0), STEPS.length - 1);
  const stepId = STEP_IDS[step];
  const StepComponent = STEP_COMPONENTS[stepId];

  function focusHeading() {
    requestAnimationFrame(() => headingRef.current?.focus({ preventScroll: true }));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function goTo(i) {
    setDir(i > step ? 1 : -1);
    setErrors({});
    update({ step: i });
    focusHeading();
  }

  function next() {
    const { errors: errs, warnings } = validateStep(stepId, draft);
    if (Object.keys(errs).length) {
      setErrors(errs);
      toast.error(Object.values(errs)[0]);
      return;
    }
    warnings.forEach((w) => toast.info(w));
    goTo(step + 1);
  }

  function back() {
    if (step > 0) goTo(step - 1);
  }

  const canSelect = (i) => i <= step || firstInvalidStep(STEP_IDS, draft, i) === -1;

  function select(i) {
    if (i === step) return;
    if (i < step) return goTo(i);
    const bad = firstInvalidStep(STEP_IDS, draft, i);
    if (bad !== -1) {
      toast.error('Please finish the earlier steps first.');
      goTo(bad);
      return undefined;
    }
    return goTo(i);
  }

  function openPreview() {
    try {
      saveDraft(draft);
      navigate('/preview');
    } catch (err) {
      toast.error(errorMessage(err));
    }
  }

  async function create() {
    const bad = firstInvalidStep(STEP_IDS, draft);
    if (bad !== -1) {
      goTo(bad);
      const errs = validateStep(STEP_IDS[bad], draft).errors;
      setErrors(errs);
      toast.error(Object.values(errs)[0] || 'Please complete the highlighted fields.');
      return;
    }
    setSaving(true);
    clearTimeout(autosaveTimer.current);
    try {
      saveDraft(draft);
      const rec = await commitDraft(draft);
      setDraft(emptyDraft());
      navigate('/create', { replace: true, state: { created: rec.slug, edited: editing } });
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  async function resetDraft() {
    setConfirmReset(false);
    await clearDraft();
    if (editing) {
      navigate('/dashboard');
      return;
    }
    setDraft(emptyDraft());
    setErrors({});
    toast.info('Started fresh ✨');
  }

  return (
    <div className="wizard-page">
      <div className="container">
        <header className="wizard-header">
          <div>
            <p className="eyebrow">{editing ? 'Edit surprise' : 'New surprise'}</p>
            <h1 className="wizard-title">
              {editing ? (
                <>
                  Editing <span className="text-gradient">{draft.name || 'surprise'}</span>
                </>
              ) : (
                <>
                  Create a <span className="text-gradient">Surprise</span> 🎁
                </>
              )}
            </h1>
            <p className="muted autosave-note">✓ Autosaved in this browser</p>
          </div>
          <button type="button" className="btn btn-ghost btn-sm" onClick={() => setConfirmReset(true)}>
            {editing ? 'Discard changes' : 'Start fresh'}
          </button>
        </header>

        <StepProgress steps={STEPS} current={step} onSelect={select} canSelect={canSelect} />

        <div className="wizard-layout">
          <div className="wizard-main glass">
            <h2 className="sr-only" tabIndex={-1} ref={headingRef}>
              Step {step + 1}: {STEPS[step].title}
            </h2>
            <AnimatePresence mode="wait" custom={dir} initial={false}>
              <motion.div key={stepId} custom={dir} variants={stepVariants} initial="enter" animate="center" exit="exit">
                {stepId === 'review' ? (
                  <StepReview
                    draft={draft}
                    editing={editing}
                    saving={saving}
                    onPreview={openPreview}
                    onBack={back}
                    onCreate={create}
                    onJump={goTo}
                  />
                ) : (
                  <StepComponent draft={draft} update={update} errors={errors} toast={toast} />
                )}
              </motion.div>
            </AnimatePresence>

            {stepId !== 'review' && (
              <div className="wizard-nav">
                <button type="button" className="btn btn-ghost" onClick={back} disabled={step === 0}>
                  ← Back
                </button>
                <button type="button" className="btn btn-ghost wizard-preview-link" onClick={openPreview}>
                  👀 Preview
                </button>
                <button type="button" className="btn btn-primary" onClick={next}>
                  Next →
                </button>
              </div>
            )}
          </div>

          <div className="wizard-side">
            <LivePreview draft={draft} stepId={stepId} />
          </div>
        </div>
      </div>

      <Modal
        open={confirmReset}
        title={editing ? 'Discard your changes?' : 'Start a fresh surprise?'}
        onClose={() => setConfirmReset(false)}
        onConfirm={resetDraft}
        confirmLabel={editing ? 'Discard changes' : 'Clear draft'}
        danger
      >
        <p>
          {editing
            ? 'Unsaved edits and newly added media will be removed. The saved surprise stays as it was.'
            : 'This removes everything in the current draft, including uploaded photos, videos and music.'}
        </p>
      </Modal>
    </div>
  );
}
