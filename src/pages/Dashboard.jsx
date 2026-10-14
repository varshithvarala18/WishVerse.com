import { memo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import Modal from '../components/Modal.jsx';
import { MediaImage } from '../components/MediaImage.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { cloudEnabled, deleteBirthday, exportBirthday, getAllBirthdays, importBirthday, publishBirthday, publishStatus } from '../utils/storage.js';
import { getTheme } from '../utils/themes.js';
import { formatDate } from '../utils/animations.js';
import { surpriseUrl } from '../utils/slug.js';
import { shareLink } from '../utils/clipboard.js';
import { errorMessage } from '../utils/errors.js';
import '../styles/Dashboard.css';

function coverId(s) {
  return s.photos[0]?.mediaId || s.memories.find((m) => m.mediaId)?.mediaId || null;
}

const SurpriseCard = memo(function SurpriseCard({ s, index, onShare, onExport, onDelete, onPublish, exporting, publishing }) {
  const theme = getTheme(s.theme);
  const status = publishStatus(s);
  const cover = coverId(s);
  return (
    <motion.li
      layout
      className="dash-card glass"
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ delay: index * 0.05 }}
    >
      <div className="dash-cover" data-theme={theme.id}>
        {cover ? (
          <MediaImage mediaId={cover} thumb alt={`Cover photo for ${s.name}`} />
        ) : (
          <span className="dash-cover-emoji" aria-hidden="true">
            🎂
          </span>
        )}
        <span className="dash-theme badge">
          {theme.emoji} {theme.name}
        </span>
      </div>
      <div className="dash-body">
        <h2 className="dash-name">{s.name}</h2>
        <p className="muted dash-meta">
          Created: {formatDate(s.createdAt)}
          {s.birthdayDate ? ` · 🎈 ${formatDate(s.birthdayDate, { day: 'numeric', month: 'short' })}` : ''}
        </p>
        <p className="muted dash-counts">
          📸 {s.photos.length} · 🧡 {s.memories.length} · 🎬 {s.videos.length}
          {status === 'online' ? ' · 🌍 Online' : ''}
        </p>
        <div className="dash-actions">
          <Link to={`/surprise/${s.slug}`} className="btn btn-sm btn-primary">
            ▶ Preview
          </Link>
          <Link to={`/edit/${s.slug}`} className="btn btn-sm btn-ghost">
            ✏️ Edit
          </Link>
          {status === 'local' || status === 'stale' ? (
            <button type="button" className="btn btn-sm btn-accent" onClick={() => onPublish(s)} disabled={publishing}>
              {publishing ? <span className="spinner" aria-hidden="true" /> : null}
              <span>{status === 'stale' ? '🌍 Update online' : '🌍 Publish online'}</span>
            </button>
          ) : (
            <button type="button" className="btn btn-sm btn-ghost" onClick={() => onShare(s)}>
              🔗 Copy / Share
            </button>
          )}
          <button type="button" className="btn btn-sm btn-ghost" onClick={() => onExport(s)} disabled={exporting}>
            ⬇️ Export
          </button>
          <button type="button" className="btn btn-sm btn-danger" onClick={() => onDelete(s)} aria-label={`Delete surprise for ${s.name}`}>
            🗑 Delete
          </button>
        </div>
      </div>
    </motion.li>
  );
});

