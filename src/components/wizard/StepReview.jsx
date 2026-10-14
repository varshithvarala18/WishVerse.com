import { getTheme } from '../../utils/themes.js';
import { CELEBRATION_KEYS } from '../../utils/storage.js';
import { formatDate } from '../../utils/animations.js';

export default function StepReview({ draft, editing, saving, onPreview, onBack, onCreate, onJump }) {
  const theme = getTheme(draft.theme);
  const celOn = CELEBRATION_KEYS.filter((k) => draft.celebrations[k]).length;
  const ex = draft.extras;
  const extras = [
    ex.hiddenSurprises.length ? `${ex.hiddenSurprises.length} hidden surprise${ex.hiddenSurprises.length > 1 ? 's' : ''}` : null,
    ex.quiz.enabled ? 'Quiz' : null,
    ex.memoryLock.enabled ? 'Memory lock' : null,
    ex.friendshipMeter.enabled ? 'Friendship meter' : null,
  ].filter(Boolean);

  const rows = [
    { label: 'Birthday person', value: draft.name || '—', step: 0 },
    { label: 'From', value: draft.senderName || '—', step: 0 },
    { label: 'Birthday', value: formatDate(draft.birthdayDate, { day: 'numeric', month: 'long' }) || '—', step: 0 },
    { label: 'Message', value: `${draft.message.trim().length} characters`, step: 1 },
    { label: 'Photos', value: String(draft.photos.length), step: 2 },
    { label: 'Memories', value: String(draft.memories.length), step: 3 },
    { label: 'Videos', value: String(draft.videos.length), step: 4 },
    { label: 'Music', value: draft.music ? draft.music.fileName : 'Built-in melody', step: 5 },
    { label: 'Theme', value: `${theme.emoji} ${theme.name}`, step: 6 },
    { label: 'Celebrations', value: `${celOn} of ${CELEBRATION_KEYS.length} on`, step: 7 },
    { label: 'Extras', value: extras.length ? extras.join(', ') : 'None', step: 8 },
  ];

  return (
    <div className="step-body">
      <h2>Ready to wow them? 🎁</h2>
      <p className="muted step-lead">Check everything, watch the full preview, then create your surprise.</p>

      <dl className="review-list glass">
        {rows.map((r) => (
          <div key={r.label} className="review-row">
            <dt>{r.label}</dt>
            <dd>
              <span>{r.value}</span>
              <button type="button" className="link-btn" onClick={() => onJump(r.step)} aria-label={`Edit ${r.label}`}>
                Edit
              </button>
            </dd>
          </div>
        ))}
      </dl>

      <p className="notice">
        🔗 Your surprise link will work in <strong>this browser on this device</strong>. To show it somewhere else, use <strong>Export</strong> and
        then <strong>Import</strong> on the other device.
      </p>

      <div className="review-actions">
        <button type="button" className="btn btn-ghost btn-lg" onClick={onPreview}>
          👀 Open Full Preview
        </button>
        <button type="button" className="btn btn-ghost btn-lg" onClick={onBack}>
          ← Back to Edit
        </button>
        <button type="button" className="btn btn-primary btn-xl" onClick={onCreate} disabled={saving}>
          {saving ? <span className="spinner" aria-hidden="true" /> : null}
          <span>{editing ? 'SAVE CHANGES' : 'CREATE SURPRISE 🎁'}</span>
        </button>
      </div>
    </div>
  );
}
