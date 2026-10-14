/** Label + control + hint + inline error. The control should use describedBy(id). */
export default function Field({ id, label, hint, error, optional = false, children, className = '' }) {
  return (
    <div className={`field ${className}`}>
      {label && (
        <label htmlFor={id}>
          {label} {optional && <span className="optional">(optional)</span>}
        </label>
      )}
      {children}
      {hint && (
        <span id={`${id}-hint`} className="hint">
          {hint}
        </span>
      )}
      {error && (
        <span id={`${id}-error`} className="field-error" role="alert">
          {error}
        </span>
      )}
    </div>
  );
}

export function describedBy(id, { hint, error }) {
  return [hint ? `${id}-hint` : null, error ? `${id}-error` : null].filter(Boolean).join(' ') || undefined;
}
