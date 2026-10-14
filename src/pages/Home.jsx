import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import Hero from '../components/Hero.jsx';
import HowItWorks from '../components/HowItWorks.jsx';
import Features from '../components/Features.jsx';
import { fadeUp } from '../utils/animations.js';
import '../styles/Home.css';

export default function Home() {
  return (
    <div className="home">
      <Hero />
      <HowItWorks />
      <Features />
      <section className="section cta" aria-labelledby="cta-title">
        <div className="container">
          <motion.div className="cta-card glass" initial="hidden" whileInView="show" viewport={{ once: true, amount: 0.4 }} variants={fadeUp}>
            <h2 id="cta-title">
              Make someone feel <span className="text-gradient">unforgettable</span> ❤️
            </h2>
            <p className="muted">It takes about five minutes. The smile lasts much longer.</p>
            <div className="btn-row center">
              <Link to="/create" className="btn btn-primary btn-lg">
                Create a Surprise 🎁
              </Link>
              <Link to="/dashboard" className="btn btn-ghost btn-lg">
                My Surprises
              </Link>
            </div>
          </motion.div>
        </div>
      </section>
      <footer className="footer">
        <div className="container">
          <p className="muted">
            Made with 💖 by WishVerse · Everything is stored privately in your browser · <Link to="/demo">Watch the demo</Link>
          </p>
        </div>
      </footer>
    </div>
  );
}
