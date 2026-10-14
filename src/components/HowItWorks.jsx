import { motion } from 'framer-motion';
import { fadeUp } from '../utils/animations.js';

const STEPS = [
  { n: '01', icon: '✍️', title: 'Create', text: 'Add their name, birthday and a heartfelt message.' },
  { n: '02', icon: '🎨', title: 'Personalize', text: 'Upload photos, memories, videos and music. Pick a theme.' },
  { n: '03', icon: '🎉', title: 'Celebrate', text: 'Choose fireworks, balloons, cake, quizzes and hidden gifts.' },
  { n: '04', icon: '💌', title: 'Share', text: 'Open it together, or export it to play on another device.' },
];

export default function HowItWorks() {
  return (
    <section className="section how" aria-labelledby="how-title">
      <div className="container">
        <motion.div className="section-head" initial="hidden" whileInView="show" viewport={{ once: true, amount: 0.5 }} variants={fadeUp}>
          <span className="eyebrow">How it works</span>
          <h2 id="how-title">
            Four steps to a <span className="text-gradient">wow</span>
          </h2>
          <p className="muted">No account, no uploads to a server. Everything stays in your browser.</p>
        </motion.div>
        <ol className="how-grid">
          {STEPS.map((s, i) => (
            <motion.li
              key={s.n}
              className="how-card glass"
              custom={i}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, amount: 0.3 }}
              variants={fadeUp}
            >
              <span className="how-num" aria-hidden="true">
                {s.n}
              </span>
              <span className="how-icon" aria-hidden="true">
                {s.icon}
              </span>
              <h3>{s.title}</h3>
              <p className="muted">{s.text}</p>
            </motion.li>
          ))}
        </ol>
      </div>
    </section>
  );
}
