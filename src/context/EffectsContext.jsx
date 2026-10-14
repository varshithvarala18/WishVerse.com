import { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';
import ConfettiAnimation from '../components/ConfettiAnimation.jsx';
import FireworksAnimation from '../components/FireworksAnimation.jsx';
import CrackerAnimation from '../components/CrackerAnimation.jsx';
import BalloonAnimation from '../components/BalloonAnimation.jsx';
import HeartAnimation from '../components/HeartAnimation.jsx';
import SparkleAnimation from '../components/SparkleAnimation.jsx';

/*
 * One global set of full-screen effect overlays. Any component can call
 * fire('confetti', { count: 200 }) as often as it likes – each call bumps the
 * effect's trigger counter. setEnabled(celebrations) limits effects to the
 * ones the creator switched on.
 */
const EffectsContext = createContext(null);

const EFFECTS = ['confetti', 'fireworks', 'crackers', 'balloons', 'hearts', 'sparkles'];
const initial = () => Object.fromEntries(EFFECTS.map((e) => [e, { trigger: 0, opts: {} }]));

export function EffectsProvider({ children }) {
  const [fx, setFx] = useState(initial);
  const [flash, setFlash] = useState(0);
  const enabledRef = useRef(null);

  const isEnabled = useCallback((name) => !enabledRef.current || enabledRef.current[name] !== false, []);

  const fire = useCallback(
    (name, opts = {}, { force = false } = {}) => {
      if (!EFFECTS.includes(name)) return false;
      if (!force && !isEnabled(name)) return false;
      setFx((s) => ({ ...s, [name]: { trigger: s[name].trigger + 1, opts } }));
      return true;
    },
    [isEnabled]
  );

  const setEnabled = useCallback((map) => {
    enabledRef.current = map || null;
  }, []);

  const flashScreen = useCallback(() => setFlash((f) => f + 1), []);

  const value = useMemo(() => ({ fire, setEnabled, isEnabled, flashScreen }), [fire, setEnabled, isEnabled, flashScreen]);

  return (
    <EffectsContext.Provider value={value}>
      {children}
      <div className="effects-layer" aria-hidden="true">
        {flash > 0 && <div key={flash} className="screen-flash" />}
        <BalloonAnimation trigger={fx.balloons.trigger} {...fx.balloons.opts} />
        <HeartAnimation trigger={fx.hearts.trigger} {...fx.hearts.opts} />
        <FireworksAnimation trigger={fx.fireworks.trigger} {...fx.fireworks.opts} />
        <CrackerAnimation trigger={fx.crackers.trigger} {...fx.crackers.opts} />
        <SparkleAnimation trigger={fx.sparkles.trigger} {...fx.sparkles.opts} />
        <ConfettiAnimation trigger={fx.confetti.trigger} {...fx.confetti.opts} />
      </div>
    </EffectsContext.Provider>
  );
}

export function useEffects() {
  const ctx = useContext(EffectsContext);
  if (!ctx) throw new Error('useEffects must be used inside <EffectsProvider>');
  return ctx;
}
