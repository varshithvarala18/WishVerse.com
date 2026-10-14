import { Link } from 'react-router-dom';
import SurpriseExperience from './SurpriseExperience.jsx';
import { demoData } from '../data/demoData.js';

/** The full experience with built-in data. Never gated, never saved. */
export default function Demo() {
  const topBar = (
    <div className="exp-topbar demo-bar">
      <Link to="/" className="btn btn-sm btn-ghost">
        ← Home
      </Link>
      <span className="badge">✨ Demo</span>
      <Link to="/create" className="btn btn-sm btn-primary">
        Create your own 🎁
      </Link>
    </div>
  );
  return <SurpriseExperience data={demoData} mode="demo" topBar={topBar} />;
}
