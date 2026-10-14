import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import FileDropzone from '../FileDropzone.jsx';
import { MediaImage } from '../MediaImage.jsx';
import { LIMITS } from '../../utils/validation.js';
import { moveItem, uploadFiles } from './steps.js';

export default function StepPhotos({ draft, update, toast }) {
  const [busy, setBusy] = useState(false);
  const [dragFrom, setDragFrom] = useState(null);
  const photos = draft.photos;

  async function onFiles(files) {
    setBusy(true);
    const added = await uploadFiles(files, 'image', {
      max: LIMITS.maxPhotos,
      existing: photos.length,
      label: 'photos',
      toast,
      onAdded: (mediaId) => update((d) => ({ ...d, photos: [...d.photos, { mediaId, caption: '' }] })),
    });
    setBusy(false);
    if (added) toast.success(`${added} photo${added > 1 ? 's' : ''} added 📸`);
  }

  const setCaption = (i, caption) =>
    update((d) => ({ ...d, photos: d.photos.map((p, k) => (k === i ? { ...p, caption } : p)) }));
  const move = (from, to) => update((d) => ({ ...d, photos: moveItem(d.photos, from, to) }));
  const remove = (i) => update((d) => ({ ...d, photos: d.photos.filter((_, k) => k !== i) }));

  return (
    <div className="step-body">
      <h2>Add your favorite photos 📸</h2>
      <p className="muted step-lead">
        They appear in the memories slideshow and the big photo mosaic. Photos are resized on your device and stored only in this
        browser.
      </p>

      <FileDropzone
        accept="image/*"
        multiple
        onFiles={onFiles}
        busy={busy}
        disabled={busy || photos.length >= LIMITS.maxPhotos}
        icon="🖼️"
        title={photos.length >= LIMITS.maxPhotos ? 'Photo limit reached' : 'Drop photos here or browse'}
        hint={`JPG, PNG, WebP or GIF · up to 15 MB each · ${photos.length}/${LIMITS.maxPhotos} added`}
      />

      {photos.length > 0 && (
        <ul className="media-list" aria-label="Photos">
          <AnimatePresence initial={false}>
            {photos.map((p, i) => (
              <motion.li
                key={p.mediaId}
                layout
                className={`media-row glass${dragFrom === i ? ' dragging' : ''}`}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -30 }}
                draggable
                onDragStart={(e) => {
                  setDragFrom(i);
                  e.dataTransfer.effectAllowed = 'move';
                }}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  if (dragFrom !== null) move(dragFrom, i);
                  setDragFrom(null);
                }}
                onDragEnd={() => setDragFrom(null)}
              >
                <span className="drag-handle" aria-hidden="true" title="Drag to reorder">
                  ⋮⋮
                </span>
                <div className="media-thumb">
                  <MediaImage mediaId={p.mediaId} thumb alt={p.caption || `Photo ${i + 1}`} />
                </div>
                <div className="media-fields">
                  <label className="sr-only" htmlFor={`photo-cap-${i}`}>
                    Caption for photo {i + 1}
                  </label>
                  <input
                    id={`photo-cap-${i}`}
                    className="input"
                    type="text"
                    maxLength={LIMITS.captionMax}
                    placeholder="Caption (e.g. Our first trip ❤️)"
                    value={p.caption}
                    onChange={(e) => setCaption(i, e.target.value)}
                  />
                </div>
                <div className="row-actions">
                  <button type="button" className="btn btn-icon btn-ghost" onClick={() => move(i, i - 1)} disabled={i === 0} aria-label={`Move photo ${i + 1} up`}>
                    ↑
                  </button>
                  <button
                    type="button"
                    className="btn btn-icon btn-ghost"
                    onClick={() => move(i, i + 1)}
                    disabled={i === photos.length - 1}
                    aria-label={`Move photo ${i + 1} down`}
                  >
                    ↓
                  </button>
                  <button type="button" className="btn btn-icon btn-danger" onClick={() => remove(i)} aria-label={`Delete photo ${i + 1}`}>
                    🗑
                  </button>
                </div>
              </motion.li>
            ))}
          </AnimatePresence>
        </ul>
      )}

      {photos.length === 0 && <p className="notice notice-warn">💡 At least one photo is recommended — but you can continue without.</p>}
    </div>
  );
}
