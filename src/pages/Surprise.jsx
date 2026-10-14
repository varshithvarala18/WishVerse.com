import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import SurpriseExperience from './SurpriseExperience.jsx';
import NotFound from './NotFound.jsx';
import { findBirthday, getBirthday } from '../utils/storage.js';
import { errorMessage } from '../utils/errors.js';

export default function Surprise() {
  const { slug } = useParams();
  const [state, setState] = useState(() => {
    const local = getBirthday(slug);
    return local ? { status: 'ready', data: local } : { status: 'loading' };
  });

  useEffect(() => {
    let cancelled = false;
    const local = getBirthday(slug);
    if (local) {
      setState({ status: 'ready', data: local });
      return undefined;
    }
    setState({ status: 'loading' });
    findBirthday(slug)
      .then((data) => !cancelled && setState(data ? { status: 'ready', data } : { status: 'missing' }))
      .catch((err) => !cancelled && setState({ status: 'error', message: errorMessage(err) }));
    return () => {
      cancelled = true;
    };
  }, [slug]);

  if (state.status === 'loading') {
    return (
      <div className="container empty-page" role="status">
        <span className="spinner" aria-hidden="true" />
        <p className="muted">Unwrapping your surprise… 🎁</p>
      </div>
    );
  }

  if (state.status === 'error') {
    return <NotFound title="Couldn’t load this surprise 😕" message={state.message} />;
  }

  if (state.status === 'missing') {
    return (
      <NotFound
        title="We couldn’t find this surprise 🎁"
        message="The link may be mistyped, or the creator may have deleted it. Ask them to send the link again."
      />
    );
  }

  return <SurpriseExperience key={slug} data={state.data} mode="live" />;
}
