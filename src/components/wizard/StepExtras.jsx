import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import Switch from './Switch.jsx';
import Field, { describedBy } from './Field.jsx';
import FileDropzone from '../FileDropzone.jsx';
import { MediaImage, MediaVideo } from '../MediaImage.jsx';
import { LIMITS } from '../../utils/validation.js';
import { uploadFiles } from './steps.js';

function HiddenSurpriseEditor({ item, index, error, onChange, onRemove, toast }) {
  const [busy, setBusy] = useState(false);
  const base = `hidden-${index}`;

  async function upload(files) {
    setBusy(true);
    await uploadFiles(files, item.type === 'video' ? 'video' : 'image', {
      max: 1,
      label: item.type,
      toast,
      onAdded: (mediaId) => onChange({ mediaId }),
    });
    setBusy(false);
  }

  return (
    <motion.li layout className="hidden-editor glass" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
      <div className="memory-card-head">
        <span className="badge">{index === 0 ? '👀 One more thing' : '😄 One LAST surprise'}</span>
        <button type="button" className="btn btn-icon btn-danger" onClick={onRemove} aria-label={`Remove hidden surprise ${index + 1}`}>
          🗑
        </button>
      </div>

      <Field id={`${base}-type`} label="Type">
        <select
          id={`${base}-type`}
          className="select"
          value={item.type}
          onChange={(e) => onChange({ type: e.target.value, mediaId: null })}
        >
          <option value="message">💬 Message</option>
          <option value="photo">📷 Photo</option>
          <option value="video">🎬 Video</option>
        </select>
      </Field>

      {item.type !== 'message' && (
        <div className="hidden-media-edit">
          {item.mediaId ? (
            <>
              <div className="hidden-media-preview">
                {item.type === 'photo' ? <MediaImage mediaId={item.mediaId} thumb alt="Hidden surprise photo" /> : <MediaVideo mediaId={item.mediaId} label="Hidden surprise video" />}
              </div>
              <button type="button" className="btn btn-sm btn-ghost" onClick={() => onChange({ mediaId: null })}>
                Change {item.type}
              </button>
            </>
          ) : (
            <FileDropzone
              accept={item.type === 'video' ? 'video/*' : 'image/*'}
              onFiles={upload}
              busy={busy}
              disabled={busy}
              icon={item.type === 'video' ? '🎬' : '📷'}
              title={`Upload a ${item.type}`}
              compact
            />
          )}
        </div>
      )}

      <Field id={`${base}-text`} label={item.type === 'message' ? 'Secret message' : 'Caption'} optional={item.type !== 'message'} error={error}>
        <textarea
          id={`${base}-text`}
          className="textarea textarea-sm"
          rows={3}
          maxLength={500}
          placeholder={item.type === 'message' ? 'Your real present is waiting at dinner tonight 🎁' : 'A little note about it'}
          value={item.text}
          onChange={(e) => onChange({ text: e.target.value })}
          aria-invalid={!!error}
          aria-describedby={describedBy(`${base}-text`, { error })}
        />
      </Field>
    </motion.li>
  );
}

