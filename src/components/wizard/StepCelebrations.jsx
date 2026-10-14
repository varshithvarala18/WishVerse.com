import Switch from './Switch.jsx';
import { CELEBRATION_KEYS, defaultCelebrations } from '../../utils/storage.js';
import { useEffects } from '../../context/EffectsContext.jsx';

const META = {
  confetti: { label: '🎉 Confetti', desc: 'Colorful bursts and confetti cannons', fx: 'confetti' },
  balloons: { label: '🎈 Balloons', desc: 'Balloons drifting up the screen', fx: 'balloons' },
  fireworks: { label: '🎆 Fireworks', desc: 'A night sky full of fireworks', fx: 'fireworks' },
  crackers: { label: '🧨 Crackers', desc: 'Ground-level bursts and flashes', fx: 'crackers' },
  hearts: { label: '❤️ Floating hearts', desc: 'Hearts rising with love', fx: 'hearts' },
  sparkles: { label: '✨ Sparkles', desc: 'A twinkling sparkle shower', fx: 'sparkles' },
  cake: { label: '🎂 Birthday cake', desc: 'The “blow the candles” stage' },
  gift: { label: '🎁 Gift wishes', desc: 'A mini gift with random wish lines' },
  stars: { label: '⭐ Starry sky', desc: 'Drifting stars in the background' },
};

export default function StepCelebrations({ draft, update }) {
  const { fire } = useEffects();
  const cel = draft.celebrations;
  const allOn = CELEBRATION_KEYS.every((k) => cel[k]);

  const set = (k, v) => update((d) => ({ ...d, celebrations: { ...d.celebrations, [k]: v } }));

  return (
    <div className="step-body">
      <h2>Pick the celebrations 🎉</h2>
      <p className="muted step-lead">Only the effects you switch on will appear in the surprise. Tap “Try” to see one right now.</p>

      <div className="btn-row">
        <button type="button" className="btn btn-primary btn-sm" onClick={() => update({ celebrations: defaultCelebrations(true) })} disabled={allOn}>
          ✅ Select All Celebrations
        </button>
        <button type="button" className="btn btn-ghost btn-sm" onClick={() => update({ celebrations: defaultCelebrations(false) })}>
          Clear All
        </button>
      </div>

      <ul className="toggle-list">
        {CELEBRATION_KEYS.map((k) => (
          <li key={k} className="toggle-row glass">
            <Switch checked={cel[k]} onChange={(v) => set(k, v)} label={META[k].label} description={META[k].desc} />
            {META[k].fx && (
              <button
                type="button"
                className="btn btn-sm btn-ghost"
                onClick={() => fire(META[k].fx, {}, { force: true })}
                aria-label={`Try ${META[k].label.replace(/^\S+\s/, '')}`}
              >
                Try
              </button>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
