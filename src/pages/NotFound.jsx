import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

export default function NotFound({
  title = 'Oops — this page floated away 🎈',
  message = 'The page you’re looking for doesn’t exist. Maybe the balloon string slipped?',
}) {
  return (
    <div className="container empty-page">
      <motion.div className="empty-card glass" initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}>
        <motion.span
          className="empty-emoji"
          aria-hidden="true"
          animate={{ y: [0, -14, 0], rotate: [-4, 4, -4] }}
          transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
        >
          🎈
        </motion.span>
        <h1>{title}</h1>
        <p className="muted">{message}</p>
        <div className="btn-row center">
          <Link to="/" className="btn btn-primary">
            Back to home
          </Link>
          <Link to="/dashboard" className="btn btn-ghost">
            My surprises
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
