import { useCallback, useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useEffects } from '../context/EffectsContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import useSound from '../hooks/useSound.js';

const CANDLES = [96, 123, 150, 177, 204];
const BLOW_THRESHOLD = 0.22; // RMS level that counts as a blow
const BLOW_FRAMES = 8; // consecutive loud frames needed

function CakeSvg({ lit }) {
  return (
    <svg viewBox="0 0 300 300" className="cake-svg" role="img" aria-label={lit ? 'Birthday cake with five lit candles' : 'Birthday cake, candles blown out'}>
      <defs>
        <linearGradient id="tier1" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor="#ffb3c8" />
          <stop offset="1" stopColor="#f27ea2" />
        </linearGradient>
        <linearGradient id="tier2" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor="#fff2e0" />
          <stop offset="1" stopColor="#f6d8b5" />
        </linearGradient>
        <radialGradient id="flame" cx="50%" cy="70%" r="60%">
          <stop offset="0" stopColor="#fffbe6" />
          <stop offset="0.45" stopColor="#ffd34d" />
          <stop offset="1" stopColor="#ff7a1a" stopOpacity="0.9" />
        </radialGradient>
      </defs>
      <ellipse cx="150" cy="262" rx="140" ry="18" fill="rgba(0,0,0,0.25)" />
      <ellipse cx="150" cy="254" rx="128" ry="16" fill="#e9e4f5" />
      {/* bottom tier */}
      <rect x="38" y="172" width="224" height="80" rx="16" fill="url(#tier1)" />
      <path d="M38 190 q14 18 28 0 t28 0 t28 0 t28 0 t28 0 t28 0 t28 0 t28 0 V176 a14 14 0 0 0 -14 -6 H52 a14 14 0 0 0 -14 6 Z" fill="#fff5f8" />
      {/* top tier */}
      <rect x="78" y="112" width="144" height="64" rx="14" fill="url(#tier2)" />
      <path d="M78 128 q12 14 24 0 t24 0 t24 0 t24 0 t24 0 t24 0 V118 a12 12 0 0 0 -12 -6 H90 a12 12 0 0 0 -12 6 Z" fill="#7b3f2a" />
      {/* sprinkles */}
      {[
        [62, 214, '#ffd166'], [92, 230, '#06d6a0'], [130, 210, '#118ab2'], [168, 232, '#ffd166'], [210, 216, '#ef476f'], [240, 232, '#06d6a0'],
        [100, 150, '#ef476f'], [132, 160, '#118ab2'], [168, 148, '#06d6a0'], [200, 162, '#ffd166'],
      ].map(([x, y, c], i) => (
        <rect key={i} x={x} y={y} width="9" height="3" rx="1.5" fill={c} transform={`rotate(${(i * 37) % 90 - 45} ${x} ${y})`} />
      ))}
      {/* candles */}
      {CANDLES.map((x, i) => (
        <g key={x}>
          <rect x={x - 5} y="72" width="10" height="42" rx="3" fill={['#8ecae6', '#ffb703', '#fb8500', '#90be6d', '#cdb4db'][i]} />
          <path d={`M${x - 5} 80 l10 -6 M${x - 5} 92 l10 -6 M${x - 5} 104 l10 -6`} stroke="rgba(255,255,255,0.7)" strokeWidth="2" />
          <line x1={x} y1="72" x2={x} y2="64" stroke="#3a2a1a" strokeWidth="2" />
          {lit && (
            <g className="flame" style={{ animationDelay: `${i * 0.13}s` }}>
              <ellipse cx={x} cy="52" rx="13" ry="18" fill="rgba(255,200,80,0.25)" />
              <path d={`M${x} 34 C${x + 9} 46 ${x + 8} 58 ${x} 62 C${x - 8} 58 ${x - 9} 46 ${x} 34 Z`} fill="url(#flame)" />
            </g>
          )}
        </g>
      ))}
    </svg>
  );
}

