import { useEffect, useRef, useState } from 'react';
import FileDropzone from '../FileDropzone.jsx';
import useMediaUrl from '../../hooks/useMediaUrl.js';
import { MelodyPlayer } from '../../utils/melody.js';
import { uploadFiles } from './steps.js';

const fmt = (s) => (Number.isFinite(s) ? `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}` : '0:00');

/** Small custom audio player for checking the uploaded song. */
function AudioPreview({ mediaId, fileName }) {
  const url = useMediaUrl(mediaId);
  const audioRef = useRef(null);
  const [playing, setPlaying] = useState(false);
  const [time, setTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.8);
  const [muted, setMuted] = useState(false);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
      audioRef.current.muted = muted;
    }
  }, [volume, muted, url]);

  const toggle = () => {
    const a = audioRef.current;
    if (!a) return;
    if (a.paused) a.play().catch(() => {});
    else a.pause();
  };

  return (
    <div className="audio-preview glass">
      {url && (
        <audio
          ref={audioRef}
          src={url}
          preload="metadata"
          onPlay={() => setPlaying(true)}
          onPause={() => setPlaying(false)}
          onEnded={() => setPlaying(false)}
          onTimeUpdate={(e) => setTime(e.currentTarget.currentTime)}
          onLoadedMetadata={(e) => setDuration(e.currentTarget.duration)}
        />
      )}
      <button type="button" className="btn btn-icon btn-primary" onClick={toggle} disabled={!url} aria-label={playing ? 'Pause preview' : 'Play preview'}>
        {playing ? '⏸' : '▶'}
      </button>
      <div className="audio-main">
        <span className="audio-name" title={fileName}>
          🎵 {fileName}
        </span>
        <div className="audio-seek">
          <span className="mp-time">{fmt(time)}</span>
          <input
            type="range"
            min={0}
            max={duration || 1}
            step={0.1}
            value={Math.min(time, duration || 1)}
            onChange={(e) => {
              const t = Number(e.target.value);
              if (audioRef.current) audioRef.current.currentTime = t;
              setTime(t);
            }}
            aria-label="Seek song preview"
            style={{ '--fill': `${duration ? (time / duration) * 100 : 0}%` }}
          />
          <span className="mp-time">{fmt(duration)}</span>
        </div>
      </div>
      <div className="audio-vol">
        <button type="button" className="btn btn-icon btn-ghost" onClick={() => setMuted((m) => !m)} aria-label={muted ? 'Unmute' : 'Mute'} aria-pressed={muted}>
          {muted ? '🔇' : '🔊'}
        </button>
        <input
          type="range"
          min={0}
          max={1}
          step={0.01}
          value={muted ? 0 : volume}
          onChange={(e) => {
            setVolume(Number(e.target.value));
            setMuted(false);
          }}
          aria-label="Preview volume"
          style={{ '--fill': `${(muted ? 0 : volume) * 100}%` }}
        />
      </div>
    </div>
  );
}

export default function StepMusic({ draft, update, toast }) {
  const [busy, setBusy] = useState(false);
  const [mode, setMode] = useState(draft.music ? 'custom' : 'melody');
  const [melodyPlaying, setMelodyPlaying] = useState(false);
  const melodyRef = useRef(null);

  useEffect(
    () => () => {
      melodyRef.current?.destroy();
      melodyRef.current = null;
    },
    []
  );

  function toggleMelody() {
    try {
      if (!melodyRef.current) melodyRef.current = new MelodyPlayer();
      if (melodyPlaying) {
        melodyRef.current.pause();
        setMelodyPlaying(false);
      } else {
        melodyRef.current.play();
        setMelodyPlaying(true);
      }
    } catch {
      toast.error('This browser can’t play the built-in melody.');
    }
  }

  function chooseMelody() {
    setMode('melody');
    update({ music: null });
  }

  function chooseCustom() {
    setMode('custom');
    melodyRef.current?.pause();
    setMelodyPlaying(false);
  }

  async function onFiles(files) {
    setBusy(true);
    await uploadFiles(files.slice(0, 1), 'audio', {
      max: 1,
      label: 'song',
      toast,
      onAdded: (mediaId, file) => {
        update({ music: { mediaId, fileName: file.name } });
        toast.success('Song added 🎵');
      },
    });
    setBusy(false);
  }

  return (
    <div className="step-body">
      <h2>Pick the soundtrack 🎵</h2>
      <p className="muted step-lead">Music starts the moment the gift box is opened (browsers never autoplay before a tap).</p>

      <div className="choice-cards" role="radiogroup" aria-label="Music source">
        <button type="button" role="radio" aria-checked={mode === 'melody'} className={`choice-card glass${mode === 'melody' ? ' selected' : ''}`} onClick={chooseMelody}>
          <span className="choice-icon" aria-hidden="true">
            🎹
          </span>
          <span className="choice-title">Built-in birthday melody</span>
          <span className="choice-desc">A sweet “Happy Birthday” tune synthesized right in the browser.</span>
        </button>
        <button type="button" role="radio" aria-checked={mode === 'custom'} className={`choice-card glass${mode === 'custom' ? ' selected' : ''}`} onClick={chooseCustom}>
          <span className="choice-icon" aria-hidden="true">
            🎧
          </span>
          <span className="choice-title">Upload your own song</span>
          <span className="choice-desc">MP3, M4A, OGG or WAV · up to 20 MB.</span>
        </button>
      </div>

      {mode === 'melody' && (
        <button type="button" className="btn btn-ghost" onClick={toggleMelody}>
          {melodyPlaying ? '⏸ Stop melody preview' : '▶ Preview melody'}
        </button>
      )}

      {mode === 'custom' && (
        <div className="music-custom">
          {draft.music ? (
            <>
              <AudioPreview key={draft.music.mediaId} mediaId={draft.music.mediaId} fileName={draft.music.fileName} />
              <div className="btn-row">
                <button type="button" className="btn btn-sm btn-ghost" onClick={() => update({ music: null })}>
                  Replace song
                </button>
                <button type="button" className="btn btn-sm btn-danger" onClick={chooseMelody}>
                  Remove & use melody
                </button>
              </div>
            </>
          ) : (
            <FileDropzone accept="audio/*" onFiles={onFiles} busy={busy} disabled={busy} icon="🎶" title="Drop a song here or browse" hint="1 track · up to 20 MB" />
          )}
        </div>
      )}
    </div>
  );
}