export default function StepExtras({ draft, update, errors, toast }) {
  const ex = draft.extras;
  const [lockBusy, setLockBusy] = useState(false);

  const setEx = (key, patch) =>
    update((d) => ({ ...d, extras: { ...d.extras, [key]: { ...d.extras[key], ...patch } } }));
  const setHidden = (fn) => update((d) => ({ ...d, extras: { ...d.extras, hiddenSurprises: fn(d.extras.hiddenSurprises) } }));

  async function uploadLockPhoto(files) {
    setLockBusy(true);
    await uploadFiles(files, 'image', { max: 1, label: 'photo', toast, onAdded: (mediaId) => setEx('memoryLock', { mediaId }) });
    setLockBusy(false);
  }

  return (
    <div className="step-body">
      <h2>Extra magic ✨ <span className="optional">(optional)</span></h2>
      <p className="muted step-lead">Hidden gifts, a playful quiz, a secret-word memory and the friendship meter.</p>

      {/* Hidden surprises */}
      <section className="extra-section glass" aria-labelledby="ex-hidden">
        <h3 id="ex-hidden">🎁 Hidden surprises</h3>
        <p className="muted">Revealed near the end: “Wait… there’s one more thing 👀”. Up to {LIMITS.maxHidden}.</p>
        <ul className="hidden-list">
          <AnimatePresence initial={false}>
            {ex.hiddenSurprises.map((h, i) => (
              <HiddenSurpriseEditor
                key={i}
                item={h}
                index={i}
                error={errors[`hidden-${i}`]}
                toast={toast}
                onChange={(patch) => setHidden((list) => list.map((x, k) => (k === i ? { ...x, ...patch } : x)))}
                onRemove={() => setHidden((list) => list.filter((_, k) => k !== i))}
              />
            ))}
          </AnimatePresence>
        </ul>
        {ex.hiddenSurprises.length < LIMITS.maxHidden && (
          <button type="button" className="btn btn-ghost btn-sm" onClick={() => setHidden((list) => [...list, { type: 'message', mediaId: null, text: '' }])}>
            Add hidden surprise +
          </button>
        )}
      </section>

      {/* Quiz */}
      <section className="extra-section glass" aria-labelledby="ex-quiz">
        <div className="extra-head">
          <h3 id="ex-quiz">🧠 Birthday quiz</h3>
          <Switch checked={ex.quiz.enabled} onChange={(v) => setEx('quiz', { enabled: v })} label={ex.quiz.enabled ? 'On' : 'Off'} />
        </div>
        {ex.quiz.enabled && (
          <div className="extra-body">
            <Field id="quiz-q" label="Question" error={errors.quizQuestion}>
              <input
                id="quiz-q"
                className="input"
                type="text"
                maxLength={160}
                placeholder="What is my favorite color?"
                value={ex.quiz.question}
                onChange={(e) => setEx('quiz', { question: e.target.value })}
                aria-invalid={!!errors.quizQuestion}
                aria-describedby={describedBy('quiz-q', { error: errors.quizQuestion })}
              />
            </Field>
            <fieldset className="quiz-edit-options">
              <legend>Options — select the correct one</legend>
              {ex.quiz.options.map((opt, i) => (
                <div key={i} className="quiz-edit-row">
                  <input
                    type="radio"
                    name="quiz-correct"
                    id={`quiz-correct-${i}`}
                    checked={ex.quiz.correctIndex === i}
                    onChange={() => setEx('quiz', { correctIndex: i })}
                  />
                  <label htmlFor={`quiz-correct-${i}`} className="sr-only">
                    Option {i + 1} is correct
                  </label>
                  <label htmlFor={`quiz-opt-${i}`} className="sr-only">
                    Option {i + 1}
                  </label>
                  <input
                    id={`quiz-opt-${i}`}
                    className="input"
                    type="text"
                    maxLength={60}
                    placeholder={`Option ${'ABCD'[i]}`}
                    value={opt}
                    onChange={(e) => setEx('quiz', { options: ex.quiz.options.map((o, k) => (k === i ? e.target.value : o)) })}
                    aria-invalid={!!errors[`quizOption${i}`]}
                  />
                </div>
              ))}
              {[0, 1, 2, 3].map((i) => errors[`quizOption${i}`] && <p key={i} className="field-error">{errors[`quizOption${i}`]}</p>)}
            </fieldset>
            <Field id="quiz-reward" label="Reward message (shown when correct)" error={errors.quizReward}>
              <input
                id="quiz-reward"
                className="input"
                type="text"
                maxLength={200}
                placeholder="You know me so well! 💖"
                value={ex.quiz.rewardText}
                onChange={(e) => setEx('quiz', { rewardText: e.target.value })}
                aria-invalid={!!errors.quizReward}
                aria-describedby={describedBy('quiz-reward', { error: errors.quizReward })}
              />
            </Field>
          </div>
        )}
      </section>

      {/* Memory lock */}
      <section className="extra-section glass" aria-labelledby="ex-lock">
        <div className="extra-head">
          <h3 id="ex-lock">🔐 Memory lock</h3>
          <Switch checked={ex.memoryLock.enabled} onChange={(v) => setEx('memoryLock', { enabled: v })} label={ex.memoryLock.enabled ? 'On' : 'Off'} />
        </div>
        {ex.memoryLock.enabled && (
          <div className="extra-body">
            <p className="notice">🔎 The secret word is stored as plain text in this browser — fine for a fun surprise, not for real secrets.</p>
            <Field id="lock-word" label="Secret word" hint="Not case-sensitive." error={errors.lockWord}>
              <input
                id="lock-word"
                className="input"
                type="text"
                autoComplete="off"
                maxLength={40}
                placeholder="sunshine"
                value={ex.memoryLock.secretWord}
                onChange={(e) => setEx('memoryLock', { secretWord: e.target.value })}
                aria-invalid={!!errors.lockWord}
                aria-describedby={describedBy('lock-word', { hint: true, error: errors.lockWord })}
              />
            </Field>
            <Field id="lock-hint" label="Hint" optional hint="Shown after 2 wrong tries.">
              <input
                id="lock-hint"
                className="input"
                type="text"
                maxLength={120}
                placeholder="What do you bring into every room? ☀️"
                value={ex.memoryLock.hint}
                onChange={(e) => setEx('memoryLock', { hint: e.target.value })}
                aria-describedby="lock-hint-hint"
              />
            </Field>
            <div className="field">
              <span className="label">Locked photo (optional)</span>
              {ex.memoryLock.mediaId ? (
                <div className="hidden-media-edit">
                  <div className="hidden-media-preview">
                    <MediaImage mediaId={ex.memoryLock.mediaId} thumb alt="Locked memory photo" />
                  </div>
                  <button type="button" className="btn btn-sm btn-ghost" onClick={() => setEx('memoryLock', { mediaId: null })}>
                    Remove photo
                  </button>
                </div>
              ) : (
                <FileDropzone accept="image/*" onFiles={uploadLockPhoto} busy={lockBusy} disabled={lockBusy} icon="📷" title="Upload the locked photo" compact />
              )}
            </div>
            <Field id="lock-text" label="Locked message" error={errors.lockContent}>
              <textarea
                id="lock-text"
                className="textarea textarea-sm"
                rows={3}
                maxLength={500}
                placeholder="The memory that's only for you…"
                value={ex.memoryLock.text}
                onChange={(e) => setEx('memoryLock', { text: e.target.value })}
                aria-invalid={!!errors.lockContent}
                aria-describedby={describedBy('lock-text', { error: errors.lockContent })}
              />
            </Field>
          </div>
        )}
      </section>

      {/* Friendship meter */}
      <section className="extra-section glass" aria-labelledby="ex-meter">
        <div className="extra-head">
          <h3 id="ex-meter">❤️ Friendship meter</h3>
          <Switch
            checked={ex.friendshipMeter.enabled}
            onChange={(v) => setEx('friendshipMeter', { enabled: v })}
            label={ex.friendshipMeter.enabled ? 'On' : 'Off'}
          />
        </div>
        {ex.friendshipMeter.enabled && (
          <div className="extra-body">
            <Field id="meter-label" label="Meter label" error={errors.meterLabel}>
              <input
                id="meter-label"
                className="input"
                type="text"
                maxLength={40}
                placeholder="Friendship Level"
                value={ex.friendshipMeter.label}
                onChange={(e) => setEx('friendshipMeter', { label: e.target.value })}
                aria-invalid={!!errors.meterLabel}
                aria-describedby={describedBy('meter-label', { error: errors.meterLabel })}
              />
            </Field>
          </div>
        )}
      </section>
    </div>
  );
}
