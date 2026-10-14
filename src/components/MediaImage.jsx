import { memo } from 'react';
import useMediaUrl from '../hooks/useMediaUrl.js';

/** <img> for a stored mediaId (IndexedDB blob or demo file) with a soft placeholder. */
function MediaImageBase({ mediaId, thumb = false, alt = '', className = '', loading = 'lazy', placeholder = '💝' }) {
  const url = useMediaUrl(mediaId, { thumb });
  if (!mediaId) {
    return (
      <div className={`media-placeholder ${className}`} role="img" aria-label={alt || 'No photo'}>
        <span aria-hidden="true">{placeholder}</span>
      </div>
    );
  }
  if (!url) return <div className={`media-placeholder loading ${className}`} aria-hidden="true" />;
  return <img src={url} alt={alt} className={className} loading={loading} decoding="async" draggable={false} />;
}

/** <video> for a stored mediaId. onPlay/onPause let the music duck while it plays. */
function MediaVideoBase({ mediaId, className = '', label = 'Video', onPlay, onPause }) {
  const url = useMediaUrl(mediaId);
  if (!url) return <div className={`media-placeholder loading ${className}`} aria-hidden="true" />;
  return (
    <video
      src={url}
      className={className}
      controls
      playsInline
      preload="metadata"
      aria-label={label}
      onPlay={onPlay}
      onPause={onPause}
      onEnded={onPause}
    />
  );
}

export const MediaImage = memo(MediaImageBase);
export const MediaVideo = memo(MediaVideoBase);
export default MediaImage;
