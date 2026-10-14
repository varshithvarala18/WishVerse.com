import Field, { describedBy } from './Field.jsx';
import { LIMITS } from '../../utils/validation.js';

export default function StepPerson({ draft, update, errors }) {
  return (
    <div className="step-body">
      <h2>Who&apos;s the birthday star? 🌟</h2>
      <p className="muted step-lead">Let&apos;s start with the basics. The name appears everywhere in the surprise.</p>

      <Field id="wz-name" label="Birthday person’s name" error={errors.name}>
        <input
          id="wz-name"
          className="input"
          type="text"
          autoComplete="off"
          maxLength={LIMITS.nameMax}
          placeholder="e.g. Priya"
          value={draft.name}
          onChange={(e) => update({ name: e.target.value })}
          aria-invalid={!!errors.name}
          aria-describedby={describedBy('wz-name', { error: errors.name })}
          required
        />
      </Field>

      <Field
        id="wz-sender"
        label="From"
        optional
        hint="Shown as the letter’s signature, e.g. “Rahul” or “Your Friends”."
        error={errors.senderName}
      >
        <input
          id="wz-sender"
          className="input"
          type="text"
          autoComplete="name"
          maxLength={LIMITS.nameMax}
          placeholder="Your name"
          value={draft.senderName}
          onChange={(e) => update({ senderName: e.target.value })}
          aria-invalid={!!errors.senderName}
          aria-describedby={describedBy('wz-sender', { hint: true, error: errors.senderName })}
        />
      </Field>

      <Field
        id="wz-date"
        label="Birthday date"
        hint="Date of birth or this year’s birthday — only the day and month are used. Before that day the surprise shows a countdown."
        error={errors.birthdayDate}
      >
        <input
          id="wz-date"
          className="input"
          type="date"
          value={draft.birthdayDate}
          onChange={(e) => update({ birthdayDate: e.target.value })}
          aria-invalid={!!errors.birthdayDate}
          aria-describedby={describedBy('wz-date', { hint: true, error: errors.birthdayDate })}
          required
        />
      </Field>
    </div>
  );
}