/** Stage 9 – blow the candles out with a button (or optionally the microphone). */
export default function BirthdayCake({ name, onNext }) {
  const { fire } = useEffects();
  const toast = useToast();
  const sound = useSound();
  const [lit, setLit] = useState(true);
  const [micOn, setMicOn] = useState(false);
  const [level, setLevel] = useState(0);
  const mic = useRef({ stream: null, ctx: null, raf: 0 });

  const stopMic = useCallback(() => {
    const m = mic.current;
    cancelAnimationFrame(m.raf);
    m.stream?.getTracks().forEach((t) => t.stop());
    m.ctx?.close().catch(() => {});
    mic.current = { stream: null, ctx: null, raf: 0 };
    setLevel(0);
  }, []);

  const litRef = useRef(true);
  const blow = useCallback(() => {
    if (!litRef.current) return;
    litRef.current = false;
    setLit(false);
    setMicOn(false);
    fire('confetti', { count: 200, intensity: 1.2 });
    fire('fireworks', { rockets: 8 });
    fire('sparkles', { count: 80 });
  }, [fire]);

  useEffect(() => {
    if (!micOn) {
      stopMic();
      sound.unduck();
      return undefined;
    }
    let cancelled = false;
    async function start() {
      try {
        if (!navigator.mediaDevices?.getUserMedia) throw new Error('unsupported');
        const stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: false } });
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        const AC = window.AudioContext || window.webkitAudioContext;
        const ctx = new AC();
        const analyser = ctx.createAnalyser();
        analyser.fftSize = 1024;
        ctx.createMediaStreamSource(stream).connect(analyser);
        const data = new Uint8Array(analyser.fftSize);
        mic.current = { stream, ctx, raf: 0 };
        sound.duck();
        let loud = 0;
        const loop = () => {
          analyser.getByteTimeDomainData(data);
          let sum = 0;
          for (let i = 0; i < data.length; i += 1) {
            const v = (data[i] - 128) / 128;
            sum += v * v;
          }
          const rms = Math.sqrt(sum / data.length);
          setLevel(Math.min(1, rms / BLOW_THRESHOLD));
          loud = rms > BLOW_THRESHOLD ? loud + 1 : 0;
          if (loud >= BLOW_FRAMES) {
            blow();
            return;
          }
          mic.current.raf = requestAnimationFrame(loop);
        };
        loop();
      } catch {
        if (!cancelled) {
          toast.info('Microphone isn’t available — no problem, just tap BLOW THE CANDLES 💨');
          setMicOn(false);
        }
      }
    }
    start();
    return () => {
      cancelled = true;
      stopMic();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [micOn]);

  return (
    <div className="stage-inner cake-stage">
      <h2 className="cake-title">{lit ? 'Make a wish and blow the candles 🎂' : 'Your wish is on its way ✨'}</h2>
      <div className="cake-wrap">
        <CakeSvg lit={lit} />
        {!lit && (
          <div className="smoke-layer" aria-hidden="true">
            {CANDLES.map((x, i) => (
              <span key={x} className="smoke" style={{ left: `${(x / 300) * 100}%`, animationDelay: `${i * 0.12}s` }} />
            ))}
          </div>
        )}
      </div>

      <AnimatePresence mode="wait">
        {lit ? (
          <motion.div key="controls" className="cake-controls" exit={{ opacity: 0 }}>
            <motion.button type="button" className="btn btn-primary btn-xl" onClick={blow} whileTap={{ scale: 0.94 }}>
              BLOW THE CANDLES 💨
            </motion.button>
            <button
              type="button"
              className="switch"
              role="switch"
              aria-checked={micOn}
              onClick={() => setMicOn((m) => !m)}
            >
              <span className="switch-track" aria-hidden="true">
                <span className="switch-thumb" />
              </span>
              <span>🎤 Use microphone (blow into it!)</span>
            </button>
            {micOn && (
              <div className="mic-meter" aria-hidden="true">
                <span style={{ width: `${Math.round(level * 100)}%` }} />
              </div>
            )}
          </motion.div>
        ) : (
          <motion.div key="done" className="cake-done" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} aria-live="polite">
            <p className="cake-message glow-text">Happy Birthday, {name}! May every wish come true 🌟</p>
            <button type="button" className="btn btn-primary btn-lg" onClick={onNext}>
              Continue →
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
