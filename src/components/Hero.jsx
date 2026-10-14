import { useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import StarsBackground from './StarsBackground.jsx';
import { BalloonSvg } from './BalloonAnimation.jsx';
import { useEffects } from '../context/EffectsContext.jsx';
import { rand } from '../utils/animations.js';

const BALLOON_COLORS = ['#ff6b97', '#f5c46b', '#9b8cff', '#5ce1e6', '#ff8fab', '#ffd166'];

export default function Hero() {
  const { fire } = useEffects();

  // A light confetti drizzle when the page opens.
  useEffect(() => {
    const t = setTimeout(() => fire('confetti', { direction: 'rain', count: 70, duration: 4500 }), 700);
    return () => clearTimeout(t);
  }, [fire]);

  const balloons = useMemo(
    () =>
      BALLOON_COLORS.map((color, i) => ({
        color,
        left: `${6 + i * 16 + rand(-3, 3)}%`,
        size: rand(38, 64),
        delay: rand(0, 6),
        duration: rand(14, 22),
      })),
    []
  );

  const sparkles = useMemo(
    () => Array.from({ length: 14 }, () => ({ left: `${rand(3, 97)}%`, top: `${rand(5, 90)}%`, delay: rand(0, 4), size: rand(8, 18) })),
    []
  );

  return (
    <section className="hero">
      <div className="hero-bg" aria-hidden="true">
        <div className="hero-gradient" />
        <StarsBackground density={0.7} />
        <div className="bloom bloom-1" />
        <div className="bloom bloom-2" />
        <div className="bloom bloom-3" />
        {balloons.map((b, i) => (
          <div
            key={i}
            className="hero-balloon"
            style={{ left: b.left, animationDelay: `${b.delay}s`, animationDuration: `${b.duration}s` }}
          >
            <BalloonSvg color={b.color} size={b.size} />
          </div>
        ))}
        {sparkles.map((s, i) => (
          <span
            key={i}
            className="hero-sparkle"
            style={{ left: s.left, top: s.top, animationDelay: `${s.delay}s`, width: s.size, height: s.size }}
          />
        ))}
      </div>

      <div className="container hero-content">
        <motion.span
          className="hero-pill glass"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          ✨ Free · No sign-up · Runs in your browser
        </motion.span>
        <motion.h1
          className="hero-title"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
        >
          Turn a Birthday Wish into an <span className="text-gradient">Experience</span> 🎂
        </motion.h1>
        <motion.p
          className="hero-sub"
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.25 }}
        >
          Create a magical birthday surprise filled with memories, music, love and celebration.
        </motion.p>
        <motion.div
          className="btn-row center hero-cta"
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
        >
          <Link to="/create" className="btn btn-primary btn-xl">
            Create a Surprise 🎁
          </Link>
          <Link to="/demo" className="btn btn-ghost btn-xl">
            Explore Demo ✨
          </Link>
        </motion.div>

        <motion.div
          className="hero-preview glass"
          initial={{ opacity: 0, y: 60, rotateX: 18 }}
          animate={{ opacity: 1, y: 0, rotateX: 0 }}
          transition={{ duration: 1.1, delay: 0.55, ease: [0.22, 1, 0.36, 1] }}
          aria-hidden="true"
        >
          <div className="hp-gift">🎁</div>
          <div className="hp-lines">
            <span className="hp-eyebrow">For Priya</span>
            <span className="hp-title">HAPPY BIRTHDAY, PRIYA! 🎂</span>
            <span className="hp-bar">
              <i />
            </span>
          </div>
          <div className="hp-polaroids">
            <img src="/demo/beach.svg" alt="" loading="lazy" />
            <img src="/demo/cake.svg" alt="" loading="lazy" />
            <img src="/demo/city.svg" alt="" loading="lazy" />
          </div>
        </motion.div>
      </div>
    </section>
  );
}
