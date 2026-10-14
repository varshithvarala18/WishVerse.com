import { useRef } from 'react';
import Field, { describedBy } from './Field.jsx';
import { LIMITS } from '../../utils/validation.js';
import { SAMPLE_MESSAGES } from './steps.js';

export default function StepMessage({ draft, update, errors }) {
  const sampleIdx = useRef(0);
  const len = draft.message.length;

  function applySample() {
    const fn = SAMPLE_MESSAGES[sampleIdx.current % SAMPLE_MESSAGES.length];
    sampleIdx.current += 1;
    update({ message: fn(draft.name.trim() || 'Bestie') });
  }

  return (
    <div className="step-body">
      <h2>Write from the heart 💌</h2>
      <p className="muted step-lead">This becomes a handwritten-style letter that types itself out. Line breaks are kept.</p>

      <Field id="wz-message" label="Your birthday message" error={errors.message}>
        <textarea
          id="wz-message"
          className="textarea textarea-letter"
          rows={9}
          maxLength={LIMITS.messageMax}
          placeholder={`Happy Birthday ${draft.name || '…'}! …`}
          value={draft.message}
          onChange={(e) => update({ message: e.target.value })}
          aria-invalid={!!errors.message}
          aria-describedby={describedBy('wz-message', { error: errors.message }) || 'wz-message-count'}
        />
        <span id="wz-message-count" className={`char-count${len > LIMITS.messageMax ? ' over' : ''}`}>
          {len} / {LIMITS.messageMax}
        </span>
      </Field>

      <button type="button" className="btn btn-ghost btn-sm" onClick={applySample}>
        ✨ Use sample message
      </button>
    </div>
  );
}
