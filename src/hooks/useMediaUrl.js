import { useEffect, useState } from 'react';
import { getMediaUrl, staticMediaUrl } from '../utils/media.js';

/**
 * Resolves a mediaId to a displayable URL. Blob URLs are created fresh from
 * IndexedDB (they never survive reloads) and revoked on unmount / id change.
 * Demo and online media resolve straight to their URL.
 */
export default function useMediaUrl(mediaId, { thumb = false } = {}) {
  const [url, setUrl] = useState(() => staticMediaUrl(mediaId, { thumb }));

  useEffect(() => {
    if (!mediaId) {
      setUrl(null);
      return undefined;
    }
    const direct = staticMediaUrl(mediaId, { thumb });
    if (direct) {
      setUrl(direct);
      return undefined;
    }
    let cancelled = false;
    let created = null;
    setUrl(null);
    getMediaUrl(mediaId, { thumb })
      .then((u) => {
        if (cancelled) {
          if (u && u.startsWith('blob:')) URL.revokeObjectURL(u);
          return;
        }
        created = u;
        setUrl(u);
      })
      .catch(() => {
        if (!cancelled) setUrl(null);
      });
    return () => {
      cancelled = true;
      if (created && created.startsWith('blob:')) URL.revokeObjectURL(created);
    };
  }, [mediaId, thumb]);

  return url;
}
