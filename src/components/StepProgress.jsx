import { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';

/** Progress bar + clickable step dots for the wizard. */
export default function StepProgress({ steps, current, onSelect, canSelect }) {
  const pct = ((current + 1) / steps.length) * 100;
  const listRef = useRef(null);

  useEffect(() => {
    const list = listRef.current;
    const dot = list?.children[current];
    if (!list || !dot) return;
    const left = dot.offsetLeft - list.clientWidth / 2 + dot.clientWidth / 2;
    list.scrollTo({ left, behavior: 'smooth' });
  }, [current]);

  return (
    <div className="step-progress">
      <div className="step-progress-top">
        <span className="step-count">
          Step {current + 1} of {steps.length}
        </span>
        <span className="step-name">
          <span aria-hidden="true">{steps[current].icon}</span> {steps[current].title}
        </span>
      </div>
      <div
        className="step-bar"
        role="progressbar"
        aria-label="Wizard progress"
        aria-valuemin={1}
        aria-valuemax={steps.length}
        aria-valuenow={current + 1}
      >
        <motion.div className="step-bar-fill" animate={{ width: `${pct}%` }} transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }} />
      </div>
      <ol className="step-dots" ref={listRef}>
        {steps.map((s, i) => {
          const state = i === current ? 'current' : i < current ? 'done' : 'todo';
          const enabled = canSelect(i);
          return (
            <li key={s.id}>
              <button
                type="button"
                className={`step-dot ${state}`}
                onClick={() => onSelect(i)}
                disabled={!enabled}
                aria-current={i === current ? 'step' : undefined}
                aria-label={`Step ${i + 1}: ${s.title}${state === 'done' ? ' (done)' : ''}`}
                title={s.title}
              >
                <span aria-hidden="true">{state === 'done' ? '✓' : i + 1}</span>
              </button>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
