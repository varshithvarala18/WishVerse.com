import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import SurpriseExperience from './SurpriseExperience.jsx';
import { getDraft, saveDraft, commitDraft } from '../utils/storage.js';
import { firstInvalidStep } from '../utils/validation.js';
import { STEP_IDS } from '../components/wizard/steps.js';
import { useToast } from '../context/ToastContext.jsx';
import { errorMessage } from '../utils/errors.js';

/** Plays the full experience from the wizard draft (no countdown gate). */
export default function Preview() {
  const navigate = useNavigate();
  const toast = useToast();
  const [draft] = useState(() => getDraft());
  const [saving, setSaving] = useState(false);

  if (!draft) {
    return (
      <div className="container empty-page">
        <div className="empty-card glass">
          <span className="empty-emoji" aria-hidden="true">
            🫥
          </span>
          <h1>Nothing to preview yet</h1>
          <p className="muted">Start a surprise first — your draft is saved automatically as you go.</p>
          <div className="btn-row center">
            <Link className="btn btn-primary" to="/create">
              Create a Surprise 🎁
            </Link>
            <Link className="btn btn-ghost" to="/demo">
              Watch the demo ✨
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const editPath = draft.editingSlug ? `/edit/${draft.editingSlug}` : '/create';

  async function create() {
    const bad = firstInvalidStep(STEP_IDS, draft);
    if (bad !== -1) {
      try {
        saveDraft({ ...draft, step: bad });
      } catch {
        /* ignore */
      }
      toast.error('A few details still need your attention before creating.');
      navigate(editPath);
      return;
    }
    setSaving(true);
    try {
      const rec = await commitDraft(draft);
      navigate('/create', { replace: true, state: { created: rec.slug, edited: !!draft.editingSlug } });
    } catch (err) {
      toast.error(errorMessage(err));
      setSaving(false);
    }
  }

  const topBar = (
    <div className="exp-topbar preview-bar">
      <Link to={editPath} className="btn btn-sm btn-ghost">
        ← Back to Edit
      </Link>
      <span className="badge">👀 Preview</span>
      <button type="button" className="btn btn-sm btn-primary" onClick={create} disabled={saving}>
        {saving ? <span className="spinner" aria-hidden="true" /> : null}
        <span>{draft.editingSlug ? 'SAVE CHANGES' : 'CREATE SURPRISE 🎁'}</span>
      </button>
    </div>
  );

  return <SurpriseExperience data={draft} mode="preview" topBar={topBar} />;
}
