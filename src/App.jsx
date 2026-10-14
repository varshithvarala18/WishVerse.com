import { lazy, Suspense, useEffect } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import Navbar from './components/Navbar.jsx';
import { ToastProvider } from './context/ToastContext.jsx';
import { EffectsProvider } from './context/EffectsContext.jsx';

const Home = lazy(() => import('./pages/Home.jsx'));
const CreateSurprise = lazy(() => import('./pages/CreateSurprise.jsx'));
const Preview = lazy(() => import('./pages/Preview.jsx'));
const Dashboard = lazy(() => import('./pages/Dashboard.jsx'));
const Surprise = lazy(() => import('./pages/Surprise.jsx'));
const Demo = lazy(() => import('./pages/Demo.jsx'));
const NotFound = lazy(() => import('./pages/NotFound.jsx'));

function PageLoader() {
  return (
    <div className="page-loader" role="status" aria-live="polite">
      <span className="loader-gift" aria-hidden="true">🎁</span>
      <span>Loading magic…</span>
    </div>
  );
}

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

export default function App() {
  const location = useLocation();
  const immersive = /^\/(surprise|demo|preview)(\/|$)/.test(location.pathname);

  return (
    <ToastProvider>
      <EffectsProvider>
        <a href="#main" className="skip-link">
          Skip to content
        </a>
        <ScrollToTop />
        {!immersive && <Navbar />}
        <main id="main" className={immersive ? 'main main-immersive' : 'main'}>
          <Suspense fallback={<PageLoader />}>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/create" element={<CreateSurprise />} />
              <Route path="/edit/:slug" element={<CreateSurprise />} />
              <Route path="/preview" element={<Preview />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/surprise/:slug" element={<Surprise />} />
              <Route path="/demo" element={<Demo />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </main>
      </EffectsProvider>
    </ToastProvider>
  );
}
