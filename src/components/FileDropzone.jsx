import { useId, useRef, useState } from 'react';

/** Click / keyboard / drag-and-drop file picker. */
export default function FileDropzone({
  accept,
  multiple = false,
  onFiles,
  icon = '📁',
  title = 'Drop files here',
  hint,
  disabled = false,
  busy = false,
  compact = false,
}) {
  const inputId = useId();
  const inputRef = useRef(null);
  const [over, setOver] = useState(false);

  function handle(list) {
    const files = Array.from(list || []);
    if (files.length && !disabled) onFiles(multiple ? files : files.slice(0, 1));
  }

  return (
    <div
      className={`dropzone${over ? ' over' : ''}${disabled ? ' disabled' : ''}${compact ? ' compact' : ''}`}
      onDragOver={(e) => {
        e.preventDefault();
        if (!disabled) setOver(true);
      }}
      onDragLeave={() => setOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setOver(false);
        handle(e.dataTransfer.files);
      }}
    >
      <input
        ref={inputRef}
        id={inputId}
        type="file"
        accept={accept}
        multiple={multiple}
        disabled={disabled}
        className="sr-only"
        onChange={(e) => {
          handle(e.target.files);
          e.target.value = '';
        }}
      />
      <label htmlFor={inputId} className="dropzone-label">
        <span className="dropzone-icon" aria-hidden="true">
          {busy ? <span className="spinner" /> : icon}
        </span>
        <span className="dropzone-title">{busy ? 'Processing…' : title}</span>
        {hint && <span className="dropzone-hint">{hint}</span>}
        <span className="btn btn-sm btn-ghost dropzone-btn" aria-hidden="true">
          Browse files
        </span>
      </label>
    </div>
  );
}
