import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import FileDropzone from '../FileDropzone.jsx';
import { MediaImage } from '../MediaImage.jsx';
import Field, { describedBy } from './Field.jsx';
import { LIMITS } from '../../utils/validation.js';
import { randomId } from '../../utils/slug.js';
import { moveItem, uploadFiles } from './steps.js';

function MemoryCard({ memory, index, total, photos, error, onChange, onMove, onRemove, toast }) {
  const [picking, setPicking] = useState(false);
  const [busy, setBusy] = useState(false);
  const base = `mem-${memory.id}`;

  async function upload(files) {
    setBusy(true);
    await uploadFiles(files, 'image', {
      max: 1,
      label: 'photo',
      toast,
      onAdded: (mediaId) => onChange({ mediaId }),
    });
    setBusy(false);
  }

  return (
    <motion.li
      layout
      className="memory-card glass"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
    >
      <div className="memory-card-head">
        <span className="badge">Memory {index + 1}</span>
        <div className="row-actions">
          <button type="button" className="btn btn-icon btn-ghost" onClick={() => onMove(-1)} disabled={index === 0} aria-label={`Move memory ${index + 1} up`}>
            ↑
          </button>
          <button
            type="button"
            className="btn btn-icon btn-ghost"
            onClick={() => onMove(1)}
            disabled={index === total - 1}
            aria-label={`Move memory ${index + 1} down`}
          >
            ↓
          </button>
          <button type="button" className="btn btn-icon btn-danger" onClick={onRemove} aria-label={`Delete memory ${index + 1}`}>
            🗑
          </button>
        </div>
      </div>

      <div className="memory-card-body">
        <div className="memory-photo">
          {memory.mediaId ? (
            <>
              <div className="memory-photo-img">
                <MediaImage mediaId={memory.mediaId} thumb alt={memory.caption || `Memory ${index + 1}`} />
              </div>
              <button type="button" className="btn btn-sm btn-ghost" onClick={() => onChange({ mediaId: null })}>
                Change photo
              </button>
            </>
          ) : (
            <>
              <FileDropzone accept="image/*" onFiles={upload} busy={busy} disabled={busy} icon="📷" title="Upload a photo" compact />
              {photos.length > 0 && (
                <button type="button" className="btn btn-sm btn-ghost" onClick={() => setPicking((p) => !p)} aria-expanded={picking}>
                  {picking ? 'Close picker' : 'Choose from your photos'}
                </button>
              )}
              {picking && (
                <div className="photo-picker" role="group" aria-label="Choose a photo">
                  {photos.map((p, i) => (
                    <button
                      key={p.mediaId}
                      type="button"
                      className="picker-thumb"
                      onClick={() => {
                        onChange({ mediaId: p.mediaId, caption: memory.caption || p.caption || '' });
                        setPicking(false);
                      }}
                      aria-label={`Use photo ${i + 1}${p.caption ? `: ${p.caption}` : ''}`}
                    >
                      <MediaImage mediaId={p.mediaId} thumb alt="" />
                    </button>
                  ))}
                </div>
              )}
            </>
          )}
        </div>

        <div className="memory-fields">
          <Field id={`${base}-cap`} label="Caption" error={error}>
            <input
              id={`${base}-cap`}
              className="input"
              type="text"
              maxLength={LIMITS.captionMax}
              placeholder="That midnight cake disaster 😂"
              value={memory.caption}
              onChange={(e) => onChange({ caption: e.target.value })}
              aria-invalid={!!error}
              aria-describedby={describedBy(`${base}-cap`, { error })}
            />
          </Field>
          <Field id={`${base}-date`} label="Date" optional>
            <input id={`${base}-date`} className="input" type="date" value={memory.date} onChange={(e) => onChange({ date: e.target.value })} />
          </Field>
          <Field id={`${base}-desc`} label="Description" optional>
            <textarea
              id={`${base}-desc`}
              className="textarea textarea-sm"
              rows={3}
              maxLength={LIMITS.descriptionMax}
              placeholder="What made this moment special?"
              value={memory.description}
              onChange={(e) => onChange({ description: e.target.value })}
            />
          </Field>
        </div>
      </div>
    </motion.li>
  );
}

export default function StepMemories({ draft, update, errors, toast }) {
  const memories = draft.memories;

  const add = () =>
    update((d) => ({ ...d, memories: [...d.memories, { id: randomId(8), mediaId: null, caption: '', date: '', description: '' }] }));
  const change = (id, patch) =>
    update((d) => ({ ...d, memories: d.memories.map((m) => (m.id === id ? { ...m, ...patch } : m)) }));
  const move = (i, delta) => update((d) => ({ ...d, memories: moveItem(d.memories, i, i + delta) }));
  const remove = (id) => update((d) => ({ ...d, memories: d.memories.filter((m) => m.id !== id) }));

  return (
    <div className="step-body">
      <h2>Tell the story with memories 🧡</h2>
      <p className="muted step-lead">Each memory becomes a Polaroid card with its caption, date and a little story.</p>

      {memories.length > 0 && (
        <ul className="memory-list">
          <AnimatePresence initial={false}>
            {memories.map((m, i) => (
              <MemoryCard
                key={m.id}
                memory={m}
                index={i}
                total={memories.length}
                photos={draft.photos}
                error={errors[`memory-${m.id}`]}
                onChange={(patch) => change(m.id, patch)}
                onMove={(delta) => move(i, delta)}
                onRemove={() => remove(m.id)}
                toast={toast}
              />
            ))}
          </AnimatePresence>
        </ul>
      )}

      <button type="button" className="btn btn-primary add-btn" onClick={add}>
        Add Memory +
      </button>
      {memories.length === 0 && (
        <p className="muted small-note">Optional — photos from the previous step will still appear in the slideshow.</p>
      )}
    </div>
  );
}