export default function Dashboard() {
  const toast = useToast();
  const [list, setList] = useState(() => getAllBirthdays());
  const [toDelete, setToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [exporting, setExporting] = useState(null);
  const [importing, setImporting] = useState(false);
  const [publishing, setPublishing] = useState(null);
  const fileRef = useRef(null);

  const refresh = () => setList(getAllBirthdays());

  async function share(s) {
    const result = await shareLink({ title: `A birthday surprise for ${s.name} 🎁`, text: 'Open your birthday surprise 🎂', url: surpriseUrl(s.slug) });
    if (result === 'copied') toast.success(cloudEnabled ? 'Link copied! 📋' : 'Link copied! 📋 (It works in this browser only.)');
    if (result === 'failed') toast.error('Couldn’t copy the link.');
  }

  async function publish(s) {
    setPublishing(s.slug);
    try {
      await publishBirthday(s.slug);
      toast.success(`The surprise for ${s.name} is online — its link now works on any device 🌍`);
      refresh();
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setPublishing(null);
    }
  }

  async function doExport(s) {
    setExporting(s.slug);
    try {
      const file = await exportBirthday(s.slug);
      toast.success(`Exported ${file} ⬇️`);
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setExporting(null);
    }
  }

  async function confirmDelete() {
    if (!toDelete) return;
    setDeleting(true);
    try {
      await deleteBirthday(toDelete.slug);
      toast.success(`Deleted the surprise for ${toDelete.name}.`);
      refresh();
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setDeleting(false);
      setToDelete(null);
    }
  }

  async function onImport(e) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setImporting(true);
    try {
      const rec = await importBirthday(file);
      toast.success(`Imported the surprise for ${rec.name} 🎉`);
      refresh();
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setImporting(false);
    }
  }

  return (
    <div className="dashboard container">
      <header className="dash-header">
        <div>
          <p className="eyebrow">Dashboard</p>
          <h1>
            Your <span className="text-gradient">surprises</span>
          </h1>
          <p className="muted">
            {cloudEnabled
              ? 'Edit and manage them from this browser. Published links open on any device.'
              : 'Saved in this browser only. Export to move one to another device.'}
          </p>
        </div>
        <div className="btn-row">
          <Link to="/create" className="btn btn-primary">
            ＋ Create New
          </Link>
          <button type="button" className="btn btn-ghost" onClick={() => fileRef.current?.click()} disabled={importing}>
            {importing ? <span className="spinner" aria-hidden="true" /> : null}
            <span>⬆️ Import</span>
          </button>
          <input
            ref={fileRef}
            type="file"
            accept=".wishverse,application/json,.json"
            className="sr-only"
            onChange={onImport}
            tabIndex={-1}
            aria-label="Import a .wishverse file"
          />
        </div>
      </header>

      {list.length === 0 ? (
        <motion.div className="empty-card glass" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <motion.span
            className="empty-emoji"
            aria-hidden="true"
            animate={{ rotate: [-6, 6, -6], y: [0, -8, 0] }}
            transition={{ duration: 3, repeat: Infinity }}
          >
            🎁
          </motion.span>
          <h2>No surprises yet</h2>
          <p className="muted">Create your first birthday experience — or import one you exported elsewhere.</p>
          <div className="btn-row center">
            <Link to="/create" className="btn btn-primary">
              Create a Surprise 🎁
            </Link>
            <Link to="/demo" className="btn btn-ghost">
              Explore Demo ✨
            </Link>
          </div>
        </motion.div>
      ) : (
        <ul className="dash-grid">
          <AnimatePresence initial={false}>
            {list.map((s, i) => (
              <SurpriseCard
                key={s.slug}
                s={s}
                index={i}
                onShare={share}
                onExport={doExport}
                onDelete={setToDelete}
                onPublish={publish}
                exporting={exporting === s.slug}
                publishing={publishing === s.slug}
              />
            ))}
          </AnimatePresence>
        </ul>
      )}

      <Modal
        open={!!toDelete}
        title="Delete this surprise?"
        onClose={() => !deleting && setToDelete(null)}
        onConfirm={confirmDelete}
        confirmLabel="Delete forever"
        danger
        busy={deleting}
      >
        <p>
          The surprise for <strong>{toDelete?.name}</strong> and all of its photos, videos and music will be removed from this browser
          {cloudEnabled ? ' and its link will stop working' : ''}. This can’t be undone — export it first if you want a backup.
        </p>
      </Modal>
    </div>
  );
}
