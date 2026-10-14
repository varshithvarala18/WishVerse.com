import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import FileDropzone from '../FileDropzone.jsx';
import { MediaVideo } from '../MediaImage.jsx';
import { LIMITS } from '../../utils/validation.js';
import { uploadFiles } from './steps.js';

export default function StepVideos({ draft, update, toast }) {
  const [busy, setBusy] = useState(false);
  const videos = draft.videos;

  async function onFiles(files) {
    setBusy(true);
    const added = await uploadFiles(files, 'video', {
      max: LIMITS.maxVideos,
      existing: videos.length,
      label: 'videos',
      toast,
      onAdded: (mediaId) => update((d) => ({ ...d, videos: [...d.videos, { mediaId, caption: '' }] })),
    });
    setBusy(false);
    if (added) toast.success(`${added} video${added > 1 ? 's' : ''} added 🎬`);
  }

  const setCaption = (i, caption) =>
    update((d) => ({ ...d, videos: d.videos.map((v, k) => (k === i ? { ...v, caption } : v)) }));
  const remove = (i) => update((d) => ({ ...d, videos: d.videos.filter((_, k) => k !== i) }));

  return (
    <div className="step-body">
      <h2>Add a video or two 🎬 <span className="optional">(optional)</span></h2>
      <p className="muted step-lead">Videos play inside the memories slideshow — the music fades down while they play.</p>

      <FileDropzone
        accept="video/*"
        multiple
        onFiles={onFiles}
        busy={busy}
        disabled={busy || videos.length >= LIMITS.maxVideos}
        icon="🎥"
        title={videos.length >= LIMITS.maxVideos ? 'Video limit reached' : 'Drop videos here or browse'}
        hint={`MP4 or WebM · up to 50 MB each · ${videos.length}/${LIMITS.maxVideos} added`}
      />

      {videos.length > 0 && (
        <ul className="video-list">
          <AnimatePresence initial={false}>
            {videos.map((v, i) => (
              <motion.li key={v.mediaId} layout className="video-card glass" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                <MediaVideo mediaId={v.mediaId} className="video-preview" label={v.caption || `Video ${i + 1}`} />
                <div className="video-card-row">
                  <label className="sr-only" htmlFor={`video-cap-${i}`}>
                    Caption for video {i + 1}
                  </label>
                  <input
                    id={`video-cap-${i}`}
                    className="input"
                    type="text"
                    maxLength={LIMITS.captionMax}
                    placeholder="Caption (optional)"
                    value={v.caption}
                    onChange={(e) => setCaption(i, e.target.value)}
                  />
                  <button type="button" className="btn btn-icon btn-danger" onClick={() => remove(i)} aria-label={`Delete video ${i + 1}`}>
                    🗑
                  </button>
                </div>
              </motion.li>
            ))}
          </AnimatePresence>
        </ul>
      )}
    </div>
  );
}
