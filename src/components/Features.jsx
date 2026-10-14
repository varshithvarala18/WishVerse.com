import { motion } from 'framer-motion';
import { fadeUp } from '../utils/animations.js';

const FEATURES = [
  { icon: '📸', title: 'Photo Memories', text: '3D Polaroid slideshow with captions and dates.' },
  { icon: '💌', title: 'Personal Message', text: 'An envelope that opens into a typed love letter.' },
  { icon: '🎵', title: 'Birthday Music', text: 'Your song — or a built-in synthesized melody.' },
  { icon: '🎆', title: 'Fireworks', text: 'A canvas night sky full of bursting shells.' },
  { icon: '🎉', title: 'Confetti', text: 'Explosions, rain and confetti cannons.' },
  { icon: '🎈', title: 'Balloons', text: 'Swaying balloons drifting up the screen.' },
  { icon: '❤️', title: 'Floating Hearts', text: 'Soft hearts rising with every bit of love.' },
  { icon: '✨', title: 'Sparkles', text: 'Twinkling magic showers on demand.' },
  { icon: '🎂', title: 'Birthday Cake', text: 'Blow the candles — even with your microphone.' },
  { icon: '🎁', title: 'Interactive Gifts', text: 'Gift boxes that burst open with surprises.' },
  { icon: '🔐', title: 'Hidden Surprises', text: 'Secret-word memories, quizzes and last-minute gifts.' },
  { icon: '📱', title: 'Mobile Friendly', text: 'Swipe-friendly and designed for phones first.' },
];

export default function Features() {
  return (
    <section className="section features" aria-labelledby="features-title">
      <div className="container">
        <motion.div className="section-head" initial="hidden" whileInView="show" viewport={{ once: true, amount: 0.5 }} variants={fadeUp}>
          <span className="eyebrow">Features</span>
          <h2 id="features-title">
            Everything a birthday <span className="text-gradient">deserves</span>
          </h2>
        </motion.div>
        <ul className="features-grid">
          {FEATURES.map((f, i) => (
            <motion.li
              key={f.title}
              className="feature-card glass"
              custom={i % 4}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, amount: 0.3 }}
              variants={fadeUp}
              whileHover={{ y: -6, scale: 1.02 }}
            >
              <span className="feature-icon" aria-hidden="true">
                {f.icon}
              </span>
              <h3>{f.title}</h3>
              <p className="muted">{f.text}</p>
            </motion.li>
          ))}
        </ul>
      </div>
    </section>
  );
}
