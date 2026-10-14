import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useEffects } from '../context/EffectsContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { surpriseUrl } from '../utils/slug.js';
import { copyText, shareLink } from '../utils/clipboard.js';
import { cloudEnabled, exportBirthday, getBirthday, publishBirthday } from '../utils/storage.js';
import { errorMessage } from '../utils/errors.js';

/** Shown after creating / saving a surprise. */
export default function SuccessScreen({ slug, edited = false, onCreateAnother }) {
  const { fire } = useEffects();
  const toast = useToast();
  const [exporting, setExporting] = useState(false);
  const url = surpriseUrl(slug);
  const rec = getBirthday(slug);
  // Upload so the link opens on any device: 'uploading' | 'online' | 'failed' | 'off'
  const [upload, setUpload] = useState({ state: cloudEnabled ? 'uploading' : 'off', done: 0, total: 0 });
  const ready = upload.state === 'online' || upload.state === 'off';

  const publish = useCallback(() => {
    setUpload({ state: 'uploading', done: 0, total: 0 });
    publishBirthday(slug, (done, total) => setUpload({ state: 'uploading', done, total }))
      .then(() => setUpload({ state: 'online', done: 0, total: 0 }))
      .catch((err) => {
        setUpload({ state: 'failed', done: 0, total: 0, message: errorMessage(err) });
      });
  }, [slug]);

  useEffect(() => {
    if (cloudEnabled) publish();
  }, [publish]);

  useEffect(() => {
    const a = setTimeout(() => fire('confetti', { count: 220, intensity: 1.2 }), 250);
    const b = setTimeout(() => fire('balloons', { count: 10 }), 700);
    return () => {
      clearTimeout(a);
      clearTimeout(b);
    };
  }, [fire]);

  async function copy() {
    (await copyText(url)) ? toast.success('Link copied! 📋') : toast.error('Couldn’t copy — select the link and copy it manually.');
  }

  async function share() {
    const result = await shareLink({ title: `A birthday surprise for ${rec?.name || 'you'} 🎁`, text: 'Open your birthday surprise 🎂', url });
    if (result === 'copied') toast.info('Sharing isn’t supported here, so the link was copied instead 📋');
    if (result === 'failed') toast.error('Couldn’t share or copy the link.');
  }

  async function doExport() {
    setExporting(true);
    try {
      const file = await exportBirthday(slug);
      toast.success(`Exported ${file} ⬇️`);
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setExporting(false);
    }
  }

  return (
    <div className="container success-page">
      <motion.div
        className="success-card glass"
        initial={{ opacity: 0, y: 40, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ type: 'spring', stiffness: 140, damping: 16 }}
      >
        <motion.div className="success-icon" aria-hidden="true" animate={{ rotate: [0, -10, 10, -6, 0], scale: [1, 1.15, 1] }} transition={{ duration: 1.2, delay: 0.3 }}>
          🎉
        </motion.div>
        <h1>{edited ? 'Your changes are saved! 🎉' : 'Your surprise is ready! 🎉'}</h1>
        <p className="muted">{rec ? `A magical birthday experience for ${rec.name} is waiting.` : 'Your birthday experience is waiting.'}</p>

        <label htmlFor="success-url" className="sr-only">
          Surprise link
        </label>
        <div className="url-box">
          <input id="success-url" className="input" readOnly value={url} onFocus={(e) => e.target.select()} />
        </div>

        <div className="success-actions">
          <button type="button" className="btn btn-primary" onClick={copy} disabled={!ready}>
            📋 Copy Link
          </button>
          <Link to={`/surprise/${slug}`} className="btn btn-accent">
            🎁 Open Surprise
          </Link>
          <button type="button" className="btn btn-ghost" onClick={share} disabled={!ready}>
            📤 Share
          </button>
          <button type="button" className="btn btn-ghost" onClick={doExport} disabled={exporting}>
            {exporting ? <span className="spinner" aria-hidden="true" /> : null}
            <span>⬇️ Export</span>
          </button>
        </div>

        {upload.state === 'uploading' ? (
          <p className="notice" role="status">
            <span className="spinner" aria-hidden="true" /> Uploading so the link works on any device…
            {upload.total ? ` ${upload.done}/${upload.total} files` : ''}
          </p>
        ) : upload.state === 'online' ? (
          <p className="notice" role="status">
            🌍 Your link is live! Anyone you send it to can open the surprise on their phone or computer.
          </p>
        ) : upload.state === 'failed' ? (
          <p className="notice" role="alert">
            ⚠️ {upload.message} Your surprise is still saved in this browser.{' '}
            <button type="button" className="btn btn-sm btn-ghost" onClick={publish}>
              Try again
            </button>
          </p>
        ) : (
          <p className="notice">
            ℹ️ This link works on <strong>this device/browser</strong>. To show it on another device, use <strong>Export</strong> and import the
            .wishverse file there (Dashboard → Import).
          </p>
        )}

        <div className="btn-row center">
          <Link to="/dashboard" className="btn btn-ghost btn-sm">
            Go to Dashboard
          </Link>
          <button type="button" className="btn btn-ghost btn-sm" onClick={onCreateAnother}>
            Create another ✨
          </button>
        </div>
      </motion.div>
    </div>
  );
}
